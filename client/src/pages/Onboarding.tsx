import { useLanguage } from "@/hooks/use-language";
import { Target, Utensils, Activity, ChevronRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GOALS = [
  { id: "lose_weight", en: "Lose Weight", ar: "خسارة الوزن", icon: "⚖️" },
  { id: "gain_muscle", en: "Gain Muscle", ar: "بناء العضلات", icon: "💪" },
  { id: "eat_healthy", en: "Eat Healthier", ar: "تناول طعام صحي", icon: "🥗" },
  { id: "manage_condition", en: "Manage Health Condition", ar: "إدارة حالة صحية", icon: "❤️" },
  { id: "increase_energy", en: "Increase Energy", ar: "زيادة الطاقة", icon: "⚡" },
  { id: "track_wellness", en: "Track Overall Wellness", ar: "تتبع الصحة العامة", icon: "📊" },
];

const ACTIVITY_LEVELS = [
  { id: "sedentary", en: "Sedentary", ar: "قليل الحركة", desc_en: "Little or no exercise", desc_ar: "لا تمارس رياضة تقريباً" },
  { id: "light", en: "Lightly Active", ar: "نشاط خفيف", desc_en: "Light exercise 1-3 days/week", desc_ar: "رياضة خفيفة 1-3 أيام/أسبوع" },
  { id: "moderate", en: "Moderately Active", ar: "نشاط معتدل", desc_en: "Moderate exercise 3-5 days/week", desc_ar: "رياضة معتدلة 3-5 أيام/أسبوع" },
  { id: "active", en: "Very Active", ar: "نشط جداً", desc_en: "Hard exercise 6-7 days/week", desc_ar: "رياضة شاقة 6-7 أيام/أسبوع" },
];

export default function Onboarding() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { checkAuth } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const saveOnboarding = async (skipGoals = false) => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          goals: skipGoals ? [] : selectedGoals,
          activityLevel: skipGoals ? "moderate" : (activityLevel || "moderate"),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await checkAuth(); // refresh user object in context
      setLocation("/");
    } catch {
      toast.error(language === "ar" ? "حدث خطأ أثناء الحفظ" : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      title: language === "ar" ? "ما هي أهدافك الصحية؟" : "What are your health goals?",
      subtitle: language === "ar" ? "اختر كل ما ينطبق عليك" : "Select all that apply",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {GOALS.map((g) => (
            <button
              key={g.id}
              onClick={() => toggleGoal(g.id)}
              className={`p-4 rounded-xl border text-start transition-all ${selectedGoals.includes(g.id) ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-primary/5"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{g.icon}</span>
                {selectedGoals.includes(g.id) && <Check className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-sm font-medium">{language === "ar" ? g.ar : g.en}</p>
            </button>
          ))}
        </div>
      ),
      canNext: selectedGoals.length > 0,
    },
    {
      title: language === "ar" ? "ما مستوى نشاطك البدني؟" : "How active are you?",
      subtitle: language === "ar" ? "هذا يساعدنا على حساب احتياجاتك من السعرات" : "This helps us calculate your calorie needs",
      content: (
        <div className="space-y-3">
          {ACTIVITY_LEVELS.map((a) => (
            <button
              key={a.id}
              onClick={() => setActivityLevel(a.id)}
              className={`w-full p-4 rounded-xl border text-start transition-all ${activityLevel === a.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{language === "ar" ? a.ar : a.en}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{language === "ar" ? a.desc_ar : a.desc_en}</p>
                </div>
                {activityLevel === a.id && <Check className="w-5 h-5 text-primary shrink-0" />}
              </div>
            </button>
          ))}
        </div>
      ),
      canNext: !!activityLevel,
    },
    {
      title: language === "ar" ? "أنت جاهز!" : "You're all set!",
      subtitle: language === "ar" ? "ابدأ رحلتك الصحية الآن" : "Start your health journey now",
      content: (
        <div className="space-y-6 text-center py-4">
          <div className="flex justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-3xl">🎉</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <Target className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm">{language === "ar" ? `${selectedGoals.length} أهداف محددة` : `${selectedGoals.length} goals selected`}</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <Activity className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm">
                {language === "ar"
                  ? `مستوى النشاط: ${ACTIVITY_LEVELS.find(a => a.id === activityLevel)?.ar || "معتدل"}`
                  : `Activity: ${ACTIVITY_LEVELS.find(a => a.id === activityLevel)?.en || "Moderate"}`}
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <Utensils className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm">{language === "ar" ? "ابدأ بتسجيل وجباتك" : "Start by logging your first meal"}</p>
            </div>
          </div>
        </div>
      ),
      canNext: true,
    },
  ];

  const current = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 animate-in fade-in">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex gap-2 mb-2">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <div className="glass-card p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{current.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{current.subtitle}</p>
          </div>

          {current.content}

          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1" disabled={saving}>
                {language === "ar" ? "السابق" : "Back"}
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                className="flex-1"
                disabled={!current.canNext}
                onClick={() => setStep((s) => s + 1)}
              >
                {language === "ar" ? "التالي" : "Next"}
                <ChevronRight className="w-4 h-4 ms-1" />
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => saveOnboarding(false)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                {language === "ar" ? "ابدأ الآن" : "Get Started"}
              </Button>
            )}
          </div>

          {step === 0 && (
            <button
              className="w-full text-center text-xs text-muted-foreground hover:underline"
              onClick={() => saveOnboarding(true)}
              disabled={saving}
            >
              {language === "ar" ? "تخطي الإعداد" : "Skip setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
