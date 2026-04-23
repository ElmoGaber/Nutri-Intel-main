import { useLanguage } from "@/hooks/use-language";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus, Loader2, CheckCircle2, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getLast7Days } from "@/lib/dateUtils";

const GOAL_TYPE_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  lose_weight:    { en: "Lose Weight",    ar: "خسارة وزن",    color: "text-orange-500 bg-orange-500/10" },
  gain_muscle:    { en: "Gain Muscle",    ar: "بناء عضلات",   color: "text-blue-500 bg-blue-500/10" },
  maintain:       { en: "Maintain",       ar: "حافظ على وزنك", color: "text-green-500 bg-green-500/10" },
  eat_healthy:    { en: "Eat Healthy",    ar: "أكل صحي",      color: "text-emerald-500 bg-emerald-500/10" },
  manage_condition: { en: "Manage Condition", ar: "إدارة حالة", color: "text-purple-500 bg-purple-500/10" },
};

const GOAL_ACHIEVEMENT_RULES: Record<string, { en: string; ar: string }> = {
  lose_weight: {
    en: "Completed when your current weight reaches or goes below the target weight.",
    ar: "يُعتبر مُحققًا عند وصول وزنك الحالي للوزن المستهدف أو أقل.",
  },
  gain_muscle: {
    en: "Completed when your current weight reaches or exceeds the target weight.",
    ar: "يُعتبر مُحققًا عند وصول وزنك الحالي للوزن المستهدف أو أعلى.",
  },
  maintain: {
    en: "Completed when weight stays close to your target (within about 0.5 kg).",
    ar: "يُعتبر مُحققًا عند ثبات الوزن قريبًا من الهدف (في حدود 0.5 كغ تقريبًا).",
  },
  eat_healthy: {
    en: "Completed when you log at least 2 meals/day for 5 days this week.",
    ar: "يُعتبر مُحققًا عند تسجيل وجبتين على الأقل يوميًا لمدة 5 أيام هذا الأسبوع.",
  },
  manage_condition: {
    en: "Completed when you log health readings on at least 5 days this week.",
    ar: "يُعتبر مُحققًا عند تسجيل قراءات صحية في 5 أيام على الأقل هذا الأسبوع.",
  },
};

type WeeklySignals = {
  mealDaysWithTwoMeals: number;
  metricDaysWithLogs: number;
};

type Goal = {
  id: string;
  goalType: string;
  targetWeight?: number | string | null;
  startWeight?: number | string | null;
  targetDate?: string | Date | null;
};

type QuickGoalTemplate = {
  goalType: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
};

