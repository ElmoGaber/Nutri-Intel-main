import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Share2, Loader2, TrendingUp, Pill, Utensils, Activity, Moon, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPDF, shareContent } from "@/lib/actions";
import { useQueries } from "@tanstack/react-query";
import { useMedications } from "@/hooks/useHealth";
import { useState, useMemo } from "react";
import { getLastNDays } from "@/lib/dateUtils";

type Period = "7" | "30" | "90";

export default function HealthReport() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: medications = [] } = useMedications();
  const [period, setPeriod] = useState<Period>("30");

  const days = useMemo(() => getLastNDays(Number(period)), [period]);

  const mealQueries = useQueries({
    queries: days.map((date) => ({
      queryKey: ["meals", date],
      queryFn: async () => {
        const r = await fetch(`/api/nutrition/meals?date=${encodeURIComponent(date)}`, { credentials: "include" });
        return r.ok ? r.json() : [];
      },
    })),
  });

  const metricsQuery = useQueries({
    queries: days.map((date) => ({
      queryKey: ["health-metrics", date],
      queryFn: async () => {
        const r = await fetch(`/api/health/metrics?date=${encodeURIComponent(date)}`, { credentials: "include" });
        return r.ok ? r.json() : [];
      },
    })),
  });

  const isLoading = mealQueries.some((q) => q.isLoading);

  const allMeals = mealQueries.flatMap((q) => (q.data as any[]) || []);
  const allMetrics = metricsQuery.flatMap((q) => (q.data as any[]) || []);

  const totalCalories = allMeals.reduce((s: number, m: any) => s + (Number(m.calories) || 0), 0);
  const avgCalories = allMeals.length > 0 ? Math.round(totalCalories / Number(period)) : 0;
  const daysLogged = days.filter((_, i) => ((mealQueries[i]?.data as any[]) || []).length > 0).length;
  const avgProtein = allMeals.length > 0
    ? Math.round(allMeals.reduce((s: number, m: any) => s + (Number(m.protein) || 0), 0) / Number(period))
    : 0;
  const avgCarbs = allMeals.length > 0
    ? Math.round(allMeals.reduce((s: number, m: any) => s + (Number(m.carbs) || 0), 0) / Number(period))
    : 0;
  const avgFat = allMeals.length > 0
    ? Math.round(allMeals.reduce((s: number, m: any) => s + (Number(m.fat) || 0), 0) / Number(period))
    : 0;

  const bpReadings = allMetrics.filter((m: any) => m.bloodPressureSystolic);
  const glucoseReadings = allMetrics.filter((m: any) => m.glucose);
  const weightReadings = allMetrics.filter((m: any) => m.weight);
  const sleepReadings = allMetrics.filter((m: any) => m.sleepHours);
  const waterReadings = allMetrics.filter((m: any) => m.waterIntake);

  const latestWeight = weightReadings[weightReadings.length - 1];
  const avgSleep = sleepReadings.length > 0
    ? (sleepReadings.reduce((s: number, m: any) => s + Number(m.sleepHours), 0) / sleepReadings.length).toFixed(1)
    : null;
  const avgWater = waterReadings.length > 0
    ? Math.round(waterReadings.reduce((s: number, m: any) => s + Number(m.waterIntake), 0) / waterReadings.length)
    : null;

  const periodLabel = {
    "7": language === "ar" ? "آخر 7 أيام" : "Last 7 days",
    "30": language === "ar" ? "آخر 30 يوم" : "Last 30 days",
    "90": language === "ar" ? "آخر 90 يوم" : "Last 90 days",
  }[period];

  const handleDownload = () => {
    const medList = (medications as any[]).map((m: any) => `${m.name} – ${m.dosage} (${m.frequency || "daily"})`).join(", ") || (language === "ar" ? "لا توجد أدوية" : "No medications");
    const sections = [
      {
        heading: language === "ar" ? `ملخص التغذية (${periodLabel})` : `Nutrition Summary (${periodLabel})`,
        content: [
          `${language === "ar" ? "متوسط السعرات اليومية" : "Avg daily calories"}: ${avgCalories} kcal`,
          `${language === "ar" ? "متوسط البروتين" : "Avg protein"}: ${avgProtein}g/day`,
          `${language === "ar" ? "متوسط الكربوهيدرات" : "Avg carbs"}: ${avgCarbs}g/day`,
          `${language === "ar" ? "متوسط الدهون" : "Avg fat"}: ${avgFat}g/day`,
          `${language === "ar" ? "أيام التسجيل" : "Days logged"}: ${daysLogged} / ${period}`,
          `${language === "ar" ? "إجمالي الوجبات" : "Total meals"}: ${allMeals.length}`,
        ].join("\n"),
      },
      {
        heading: language === "ar" ? "المقاييس الصحية" : "Health Metrics",
        content: [
          `${language === "ar" ? "قراءات ضغط الدم" : "BP readings"}: ${bpReadings.length}`,
          `${language === "ar" ? "قراءات الجلوكوز" : "Glucose readings"}: ${glucoseReadings.length}`,
          latestWeight ? `${language === "ar" ? "آخر وزن" : "Latest weight"}: ${latestWeight.weight} kg` : "",
          avgSleep ? `${language === "ar" ? "متوسط النوم" : "Avg sleep"}: ${avgSleep} ${language === "ar" ? "ساعة/يوم" : "hrs/day"}` : "",
          avgWater ? `${language === "ar" ? "متوسط الماء" : "Avg water"}: ${avgWater} ml/day` : "",
        ].filter(Boolean).join("\n"),
      },
      {
        heading: language === "ar" ? "الأدوية" : "Medications",
        content: medList,
      },
      {
        heading: language === "ar" ? "التوصيات" : "Recommendations",
        content: [
          daysLogged < Number(period) * 0.7
            ? (language === "ar" ? "⚠ حاول تسجيل وجباتك يومياً للحصول على تحليل أفضل" : "⚠ Try to log meals daily for better analysis")
            : (language === "ar" ? "✅ استمر في التسجيل اليومي المنتظم" : "✅ Keep up the consistent daily logging"),
          avgSleep && Number(avgSleep) < 7
            ? (language === "ar" ? "⚠ متوسط نومك أقل من 7 ساعات — حاول تحسين جودة نومك" : "⚠ Average sleep below 7 hours — consider improving sleep quality")
            : "",
          avgCalories > 0 && avgCalories < 1200
            ? (language === "ar" ? "⚠ متوسط السعرات منخفض جداً — تأكد من تناول كميات كافية" : "⚠ Average calories very low — ensure adequate intake")
            : "",
        ].filter(Boolean).join("\n"),
      },
    ];
    downloadPDF("health-report.pdf", language === "ar" ? "التقرير الصحي" : "Health Report", sections);
    toast({ title: language === "ar" ? "تم التنزيل" : "Downloaded" });
  };

  const handleShare = async () => {
    const summary = language === "ar"
      ? `التقرير الصحي – ${periodLabel}\nمتوسط السعرات: ${avgCalories} kcal\nأيام التسجيل: ${daysLogged}/${period}`
      : `Health Report – ${periodLabel}\nAvg calories: ${avgCalories} kcal\nDays logged: ${daysLogged}/${period}`;
    const ok = await shareContent(language === "ar" ? "تقريري الصحي" : "My Health Report", summary);
    toast({ title: ok ? (language === "ar" ? "تمت المشاركة" : "Shared") : (language === "ar" ? "تم النسخ" : "Copied") });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">{t("healthReportTitle")}</h1>
        <p className="text-muted-foreground mt-1">{periodLabel}</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {(["7", "30", "90"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${period === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {p === "7" ? (language === "ar" ? "٧ أيام" : "7 days") : p === "30" ? (language === "ar" ? "٣٠ يوم" : "30 days") : (language === "ar" ? "٩٠ يوم" : "90 days")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <Utensils className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{avgCalories}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "سعرات/يوم" : "kcal/day avg"}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{daysLogged}/{period}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "أيام التسجيل" : "Days logged"}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Activity className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{allMetrics.length}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "قراءات صحية" : "Health readings"}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Pill className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{(medications as any[]).length}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "أدوية" : "Medications"}</p>
            </div>
          </div>

          {/* Nutrition details */}
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t("nutritionSummary")}
              </h2>
              {allMeals.length === 0 ? (
                <p className="text-sm text-muted-foreground">{language === "ar" ? "لا توجد وجبات مسجلة" : "No meals logged in this period"}</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: language === "ar" ? "سعرات/يوم" : "Avg Calories", value: `${avgCalories} kcal`, color: "text-orange-500" },
                    { label: language === "ar" ? "بروتين/يوم" : "Avg Protein", value: `${avgProtein}g`, color: "text-blue-500" },
                    { label: language === "ar" ? "كارب/يوم" : "Avg Carbs", value: `${avgCarbs}g`, color: "text-green-500" },
                    { label: language === "ar" ? "دهون/يوم" : "Avg Fat", value: `${avgFat}g`, color: "text-amber-500" },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/30 rounded-xl p-3 text-center">
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4">{t("healthMetrics")}</h2>
              {allMetrics.length === 0 ? (
                <p className="text-sm text-muted-foreground">{language === "ar" ? "لا توجد قراءات صحية مسجلة" : "No health readings recorded"}</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {bpReadings.length > 0 && (
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <Activity className="w-5 h-5 mx-auto mb-1 text-red-500" />
                      <p className="text-lg font-bold">{bpReadings.length}</p>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "قراءات ضغط الدم" : "BP readings"}</p>
                    </div>
                  )}
                  {glucoseReadings.length > 0 && (
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <Activity className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                      <p className="text-lg font-bold">{glucoseReadings.length}</p>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "قراءات سكر الدم" : "Glucose readings"}</p>
                    </div>
                  )}
                  {latestWeight && (
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                      <p className="text-lg font-bold">{latestWeight.weight} kg</p>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "آخر وزن" : "Latest weight"}</p>
                    </div>
                  )}
                  {avgSleep && (
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <Moon className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
                      <p className={`text-lg font-bold ${Number(avgSleep) < 7 ? "text-amber-500" : "text-indigo-500"}`}>{avgSleep}h</p>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "متوسط النوم" : "Avg sleep"}</p>
                    </div>
                  )}
                  {avgWater && (
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-lg font-bold">{avgWater}ml</p>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "متوسط الماء" : "Avg water"}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4">{t("recommendations")}</h2>
              <div className="space-y-2 text-sm">
                {daysLogged < Number(period) * 0.7 && (
                  <p className="text-amber-600">⚠ {language === "ar" ? "حاول تسجيل وجباتك كل يوم للحصول على تحليل أفضل" : "Try to log meals every day for better analysis"}</p>
                )}
                {avgSleep && Number(avgSleep) < 7 && (
                  <p className="text-amber-600">⚠ {language === "ar" ? `متوسط نومك ${avgSleep} ساعة — يُنصح بـ 7-9 ساعات يومياً` : `Average sleep ${avgSleep}h — aim for 7–9 hours nightly`}</p>
                )}
                {(medications as any[]).length === 0 && (
                  <p>• {language === "ar" ? "أضف أدويتك لتفعيل تذكيرات الجرعات" : "Add your medications to enable dose reminders"}</p>
                )}
                <p>• {language === "ar" ? "استخدم مساعد الذكاء الاصطناعي للنصائح الصحية المخصصة" : "Use the AI Assistant for personalized health advice"}</p>
                <p>• {language === "ar" ? "تحقق من التفاعلات الدوائية قبل تناول أدوية جديدة" : "Check Drug Interactions before starting new medications"}</p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3 pt-4">
        <Button className="flex-1" onClick={handleDownload} disabled={isLoading}>
          <Download className="w-4 h-4 me-2" />
          {t("downloadPDF")}
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleShare}>
          <Share2 className="w-4 h-4 me-2" />
          {t("share")}
        </Button>
      </div>
    </div>
  );
}
