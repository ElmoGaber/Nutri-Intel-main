export type NutritionGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  waterLiters: number;
};

export type NutritionSummary = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  mealCount: number;
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function positiveNumberOrNull(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function positiveNumberOrZero(value: unknown): number {
  return positiveNumberOrNull(value) ?? 0;
}

export function buildNutritionGoals(user: { weight?: string | number | null } | null | undefined, prefs: any): NutritionGoals {
  const weightKg = positiveNumberOrNull(user?.weight);
  const explicitWaterGoal = positiveNumberOrNull(prefs?.waterGoalLiters ?? prefs?.waterGoal);
  const derivedWaterGoal = weightKg ? round(weightKg * 0.033) : 0;

  const proteinFromPreferences = positiveNumberOrNull(prefs?.proteinGoal);

  return {
    calories: positiveNumberOrZero(prefs?.calorieGoal),
    protein: proteinFromPreferences ?? (weightKg ? Math.round(weightKg * 1.3) : 0),
    carbs: positiveNumberOrZero(prefs?.carbGoal),
    fats: positiveNumberOrZero(prefs?.fatGoal),
    fiber: positiveNumberOrZero(prefs?.fiberGoal),
    waterLiters: explicitWaterGoal ?? derivedWaterGoal,
  };
}

export function summarizeMeals(meals: any[]): NutritionSummary {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (Number(meal?.calories) || 0),
      protein: acc.protein + (Number(meal?.protein) || 0),
      carbs: acc.carbs + (Number(meal?.carbs) || 0),
      fats: acc.fats + (Number(meal?.fat) || 0),
      fiber: acc.fiber + (Number(meal?.fiber) || 0),
      mealCount: acc.mealCount + 1,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, mealCount: 0 }
  );
}

export function calculateGoalPercentage(consumed: number, goal: number) {
  if (!goal || goal <= 0) return 0;
  return Math.min(Math.round((consumed / goal) * 100), 100);
}
