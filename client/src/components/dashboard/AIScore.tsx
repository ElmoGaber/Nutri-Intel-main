import { useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useMeals } from "@/hooks/useNutrition";
import { useNutritionGoals } from "@/hooks/useNutritionGoals";
import { summarizeMeals } from "@/lib/nutrition-metrics";
import { CheckCircle2, AlertTriangle, Loader2, TrendingUp } from "lucide-react";
import { Link } from "wouter";

function scoreComponent(actual: number, target: number): number {
  if (!target || target <= 0) return 0;
  const ratio = actual / target;
  if (ratio >= 0.88 && ratio <= 1.12) return 25;
  if (ratio >= 0.75 && ratio <= 1.25) return 18;
  if (ratio >= 0.55 && ratio <= 1.4) return 10;
  return 4;
}

export default function AIScore() {
  const { t, language } = useLanguage();
  const { data: todayMeals = [], isLoading: mealsLoading } = useMeals();
  const { goals, isLoading: goalsLoading } = useNutritionGoals();

  const todaySummary = useMemo(() => summarizeMeals(todayMeals as any[]), [todayMeals]);

  const { score, complianceRate, microCoverage, metabolicStability, noDataReason } = useMemo(() => {
    const hasRequiredTargets =
      goals.calories > 0 && goals.protein > 0 && goals.carbs > 0 && goals.fats > 0;

    if (todaySummary.calories === 0 || !hasRequiredTargets) {
      return {
        score: 0,
        complianceRate: 0,
        microCoverage: 0,
        metabolicStability: "no-data" as const,
        noDataReason: todaySummary.calories === 0 ? "missing-meals" as const : "missing-targets" as const,
      };
    }

    const total = Math.min(
      100,
      scoreComponent(todaySummary.calories, goals.calories) +
        scoreComponent(todaySummary.protein, goals.protein) +
        scoreComponent(todaySummary.carbs, goals.carbs) +
        scoreComponent(todaySummary.fats, goals.fats)
    );

    return {
      score: total,
      complianceRate: Math.min(100, Math.round((todaySummary.calories / goals.calories) * 100)),
      microCoverage: Math.min(100, Math.round((todaySummary.protein / goals.protein) * 100)),
      metabolicStability: total >= 80 ? "optimal" : total >= 55 ? "fair" : "poor",
      noDataReason: null,
    };
  }, [todaySummary, goals]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const stabilityLabel =
    metabolicStability === "optimal"
      ? t("optimal") || "Optimal"
      : metabolicStability === "fair"
        ? language === "ar"
          ? "مقبول"
          : "Fair"
        : metabolicStability === "poor"
          ? language === "ar"
            ? "ضعيف"
            : "Poor"
          : language === "ar"
            ? "لا توجد بيانات"
            : "No Data";

  const stabilityColor =
    metabolicStability === "optimal"
      ? "text-green-500"
      : metabolicStability === "fair"
        ? "text-amber-500"
        : "text-muted-foreground";

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center animate-in fade-in slide-in-from-right-4 duration-500 delay-200 fill-mode-both">
      <div className="flex items-center justify-between w-full mb-6">
        <h2 className="text-xl font-semibold">{t("nutritionScore")}</h2>
        <span className="text-[10px] text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
          {language === "ar" ? "أهداف موحدة" : "Unified goals"}
        </span>
      </div>

      {mealsLoading || goalsLoading ? (
        <div className="flex items-center justify-center py-8 w-full">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : score === 0 ? (
        <div className="flex flex-col items-center gap-3 text-center py-4 w-full">
          <TrendingUp className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {noDataReason === "missing-targets"
              ? language === "ar"
                ? "أكمل أهدافك الغذائية في الملف الشخصي لحساب النقاط بدون افتراضات."
                : "Complete your nutrition targets in Profile to calculate the score without assumptions."
              : language === "ar"
                ? "سجل وجباتك لرؤية نقاطك"
                : "Log meals to see your score"}
          </p>
          {noDataReason === "missing-targets" ? (
            <Link href="/profile">
              <a className="text-xs text-primary hover:underline">{language === "ar" ? "اكمل أهدافك" : "Complete targets"}</a>
            </Link>
          ) : (
            <Link href="/meal-planner?add=1">
              <a className="text-xs text-primary hover:underline">{language === "ar" ? "أضف وجبة" : "Add a meal"}</a>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="relative w-40 h-40 mb-6 flex items-center justify-center group">
            <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={radius} stroke="hsl(var(--muted))" strokeWidth="12" fill="transparent" />
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="url(#aiScoreGrad)"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1500 ease-out"
              />
              <defs>
                <linearGradient id="aiScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col items-center justify-center z-10 group-hover:scale-110 transition-transform">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-emerald-400">{score}</span>
              <span className="text-sm text-muted-foreground font-medium">/ 100</span>
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-black/5 dark:bg-white/5">
              <span className="text-muted-foreground font-medium">{t("complianceRate")}</span>
              <span className="font-semibold text-foreground">{complianceRate}%</span>
            </div>
            <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-black/5 dark:bg-white/5">
              <span className="text-muted-foreground font-medium">{t("microCoverage")}</span>
              <span className={`font-semibold flex items-center gap-1 ${microCoverage >= 80 ? "text-green-500" : "text-amber-500"}`}>
                {microCoverage < 80 && <AlertTriangle className="w-4 h-4" />}
                {microCoverage}%
              </span>
            </div>
            <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-black/5 dark:bg-white/5">
              <span className="text-muted-foreground font-medium">{t("metabolicStability")}</span>
              <span className={`font-semibold flex items-center gap-1 ${stabilityColor}`}>
                {metabolicStability === "optimal" && <CheckCircle2 className="w-4 h-4" />}
                {metabolicStability === "fair" && <AlertTriangle className="w-4 h-4" />}
                {stabilityLabel}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
