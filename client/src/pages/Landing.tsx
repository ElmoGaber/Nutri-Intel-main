import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  ArrowRight,
  Bot,
  ChefHat,
  HeartPulse,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  UserRound,
  Waves,
} from "lucide-react";

const lockedFeatures = [
  "AI assistant and predictions",
  "Food database and advanced scoring",
  "Advanced coaching tools",
  "Health report export",
  "Premium insights and alerts",
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [mealCalories, setMealCalories] = useState(520);
  const [mealProtein, setMealProtein] = useState(34);
  const [mealCarbs, setMealCarbs] = useState(48);
  const [mealFat, setMealFat] = useState(18);
  const [bmiWeight, setBmiWeight] = useState(78);
  const [bmiHeight, setBmiHeight] = useState(172);

  const mealMacroCalories = mealProtein * 4 + mealCarbs * 4 + mealFat * 9;
  const mealGap = mealCalories - mealMacroCalories;
  const bmiHeightMeters = bmiHeight / 100;
  const bmiValue = bmiHeightMeters > 0 ? bmiWeight / (bmiHeightMeters * bmiHeightMeters) : 0;
  const bmiStatus = bmiValue < 18.5 ? "Underweight" : bmiValue < 25 ? "Healthy" : bmiValue < 30 ? "Overweight" : "High risk";

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");

    if (!adminUsername.trim() || !adminPassword) {
      setAdminError("Please enter admin credentials");
      return;
    }

    try {
      setAdminSubmitting(true);
      await login(adminUsername.trim(), adminPassword);
      setLocation("/admin");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Admin login failed");
    } finally {
      setAdminSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(180deg,_rgba(8,15,30,0.96),_rgba(3,7,18,1))]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[linear-gradient(135deg,_rgba(34,197,94,0.18),_rgba(14,165,233,0.16),_transparent_70%)] blur-3xl" />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 md:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-primary/80">Nutri-Intel</div>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Smart nutrition for patients, doctors, and coaches</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setLocation("/login")}>
              Login
            </Button>
            <Button className="bg-emerald-500 text-white hover:bg-emerald-400" onClick={() => setLocation("/register")}>
              Start free trial
              <ArrowRight className="ms-2 h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-200 backdrop-blur">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              15-day default trial with meal calculation and BMI
            </div>

            <div className="space-y-5">
              <h2 className="max-w-3xl text-5xl font-black leading-none tracking-tight text-white md:text-7xl">
                Understand nutrition, then unlock the full care platform.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                Nutri-Intel combines personalized meal planning, medical context, and risk scoring so patients can act fast and clinicians can guide better.
                The landing page keeps only the basic public tools visible. Everything else stays accessible from the subscription flow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => setLocation("/register?mode=client")}>
                Client signup
                <ArrowRight className="ms-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setLocation("/register?mode=provider")}>
                Provider signup
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-sm text-slate-300"><UserRound className="h-4 w-4 text-emerald-300" />Who we are</div>
                <p className="mt-3 text-sm leading-6 text-slate-200">A nutrition platform for patients, doctors, and coaches to share one structured view of care.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="h-4 w-4 text-sky-300" />What is included</div>
                <p className="mt-3 text-sm leading-6 text-slate-200">Daily planning, recall, personalization, and lock-aware premium visibility for the rest of the platform.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-sm text-slate-300"><Bot className="h-4 w-4 text-cyan-300" />How it helps</div>
                <p className="mt-3 text-sm leading-6 text-slate-200">Translate health data into practical meal decisions and clearer follow-up for every client.</p>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-400">Free trial features</div>
                  <div className="mt-1 text-2xl font-bold text-white">Meal calc + BMI only</div>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">Trial</Badge>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-emerald-500/15 p-2 text-emerald-300">
                      <ChefHat className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Meal calculation</div>
                      <p className="text-sm leading-6 text-slate-300">Build meals with calories and macro totals.</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <label className="space-y-1 text-xs text-slate-300">
                          <span>Calories</span>
                          <Input type="number" value={mealCalories} onChange={(e) => setMealCalories(Number(e.target.value || 0))} className="border-white/10 bg-slate-950/70 text-white" />
                        </label>
                        <label className="space-y-1 text-xs text-slate-300">
                          <span>Protein g</span>
                          <Input type="number" value={mealProtein} onChange={(e) => setMealProtein(Number(e.target.value || 0))} className="border-white/10 bg-slate-950/70 text-white" />
                        </label>
                        <label className="space-y-1 text-xs text-slate-300">
                          <span>Carbs g</span>
                          <Input type="number" value={mealCarbs} onChange={(e) => setMealCarbs(Number(e.target.value || 0))} className="border-white/10 bg-slate-950/70 text-white" />
                        </label>
                        <label className="space-y-1 text-xs text-slate-300">
                          <span>Fat g</span>
                          <Input type="number" value={mealFat} onChange={(e) => setMealFat(Number(e.target.value || 0))} className="border-white/10 bg-slate-950/70 text-white" />
                        </label>
                      </div>
                      <div className="mt-3 rounded-xl border border-white/8 bg-slate-950/50 p-3 text-sm text-slate-200">
                        Macro calories: <span className="font-semibold text-white">{mealMacroCalories}</span> kcal, gap: <span className={mealGap === 0 ? "text-emerald-300" : mealGap > 0 ? "text-amber-300" : "text-sky-300"}>{mealGap > 0 ? `+${mealGap}` : mealGap}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-sky-500/15 p-2 text-sky-300">
                      <HeartPulse className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">BMI calculator</div>
                      <p className="text-sm leading-6 text-slate-300">Track body metrics and start with a simple assessment.</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <label className="space-y-1 text-xs text-slate-300">
                          <span>Weight kg</span>
                          <Input type="number" value={bmiWeight} onChange={(e) => setBmiWeight(Number(e.target.value || 0))} className="border-white/10 bg-slate-950/70 text-white" />
                        </label>
                        <label className="space-y-1 text-xs text-slate-300">
                          <span>Height cm</span>
                          <Input type="number" value={bmiHeight} onChange={(e) => setBmiHeight(Number(e.target.value || 0))} className="border-white/10 bg-slate-950/70 text-white" />
                        </label>
                      </div>
                      <div className="mt-3 rounded-xl border border-white/8 bg-slate-950/50 p-3 text-sm text-slate-200">
                        BMI: <span className="font-semibold text-white">{bmiValue.toFixed(1)}</span> · <span className="text-slate-100">{bmiStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                <div className="text-sm font-semibold text-amber-200">Premium pages stay visible</div>
                <ul className="mt-2 space-y-2 text-sm text-amber-50/90">
                  {lockedFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Waves className="h-4 w-4 text-amber-200" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex gap-3">
                <Button className="flex-1 bg-emerald-500 text-white hover:bg-emerald-400" onClick={() => setLocation("/subscribe")}>
                  Unlock full platform
                </Button>
                <Button variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10" onClick={() => setLocation("/login")}>
                  Login
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-8 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.15fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <UserRound className="h-4 w-4 text-emerald-300" />
              Client onboarding
            </div>
            <h3 className="mt-3 text-2xl font-bold text-white">Start as a client</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">Create a patient account, answer the nutrition questions, and enter the trial flow.</p>
            <Button className="mt-5 w-full bg-emerald-500 text-white hover:bg-emerald-400" onClick={() => setLocation("/register?mode=client")}>
              Register as client
            </Button>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <ShieldCheck className="h-4 w-4 text-sky-300" />
              Provider onboarding
            </div>
            <h3 className="mt-3 text-2xl font-bold text-white">Doctor or coach</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">One provider registration flow with a doctor/coach selector, built like SaaS onboarding.</p>
            <Button className="mt-5 w-full bg-white text-slate-950 hover:bg-slate-100" onClick={() => setLocation("/register?mode=provider")}>
              Register as provider
            </Button>
          </div>

          <form onSubmit={handleAdminLogin} className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm text-emerald-100">
              <Lock className="h-4 w-4" />
              Admin access
            </div>
            <h3 className="mt-3 text-2xl font-bold text-white">Login as admin</h3>
            <p className="mt-2 text-sm leading-6 text-emerald-50/90">This bypasses user onboarding and goes straight to the admin dashboard.</p>

            <div className="mt-5 space-y-3">
              <Input
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Admin username"
                className="border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500"
                disabled={adminSubmitting}
              />
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Password"
                className="border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500"
                disabled={adminSubmitting}
              />
              {adminError && <p className="text-sm text-red-300">{adminError}</p>}
              <Button type="submit" className="w-full bg-slate-950 text-white hover:bg-slate-800" disabled={adminSubmitting}>
                {adminSubmitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                Enter admin dashboard
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}