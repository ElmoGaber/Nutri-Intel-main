import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const PRESETS = [150, 250, 350, 500];

export default function WaterTracking() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [customAmount, setCustomAmount] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const DAILY_GOAL_ML = user?.weight ? Math.round(Number(user.weight) * 33) : 0;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["water", today],
    queryFn: async () => {
      const r = await fetch(`/api/water/logs?date=${today}`, { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const addLog = useMutation({
    mutationFn: async (amount: number) => {
      const r = await fetch("/api/water/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, unit: "ml", date: today }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["water", today] }),
  });

  const removeLog = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/water/logs/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["water", today] }),
  });

  const totalMl = (logs as any[]).reduce((s: number, l: any) => s + (l.amount || 0), 0);
  const percent = DAILY_GOAL_ML > 0 ? Math.min(Math.round((totalMl / DAILY_GOAL_ML) * 100), 100) : 0;
  const cups = Math.round(totalMl / 250);

  const handleAdd = (amount: number) => {
    if (amount <= 0) return;
    addLog.mutate(amount);
    toast({ title: language === "ar" ? "تمت الإضافة" : "Added", description: `+${amount} ml` });
  };

  const handleCustom = () => {
    const val = parseInt(customAmount);
    if (!val || val <= 0) return;
    handleAdd(val);
    setCustomAmount("");
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
          {language === "ar" ? "تتبع الماء" : "Water Tracking"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "ar" ? "تتبع استهلاكك اليومي من الماء" : "Track your daily water intake"}
        </p>
      </div>

      {/* Progress ring */}
      <div className="glass-card p-8 flex flex-col items-center gap-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="currentColor" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - percent / 100)}`}
              className="text-blue-500 transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets className="w-6 h-6 text-blue-500 mb-1" />
            <span className="text-2xl font-bold">{percent}%</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{totalMl} <span className="text-lg text-muted-foreground">ml</span></p>
          <p className="text-sm text-muted-foreground">
            {DAILY_GOAL_ML > 0
              ? `${language === "ar" ? "الهدف" : "Goal"}: ${DAILY_GOAL_ML} ml · ${cups} ${language === "ar" ? "أكواب" : "cups"}`
              : language === "ar"
                ? "الهدف غير متاح - أكمل الوزن في الملف الشخصي"
                : "Goal unavailable - complete your weight in Profile"}
            {user?.weight && DAILY_GOAL_ML > 0 && <span className="ms-1 text-xs text-primary/70">({language === "ar" ? `${user.weight} كجم × 33` : `${user.weight}kg × 33`})</span>}
          </p>
        </div>
        {percent >= 100 && (
          <div className="px-4 py-2 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
            🎉 {language === "ar" ? "أحسنت! وصلت هدفك اليومي" : "Great! You've reached your daily goal"}
          </div>
        )}
      </div>

      {/* Quick add buttons */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">{language === "ar" ? "إضافة سريعة" : "Quick Add"}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {PRESETS.map((ml) => (
            <button
              key={ml}
              onClick={() => handleAdd(ml)}
              disabled={addLog.isPending}
              className="glass p-3 rounded-xl text-center hover:bg-blue-500/10 hover:border-blue-500/30 border border-transparent transition-all"
            >
              <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-sm font-medium">{ml} ml</p>
              <p className="text-xs text-muted-foreground">{Math.round(ml / 250 * 10) / 10} {language === "ar" ? "كوب" : "cup"}</p>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder={language === "ar" ? "كمية مخصصة (ml)" : "Custom amount (ml)"}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustom()}
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm"
            min={1}
            max={2000}
          />
          <Button onClick={handleCustom} disabled={!customAmount || addLog.isPending}>
            <Plus className="w-4 h-4 me-1" />
            {language === "ar" ? "إضافة" : "Add"}
          </Button>
        </div>
      </div>

      {/* Today's log */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">{language === "ar" ? "سجل اليوم" : "Today's Log"}</h2>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (logs as any[]).length === 0 ? (
          <div className="text-center py-8">
            <Droplets className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">{language === "ar" ? "لم تشرب ماءً بعد اليوم" : "No water logged today"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(logs as any[]).map((log: any) => (
              <div key={log.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center gap-3">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{log.amount} ml</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <button onClick={() => removeLog.mutate(log.id)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