export default function GoalProgress() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ goalType: "lose_weight", targetWeight: "", targetDate: "" });

  const { data: goals = [], isLoading, isError, error, refetch } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const r = await fetch("/api/goals", { credentials: "include" });
      if (!r.ok) {
        const payload = await r.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to load goals");
      }
      return r.json();
    },
    staleTime: 60 * 60 * 1000,
  });

  const { data: weeklySignals = { mealDaysWithTwoMeals: 0, metricDaysWithLogs: 0 } } = useQuery<WeeklySignals>({
    queryKey: ["goal-weekly-signals", getLast7Days()[0]],
    queryFn: async () => {
      const dates = getLast7Days();

      const [mealResults, metricResults] = await Promise.all([
        Promise.all(
          dates.map((date) =>
            fetch(`/api/nutrition/meals?date=${date}`, { credentials: "include" })
              .then((r) => (r.ok ? r.json() : []))
              .catch(() => [])
          )
        ),
        Promise.all(
          dates.map((date) =>
            fetch(`/api/health/metrics?date=${date}`, { credentials: "include" })
              .then((r) => (r.ok ? r.json() : []))
              .catch(() => [])
          )
        ),
      ]);

      return {
        mealDaysWithTwoMeals: mealResults.filter((entries) => Array.isArray(entries) && entries.length >= 2).length,
        metricDaysWithLogs: metricResults.filter((entries) => Array.isArray(entries) && entries.length > 0).length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const addGoal = useMutation({
    mutationFn: async (body: object) => {
      const r = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const payload = await r.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed");
      }
      return r.json();
    },
    onSuccess: (createdGoal: Goal) => {
      qc.setQueryData<Goal[]>(["goals"], (prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return [createdGoal, ...list.filter((goal) => goal.id !== createdGoal.id)];
      });
      setShowAdd(false);
      setForm({ goalType: "lose_weight", targetWeight: "", targetDate: "" });
      toast.success(language === "ar" ? "تم إضافة الهدف" : "Goal added");
    },
    onError: (err: any) => {
      toast.error(err?.message || (language === "ar" ? "تعذر إضافة الهدف" : "Failed to add goal"));
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/goals/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) {
        const payload = await r.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed");
      }
      return id;
    },
    onSuccess: (deletedId: string) => {
      qc.setQueryData<Goal[]>(["goals"], (prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.filter((goal) => goal.id !== deletedId);
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || (language === "ar" ? "تعذر حذف الهدف" : "Failed to delete goal"));
    },
  });

  const currentWeight = user?.weight ? Number(user.weight) : null;

  const calcProgress = (goal: any) => {
    const type = String(goal.goalType || "");

    if (type === "eat_healthy") {
      return Math.min(Math.round((weeklySignals.mealDaysWithTwoMeals / 5) * 100), 100);
    }

    if (type === "manage_condition") {
      return Math.min(Math.round((weeklySignals.metricDaysWithLogs / 5) * 100), 100);
    }

    if (!currentWeight) return null;

    const start = goal.startWeight != null ? Number(goal.startWeight) : currentWeight;
    const target = goal.targetWeight != null ? Number(goal.targetWeight) : start;

    if (type === "lose_weight") {
      const total = start - target;
      if (total <= 0) return currentWeight <= target ? 100 : 0;
      const done = start - currentWeight;
      return Math.max(0, Math.min(Math.round((done / total) * 100), 100));
    }

    if (type === "gain_muscle") {
      const total = target - start;
      if (total <= 0) return currentWeight >= target ? 100 : 0;
      const done = currentWeight - start;
      return Math.max(0, Math.min(Math.round((done / total) * 100), 100));
    }

    if (type === "maintain") {
      const reference = target || start;
      const delta = Math.abs(currentWeight - reference);
      if (delta <= 0.5) return 100;
      if (delta <= 1) return 85;
      if (delta <= 2) return 55;
      return 20;
    }

    return null;
  };

  const progressHint = (goal: any) => {
    const type = String(goal.goalType || "");
    if (type === "eat_healthy") {
      return language === "ar"
        ? `${weeklySignals.mealDaysWithTwoMeals}/5 أيام صحية هذا الأسبوع`
        : `${weeklySignals.mealDaysWithTwoMeals}/5 healthy days this week`;
    }
    if (type === "manage_condition") {
      return language === "ar"
        ? `${weeklySignals.metricDaysWithLogs}/5 أيام فيها قراءات صحية`
        : `${weeklySignals.metricDaysWithLogs}/5 days with health readings`;
    }
    if (currentWeight != null) {
      return language === "ar" ? `وزنك الحالي: ${currentWeight} كغ` : `Current weight: ${currentWeight} kg`;
    }
    return language === "ar"
      ? "حدّث وزنك الحالي من الملف الشخصي لاحتساب التقدم"
      : "Update current weight in profile to calculate progress";
  };

  const weightGoalTypes = new Set(["lose_weight", "gain_muscle", "maintain"]);
  const needsWeight = weightGoalTypes.has(form.goalType);

  const quickGoals: QuickGoalTemplate[] = [
    {
      goalType: "eat_healthy",
      titleEn: "Healthy Eating",
      titleAr: "أكل صحي",
      subtitleEn: "Focus on meal consistency this week",
      subtitleAr: "ركز على انتظام الوجبات هذا الأسبوع",
    },
    {
      goalType: "manage_condition",
      titleEn: "Condition Tracking",
      titleAr: "متابعة الحالة الصحية",
      subtitleEn: "Keep regular health readings",
      subtitleAr: "حافظ على تسجيل القراءات الصحية بانتظام",
    },
    {
      goalType: "lose_weight",
      titleEn: "Weight Cut Plan",
      titleAr: "خطة خسارة وزن",
      subtitleEn: "Set a practical reduction target",
      subtitleAr: "حدد هدف نزول وزن عملي",
    },
  ];

  const handleQuickGoal = (goalType: string) => {
    const payload: Record<string, unknown> = {
      goalType,
      targetDate: undefined,
    };

    if (weightGoalTypes.has(goalType)) {
      if (currentWeight == null) {
        toast.error(language === "ar" ? "حدّث وزنك الحالي من الملف الشخصي أولاً" : "Set your current weight in profile first");
        setShowAdd(true);
        setForm((prev) => ({ ...prev, goalType }));
        return;
      }

      const suggestedTarget = goalType === "lose_weight"
        ? Math.max(30, Math.round((currentWeight - 3) * 10) / 10)
        : goalType === "gain_muscle"
          ? Math.round((currentWeight + 2) * 10) / 10
          : currentWeight;

      payload.startWeight = currentWeight;
      payload.targetWeight = suggestedTarget;
    }

    addGoal.mutate(payload);
  };

  const handleAdd = () => {
    if (needsWeight && !form.targetWeight) return;
    if (needsWeight && currentWeight == null) {
      toast.error(language === "ar" ? "حدّث وزنك الحالي من الملف الشخصي أولاً" : "Set your current weight in profile first");
      return;
    }

    const payload: Record<string, unknown> = {
      goalType: form.goalType,
      targetDate: form.targetDate || undefined,
    };

    if (needsWeight && form.targetWeight) {
      payload.targetWeight = Number(form.targetWeight);
      payload.startWeight = currentWeight;
    }

    addGoal.mutate({
      ...payload,
    });
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{language === "ar" ? "أهدافك الصحية" : "Your Goals"}</h2>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4 me-1" />
          {language === "ar" ? "هدف جديد" : "New goal"}
        </Button>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 rounded-xl bg-muted/30 border border-border space-y-3">
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={form.goalType}
            onChange={(e) => setForm({ ...form, goalType: e.target.value })}
          >
            {Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{language === "ar" ? v.ar : v.en}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {language === "ar"
              ? GOAL_ACHIEVEMENT_RULES[form.goalType]?.ar
              : GOAL_ACHIEVEMENT_RULES[form.goalType]?.en}
          </p>
          {needsWeight && (
            <Input
              type="number"
              placeholder={language === "ar" ? "الوزن المستهدف (كغ) *" : "Target weight (kg) *"}
              value={form.targetWeight}
              onChange={(e) => setForm({ ...form, targetWeight: e.target.value })}
            />
          )}
          {needsWeight && currentWeight == null && (
            <p className="text-xs text-amber-500">
              {language === "ar"
                ? "لا يمكن احتساب التقدم بدون وزن حالي. حدّث وزنك من الملف الشخصي."
                : "Progress needs a current weight. Update your weight in profile."}
            </p>
          )}
          <Input
            type="date"
            placeholder={language === "ar" ? "تاريخ الهدف" : "Target date"}
            value={form.targetDate}
            onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" className="flex-1" onClick={handleAdd} disabled={(needsWeight && !form.targetWeight) || addGoal.isPending}>
              {addGoal.isPending ? <Loader2 className="w-3 h-3 animate-spin me-1" /> : null}
              {language === "ar" ? "إضافة" : "Add"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : isError ? (
        <div className="text-center py-6 space-y-2">
          <p className="text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : (language === "ar" ? "تعذر تحميل الأهداف" : "Failed to load goals")}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>
            {language === "ar" ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      ) : goals.length === 0 ? (
        <div className="space-y-4 py-2">
          <div className="text-center py-2">
            <Target className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد أهداف بعد — أضف هدفك الأول" : "No goals yet — add your first goal"}
            </p>
          </div>

          <div className="glass-card p-4 bg-muted/20 border border-border">
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              {language === "ar" ? "أهداف سريعة" : "Quick goals"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {quickGoals.map((template) => (
                <button
                  key={template.goalType}
                  type="button"
                  onClick={() => handleQuickGoal(template.goalType)}
                  disabled={addGoal.isPending}
                  className="text-start rounded-lg border border-border bg-background/70 px-3 py-2 hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-60"
                >
                  <p className="text-sm font-medium">
                    {language === "ar" ? template.titleAr : template.titleEn}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {language === "ar" ? template.subtitleAr : template.subtitleEn}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(goals as any[]).map((goal) => {
            const progress = calcProgress(goal);
            const label = GOAL_TYPE_LABELS[goal.goalType] || { en: goal.goalType, ar: goal.goalType, color: "text-primary bg-primary/10" };
            const daysLeft = goal.targetDate
              ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000)
              : null;
            const isDone = progress !== null && progress >= 100;
            const hasWeightScale = goal.startWeight != null && goal.targetWeight != null;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${label.color}`}>
                      {language === "ar" ? label.ar : label.en}
                    </span>
                    {goal.targetWeight && (
                      <span className="text-sm text-muted-foreground">
                        {language === "ar" ? `→ ${goal.targetWeight} كغ` : `→ ${goal.targetWeight} kg`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {daysLeft !== null && daysLeft > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {language === "ar" ? `متبقي ${daysLeft} يوم` : `${daysLeft}d left`}
                      </span>
                    )}
                    {isDone && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    <button
                      type="button"
                      onClick={() => deleteGoal.mutate(goal.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {progress !== null && (
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isDone ? "bg-green-500" : "bg-primary"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      {hasWeightScale ? (
                        <>
                          <span>{goal.startWeight} kg</span>
                          <span className="font-medium">{progress}%</span>
                          <span>{goal.targetWeight} kg</span>
                        </>
                      ) : (
                        <>
                          <span>{progressHint(goal)}</span>
                          <span className="font-medium">{progress}%</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
