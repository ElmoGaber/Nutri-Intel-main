/**
 * Food Database Tests
 * Tests the shared food nutrition data and search functions
 */

import { describe, it, expect } from "vitest";
import { foodDatabase, foodCategories, searchFoods, calculateNutrition, assessFoodForProfile } from "../shared/food-nutrition";

describe("Food Database Data", () => {
  it("has at least 100 food items", () => {
    expect(foodDatabase.length).toBeGreaterThanOrEqual(100);
  });

  it("has at least 5 categories", () => {
    expect(foodCategories.length).toBeGreaterThanOrEqual(5);
  });

  it("every food item has required fields", () => {
    for (const food of foodDatabase) {
      expect(food).toHaveProperty("name");
      expect(food).toHaveProperty("per100g");
      expect(food).toHaveProperty("category");
      expect(typeof food.name).toBe("string");
      expect(typeof food.per100g.caloricValue).toBe("number");
      expect(food.per100g.caloricValue).toBeGreaterThanOrEqual(0);
    }
  });

  it("every food item has non-empty name", () => {
    const emptyNames = foodDatabase.filter((f) => !f.name || f.name.trim() === "");
    expect(emptyNames).toHaveLength(0);
  });

  it("every category has id and name", () => {
    for (const cat of foodCategories) {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(typeof cat.id).toBe("string");
      expect(typeof cat.name).toBe("string");
      expect(cat.id.length).toBeGreaterThan(0);
    }
  });

  it("food items reference valid category ids", () => {
    const validIds = new Set(foodCategories.map((c) => c.id));
    for (const food of foodDatabase) {
      if (food.category) {
        expect(validIds.has(food.category), `'${food.name}' has unknown category '${food.category}'`).toBe(true);
      }
    }
  });

  it("every food has at least one serving unit", () => {
    for (const food of foodDatabase) {
      expect(food.servingUnits.length, `'${food.name}' has no serving units`).toBeGreaterThan(0);
    }
  });

  it("every food item has an image after enrichment", () => {
    for (const food of foodDatabase) {
      expect(typeof food.image).toBe("string");
      expect(food.image?.startsWith("data:image/svg+xml")).toBe(true);
    }
  });

  it("includes ready-made meals for direct meal logging", () => {
    const readyMeals = foodDatabase.filter((food) => food.readyMeal);
    expect(readyMeals.length).toBeGreaterThanOrEqual(8);
  });
});

describe("Food Search", () => {
  it("returns all foods when query is empty", () => {
    const results = searchFoods("", undefined);
    expect(results.length).toBe(foodDatabase.length);
  });

  it("filters by name (case insensitive)", () => {
    const results = searchFoods("milk", undefined);
    expect(results.length).toBeGreaterThan(0);
    for (const food of results) {
      expect(food.name.toLowerCase()).toContain("milk");
    }
  });

  it("returns empty array for non-existent food", () => {
    const results = searchFoods("xyznonexistentfood123", undefined);
    expect(results).toHaveLength(0);
  });

  it("filters by category id", () => {
    const catId = foodCategories[0].id;
    const results = searchFoods("", catId);
    expect(results.length).toBeGreaterThan(0);
    for (const food of results) {
      expect(food.category).toBe(catId);
    }
  });

  it("combined name + category filter narrows results", () => {
    const catId = foodCategories[0].id;
    const allForCat = searchFoods("", catId);
    const filtered = searchFoods("a", catId);
    expect(filtered.length).toBeLessThanOrEqual(allForCat.length);
  });

  it("search can match curated tags like ready meals", () => {
    const results = searchFoods("ready meal", undefined);
    expect(results.some((food) => food.readyMeal)).toBe(true);
  });
});

describe("Nutrition Calculation", () => {
  it("calculateNutrition returns caloricValue", () => {
    const food = foodDatabase[0];
    if (!food) return;
    const servingUnit = food.servingUnits[0].unit;
    const result = calculateNutrition(food, servingUnit, 1);
    expect(result).toHaveProperty("caloricValue");
    expect(typeof result.caloricValue).toBe("number");
  });

  it("nutrition scales proportionally with quantity", () => {
    const food = foodDatabase[0];
    if (!food) return;
    const servingUnit = food.servingUnits[0].unit;
    const x1 = calculateNutrition(food, servingUnit, 1);
    const x2 = calculateNutrition(food, servingUnit, 2);
    expect(x2.caloricValue).toBeCloseTo(x1.caloricValue * 2, 0);
  });

  it("gram serving unit scales by weight in grams", () => {
    const food = foodDatabase.find((f) => f.servingUnits.some((u) => u.unit === "gram"));
    if (!food) return;
    const gramUnit = food.servingUnits.find((u) => u.unit === "gram")!;
    const result = calculateNutrition(food, "gram", 100);
    // 100g should equal per100g values
    expect(result.caloricValue).toBeCloseTo(food.per100g.caloricValue, 0);
  });
});

describe("Food Personalization", () => {
  it("blocks dairy foods for dairy-sensitive profiles", () => {
    const yogurt = foodDatabase.find((food) => food.name === "Greek Yogurt");
    expect(yogurt).toBeDefined();
    if (!yogurt) return;

    const result = assessFoodForProfile(yogurt, {
      dairyFree: true,
      allergies: ["dairy"],
    });

    expect(result.status).toBe("avoid");
    expect(result.matchedAllergens).toContain("dairy");
  });

  it("promotes healthy kid-friendly foods for children", () => {
    const kidMeal = foodDatabase.find((food) => food.name === "Banana Oat Pancakes");
    expect(kidMeal).toBeDefined();
    if (!kidMeal) return;

    const result = assessFoodForProfile(kidMeal, {
      age: 8,
      favoriteFoods: ["banana"],
    });

    expect(result.status).toBe("recommended");
    expect(result.scoreDelta).toBeGreaterThan(0);
  });

  it("limits sugary desserts for diabetes-aware profiles", () => {
    const dessert = foodDatabase.find((food) => food.name === "Kunafa");
    expect(dessert).toBeDefined();
    if (!dessert) return;

    const result = assessFoodForProfile(dessert, {
      conditions: ["diabetes"],
    });

    expect(result.status === "limit" || result.status === "avoid").toBe(true);
    expect(result.warningsEn.length).toBeGreaterThan(0);
  });
});
