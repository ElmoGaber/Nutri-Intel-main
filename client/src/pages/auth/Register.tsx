import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, User, AlertCircle, CheckCircle, Loader2, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "next-themes";

export default function Register() {
  const { t, language } = useLanguage();
  const { register, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { setTheme } = useTheme();
  const initialMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "provider" ? "provider" : "client";
  const [signupMode, setSignupMode] = useState<"client" | "provider">(initialMode);
  const [providerType, setProviderType] = useState<"doctor" | "coach">("doctor");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    accountType: "patient" as "patient" | "doctor" | "coach",
    clientId: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    height: "",
    weight: "",
    bloodType: "",
    favoriteFoods: "",
    allergyFoods: "",
    lastMeal: "",
    conditions: "",
    symptoms: "",
    medications: "",
    themePreference: "light" as "light" | "dark",
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const checkPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    checkPasswordStrength(value);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const isProvider = signupMode === "provider";
    const actualRole = isProvider ? providerType : "patient";

    if (!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(t("errorOccurred") || t("errorOccurred"));
      return;
    }

    if (!isProvider && (!formData.age || !formData.height || !formData.weight || !formData.bloodType)) {
      setError(t("errorOccurred") || t("errorOccurred"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    if (!agreeTerms) {
      setError(t("termsAndConditions"));
      return;
    }

    try {
      setIsSubmitting(true);
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.confirmPassword,
        formData.firstName,
        formData.lastName,
        isProvider ? undefined : parseInt(formData.age),
        isProvider ? undefined : parseFloat(formData.height),
        isProvider ? undefined : parseFloat(formData.weight),
        isProvider ? undefined : formData.bloodType,
        actualRole,
        formData.clientId || undefined,
        isProvider
          ? undefined
          : {
              favoriteFoods: formData.favoriteFoods,
              allergyFoods: formData.allergyFoods,
              lastMeal: formData.lastMeal,
              conditions: formData.conditions,
              symptoms: formData.symptoms,
              medications: formData.medications,
            }
      );
      // Apply the chosen theme
      setTheme(formData.themePreference);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("registrationFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const strengthLabels = [t("weak"), t("fair"), t("good"), t("strong"), t("veryStrong")];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const strengthWidths = ["w-1/5", "w-2/5", "w-3/5", "w-4/5", "w-full"];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pb-20 animate-in fade-in">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">Nutri-Intel</h1>
          <p className="text-muted-foreground">{t("registerTitle")}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="glass-card p-4 bg-red-500/5 border-s-4 border-red-500 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="glass-card p-8 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                {t("firstName")}
              </label>
              <Input
                placeholder={t("firstName")}
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value });
                  setError("");
                }}
                disabled={isSubmitting || isLoading}
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                {t("lastName")}
              </label>
              <Input
                placeholder={t("lastName")}
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value });
                  setError("");
                }}
                disabled={isSubmitting || isLoading}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              {t("username")}
            </label>
            <Input
              placeholder={t("chooseUsername")}
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
                setError("");
              }}
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSignupMode("client")}
                className={`rounded-xl border px-4 py-3 text-start transition ${signupMode === "client" ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"}`}
              >
                <div className="text-sm font-semibold">{language === "ar" ? "تسجيل عميل" : "Client signup"}</div>
                <div className="text-xs text-muted-foreground mt-1">{language === "ar" ? "للمريض/العميل" : "For patient/client onboarding"}</div>
              </button>
              <button
                type="button"
                onClick={() => setSignupMode("provider")}
                className={`rounded-xl border px-4 py-3 text-start transition ${signupMode === "provider" ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"}`}
              >
                <div className="text-sm font-semibold">{language === "ar" ? "تسجيل دكتور/كوتش" : "Doctor/Coach signup"}</div>
                <div className="text-xs text-muted-foreground mt-1">{language === "ar" ? "تسجيل واحد للـ SaaS" : "One SaaS-style provider flow"}</div>
              </button>
            </div>

            {signupMode === "provider" && (
              <div>
                <label className="text-sm font-medium mb-2 block">{language === "ar" ? "نوع البروفايدر" : "Provider type"}</label>
                <select
                  value={providerType}
                  onChange={(e) => {
                    const value = e.target.value as "doctor" | "coach";
                    setProviderType(value);
                    setFormData({ ...formData, accountType: value });
                    setError("");
                  }}
                  disabled={isSubmitting || isLoading}
                  title={language === "ar" ? "نوع البروفايدر" : "Provider type"}
                  aria-label={language === "ar" ? "نوع البروفايدر" : "Provider type"}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="doctor">{language === "ar" ? "دكتور" : "Doctor"}</option>
                  <option value="coach">{language === "ar" ? "كوتش" : "Coach"}</option>
                </select>
              </div>
            )}
          </div>

          {signupMode === "client" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === "ar" ? "Patient ID (اختياري)" : "Patient ID (optional)"}
              </label>
              <Input
                placeholder={language === "ar" ? "مثال: PAT-2001" : "Example: PAT-2001"}
                value={formData.clientId}
                onChange={(e) => {
                  setFormData({ ...formData, clientId: e.target.value.toUpperCase() });
                  setError("");
                }}
                disabled={isSubmitting || isLoading}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4" />
              {t("email")}
            </label>
            <Input
              type="email"
              placeholder={t("email")}
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setError("");
              }}
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" />
              {t("password")}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={isSubmitting || isLoading}
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strengthColors[passwordStrength - 1] || "bg-red-500"} ${strengthWidths[passwordStrength - 1] || "w-0"}`}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {strengthLabels[passwordStrength - 1]}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" />
              {t("confirmPassword")}
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  setError("");
                }}
                disabled={isSubmitting || isLoading}
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                <CheckCircle className="w-4 h-4" />
                {t("passwordMatch")}
              </div>
            )}
          </div>

          {signupMode === "client" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("age")}</label>
                  <Input
                    type="number"
                    placeholder={t("age")}
                    value={formData.age}
                    onChange={(e) => {
                      setFormData({ ...formData, age: e.target.value });
                      setError("");
                    }}
                    disabled={isSubmitting || isLoading}
                    min="1"
                    max="120"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("height")}</label>
                  <Input
                    type="number"
                    placeholder={t("height")}
                    value={formData.height}
                    onChange={(e) => {
                      setFormData({ ...formData, height: e.target.value });
                      setError("");
                    }}
                    disabled={isSubmitting || isLoading}
                    step="0.1"
                    min="50"
                    max="250"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("weight")}</label>
                  <Input
                    type="number"
                    placeholder={t("weight")}
                    value={formData.weight}
                    onChange={(e) => {
                      setFormData({ ...formData, weight: e.target.value });
                      setError("");
                    }}
                    disabled={isSubmitting || isLoading}
                    step="0.1"
                    min="20"
                    max="300"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("bloodType")}</label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => {
                      setFormData({ ...formData, bloodType: e.target.value });
                      setError("");
                    }}
                    disabled={isSubmitting || isLoading}
                    title={language === "ar" ? "فصيلة الدم" : "Blood type"}
                    aria-label={language === "ar" ? "فصيلة الدم" : "Blood type"}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{language === "ar" ? "اختر فصيلة الدم" : "Select blood type"}</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{language === "ar" ? "الأكل المفضل" : "Favorite foods"}</label>
                  <textarea
                    className="w-full min-h-[90px] rounded-xl border border-input bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={language === "ar" ? "مثال: فراخ مشوية، رز، زبادي" : "Example: grilled chicken, rice, yogurt"}
                    value={formData.favoriteFoods}
                    onChange={(e) => setFormData({ ...formData, favoriteFoods: e.target.value })}
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{language === "ar" ? "الأكل المسبب للحساسية" : "Food allergies"}</label>
                  <textarea
                    className="w-full min-h-[90px] rounded-xl border border-input bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={language === "ar" ? "مثال: مكسرات، ألبان" : "Example: nuts, dairy"}
                    value={formData.allergyFoods}
                    onChange={(e) => setFormData({ ...formData, allergyFoods: e.target.value })}
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{language === "ar" ? "آخر وجبة" : "Last meal"}</label>
                  <textarea
                    className="w-full min-h-[90px] rounded-xl border border-input bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={language === "ar" ? "مثال: رز وخضار ودجاج" : "Example: rice, vegetables, chicken"}
                    value={formData.lastMeal}
                    onChange={(e) => setFormData({ ...formData, lastMeal: e.target.value })}
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{language === "ar" ? "الأمراض أو الحالات" : "Conditions / diseases"}</label>
                    <textarea
                      className="w-full min-h-[90px] rounded-xl border border-input bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder={language === "ar" ? "مثال: سكر، ضغط" : "Example: diabetes, blood pressure"}
                      value={formData.conditions}
                      onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{language === "ar" ? "الأعراض" : "Symptoms"}</label>
                    <textarea
                      className="w-full min-h-[90px] rounded-xl border border-input bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder={language === "ar" ? "مثال: صداع، حموضة" : "Example: headache, reflux"}
                      value={formData.symptoms}
                      onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{language === "ar" ? "الأدوية" : "Medications"}</label>
                  <textarea
                    className="w-full min-h-[90px] rounded-xl border border-input bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={language === "ar" ? "مثال: metformin مرتين يوميًا" : "Example: metformin twice daily"}
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                    disabled={isSubmitting || isLoading}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <h3 className="font-semibold">{language === "ar" ? "تسجيل البروفايدر" : "Provider onboarding"}</h3>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "الـ doctor/coach له مسار تسجيل واحد فقط بدون أسئلة العميل الصحية." : "Doctors and coaches use one shared onboarding flow without client health questions."}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "بعد التسجيل سيتم توجيهك إلى لوحة البروفايدر." : "After signup you will be routed to the provider dashboard."}</p>
            </div>
          )}

          {/* Theme Preference */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              {language === "ar" ? "اختر المظهر" : "Choose Theme"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, themePreference: "light" });
                  setTheme("light");
                }}
                disabled={isSubmitting || isLoading}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  formData.themePreference === "light"
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium">{language === "ar" ? "فاتح" : "Light"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, themePreference: "dark" });
                  setTheme("dark");
                }}
                disabled={isSubmitting || isLoading}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  formData.themePreference === "dark"
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <Moon className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">{language === "ar" ? "داكن" : "Dark"}</span>
              </button>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                setError("");
              }}
              disabled={isSubmitting || isLoading}
              className="w-4 h-4 rounded border border-muted mt-0.5"
            />
            <span className="text-sm text-muted-foreground">
              {t("agreeTerms")}{" "}
              <a href="#" className="text-primary hover:underline">
                {t("termsOfService")}
              </a>{" "}
              {t("and")}{" "}
              <a href="#" className="text-primary hover:underline">
                {t("privacyPolicy")}
              </a>
            </span>
          </label>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {t("signUp")}
              </>
            ) : (
              t("signUp")
            )}
          </Button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <button onClick={() => setLocation("/login")} className="text-primary hover:underline font-medium">
            {t("signInLink")}
          </button>
        </p>
      </div>
    </div>
  );
}
