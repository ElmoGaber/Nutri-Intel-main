import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";
import { useQueries } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Droplets, Droplet, Wheat, ArrowRight, Loader2, HeartPulse, Moon } from "lucide-react";
import { useMemo } from "react";
import { today, getLast7Days } from "@/lib/dateUtils";
import { average, normalizeMetricSeries, trendDirection, waterAmountToMl } from "@/lib/metric-insights";

type WaterLog = {
  amount?: number;
  unit?: string;
  date?: string | Date;
};

type Insight = {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  prob: number;
  icon: any;
  color: string;
  bg: string;
  bar: string;
  priority: number;
};

function boundedRisk(value: number): number {
  return Math.max(8, Math.min(96, Math.round(value)));
}

function riskTone(prob: number) {
  if (prob >= 65) {
    return { color: "text-red-500", bg: "bg-red-500/10", bar: "bg-red-500" };
  }
  if (prob >= 35) {
    return { color: "text-amber-500", bg: "bg-amber-500/10", bar: "bg-amber-500" };
  }
  return { color: "text-blue-500", bg: "bg-blue-500/10", bar: "bg-blue-500" };
}

function positiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function PredictiveInsights() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const dates = getLast7Days();

  const queries = useQueries({
    queries: [
      {
        queryKey: ["water", today()],
        queryFn: async () => {
          const r = await fetch(`/api/water/logs?date=${today()}`, { credentials: "include" });
          return r.ok ? r.json() : [];
        },
      },
      ...dates.map((date) => ({
        queryKey: ["predictive-metrics", date],
        queryFn: async () => {
          const r = await fetch(`/api/health/metrics?date=${date}`, { credentials: "include" });
          return r.ok ? r.json() : [];
        },
      })),
      ...dates.map((date) => ({
        queryKey: ["predictive-meals", date],
        queryFn: async () => {
          const r = await fetch(`/api/nutrition/meals?date=${date}`, { credentials: "include" });
          return r.ok ? r.json() : [];
        },
      })),
    ],
  });

  const waterQuery = queries[0];
  const metricsQueries = queries.slice(1, 1 + dates.length);
  const mealQueries = queries.slice(1 + dates.length);
  const isLoading = queries.some((query) => query.isLoading);

  const insights = useMemo(() => {
    const weightKg = positiveNumber(user?.weight);
    const waterGoalMl = weightKg ? Math.round(weightKg * 33) : null;
    const activity = typeof user?.activityLevel === "string" ? user.activityLevel : null;

    const waterLogs: WaterLog[] = Array.isArray(waterQuery.data) ? waterQuery.data : [];
    const metrics: any[] = metricsQueries.flatMap((query) => (Array.isArray(query.data) ? query.data : []));
    const allMeals: any[] = mealQueries.flatMap((query) => (Array.isArray(query.data) ? query.data : []));

    const cards: Insight[] = [];

    const waterTodayMl = waterLogs.reduce((sum, log) => sum + waterAmountToMl(log.amount, log.unit), 0);
    const hydrationPct = waterGoalMl ? Math.min((waterTodayMl / waterGoalMl) * 100, 100) : 0;
    const dehydrationRisk = boundedRisk(waterLogs.length === 0 ? 72 : waterGoalMl ? Math.max(6, 100 - hydrationPct) : 48);
    const hydrationTone = riskTone(dehydrationRisk);
    cards.push({
      id: "hydration",
      titleEn: "Hydration Stability",
      titleAr: "استقرار الترطيب",
      subtitleEn: waterLogs.length > 0 && waterGoalMl
        ? `${waterTodayMl} / ${waterGoalMl} ml today (${Math.round(hydrationPct)}%)`
        : waterLogs.length > 0
          ? `${waterTodayMl} ml logged today (personal target unavailable)`
        : "No water logged today",
      subtitleAr: waterLogs.length > 0 && waterGoalMl
        ? `${waterTodayMl} / ${waterGoalMl} مل اليوم (${Math.round(hydrationPct)}%)`
        : waterLogs.length > 0
          ? `تم تسجيل ${waterTodayMl} مل اليوم (الهدف الشخصي غير متاح)`
        : "لم يتم تسجيل ماء اليوم",
      prob: dehydrationRisk,
      icon: Droplets,
      ...hydrationTone,
      priority: dehydrationRisk + (waterLogs.length > 0 ? 15 : 0),
    });

    const metricSeries = normalizeMetricSeries(metrics);

    const glucoseValues = metricSeries.glucose;
    if (glucoseValues.length > 0) {
      const avgGlucose = average(glucoseValues) || 0;
      const highFraction = glucoseValues.filter((value) => value > 140).length / glucoseValues.length;
      const glucoseTrend = trendDirection(glucoseValues);
      let glucoseRisk = avgGlucose > 126 ? 82 : avgGlucose > 110 ? 55 : 20;
      glucoseRisk += highFraction > 0.4 ? 8 : 0;
      glucoseRisk += glucoseTrend === "up" ? 6 : glucoseTrend === "down" ? -6 : 0;
      glucoseRisk = boundedRisk(glucoseRisk);
      const glucoseTone = riskTone(glucoseRisk);

      cards.push({
        id: "glucose",
        titleEn: "Blood Sugar Stability",
        titleAr: "استقرار سكر الدم",
        subtitleEn: `Avg ${Math.round(avgGlucose)} mg/dL (${glucoseValues.length} readings)`,
        subtitleAr: `متوسط ${Math.round(avgGlucose)} ملجم/ديسيلتر (${glucoseValues.length} قراءة)`,
        prob: glucoseRisk,
        icon: Droplet,
        ...glucoseTone,
        priority: glucoseRisk + 20,
      });
    } else {
      const noDataRisk = boundedRisk(48);
      const tone = riskTone(noDataRisk);
      cards.push({
        id: "glucose-missing",
        titleEn: "Glucose Coverage Gap",
        titleAr: "نقص في تغطية قياسات السكر",
        subtitleEn: "No glucose readings logged this week",
        subtitleAr: "لا توجد قراءات سكر مسجلة هذا الأسبوع",
        prob: noDataRisk,
        icon: Droplet,
        ...tone,
        priority: noDataRisk,
      });
    }

    const systolicValues = metricSeries.systolic;
    if (systolicValues.length > 0) {
      const avgSystolic = average(systolicValues) || 0;
      const highFraction = systolicValues.filter((value) => value >= 130).length / systolicValues.length;
      const bpTrend = trendDirection(systolicValues, 0.03);
      let bpRisk = avgSystolic >= 135 ? 78 : avgSystolic >= 125 ? 52 : 24;
      bpRisk += highFraction > 0.4 ? 8 : 0;
      bpRisk += bpTrend === "up" ? 6 : bpTrend === "down" ? -5 : 0;
      bpRisk = boundedRisk(bpRisk);
      const bpTone = riskTone(bpRisk);

      cards.push({
        id: "bp",
        titleEn: "Blood Pressure Drift",
        titleAr: "انحراف ضغط الدم",
        subtitleEn: `Avg systolic ${Math.round(avgSystolic)} mmHg (${systolicValues.length} readings)`,
        subtitleAr: `متوسط الضغط الانقباضي ${Math.round(avgSystolic)} ملم زئبق (${systolicValues.length} قراءة)`,
        prob: bpRisk,
        icon: HeartPulse,
        ...bpTone,
        priority: bpRisk + 12,
      });
    }

    const sleepValues = metricSeries.sleepHours;
    if (sleepValues.length > 0) {
      const avgSleep = average(sleepValues) || 0;
      const sleepDeficit = Math.max(0, 7 - avgSleep);
      const sleepRisk = boundedRisk(18 + sleepDeficit * 12);
      const sleepTone = riskTone(sleepRisk);
      cards.push({
        id: "sleep",
        titleEn: "Sleep Debt Risk",
        titleAr: "خطر عجز النوم",
        subtitleEn: `Average sleep ${avgSleep.toFixed(1)}h/night`,
        subtitleAr: `متوسط النوم ${avgSleep.toFixed(1)} ساعة/ليلة`,
        prob: sleepRisk,
        icon: Moon,
        ...sleepTone,
        priority: sleepRisk + 10,
      });
    }

    const activityFactor = activity
      ? ["veryActive", "extraActive"].includes(activity)
        ? 1.5
        : ["moderatelyActive"].includes(activity)
          ? 1.3
          : ["sedentary", "lightlyActive"].includes(activity)
            ? 1.0
            : null
      : null;
    const proteinTarget = weightKg && activityFactor ? Math.round(weightKg * activityFactor) : null;
    const avgProtein = allMeals.length > 0
      ? Math.round(allMeals.reduce((sum: number, meal: any) => sum + (Number(meal.protein) || 0), 0) / 7)
      : 0;
    let nutrientRisk = 62;
    if (allMeals.length === 0) {
      nutrientRisk = 65;
    } else if (!proteinTarget) {
      nutrientRisk = 52;
    } else if (avgProtein < proteinTarget * 0.6) {
      nutrientRisk = 78;
    } else if (avgProtein < proteinTarget * 0.85) {
      nutrientRisk = 52;
    } else {
      nutrientRisk = 20;
    }
    nutrientRisk = boundedRisk(nutrientRisk);
    const nutrientTone = riskTone(nutrientRisk);
    cards.push({
      id: "protein",
      titleEn: "Protein Adequacy",
      titleAr: "كفاية البروتين",
      subtitleEn: allMeals.length > 0
        ? proteinTarget
          ? `Avg ${avgProtein}g/day, target ~${proteinTarget}g`
          : `Avg ${avgProtein}g/day (target unavailable without full profile)`
        : "No meals logged this week",
      subtitleAr: allMeals.length > 0
        ? proteinTarget
          ? `متوسط ${avgProtein}ج/يوم، الهدف ~${proteinTarget}ج`
          : `متوسط ${avgProtein}ج/يوم (الهدف غير متاح قبل اكتمال الملف الشخصي)`
        : "لا توجد وجبات مسجلة هذا الأسبوع",
      prob: nutrientRisk,
      icon: Wheat,
      ...nutrientTone,
      priority: nutrientRisk + 14,
    });

    return cards
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 4);
  }, [user, waterQuery.data, ...metricsQueries.map((q) => q.data), ...mealQueries.map((q) => q.data)]);

  return (
    <div className="glass-card p-6 flex flex-col animate-in fade-in slide-in-from-right-8 duration-700 delay-100">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("aiPredictions")}</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-5">
          {insights.map((insight) => (
            <div key={insight.id} className="group">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${insight.bg} ${insight.color}`}>
                    <insight.icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {language === "ar" ? insight.titleAr : insight.titleEn}
                    </span>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {language === "ar" ? insight.subtitleAr : insight.subtitleEn}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold shrink-0 ms-2 ${insight.prob > 55 ? "text-destructive" : "text-muted-foreground"}`}>
                  {insight.prob}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${insight.prob > 55 ? "bg-destructive" : insight.bar} transition-all duration-1000 ease-out origin-left`}
                  style={{ width: `${insight.prob}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border">
        <button
          onClick={() => setLocation("/predictions")}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
        >
          {language === "ar" ? "عرض التحليل الكامل" : "View full analysis"}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
