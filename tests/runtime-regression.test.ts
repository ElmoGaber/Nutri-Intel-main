import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

let app: express.Express;

type SessionUser = {
  id: string;
  username: string;
  role?: string;
  clientId?: string | null;
};

type SessionInfo = {
  cookie: string;
  user: SessionUser;
};

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
    }),
  );

  await registerRoutes(httpServer, a);
  return a;
}

async function loginAs(username: string, password: string): Promise<SessionInfo> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username, password });

  if (res.status !== 200) {
    throw new Error(`Login failed for ${username}: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    cookie: res.headers["set-cookie"]?.[0] ?? "",
    user: res.body,
  };
}

async function registerPatient(username: string, clientId: string): Promise<SessionInfo> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      username,
      password: "pass1234",
      role: "patient",
      accountType: "patient",
      clientId,
    });

  if (res.status !== 201) {
    throw new Error(`Register failed for ${username}: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    cookie: res.headers["set-cookie"]?.[0] ?? "",
    user: res.body,
  };
}

describe("Runtime regression coverage", () => {
  let admin: SessionInfo;
  let doctor: SessionInfo;
  let coach: SessionInfo;
  let patient: SessionInfo;
  let otherPatient: SessionInfo;

  let doctorPatientSessionId: string;
  let coachPatientSessionId: string;
  let otherDoctorSessionId: string;

  const doctorPatientTitle = `doctor-linked-session-${uniqueSuffix}`;
  const coachPatientTitle = `coach-linked-session-${uniqueSuffix}`;
  const otherDoctorTitle = `other-patient-doctor-session-${uniqueSuffix}`;
  const createdPractitionerUsername = `practitioner-${uniqueSuffix}`;

  beforeAll(async () => {
    app = await buildTestApp();

    admin = await loginAs("admin", "admin1234");
    doctor = await loginAs("doctor", "doctor1234");
    coach = await loginAs("coach", "coach1234");
    patient = await loginAs("test", "test1234");
    otherPatient = await registerPatient(`patient-${uniqueSuffix}`, `PAT-${uniqueSuffix.toUpperCase()}`);

    const doctorLinkedSession = await request(app)
      .post("/api/coaching/sessions")
      .set("Cookie", patient.cookie)
      .send({
        title: doctorPatientTitle,
        notes: "Doctor session created in regression test",
        coachUserId: doctor.user.id,
      });

    expect(doctorLinkedSession.status).toBe(201);
    expect(doctorLinkedSession.body.coachUserId).toBe(doctor.user.id);
    expect(doctorLinkedSession.body.meetingUrl).toMatch(/^https:\/\/meet\.google\.com\//);
    doctorPatientSessionId = doctorLinkedSession.body.id;

    const coachLinkedSession = await request(app)
      .post("/api/coaching/sessions")
      .set("Cookie", patient.cookie)
      .send({
        title: coachPatientTitle,
        notes: "Coach session created in regression test",
        coachUserId: coach.user.id,
        meetingUrl: "https://meet.google.com/custom-regression-link",
      });

    expect(coachLinkedSession.status).toBe(201);
    expect(coachLinkedSession.body.meetingUrl).toBe("https://meet.google.com/custom-regression-link");
    coachPatientSessionId = coachLinkedSession.body.id;

    const otherDoctorSession = await request(app)
      .post("/api/coaching/sessions")
      .set("Cookie", otherPatient.cookie)
      .send({
        title: otherDoctorTitle,
        notes: "Second patient linked to the doctor",
        coachUserId: doctor.user.id,
      });

    expect(otherDoctorSession.status).toBe(201);
    expect(otherDoctorSession.body.meetingUrl).toMatch(/^https:\/\/meet\.google\.com\//);
    otherDoctorSessionId = otherDoctorSession.body.id;
  });

  it("GET /api/health returns runtime status in mock mode", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.mode).toBe("mock");
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("admin practitioners endpoints list and create practitioners", async () => {
    const listBefore = await request(app)
      .get("/api/admin/practitioners")
      .set("Cookie", admin.cookie);

    expect(listBefore.status).toBe(200);
    expect(listBefore.body.some((item: SessionUser) => item.username === "doctor")).toBe(true);
    expect(listBefore.body.some((item: SessionUser) => item.username === "coach")).toBe(true);

    const createRes = await request(app)
      .post("/api/admin/practitioners")
      .set("Cookie", admin.cookie)
      .send({
        username: createdPractitionerUsername,
        password: "pass1234",
        role: "coach",
        firstName: "Regression",
        lastName: "Coach",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.username).toBe(createdPractitionerUsername);
    expect(createRes.body.role).toBe("coach");

    const listAfter = await request(app)
      .get("/api/admin/practitioners")
      .set("Cookie", admin.cookie);

    expect(listAfter.status).toBe(200);
    expect(listAfter.body.some((item: SessionUser) => item.username === createdPractitionerUsername)).toBe(true);
  });

  it("coaching sessions stay role-aware across patient, doctor, coach, and admin views", async () => {
    const patientSessions = await request(app)
      .get("/api/coaching/sessions")
      .set("Cookie", patient.cookie);

    expect(patientSessions.status).toBe(200);
    expect(patientSessions.body.some((item: { id: string }) => item.id === doctorPatientSessionId)).toBe(true);
    expect(patientSessions.body.some((item: { id: string }) => item.id === coachPatientSessionId)).toBe(true);
    expect(patientSessions.body.some((item: { id: string }) => item.id === otherDoctorSessionId)).toBe(false);

    const doctorSessions = await request(app)
      .get("/api/coaching/sessions")
      .set("Cookie", doctor.cookie);

    expect(doctorSessions.status).toBe(200);
    expect(doctorSessions.body.some((item: { id: string }) => item.id === doctorPatientSessionId)).toBe(true);
    expect(doctorSessions.body.some((item: { id: string }) => item.id === otherDoctorSessionId)).toBe(true);
    expect(doctorSessions.body.some((item: { id: string }) => item.id === coachPatientSessionId)).toBe(false);

    const coachSessions = await request(app)
      .get("/api/coaching/sessions")
      .set("Cookie", coach.cookie);

    expect(coachSessions.status).toBe(200);
    expect(coachSessions.body.some((item: { id: string }) => item.id === coachPatientSessionId)).toBe(true);
    expect(coachSessions.body.some((item: { id: string }) => item.id === doctorPatientSessionId)).toBe(false);
    expect(coachSessions.body.some((item: { id: string }) => item.id === otherDoctorSessionId)).toBe(false);

    const adminSessions = await request(app)
      .get("/api/coaching/sessions")
      .set("Cookie", admin.cookie);

    expect(adminSessions.status).toBe(200);
    expect(adminSessions.body.some((item: { id: string }) => item.id === doctorPatientSessionId)).toBe(true);
    expect(adminSessions.body.some((item: { id: string }) => item.id === coachPatientSessionId)).toBe(true);
    expect(adminSessions.body.some((item: { id: string }) => item.id === otherDoctorSessionId)).toBe(true);
  });

  it("practitioner lookup by patient ID returns the linked patient overview", async () => {
    const res = await request(app)
      .get(`/api/patients/${otherPatient.user.clientId}/overview`)
      .set("Cookie", doctor.cookie);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(otherPatient.user.id);
    expect(res.body.clientId).toBe(otherPatient.user.clientId);
    expect(res.body.username).toBe(otherPatient.user.username);
    expect(res.body.sessionsCount).toBeGreaterThanOrEqual(1);
    expect(res.body.latestSession).not.toBeNull();
  });
});
