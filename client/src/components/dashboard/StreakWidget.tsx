import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { Flame, Droplets, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { today } from "@/lib/dateUtils";
import { useNutritionGoals } from "@/hooks/useNutritionGoals";

export default function StreakWidget() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const todayKey = today();
  const { goals } = useNutritionGoals();

  const { data: streak } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      const r = await fetch("/api/progress/streak", { credentials: "include" });
      return r.ok ? r.json() : { streak: 0, totalDaysLogged: 0 };
    },
  });

  const { data: waterLogs = [] } = useQuery({
    queryKey: ["water", todayKey],
    queryFn: async () => {
      const r = await fetch(`/api/water/logs?date=${todayKey}`, { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const waterToday = (waterLogs as any[]).reduce((s: number, l: any) => s + (l.amount || 0), 0);
  const waterGoalMl = goals.waterLiters > 0 ? goals.waterLiters * 1000 : 0;
  const waterPercent = waterGoalMl > 0 ? Math.min(Math.round((waterToday / waterGoalMl) * 100), 100) : 0;
  const currentStreak = streak?.streak || 0;

  return (
    <div className="glass-card p-5">
      <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
        {language === "ar" ? "التقدم" : "Progress"}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${currentStreak > 0 ? "bg-orange-500/15" : "bg-muted/30"}`}>
            <Flame className={`w-6 h-6 ${currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
          </div>
          <p className="text-xl font-bold">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">{language === "ar" ? "أيام متتالية" : "day streak"}</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 bg-blue-500/15 cursor-pointer" onClick={() => setLocation("/water")}>
            <Droplets className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-xl font-bold">{waterGoalMl > 0 ? `${waterPercent}%` : "--"}</p>
          <p className="text-xs text-muted-foreground">{language === "ar" ? "هدف الماء" : "water goal"}</p>
        </div>
        <div className="text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${(streak?.totalDaysLogged || 0) > 0 ? "bg-yellow-500/15" : "bg-muted/30"}`}>
            <Trophy className={`w-6 h-6 ${(streak?.totalDaysLogged || 0) > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
          </div>
          <p className="text-xl font-bold">{streak?.totalDaysLogged || 0}</p>
          <p className="text-xs text-muted-foreground">{language === "ar" ? "أيام مسجلة" : "days logged"}</p>
        </div>
      </div>
    </div>
  );
}
