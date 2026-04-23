import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useQueries } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { getWeekDates } from "@/lib/dateUtils";
import { summarizeMeals } from "@/lib/nutrition-metrics";

const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>
      <p className="text-sm font-bold text-foreground">
        {payload[0]?.value?.toLocaleString()}{" "}
        <span className="font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

export default function WeeklyTrends() {
  const { t, language } = useLanguage();
  const [activeMetric, setActiveMetric] = useState("calories");

  const weekDates = useMemo(() => getWeekDates(), []);

  const dayQueries = useQueries({
    queries: weekDates.map((date) => ({
      queryKey: ["meals", date],
      queryFn: async () => {
        const r = await fetch(`/api/nutrition/meals?date=${date}`, { credentials: "include" });
        return r.ok ? r.json() : [];
      },
    })),
  });

  const isLoading = dayQueries.some((q) => q.isLoading);

  const data = useMemo(() => {
    return weekDates.map((date, idx) => {
      const meals: any[] = Array.isArray(dayQueries[idx]?.data) ? dayQueries[idx].data : [];
      const summary = summarizeMeals(meals);
      const dow = new Date(date + "T12:00:00").getDay();
      return {
        name: language === "ar" ? DAY_LABELS_AR[dow] : DAY_LABELS_EN[dow],
        calories: Math.round(summary.calories),
        carbs: Math.round(summary.carbs),
        protein: Math.round(summary.protein),
      };
    });
  }, [...dayQueries.map((q) => q.data), weekDates, language]);

  const metrics = [
    { id: "calories", label: t("calories"), color: "hsl(var(--chart-1))", unit: "kcal" },
    { id: "carbs", label: t("carbs"), color: "hsl(var(--chart-3))", unit: "g" },
    { id: "protein", label: t("protein"), color: "hsl(var(--chart-2))", unit: "g" },
  ];

  const activeConfig = metrics.find((m) => m.id === activeMetric)!;
  const hasData = data.some((d) => (d as any)[activeMetric] > 0);

  return (
    <div className="glass-card p-6 h-[400px] flex flex-col animate-in fade-in slide-in-from-left-4 duration-500 delay-200 fill-mode-both">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          {t("weeklyTrendsTitle")}
        </h2>
        <div className="flex gap-1.5">
          {metrics.map((m) => (
            <Button
              key={m.id}
              variant={activeMetric === m.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveMetric(m.id)}
              className="rounded-full shadow-sm text-xs h-7 px-3"
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              {language === "ar"
                ? "لا توجد بيانات هذا الأسبوع"
                : "No data this week"}
            </p>
            <Link href="/nutrition">
              <a className="text-xs text-primary hover:underline">
                {language === "ar" ? "ابدأ بتسجيل وجباتك" : "Start logging your meals"}
              </a>
            </Link>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip unit={activeConfig.unit} />} />
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={activeConfig.color}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMetricGrad)"
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
