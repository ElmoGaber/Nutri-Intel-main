import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import SummaryCards from "@/components/dashboard/SummaryCards";
import WeeklyTrends from "@/components/dashboard/WeeklyTrends";
import AIScore from "@/components/dashboard/AIScore";
import TodaysMeals from "@/components/dashboard/TodaysMeals";
import Medications from "@/components/dashboard/Medications";
import PredictiveInsights from "@/components/dashboard/PredictiveInsights";
import HealthJournal from "@/components/dashboard/HealthJournal";
import StreakWidget from "@/components/dashboard/StreakWidget";
import GoalProgress from "@/components/dashboard/GoalProgress";
import { Button } from "@/components/ui/button";
import { Redirect, useLocation } from "wouter";
import { Utensils, Activity, MessageSquare, Bell, X } from "lucide-react";
import { useState } from "react";
import { today } from "@/lib/dateUtils";
import { useAuth } from "@/contexts/AuthContext";

function NewUserCTA({ language }: { language: string }) {
  const [, setLocation] = useLocation();

  return (
    <div className="glass-card p-8 text-center space-y-4 border-dashed border-2 border-primary/20">
      <div className="flex justify-center gap-4">
        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
          <Utensils className="w-6 h-6 text-orange-500" />
        </div>
        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Activity className="w-6 h-6 text-blue-500" />
        </div>
        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-purple-500" />
        </div>
      </div>

      <h2 className="text-xl font-bold">{language === "ar" ? "ابدأ رحلتك الصحية" : "Start Your Health Journey"}</h2>

      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
        {language === "ar"
          ? "سجل وجباتك، تتبع صحتك، واحصل على نصائح مخصصة من الذكاء الاصطناعي"
          : "Log your meals, track your health, and get personalized AI advice"}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => setLocation("/meal-planner?add=1")}>
          <Utensils className="w-4 h-4 me-2" />
          {language === "ar" ? "أضف وجبة" : "Add a Meal"}
        </Button>
        <Button variant="outline" onClick={() => setLocation("/health")}>
          <Activity className="w-4 h-4 me-2" />
          {language === "ar" ? "سجل قراءة" : "Log Reading"}
        </Button>
        <Button variant="outline" onClick={() => setLocation("/ai-assistant")}>
          <MessageSquare className="w-4 h-4 me-2" />
          {language === "ar" ? "اسأل المساعد" : "Ask AI"}
        </Button>
      </div>
    </div>
  );
}

function NotificationBanner({ language }: { language: string }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !("Notification" in window) || Notification.permission !== "default") return null;

  const enable = async () => {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      new Notification(language === "ar" ? "تم تفعيل الإشعارات" : "Notifications enabled", {
        body: language === "ar" ? "ستصلك تذكيرات الأدوية في موعدها" : "You'll receive medication reminders on time",
        icon: "/favicon.ico",
      });
    }
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
      <Bell className="w-4 h-4 text-amber-500 shrink-0" />
      <span className="flex-1 text-foreground">
        {language === "ar" ? "فعّل الإشعارات لتلقي تذكيرات الأدوية في وقتها" : "Enable notifications to receive on-time medication reminders"}
      </span>
      <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 shrink-0" onClick={enable}>
        {language === "ar" ? "تفعيل" : "Enable"}
      </Button>
      <button
        onClick={() => setDismissed(true)}
        title={language === "ar" ? "إغلاق الإشعار" : "Dismiss notification"}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { role, clientId } = useAuth();

  const { data: user } = useQuery({
    queryKey: ["auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
  });

  const todayDate = today();

  const { data: todayMeals = [] } = useQuery({
    queryKey: ["meals", todayDate],
    queryFn: async () => {
      const r = await fetch(`/api/nutrition/meals?date=${todayDate}`, { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const userName = user?.firstName || user?.username || "User";
  const isNewUser = (todayMeals as any[]).length === 0;

  if (role === "doctor" || role === "coach") {
    return <Redirect to="/doctor" />;
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient py-1">
          {t("welcomeBack")}, {userName}
        </h1>
        <p className="text-muted-foreground font-medium">{t("nutritionSummaryTitle")}</p>
        {(clientId || (user as any)?.clientId) && (
          <p className="text-xs text-primary font-medium mt-1">
            {language === "ar" ? "Patient ID" : "Patient ID"}: {(clientId || (user as any)?.clientId) as string}
          </p>
        )}
      </div>

      <NotificationBanner language={language} />
      {isNewUser && <NewUserCTA language={language} />}

      <SummaryCards />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mt-8">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <WeeklyTrends />
        </div>
        <div className="space-y-6 order-1 lg:order-2">
          <StreakWidget />
          <AIScore />
          <PredictiveInsights />
        </div>
      </div>

      <div className="mt-8">
        <TodaysMeals />
      </div>

      <div className="mt-8">
        <GoalProgress />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-8">
        <Medications />
        <HealthJournal />
      </div>
    </div>
  );
}
