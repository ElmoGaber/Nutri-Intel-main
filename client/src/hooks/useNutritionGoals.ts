import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { buildNutritionGoals } from "@/lib/nutrition-metrics";

export function useNutritionGoals() {
  const { user } = useAuth();

  const preferencesQuery = useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const r = await fetch("/api/users/preferences", { credentials: "include" });
      return r.ok ? r.json() : {};
    },
    staleTime: 60 * 60 * 1000,
  });

  return {
    user,
    preferences: preferencesQuery.data || {},
    goals: buildNutritionGoals(user, preferencesQuery.data || {}),
    isLoading: preferencesQuery.isLoading,
  };
}
