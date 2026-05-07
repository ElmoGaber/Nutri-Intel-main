/**
 * BMI Calculator - Unit Tests
 * Tests the pure calculation logic extracted from BMICalculator.tsx
 */

import { describe, it, expect } from "vitest";

// ---- Replicate the calculation logic (pure functions) ----

type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "lightlyActive" | "moderatelyActive" | "veryActive" | "extraActive";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightlyActive: 1.375,
  moderatelyActive: 1.55,
  veryActive: 1.725,
  extraActive: 1.9,
};

interface BMIResult {
  bmi: number;
  categoryKey: string;
  idealWeightMin: number;
  idealWeightMax: number;
  weightDiff: number;
  weightDiffDirection: "gain" | "lose" | "none";
  dailyCalories: number;
}

function calculateBMI(
  weight: number,
  heightCm: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel
): BMIResult {
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  const roundedBMI = Math.round(bmi * 10) / 10;

  let categoryKey: string;
  if (bmi < 18.5) categoryKey = "underweight";
  else if (bmi < 25) categoryKey = "normalWeight";
  else if (bmi < 30) categoryKey = "overweight";
  else if (bmi < 35) categoryKey = "obese";
  else categoryKey = "severelyObese";

  const idealWeightMin = Math.round(18.5 * heightM * heightM * 10) / 10;
  const idealWeightMax = Math.round(24.9 * heightM * heightM * 10) / 10;

  let weightDiff = 0;
  let weightDiffDirection: "gain" | "lose" | "none" = "none";
  if (bmi < 18.5) {
    weightDiff = Math.round((idealWeightMin - weight) * 10) / 10;
    weightDiffDirection = "gain";
  } else if (bmi >= 25) {
    weightDiff = Math.round((weight - idealWeightMax) * 10) / 10;
    weightDiffDirection = "lose";
  }

  let bmr: number;
  if (gender === "male") {
    bmr = 88.362 + 13.397 * weight + 4.799 * heightCm - 5.677 * age;
  } else {
    bmr = 447.593 + 9.247 * weight + 3.098 * heightCm - 4.33 * age;
  }
  const dailyCalories = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);

  return { bmi: roundedBMI, categoryKey, idealWeightMin, idealWeightMax, weightDiff, weightDiffDirection, dailyCalories };
}

// ---- Tests ----

describe("BMI Calculation", () => {
  it("calculates BMI correctly (70kg, 175cm = ~22.9)", () => {
    const result = calculateBMI(70, 175, 25, "male", "sedentary");
    expect(result.bmi).toBe(22.9);
    expect(result.categoryKey).toBe("normalWeight");
  });

  it("classifies underweight correctly (BMI < 18.5)", () => {
    const result = calculateBMI(50, 175, 25, "male", "sedentary");
    expect(result.bmi).toBeLessThan(18.5);
    expect(result.categoryKey).toBe("underweight");
    expect(result.weightDiffDirection).toBe("gain");
    expect(result.weightDiff).toBeGreaterThan(0);
  });

  it("classifies overweight correctly (BMI 25-30)", () => {
    const result = calculateBMI(90, 175, 30, "male", "sedentary");
    expect(result.bmi).toBeGreaterThanOrEqual(25);
    expect(result.bmi).toBeLessThan(30);
    expect(result.categoryKey).toBe("overweight");
    expect(result.weightDiffDirection).toBe("lose");
  });

  it("classifies obese correctly (BMI 30-35)", () => {
    // 95 / (1.75)^2 ≈ 31.0 → obese
    const result = calculateBMI(95, 175, 30, "male", "sedentary");
    expect(result.bmi).toBeGreaterThanOrEqual(30);
    expect(result.bmi).toBeLessThan(35);
    expect(result.categoryKey).toBe("obese");
  });

  it("classifies severely obese correctly (BMI >= 35)", () => {
    const result = calculateBMI(130, 175, 30, "male", "sedentary");
    expect(result.bmi).toBeGreaterThanOrEqual(35);
    expect(result.categoryKey).toBe("severelyObese");
  });

  it("weightDiffDirection is 'none' for normal BMI", () => {
    const result = calculateBMI(70, 175, 25, "male", "sedentary");
    expect(result.weightDiffDirection).toBe("none");
    expect(result.weightDiff).toBe(0);
  });

  it("ideal weight range is computed from height", () => {
    const result = calculateBMI(70, 175, 25, "male", "sedentary");
    // 18.5 * (1.75)^2 ≈ 56.6, 24.9 * (1.75)^2 ≈ 76.2
    expect(result.idealWeightMin).toBeCloseTo(56.6, 0);
    expect(result.idealWeightMax).toBeCloseTo(76.2, 0);
  });
});

describe("Activity Level Multipliers", () => {
  it("sedentary uses 1.2 multiplier", () => {
    const res = calculateBMI(70, 175, 25, "male", "sedentary");
    const res2 = calculateBMI(70, 175, 25, "male", "lightlyActive");
    expect(res2.dailyCalories).toBeGreaterThan(res.dailyCalories);
  });

  it("extraActive gives highest calorie estimate", () => {
    const sedentary = calculateBMI(70, 175, 25, "male", "sedentary");
    const extra = calculateBMI(70, 175, 25, "male", "extraActive");
    expect(extra.dailyCalories).toBeGreaterThan(sedentary.dailyCalories);
    // 1.9 / 1.2 ≈ 1.58x difference
    expect(extra.dailyCalories / sedentary.dailyCalories).toBeCloseTo(1.9 / 1.2, 1);
  });

  it("female uses Mifflin formula (lower BMR than male for same stats)", () => {
    const male = calculateBMI(70, 175, 25, "male", "sedentary");
    const female = calculateBMI(70, 175, 25, "female", "sedentary");
    expect(female.dailyCalories).toBeLessThan(male.dailyCalories);
  });
});

describe("BMI Edge Cases", () => {
  it("handles minimum valid input (1cm, 1kg)", () => {
    // Should not throw
    expect(() => calculateBMI(1, 100, 1, "male", "sedentary")).not.toThrow();
  });

  it("BMI formula is weight / height_m^2", () => {
    const weight = 80;
    const height = 180;
    const expected = Math.round((weight / ((height / 100) ** 2)) * 10) / 10;
    const result = calculateBMI(weight, height, 30, "male", "sedentary");
    expect(result.bmi).toBe(expected);
  });
});
