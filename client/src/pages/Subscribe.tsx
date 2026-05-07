import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Crown, Loader2, ShieldCheck, Sparkles, CalendarRange, CalendarClock } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

function isSubscriptionActive(user: any) {
  if (!user) return false;
  if (user.subscriptionStatus === "active") return true;
  if (user.subscriptionStatus === "trial") {
    const endsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    return !!endsAt && endsAt.getTime() > Date.now();
  }
  return false;
}

export default function SubscribePage() {
  const { user, checkAuth, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"trial_15" | "annual">("trial_15");

  const plans = [
    {
      key: "trial_15" as const,
      name: "15-Day Plan",
      labelAr: "باقة 15 يوم",
      price: "Default",
      priceAr: "الافتراضية",
      icon: CalendarRange,
      description: "Renew every 15 days and keep the plan lightweight for new users.",
      descriptionAr: "تجدد كل 15 يوم ومناسبة كباقة افتراضية للمستخدم الجديد.",
      highlight: true,
    },
    {
      key: "annual" as const,
      name: "Annual Plan",
      labelAr: "الباقة السنوية",
      price: "Higher value",
      priceAr: "قيمة أعلى",
      icon: CalendarClock,
      description: "One year of access with a higher price and fewer renewals.",
      descriptionAr: "اشتراك سنوي بسعر أعلى وتجديد أقل.",
      highlight: false,
    },
  ];

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setLocation("/register");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to activate subscription");
      }

      await checkAuth();
      toast({
        title: "Subscription activated",
        description: "You can now access the dashboard and all unlocked pages.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Subscription failed",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const alreadyActive = isSubscriptionActive(user);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_35%),linear-gradient(180deg,_#08111f,_#030712)] px-4 py-8 text-white md:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/6 p-8 backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
              <Crown className="h-4 w-4" />
              Subscription page
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Unlock the full Nutri-Intel workspace</h1>
              <p className="max-w-xl text-base leading-8 text-slate-300 md:text-lg">
                The subscription opens the remaining premium pages after the 15-day trial, while keeping the dashboard and care flow in one place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "AI assistant and predictions",
                "Food database and advanced scoring",
                "Clinician-focused coaching tools",
                "Patient reporting and recall",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                <ShieldCheck className="h-4 w-4" />
                What happens after you subscribe
              </div>
              <p className="mt-2 text-sm leading-6 text-cyan-50/90">
                Your account becomes active immediately, and you are sent back to the dashboard without extra steps.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-slate-400">Premium access</div>
                <div className="mt-1 text-3xl font-bold text-white">Immediate activation</div>
              </div>
              <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm uppercase tracking-[0.3em] text-slate-400">Plan summary</div>
              <div className="mt-3 text-2xl font-bold text-white">Choose your subscription</div>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                The 15-day plan is selected by default. Switch to the annual option if you want a longer cycle and higher value plan.
              </p>

              <div className="mt-6 grid gap-3">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const selected = selectedPlan === plan.key;
                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => setSelectedPlan(plan.key)}
                      className={`w-full rounded-3xl border p-4 text-start transition ${selected ? "border-emerald-400 bg-emerald-400/10" : "border-white/10 bg-slate-900/50 hover:bg-slate-900/70"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`rounded-2xl p-3 ${selected ? "bg-emerald-500/15 text-emerald-300" : "bg-white/8 text-slate-200"}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-white">{plan.name}</div>
                              {plan.highlight && <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">Default</Badge>}
                            </div>
                            <p className="mt-1 text-sm text-slate-300">{plan.description}</p>
                          </div>
                        </div>
                        <div className="text-end text-sm text-slate-400">
                          <div className="font-semibold text-white">{plan.price}</div>
                          <div>{selected ? "Selected" : "Choose"}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 space-y-3">
                <Button className="w-full bg-emerald-500 text-white hover:bg-emerald-400" size="lg" onClick={handleSubscribe} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                  {isAuthenticated ? (alreadyActive ? "Enter dashboard" : `Subscribe: ${selectedPlan === "annual" ? "Annual" : "15-day"}`) : "Create account to subscribe"}
                </Button>
                <Button variant="outline" className="w-full border-white/15 bg-transparent text-white hover:bg-white/10" size="lg" onClick={() => setLocation("/")}>
                  Back to home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}