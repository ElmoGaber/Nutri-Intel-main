import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Meal, InsertMeal } from "@shared/schema";
import { toast } from "sonner";
import { today, toLocalDateString } from "@/lib/dateUtils";

interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

type MealWithNutrition = Meal & {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

type MealInput = InsertMeal & {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

function getDateKey(date?: string) {
  return date || today();
}

function getMealDateKey(meal: { date?: string | Date }) {
  return meal.date ? toLocalDateString(new Date(meal.date)) : today();
}

function getMealCalories(meal: Partial<MealWithNutrition>) {
  return Number(meal.calories || 0);
}

function getMealProtein(meal: Partial<MealWithNutrition>) {
  return Number(meal.protein || 0);
}

function getMealCarbs(meal: Partial<MealWithNutrition>) {
  return Number(meal.carbs || 0);
}

function getMealFat(meal: Partial<MealWithNutrition>) {
  return Number(meal.fat || 0);
}

function buildDailySummary(dateKey: string, meals: Partial<MealWithNutrition>[]): DailySummary {
  return meals.reduce(
    (acc, meal) => ({
      date: dateKey,
      totalCalories: acc.totalCalories + getMealCalories(meal),
      totalProtein: acc.totalProtein + getMealProtein(meal),
      totalCarbs: acc.totalCarbs + getMealCarbs(meal),
      totalFat: acc.totalFat + getMealFat(meal),
      mealCount: acc.mealCount + 1,
    }),
    { date: dateKey, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: 0 }
  );
}

function upsertMealInList(list: MealWithNutrition[], meal: MealWithNutrition) {
  const index = list.findIndex((item) => item.id === meal.id);
  if (index === -1) return [meal, ...list];
  return list.map((item) => (item.id === meal.id ? { ...item, ...meal } : item));
}

export function useMeals(date?: string) {
  const dateStr = getDateKey(date);

  return useQuery({
    queryKey: ["meals", dateStr],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/meals?date=${encodeURIComponent(dateStr)}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch meals");
      }

      return response.json() as Promise<MealWithNutrition[]>;
    },
  });
}

export function useDailySummary(date?: string) {
  const dateStr = getDateKey(date);

  return useQuery({
    queryKey: ["daily-summary", dateStr],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/daily-summary?date=${encodeURIComponent(dateStr)}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch daily summary");
      }

      return response.json() as Promise<DailySummary>;
    },
  });
}

function updateMealCaches(queryClient: ReturnType<typeof useQueryClient>, dateKey: string, meals: MealWithNutrition[]) {
  queryClient.setQueryData(["meals", dateKey], meals);
  queryClient.setQueryData(["daily-summary", dateKey], buildDailySummary(dateKey, meals));
}

export function useCreateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meal: MealInput) => {
      const response = await fetch("/api/nutrition/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(meal),
      });

      if (!response.ok) {
        throw new Error("Failed to create meal");
      }

      return response.json() as Promise<MealWithNutrition>;
    },
    onMutate: async (meal) => {
      const dateKey = getMealDateKey(meal);
      await queryClient.cancelQueries({ queryKey: ["meals", dateKey] });
      await queryClient.cancelQueries({ queryKey: ["daily-summary", dateKey] });

      const previousMeals = (queryClient.getQueryData(["meals", dateKey]) as MealWithNutrition[] | undefined) || [];
      const optimisticMeal: MealWithNutrition = {
        id: `temp-${Date.now()}`,
        userId: "",
        name: meal.name,
        description: meal.description ?? null,
        mealType: meal.mealType,
        date: meal.date,
        createdAt: new Date(),
        updatedAt: new Date(),
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      };

      updateMealCaches(queryClient, dateKey, [optimisticMeal, ...previousMeals]);
      return { dateKey, previousMeals };
    },
    onSuccess: (createdMeal, _variables, context) => {
      const dateKey = context?.dateKey || getMealDateKey(createdMeal);
      const currentMeals = (queryClient.getQueryData(["meals", dateKey]) as MealWithNutrition[] | undefined) || [];
      const cleaned = currentMeals.filter((meal) => !String(meal.id).startsWith("temp-"));
      updateMealCaches(queryClient, dateKey, [createdMeal, ...cleaned]);
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["daily-summary"] });
      toast.success("Meal saved successfully");
    },
    onError: (error, _variables, context) => {
      if (context?.dateKey) {
        updateMealCaches(queryClient, context.dateKey, context.previousMeals || []);
      }
      toast.error(error instanceof Error ? error.message : "Failed to create meal");
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, meal }: { id: string; meal: MealInput }) => {
      const response = await fetch(`/api/nutrition/meals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(meal),
      });

      if (!response.ok) {
        throw new Error("Failed to update meal");
      }

      return response.json() as Promise<MealWithNutrition>;
    },
    onMutate: async ({ id, meal }) => {
      const dateKey = getMealDateKey(meal);
      await queryClient.cancelQueries({ queryKey: ["meals", dateKey] });
      await queryClient.cancelQueries({ queryKey: ["daily-summary", dateKey] });

      const previousMeals = (queryClient.getQueryData(["meals", dateKey]) as MealWithNutrition[] | undefined) || [];
      const optimisticMeal = {
        ...(previousMeals.find((item) => item.id === id) || ({} as MealWithNutrition)),
        id,
        name: meal.name,
        description: meal.description ?? null,
        mealType: meal.mealType,
        date: meal.date,
        updatedAt: new Date(),
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      } as MealWithNutrition;

      updateMealCaches(queryClient, dateKey, upsertMealInList(previousMeals, optimisticMeal));
      return { dateKey, previousMeals };
    },
    onSuccess: (updatedMeal, _variables, context) => {
      const dateKey = context?.dateKey || getMealDateKey(updatedMeal);
      const currentMeals = (queryClient.getQueryData(["meals", dateKey]) as MealWithNutrition[] | undefined) || [];
      updateMealCaches(queryClient, dateKey, upsertMealInList(currentMeals, updatedMeal));
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["daily-summary"] });
      toast.success("Meal updated successfully");
    },
    onError: (error, _variables, context) => {
      if (context?.dateKey) {
        updateMealCaches(queryClient, context.dateKey, context.previousMeals || []);
      }
      toast.error(error instanceof Error ? error.message : "Failed to update meal");
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dateKey }: { id: string; dateKey: string }) => {
      const response = await fetch(`/api/nutrition/meals/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete meal");
      }

      return { id, dateKey };
    },
    onMutate: async ({ id, dateKey }) => {
      await queryClient.cancelQueries({ queryKey: ["meals", dateKey] });
      await queryClient.cancelQueries({ queryKey: ["daily-summary", dateKey] });

      const previousMeals = (queryClient.getQueryData(["meals", dateKey]) as MealWithNutrition[] | undefined) || [];
      const nextMeals = previousMeals.filter((meal) => meal.id !== id);
      updateMealCaches(queryClient, dateKey, nextMeals);
      return { dateKey, previousMeals };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meals", variables.dateKey] });
      queryClient.invalidateQueries({ queryKey: ["daily-summary", variables.dateKey] });
      toast.success("Meal deleted successfully");
    },
    onError: (error, _variables, context) => {
      if (context?.dateKey) {
        updateMealCaches(queryClient, context.dateKey, context.previousMeals || []);
      }
      toast.error(error instanceof Error ? error.message : "Failed to delete meal");
    },
  });
}
