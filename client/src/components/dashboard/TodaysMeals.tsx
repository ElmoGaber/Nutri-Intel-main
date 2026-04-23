import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";
import { useMeals } from "@/hooks/useNutrition";
import { Sunrise, Sun, Moon, Apple, ChevronRight, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MealGroup {
  mealType: string;
  icon: React.ComponentType<any>;
  time: string;
  meals: any[];
  totalCalories: number;
  macros: { p: number; c: number; f: number };
  rating: string;
  ratingColor: string;
}

export default function TodaysMeals() {
  const { t, dir } = useLanguage();
  const [, setLocation] = useLocation();
  const { data: mealsList, isLoading } = useMeals();

  const getMealTypeIcon = (type: string): React.ComponentType<any> => {
    const value = type.toLowerCase();
    if (value.includes("breakfast")) return Sunrise;
    if (value.includes("lunch")) return Sun;
    if (value.includes("dinner")) return Moon;
    return Apple;
  };

  const getMealTypeTime = (type: string): string => {
    const value = type.toLowerCase();
    if (value.includes("breakfast")) return "07:30 AM";
    if (value.includes("lunch")) return "01:00 PM";
    if (value.includes("dinner")) return "07:00 PM";
    return dir === "rtl" ? "أي وقت" : "Anytime";
  };

  const getRating = (calories: number, target: number): { rating: string; color: string } => {
    const percentage = (calories / target) * 100;
    if (percentage >= 90 && percentage <= 110) return { rating: t("excellent"), color: "text-green-500" };
    if (percentage >= 75 && percentage < 90) return { rating: t("good"), color: "text-blue-500" };
    if (percentage >= 50 && percentage < 75) return { rating: t("moderate"), color: "text-amber-500" };
    return { rating: t("needsImprovement"), color: "text-amber-500" };
  };

  const mealsByType = new Map<string, any[]>();
  (mealsList || []).forEach((meal: any) => {
    const type = meal.mealType || "snacks";
    if (!mealsByType.has(type)) mealsByType.set(type, []);
    mealsByType.get(type)!.push(meal);
  });

  const meals: MealGroup[] = Array.from(mealsByType.entries()).map(([type, items]) => {
    const totalCalories = items.reduce((sum: number, item: any) => sum + Number(item.calories || 0), 0);
    const totalProtein = items.reduce((sum: number, item: any) => sum + Number(item.protein || 0), 0);
    const totalCarbs = items.reduce((sum: number, item: any) => sum + Number(item.carbs || 0), 0);
    const totalFat = items.reduce((sum: number, item: any) => sum + Number(item.fat || 0), 0);
    const { rating, color } = getRating(totalCalories, 500);

    return {
      mealType: type,
      icon: getMealTypeIcon(type),
      time: getMealTypeTime(type),
      meals: items,
      totalCalories,
      macros: { p: totalProtein, c: totalCarbs, f: totalFat },
      rating,
      ratingColor: color,
    };
  });

  const hasMeals = meals.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">{t("todaysMeals")}</h2>
        <Button variant="ghost" className="text-primary hover:text-primary/80 group" onClick={() => setLocation("/meal-planner?add=1")}>
          {t("mealPlanner")}
          <ChevronRight className={cn("w-4 h-4 ms-1 transition-transform", dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
        </Button>
      </div>

      {hasMeals ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {meals.map((meal) => (
            <div key={meal.mealType} className="glass-card p-5 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer">
              <div className="absolute top-0 end-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <meal.icon className="w-24 h-24" />
              </div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:scale-110 transition-transform">
                    <meal.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t(meal.mealType as any)}</h3>
                    <p className="text-xs text-muted-foreground">{meal.time}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-xl font-bold">{Math.round(meal.totalCalories)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">kcal</p>
                </div>
              </div>

              <div className="space-y-3 mb-5 relative z-10">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">P: {Math.round(meal.macros.p)}g</span>
                  <span className="text-muted-foreground">C: {Math.round(meal.macros.c)}g</span>
                  <span className="text-muted-foreground">F: {Math.round(meal.macros.f)}g</span>
                </div>

                <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
                  <div className="bg-red-400" style={{ width: `${meal.macros.p + meal.macros.c + meal.macros.f > 0 ? (meal.macros.p / (meal.macros.p + meal.macros.c + meal.macros.f)) * 100 : 0}%` }} />
                  <div className="bg-yellow-400" style={{ width: `${meal.macros.p + meal.macros.c + meal.macros.f > 0 ? (meal.macros.c / (meal.macros.p + meal.macros.c + meal.macros.f)) * 100 : 0}%` }} />
                  <div className="bg-amber-400" style={{ width: `${meal.macros.p + meal.macros.c + meal.macros.f > 0 ? (meal.macros.f / (meal.macros.p + meal.macros.c + meal.macros.f)) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4 relative z-10">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className={cn("text-xs font-medium", meal.ratingColor)}>{meal.rating}</span>
                </div>
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-medium shadow-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" onClick={() => setLocation("/meal-planner")}>
                  {t("viewDetails")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <Apple className="w-10 h-10 mx-auto text-muted-foreground/35 mb-3" />
          <p className="text-sm text-muted-foreground">
            {dir === "rtl" ? "لا توجد وجبات اليوم بعد" : "No meals logged for today yet"}
          </p>
          <Button type="button" size="sm" className="mt-4" onClick={() => setLocation("/meal-planner?add=1")}>
            {dir === "rtl" ? "أضف أول وجبة" : "Add your first meal"}
          </Button>
        </div>
      )}
    </div>
  );
}
