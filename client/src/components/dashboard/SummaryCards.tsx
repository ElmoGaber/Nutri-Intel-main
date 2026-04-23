import { useLanguage } from "@/hooks/use-language";
import { useMeals } from "@/hooks/useNutrition";
import { useHealthMetrics } from "@/hooks/useHealth";
import { useNutritionGoals } from "@/hooks/useNutritionGoals";
import { Activity, Droplets, Flame, Beef, Wheat, Shell, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import { summarizeMeals } from "@/lib/nutrition-metrics";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { today } from "@/lib/dateUtils";

function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-muted" />
        <div className="h-3 bg-muted rounded w-20" />
      </div>
      <div className="h-8 bg-muted rounded w-14 mb-4" />
      <div className="h-2 bg-muted rounded w-full mt-4" />
    </div>
  );
}

type Status = "optimal" | "normal" | "attention";

interface CardConfig {
  id: string;
  title: string;
  value: string | number;
  target: number;
  unit: string;
  icon: React.ComponentType<any>;
  color: string;
  bg: string;
  status: Status;
}

export default function SummaryCards() {
  const { t, language } = useLanguage();
  const { data: todayMeals = [], isLoading: mealsLoading } = useMeals();
  const { data: healthMetrics = [], isLoading: metricsLoading } = useHealthMetrics();
  const { goals, isLoading: goalsLoading } = useNutritionGoals();

  const { data: waterLogs = [], isLoading: waterLoading } = useQuery({
    queryKey: ["water", today()],
    queryFn: async () => {
      const response = await fetch(`/api/water/logs?date=${today()}`, { credentials: "include" });
      return response.ok ? response.json() : [];
    },
  });

  const summary = useMemo(() => summarizeMeals(todayMeals as any[]), [todayMeals]);
  const waterLiters = useMemo(
    () => (Array.isArray(waterLogs) ? waterLogs.reduce((sum: number, log: any) => sum + (Number(log.amount) || 0), 0) / 1000 : 0),
    [waterLogs]
  );

  const latestGlucose = (healthMetrics as any[]).find((item) => item.type === "Blood Glucose");
  const latestBP = (healthMetrics as any[]).find((item) => item.type === "Blood Pressure");
  const glucoseValue = latestGlucose ? Number(latestGlucose.value) : null;
  const bpValue = latestBP ? String(latestBP.value) : "--";
  const bpSystolic = latestBP ? Number(String(latestBP.value).split("/")[0]) || 0 : 0;

  const determineStatus = (current: number, target: number, isLowerBetter = false): Status => {
    if (!target) return "normal";
    const percentage = (current / target) * 100;
    if (isLowerBetter) {
      if (percentage <= 100) return "optimal";
      if (percentage <= 110) return "normal";
      return "attention";
    }
    if (percentage >= 80) return "optimal";
    if (percentage >= 70) return "normal";
    return "attention";
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case "optimal":
        return "bg-green-500";
      case "normal":
        return "bg-blue-500";
      default:
        return "bg-destructive animate-pulse";
    }
  };

  const formatTarget = (target: number, unit: string) => {
    if (!target || target <= 0) {
      return language === "ar" ? "غير متاح" : "N/A";
    }
    return `${Math.round(target * 10) / 10} ${unit}`;
  };

  const cards: CardConfig[] = [
    {
      id: "calories",
      title: t("dailyCalories"),
      value: Math.round(summary.calories),
      target: goals.calories,
      unit: "kcal",
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      status: determineStatus(summary.calories, goals.calories),
    },
    {
      id: "protein",
      title: t("protein"),
      value: Math.round(summary.protein),
      target: goals.protein,
      unit: "g",
      icon: Beef,
      color: "text-red-500",
      bg: "bg-red-500/10",
      status: determineStatus(summary.protein, goals.protein),
    },
    {
      id: "carbs",
      title: t("carbs"),
      value: Math.round(summary.carbs),
      target: goals.carbs,
      unit: "g",
      icon: Wheat,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      status: determineStatus(summary.carbs, goals.carbs),
    },
    {
      id: "fats",
      title: t("fats"),
      value: Math.round(summary.fats),
      target: goals.fats,
      unit: "g",
      icon: Droplets,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      status: determineStatus(summary.fats, goals.fats),
    },
    {
      id: "fiber",
      title: t("fiber"),
      value: Math.round(summary.fiber),
      target: goals.fiber,
      unit: "g",
      icon: Shell,
      color: "text-green-500",
      bg: "bg-green-500/10",
      status: determineStatus(summary.fiber, goals.fiber),
    },
    {
      id: "water",
      title: t("water"),
      value: waterLiters.toFixed(1),
      target: goals.waterLiters,
      unit: "L",
      icon: Droplets,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      status: determineStatus(waterLiters, goals.waterLiters),
    },
    {
      id: "glucose",
      title: t("bloodGlucose"),
      value: glucoseValue ?? "--",
      target: 100,
      unit: "mg/dL",
      icon: Thermometer,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      status: glucoseValue != null ? determineStatus(glucoseValue, 100, true) : "normal",
    },
    {
      id: "bp",
      title: t("bloodPressure"),
      value: bpValue,
      target: 120,
      unit: "mmHg",
      icon: Activity,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      status: bpSystolic ? determineStatus(bpSystolic, 120, true) : "normal",
    },
  ];

  if (mealsLoading || metricsLoading || goalsLoading || waterLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in zoom-in-95 duration-500 delay-100 fill-mode-both">
      {cards.map((card) => (
        <div key={card.id} className="glass-card p-5 relative overflow-hidden group hover:scale-[1.02] hover:shadow-lg transition-all cursor-default">
          <div className="absolute top-4 end-4 flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", getStatusColor(card.status))} />
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", card.bg)}>
              <card.icon className={cn("w-5 h-5", card.color)} />
            </div>
            <h3 className="font-medium text-sm text-muted-foreground truncate" title={card.title}>
              {card.title}
            </h3>
          </div>

          <div className="flex items-end gap-2 mb-3">
            <div className="text-3xl font-bold tracking-tight text-foreground">{card.value}</div>
            <div className="text-sm text-muted-foreground mb-1 font-medium">{card.unit}</div>
          </div>

          <div className="text-xs text-muted-foreground">
            {language === "ar" ? "الهدف" : "Goal"}: {formatTarget(card.target, card.unit)}
          </div>
        </div>
      ))}
    </div>
  );
}
