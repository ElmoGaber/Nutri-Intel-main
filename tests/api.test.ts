/**
 * Nutri-Intel Backend API Tests
 * Tests all major API endpoints in mock mode (no database required)
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

// ---- App setup (mirrors server/index.ts but without static/vite) ----
let app: express.Express;
const uniqueSuffix = Date.now().toString(36);

async function buildTestApp() {
  const a = express();
  const httpServer = createServer(a);

  a.use(express.json({ limit: "10mb" }));
  a.use(express.urlencoded({ extended: false }));

  const sessionStore = new (MemoryStore(session))({ checkPeriod: 86400000 });
  a.use(
    session({
      store: sessionStore,
      secret: "test-secret-key-32-chars-long-ok!!",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, httpOnly: true, maxAge: 86400000 },
    })
  );

  await registerRoutes(httpServer, a);
  return a;
}

beforeAll(async () => {
  app = await buildTestApp();
});

/** Helper: login as test user, return session cookie */
async function loginAsTest(): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username: "test", password: "test1234" });
  if (res.status !== 200) throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.headers["set-cookie"]?.[0] ?? "";
}

// ============================================================
// AUTH
// ============================================================
describe("Auth API", () => {
  it("GET /api/auth/me → 401 when not logged in", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/register → 400 when missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it("POST /api/auth/register → 201 creates new user", async () => {
    const username = `testuser_reg_${uniqueSuffix}`;
    const res = await request(app).post("/api/auth/register").send({
      username,
      password: "pass1234",
      email: `${username}@example.com`,
      firstName: "Test",
      lastName: "User",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).not.toHaveProperty("password");
    expect(res.body.username).toBe(username);
  });

  it("POST /api/auth/register → 400 on duplicate username", async () => {
    const username = `duplicate_reg_${uniqueSuffix}`;
    await request(app).post("/api/auth/register").send({
      username,
      password: "pass1234",
    });
    const res = await request(app).post("/api/auth/register").send({
      username,
      password: "pass1234",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/exists/i);
  });

  it("POST /api/auth/login → 401 on wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "test", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/login → 200 with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "test", password: "test1234" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).not.toHaveProperty("password");
  });

  it("GET /api/auth/me → 200 when authenticated", async () => {
    const cookie = await loginAsTest();
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("username", "test");
  });

  it("POST /api/auth/logout → 200", async () => {
    const cookie = await loginAsTest();
    const res = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});

// ============================================================
// MEALS / NUTRITION
// ============================================================
describe("Nutrition API", () => {
  let cookie: string;
  let mealId: string;

  beforeAll(async () => {
    cookie = await loginAsTest();
  });

  it("GET /api/nutrition/meals → 401 without auth", async () => {
    const res = await request(app).get("/api/nutrition/meals");
    expect(res.status).toBe(401);
  });

  it("GET /api/nutrition/meals → 200 returns array", async () => {
    const res = await request(app).get("/api/nutrition/meals").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/nutrition/meals → 201 creates meal", async () => {
    const res = await request(app)
      .post("/api/nutrition/meals")
      .set("Cookie", cookie)
      .send({
        name: "Grilled Chicken",
        type: "lunch",
        calories: 350,
        protein: 40,
        carbs: 10,
        fat: 15,
        date: new Date().toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Grilled Chicken");
    mealId = res.body.id;
  });

  it("PUT /api/nutrition/meals/:id → 200 updates meal", async () => {
    const res = await request(app)
      .put(`/api/nutrition/meals/${mealId}`)
      .set("Cookie", cookie)
      .send({ name: "Baked Chicken", calories: 320 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Baked Chicken");
  });

  it("GET /api/nutrition/daily-summary → 200", async () => {
    const res = await request(app).get("/api/nutrition/daily-summary").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalCalories");
  });

  it("DELETE /api/nutrition/meals/:id → 204", async () => {
    const res = await request(app)
      .delete(`/api/nutrition/meals/${mealId}`)
      .set("Cookie", cookie);
    expect(res.status).toBe(204);
  });
});

// ============================================================
// HEALTH METRICS
// ============================================================
describe("Health Metrics API", () => {
  let cookie: string;

  beforeAll(async () => {
    cookie = await loginAsTest();
  });

  it("GET /api/health/metrics → 401 without auth", async () => {
    const res = await request(app).get("/api/health/metrics");
    expect(res.status).toBe(401);
  });

  it("GET /api/health/metrics → 200 returns array", async () => {
    const res = await request(app).get("/api/health/metrics").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/health/metrics → 201 creates metric", async () => {
    const res = await request(app)
      .post("/api/health/metrics")
      .set("Cookie", cookie)
      .send({
        type: "blood_pressure",
        value: "120/80",
        unit: "mmHg",
        date: new Date().toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});

// ============================================================
// MEDICATIONS
// ============================================================
describe("Medications API", () => {
  let cookie: string;
  let medId: string;

  beforeAll(async () => {
    cookie = await loginAsTest();
  });

  it("GET /api/health/medications → 200 returns array", async () => {
    const res = await request(app).get("/api/health/medications").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/health/medications → 201 creates medication", async () => {
    const res = await request(app)
      .post("/api/health/medications")
      .set("Cookie", cookie)
      .send({
        name: "Vitamin D",
        dosage: "1000",
        unit: "IU",
        frequency: "once daily",
        reason: "Deficiency",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Vitamin D");
    medId = res.body.id;
  });

  it("PUT /api/health/medications/:id → 200 updates medication", async () => {
    const res = await request(app)
      .put(`/api/health/medications/${medId}`)
      .set("Cookie", cookie)
      .send({ name: "Vitamin D3", dosage: "2000" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Vitamin D3");
  });

  it("DELETE /api/health/medications/:id → 204", async () => {
    const res = await request(app)
      .delete(`/api/health/medications/${medId}`)
      .set("Cookie", cookie);
    expect(res.status).toBe(204);
  });

  it("DELETE non-existent medication → 404", async () => {
    const res = await request(app)
      .delete("/api/health/medications/nonexistent_id_xyz")
      .set("Cookie", cookie);
    expect(res.status).toBe(404);
  });
});

// ============================================================
// HEALTH JOURNAL (new PUT/DELETE endpoints)
// ============================================================
describe("Health Journal API", () => {
  let cookie: string;
  let entryId: string;

  beforeAll(async () => {
    cookie = await loginAsTest();
  });

  it("GET /api/health/journal → 200 returns array", async () => {
    const res = await request(app).get("/api/health/journal").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/health/journal → 201 creates entry", async () => {
    const res = await request(app)
      .post("/api/health/journal")
      .set("Cookie", cookie)
      .send({
        content: "Feeling great today!",
        mood: "great",
        date: new Date().toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.mood).toBe("great");
    entryId = res.body.id;
  });

  it("PUT /api/health/journal/:id → 200 updates entry", async () => {
    const res = await request(app)
      .put(`/api/health/journal/${entryId}`)
      .set("Cookie", cookie)
      .send({ content: "Updated content", mood: "good" });
    expect(res.status).toBe(200);
    expect(res.body.mood).toBe("good");
    expect(res.body.content).toBe("Updated content");
  });

  it("PUT /api/health/journal/:id → 404 for non-existent entry", async () => {
    const res = await request(app)
      .put("/api/health/journal/nonexistent_id_xyz")
      .set("Cookie", cookie)
      .send({ content: "test" });
    expect(res.status).toBe(404);
  });

  it("DELETE /api/health/journal/:id → 204", async () => {
    const res = await request(app)
      .delete(`/api/health/journal/${entryId}`)
      .set("Cookie", cookie);
    expect(res.status).toBe(204);
  });

  it("DELETE non-existent journal entry → 404", async () => {
    const res = await request(app)
      .delete("/api/health/journal/nonexistent_id_xyz")
      .set("Cookie", cookie);
    expect(res.status).toBe(404);
  });
});

// ============================================================
// FOOD DATABASE
// ============================================================
describe("Food Database API", () => {
  it("GET /api/food-database/categories → 200 returns categories", async () => {
    const res = await request(app).get("/api/food-database/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /api/food-database/foods → 200 returns foods", async () => {
    const res = await request(app).get("/api/food-database/foods");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/food-database/foods?q=milk → 200 filters results", async () => {
    const res = await request(app).get("/api/food-database/foods?q=milk");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("POST /api/food-database/calculate → 404 for unknown food", async () => {
    const res = await request(app)
      .post("/api/food-database/calculate")
      .send({ foodName: "nonexistent_food_xyz_999", servingUnit: "gram", quantity: 100 });
    expect(res.status).toBe(404);
  });
});

// ============================================================
// AI CHAT (unified endpoint)
// ============================================================
describe("AI Chat API", () => {
  it("POST /api/chat → 400 when no message content", async () => {
    const res = await request(app).post("/api/chat").send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/chat → 200 with Format A (message + history)", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "What is a healthy breakfast?", history: [] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("reply");
    expect(typeof res.body.reply).toBe("string");
    expect(res.body.reply.length).toBeGreaterThan(0);
    // Also includes message + choices for backward compatibility
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("choices");
  });

  it("POST /api/chat → 200 with Format B (messages array)", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({
        messages: [
          { role: "system", content: "You are a nutrition assistant." },
          { role: "user", content: "How much protein do I need daily?" },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("choices");
    expect(Array.isArray(res.body.choices)).toBe(true);
  });
});

// ============================================================
// USER PROFILE
// ============================================================
describe("User Profile API", () => {
  let cookie: string;

  beforeAll(async () => {
    cookie = await loginAsTest();
  });

  it("GET /api/users/profile → 401 without auth", async () => {
    const res = await request(app).get("/api/users/profile");
    expect(res.status).toBe(401);
  });

  it("GET /api/users/profile → 200 with auth", async () => {
    const res = await request(app).get("/api/users/profile").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("username");
  });

  it("PUT /api/users/profile → 200 updates profile", async () => {
    const res = await request(app)
      .put("/api/users/profile")
      .set("Cookie", cookie)
      .send({ firstName: "Updated", lastName: "Name", email: "test@nutri-intel.com" });
    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe("Updated");
  });
});
