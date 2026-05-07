import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { downloadPDF } from "@/lib/actions";
import { useQueries } from "@tanstack/react-query";
import { getWeekDates, today } from "@/lib/dateUtils";
import { useMeals } from "@/hooks/useNutrition";
import { useNutritionGoals } from "@/hooks/useNutritionGoals";
import { calculateGoalPercentage, summarizeMeals } from "@/lib/nutrition-metrics";

const daysOfWeekKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

function targetLabel(value: number, unit: string, language: string): string {
  if (!value || value <= 0) {
    return language === "ar" ? "غير متاح" : "N/A";
  }
  return `${Math.round(value)}${unit}`;
}

export default function Nutrition() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showFilter, setShowFilter] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("week");

  const weekDates = useMemo(() => getWeekDates(), []);
  const { data: todayMeals = [] } = useMeals(today());
  const { goals } = useNutritionGoals();

  const weekQueries = useQueries({
    queries: weekDates.map((date) => ({
      queryKey: ["meals", date],
      queryFn: async () => {
        const r = await fetch(`/api/nutrition/meals?date=${encodeURIComponent(date)}`, { credentials: "include" });
        if (!r.ok) return [];
        return r.json() as Promise<any[]>;
      },
    })),
  });

  const todaySummary = useMemo(() => summarizeMeals(todayMeals as any[]), [todayMeals]);

  const dailyData = useMemo(() => {
    return weekDates.map((_, idx) => {
      const meals = (weekQueries[idx]?.data as any[]) || [];
      const summary = summarizeMeals(meals);
      return {
        day: t(daysOfWeekKeys[idx]),
        calories: summary.calories,
        protein: summary.protein,
        carbs: summary.carbs,
        fats: summary.fats,
        fiber: summary.fiber,
        mealCount: summary.mealCount,
      };
    });
  }, [weekQueries, weekDates, t]);

  const aggregated = useMemo(() => {
    if (filterPeriod === "week") {
      return dailyData;
    }
    return [] as typeof dailyData;
  }, [dailyData, filterPeriod]);

  const totals = useMemo(() => {
    return dailyData.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fats: acc.fats + day.fats,
        fiber: acc.fiber + day.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
  }, [dailyData]);

  const daysWithMeals = dailyData.filter((d) => d.mealCount > 0).length || 1;
  const avgCalories = Math.round(totals.calories / daysWithMeals);
  const hasGoalTargets = [goals.calories, goals.protein, goals.carbs, goals.fats, goals.fiber].some((value) => value > 0);
  const nutrients = [
    { label: t("protein"), current: Math.round(todaySummary.protein), goal: goals.protein, unit: "g", color: "bg-red-500" },
    { label: t("carbs"), current: Math.round(todaySummary.carbs), goal: goals.carbs, unit: "g", color: "bg-blue-500" },
    { label: t("fats"), current: Math.round(todaySummary.fats), goal: goals.fats, unit: "g", color: "bg-amber-500" },
    { label: t("fiber"), current: Math.round(todaySummary.fiber), goal: goals.fiber, unit: "g", color: "bg-green-500" },
  ];

  const hasData = totals.calories > 0 || todaySummary.calories > 0;

  const handleAddMeal = () => {
    setLocation("/meal-planner?add=1");
  };

  const handleExport = () => {
    if (!hasData) {
      toast({
        title: language === "ar" ? "لا توجد بيانات" : "No Data",
        description: language === "ar" ? "أضف وجبات أولًا من مخطط الوجبات" : "Add meals first from the Meal Planner",
      });
      return;
    }

    const sections = [
      {
        heading: language === "ar" ? "ملخص اليوم الحالي" : "Today's Summary",
        content: [
          `${language === "ar" ? "السعرات" : "Calories"}: ${Math.round(todaySummary.calories)} / ${targetLabel(goals.calories, " kcal", language)}`,
          `${language === "ar" ? "البروتين" : "Protein"}: ${Math.round(todaySummary.protein)}g / ${targetLabel(goals.protein, "g", language)}`,
          `${language === "ar" ? "الكربوهيدرات" : "Carbs"}: ${Math.round(todaySummary.carbs)}g / ${targetLabel(goals.carbs, "g", language)}`,
          `${language === "ar" ? "الدهون" : "Fats"}: ${Math.round(todaySummary.fats)}g / ${targetLabel(goals.fats, "g", language)}`,
          `${language === "ar" ? "الألياف" : "Fiber"}: ${Math.round(todaySummary.fiber)}g / ${targetLabel(goals.fiber, "g", language)}`,
        ].join("\n"),
      },
      {
        heading: language === "ar" ? "التفاصيل الأسبوعية" : "Weekly Breakdown",
        content: dailyData.map((d) => `${d.day}: ${d.calories} kcal (${d.mealCount} ${language === "ar" ? "وجبات" : "meals"})`).join("\n"),
      },
    ];

    downloadPDF("nutrition-report.pdf", language === "ar" ? "تقرير التغذية" : "Nutrition Report", sections);
    toast({
      title: language === "ar" ? "تم التنزيل" : "Downloaded",
      description: language === "ar" ? "تم تنزيل تقرير التغذية كـ PDF" : "Nutrition report downloaded as PDF",
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">{t("nutritionTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("nutritionSummaryTitle")}</p>
      </div>

      {!hasData ? (
        <div className="glass-card p-8 text-center">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{language === "ar" ? "لا توجد بيانات تغذية بعد" : "No nutrition data yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">{language === "ar" ? "أضف وجبات في مخطط الوجبات لرؤية تحليل التغذية" : "Add meals in the Meal Planner to see nutrition analysis"}</p>
          <Button className="mt-4" onClick={handleAddMeal}>
            {language === "ar" ? "اذهب لمخطط الوجبات" : "Go to Meal Planner"}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("dailyCalories")}</p>
                  <p className="text-2xl font-bold">{Math.round(todaySummary.calories)}</p>
                  <p className="text-xs text-muted-foreground mt-2">{language === "ar" ? "الهدف" : "Goal"}: {targetLabel(goals.calories, "", language)}</p>
                </div>
                <div className="text-3xl">🔥</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">{calculateGoalPercentage(todaySummary.calories, goals.calories)}%</div>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${calculateGoalPercentage(todaySummary.calories, goals.calories)}%` }} />
                </div>
              </div>
            </div>
            {nutrients.map((nutrient) => (
              <div key={nutrient.label} className="glass-card p-6 relative overflow-hidden group">
                <p className="text-sm text-muted-foreground mb-2">{nutrient.label}</p>
                <p className="text-2xl font-bold mb-1">
                  {nutrient.current}
                  {nutrient.unit}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {language === "ar" ? "الهدف" : "Goal"}: {targetLabel(nutrient.goal, nutrient.unit, language)}
                </p>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium">{calculateGoalPercentage(nutrient.current, nutrient.goal)}%</div>
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className={nutrient.color} style={{ width: `${calculateGoalPercentage(nutrient.current, nutrient.goal)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t("weeklyTrendsTitle")}
              </h2>
              <Button variant="outline" size="sm" onClick={() => setShowFilter(!showFilter)}>
                <BarChart3 className="w-4 h-4 me-2" />
                {t("filter")}
              </Button>
            </div>

            {showFilter && (
              <div className="flex gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
                {[
                  { key: "week", label: language === "ar" ? "أسبوع" : "Week" },
                  { key: "month", label: language === "ar" ? "شهر" : "Month" },
                  { key: "year", label: language === "ar" ? "سنة" : "Year" },
                ].map((period) => (
                  <button
                    key={period.key}
                    onClick={() => setFilterPeriod(period.key)}
                    className={`px-3 py-1 rounded text-xs transition ${filterPeriod === period.key ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            )}

            {filterPeriod !== "week" && (
              <p className="text-xs text-muted-foreground mb-3">
                {language === "ar"
                  ? "لا تتوفر حالياً بيانات فعلية كافية لعرض تجميع شهري/سنوي بدون افتراضات."
                  : "There is not enough actual data yet to render month/year aggregation without assumptions."}
              </p>
            )}

            <div className="space-y-3">
              {aggregated.map((item) => {
                const maxCal = Math.max(...aggregated.map((a) => a.calories), 1);
                const pct = Math.round((item.calories / maxCal) * 100);
                return (
                  <div key={item.day} className="flex items-center gap-4">
                    <div className="w-20 font-medium text-sm truncate">{item.day}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{item.calories} kcal</span>
                        <span className="text-xs font-medium text-primary">
                          {item.mealCount} {language === "ar" ? "وجبة" : "meals"}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-3">{language === "ar" ? "متوسط الأسبوع" : "Weekly Average"}</h2>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
              {[
                { label: language === "ar" ? "السعرات" : "Calories", value: `${avgCalories} kcal` },
                { label: language === "ar" ? "البروتين" : "Protein", value: `${Math.round(totals.protein / daysWithMeals)}g` },
                { label: language === "ar" ? "الكربوهيدرات" : "Carbs", value: `${Math.round(totals.carbs / daysWithMeals)}g` },
                { label: language === "ar" ? "الدهون" : "Fats", value: `${Math.round(totals.fats / daysWithMeals)}g` },
                { label: language === "ar" ? "الألياف" : "Fiber", value: `${Math.round(totals.fiber / daysWithMeals)}g` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-muted/30 p-3 text-center">
                  <p className="text-lg font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3 pt-4">
        <Button className="flex-1" onClick={handleAddMeal}>
          {t("addMealButton")}
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleExport}>
          {language === "ar" ? "تنزيل PDF" : "Download PDF"}
        </Button>
      </div>

      {!hasGoalTargets && (
        <p className="text-xs text-muted-foreground text-center">
          {language === "ar"
            ? "أهداف التغذية غير مكتملة. أضف أهدافك من الملف الشخصي لتحليل أدق بدون افتراضات."
            : "Nutrition targets are incomplete. Add your goals in Profile for more precise, assumption-free analysis."}
        </p>
      )}
    </div>
  );
}
