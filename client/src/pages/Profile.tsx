import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Droplets,
  Target,
  Flame,
  Trophy,
  HeartPulse,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/actions";
import { buildNutritionGoals } from "@/lib/nutrition-metrics";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  caloricGoal: string;
  proteinGoal: string;
  weightGoal: string;
  age: string;
  height: string;
  weight: string;
  bloodType: string;
  dietType: string;
  favoriteFoodsAdult: string;
  favoriteFoodsKids: string;
  otherAllergies: string;
  conditions: string[];
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  nutAllergy: boolean;
  shellFishAllergy: boolean;
}

interface DietaryPreferencePayload {
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  nutAllergy?: boolean;
  shellFishAllergy?: boolean;
  otherAllergies?: string | null;
  dietType?: string | null;
  calorieGoal?: number | null;
  proteinGoal?: number | null;
  carbGoal?: number | null;
  fatGoal?: number | null;
}

interface MedicalInfoPayload {
  bloodType?: string | null;
  allergies?: string | null;
  medications?: string | null;
  conditions?: string | null;
}

interface ProfileCustomizationPayload {
  settings?: {
    profile?: {
      dietType?: string;
      allergies?: string[];
      conditions?: string[];
      favoriteFoodsAdult?: string[];
      favoriteFoodsKids?: string[];
    };
  };
  preferences?: DietaryPreferencePayload;
  medical?: MedicalInfoPayload;
}

const GOAL_LABELS: Record<string, { en: string; ar: string; icon: string }> = {
  lose_weight: { en: "Lose Weight", ar: "خسارة الوزن", icon: "⚖️" },
  gain_muscle: { en: "Gain Muscle", ar: "بناء العضلات", icon: "💪" },
  eat_healthy: { en: "Eat Healthier", ar: "الأكل الصحي", icon: "🥗" },
  manage_condition: { en: "Manage Condition", ar: "إدارة الحالة الصحية", icon: "❤️" },
  increase_energy: { en: "Increase Energy", ar: "زيادة الطاقة", icon: "⚡" },
  track_wellness: { en: "Track Wellness", ar: "متابعة الصحة العامة", icon: "📊" },
};

const toggleOptions = [
  { key: "vegetarian", en: "Vegetarian", ar: "نباتي" },
  { key: "vegan", en: "Vegan", ar: "نباتي صرف" },
  { key: "glutenFree", en: "Gluten Free", ar: "بدون جلوتين" },
  { key: "dairyFree", en: "Dairy Free", ar: "بدون ألبان" },
  { key: "nutAllergy", en: "Nut Allergy", ar: "حساسية مكسرات" },
  { key: "shellFishAllergy", en: "Shellfish Allergy", ar: "حساسية قشريات" },
] as const;

const conditionOptions = [
  { value: "diabetes", en: "Diabetes / High Sugar", ar: "سكري / ارتفاع سكر" },
  { value: "hypertension", en: "High Blood Pressure", ar: "ارتفاع ضغط" },
  { value: "high_cholesterol", en: "High Cholesterol / Heart", ar: "كوليسترول / قلب" },
  { value: "kidney_disease", en: "Kidney Disease", ar: "مشاكل كلى" },
] as const;

function splitName(fullName: string, fallbackFirst = "User", fallbackLast = "Profile") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: fallbackFirst, lastName: fallbackLast };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || fallbackLast,
  };
}

function goalToInput(goal: number): string {
  return goal > 0 ? String(Math.round(goal)) : "";
}

function parseDelimitedList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function localizeCondition(value: string, language: string) {
  const match = conditionOptions.find((item) => item.value === value);
  return language === "ar" ? match?.ar || value : match?.en || value;
}

export default function Profile() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, checkAuth } = useAuth();
  const queryClient = useQueryClient();

  const { data: streak } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      const r = await fetch("/api/progress/streak", { credentials: "include" });
      return r.ok ? r.json() : { streak: 0, totalDaysLogged: 0 };
    },
  });

  const { data: preferences = {} } = useQuery<DietaryPreferencePayload>({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const r = await fetch("/api/users/preferences", { credentials: "include" });
      return r.ok ? r.json() : {};
    },
  });

  const { data: medicalInfo = {} } = useQuery<MedicalInfoPayload>({
    queryKey: ["emergency-medical-info"],
    queryFn: async () => {
      const r = await fetch("/api/emergency/medical-info", { credentials: "include" });
      return r.ok ? r.json() : {};
    },
  });

  const { data: customization = {} } = useQuery<ProfileCustomizationPayload>({
    queryKey: ["profile-customization"],
    queryFn: async () => {
      const r = await fetch("/api/profile/customization", { credentials: "include" });
      return r.ok ? r.json() : {};
    },
  });

  const goals = loadFromLocalStorage<string[]>("nutri-intel-goals") || [];
  const nutritionGoals = buildNutritionGoals(user, preferences);

  const buildDefault = (): ProfileData => {
    const saved = loadFromLocalStorage<Partial<ProfileData>>("nutri-intel-profile");
    const customizationProfile = customization.settings?.profile;
    const customizationPrefs = customization.preferences || {};
    const customizationMedical = customization.medical || {};

    const mergedAllergies = parseDelimitedList(
      customizationProfile?.allergies?.join(", ")
        || customizationMedical.allergies
        || preferences.otherAllergies
        || saved?.otherAllergies,
    );
    const mergedConditions = customizationProfile?.conditions?.length
      ? customizationProfile.conditions
      : parseDelimitedList(customizationMedical.conditions || medicalInfo.conditions || saved?.conditions?.join(", "));

    return {
      name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username : "",
      email: user?.email || "",
      phone: saved?.phone || "",
      address: saved?.address || "",
      caloricGoal: goalToInput(nutritionGoals.calories),
      proteinGoal: goalToInput(nutritionGoals.protein),
      weightGoal: user?.weight ? String(user.weight) : saved?.weightGoal || "",
      age: user?.age ? String(user.age) : saved?.age || "",
      height: user?.height ? String(user.height) : saved?.height || "",
      weight: user?.weight ? String(user.weight) : saved?.weight || "",
      bloodType: (user as any)?.bloodType || customizationMedical.bloodType || medicalInfo.bloodType || saved?.bloodType || "",
      dietType: customizationProfile?.dietType || customizationPrefs.dietType || preferences.dietType || saved?.dietType || "balanced",
      favoriteFoodsAdult: customizationProfile?.favoriteFoodsAdult?.join(", ") || saved?.favoriteFoodsAdult || "",
      favoriteFoodsKids: customizationProfile?.favoriteFoodsKids?.join(", ") || saved?.favoriteFoodsKids || "",
      otherAllergies: mergedAllergies.join(", "),
      conditions: mergedConditions,
      vegetarian: Boolean(customizationPrefs.vegetarian ?? preferences.vegetarian),
      vegan: Boolean(customizationPrefs.vegan ?? preferences.vegan),
      glutenFree: Boolean(customizationPrefs.glutenFree ?? preferences.glutenFree),
      dairyFree: Boolean(customizationPrefs.dairyFree ?? preferences.dairyFree),
      nutAllergy: Boolean(customizationPrefs.nutAllergy ?? preferences.nutAllergy),
      shellFishAllergy: Boolean(customizationPrefs.shellFishAllergy ?? preferences.shellFishAllergy),
    };
  };

  const [profile, setProfile] = useState<ProfileData>(buildDefault);
  const [savedProfile, setSavedProfile] = useState<ProfileData>(buildDefault);

  useEffect(() => {
    const nextProfile = buildDefault();
    setProfile(nextProfile);
    setSavedProfile(nextProfile);
  }, [
    user,
    preferences.vegetarian,
    preferences.vegan,
    preferences.glutenFree,
    preferences.dairyFree,
    preferences.nutAllergy,
    preferences.shellFishAllergy,
    preferences.otherAllergies,
    preferences.dietType,
    medicalInfo.bloodType,
    medicalInfo.conditions,
    customization.settings,
    customization.preferences,
    customization.medical,
    nutritionGoals.calories,
    nutritionGoals.protein,
  ]);

  const ageNumber = Number(profile.age || 0);
  const kidMode = Number.isFinite(ageNumber) && ageNumber > 0 && ageNumber <= 12;

  const updateToggle = (key: keyof Pick<ProfileData, "vegetarian" | "vegan" | "glutenFree" | "dairyFree" | "nutAllergy" | "shellFishAllergy">) => {
    setProfile((current) => ({ ...current, [key]: !current[key] }));
  };

  const toggleCondition = (condition: string) => {
    setProfile((current) => {
      const exists = current.conditions.includes(condition);
      return {
        ...current,
        conditions: exists
          ? current.conditions.filter((item) => item !== condition)
          : [...current.conditions, condition],
      };
    });
  };

  const handleSave = async () => {
    if (!profile.name.trim() || !profile.email.trim()) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "الاسم والبريد الإلكتروني مطلوبان" : "Name and email are required",
      });
      return;
    }

    try {
      const fallbackFirst = user?.firstName || "User";
      const fallbackLast = user?.lastName || "Profile";
      const { firstName, lastName } = splitName(profile.name, fallbackFirst, fallbackLast);

      const profileResponse = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName,
          lastName,
          email: profile.email.trim(),
          age: profile.age ? Number(profile.age) : null,
          height: profile.height ? Number(profile.height) : null,
          weight: profile.weight ? Number(profile.weight) : null,
          bloodType: profile.bloodType || null,
        }),
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.json().catch(() => ({}));
        throw new Error(error.message || "Failed to save profile");
      }

      const otherAllergiesList = parseDelimitedList(profile.otherAllergies);
      const mergedAllergies = [
        ...otherAllergiesList,
        profile.nutAllergy ? "nut allergy" : "",
        profile.shellFishAllergy ? "shellfish allergy" : "",
        profile.dairyFree ? "dairy sensitivity" : "",
        profile.glutenFree ? "gluten sensitivity" : "",
      ].filter(Boolean);

      const customizationResponse = await fetch("/api/profile/customization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profile: {
            dietType: profile.dietType || "balanced",
            allergies: mergedAllergies,
            conditions: profile.conditions,
            favoriteFoodsAdult: parseDelimitedList(profile.favoriteFoodsAdult),
            favoriteFoodsKids: parseDelimitedList(profile.favoriteFoodsKids),
          },
          preferences: {
            ...preferences,
            calorieGoal: profile.caloricGoal ? Number(profile.caloricGoal) : null,
            proteinGoal: profile.proteinGoal ? Number(profile.proteinGoal) : null,
            vegetarian: profile.vegetarian,
            vegan: profile.vegan,
            glutenFree: profile.glutenFree,
            dairyFree: profile.dairyFree,
            nutAllergy: profile.nutAllergy,
            shellFishAllergy: profile.shellFishAllergy,
            otherAllergies: otherAllergiesList.join(", ") || null,
            dietType: profile.dietType || null,
          },
          medical: {
            bloodType: profile.bloodType || null,
            medications: medicalInfo.medications || null,
          },
        }),
      });

      if (!customizationResponse.ok) {
        const error = await customizationResponse.json().catch(() => ({}));
        throw new Error(error.message || "Failed to save customization");
      }

      saveToLocalStorage("nutri-intel-profile", profile);
      setSavedProfile({ ...profile });
      await checkAuth();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-preferences"] }),
        queryClient.invalidateQueries({ queryKey: ["emergency-medical-info"] }),
        queryClient.invalidateQueries({ queryKey: ["profile-customization"] }),
      ]);

      toast({
        title: language === "ar" ? "تم الحفظ" : "Profile Saved",
        description:
          language === "ar"
            ? "تم حفظ التخصيص الغذائي والبيانات الصحية بنجاح"
            : "Your profile, food preferences, and health flags were saved successfully",
      });
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: error instanceof Error ? error.message : language === "ar" ? "تعذر حفظ البيانات" : "Failed to save data",
      });
    }
  };

  const handleCancel = () => {
    setProfile({ ...savedProfile });
    toast({
      title: language === "ar" ? "تم الإلغاء" : "Cancelled",
      description: language === "ar" ? "تمت استعادة آخر بيانات محفوظة" : "Changes have been reverted",
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">{t("profileTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("updateProfile")}</p>
      </div>

      <div className="glass-card p-8 text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20 text-3xl font-bold text-primary-foreground select-none">
          {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
        </div>
        <h2 className="text-2xl font-bold mb-1">{profile.name || (language === "ar" ? "مستخدم" : "User")}</h2>
        <p className="text-sm text-muted-foreground mb-3">{profile.email}</p>

        {(profile.age || profile.height || profile.weight || profile.bloodType) && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap mb-4">
            {profile.age && <span className="px-2 py-1 rounded-full bg-muted">{profile.age} {language === "ar" ? "سنة" : "yrs"}</span>}
            {profile.height && <span className="px-2 py-1 rounded-full bg-muted">{profile.height} cm</span>}
            {profile.weight && <span className="px-2 py-1 rounded-full bg-muted">{profile.weight} kg</span>}
            {profile.bloodType && <span className="px-2 py-1 rounded-full bg-muted">{language === "ar" ? "فصيلة الدم" : "Blood"}: {profile.bloodType}</span>}
            {kidMode && (
              <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                {language === "ar" ? "وضع الطفل الصحي مفعل" : "Healthy kid mode active"}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="text-center">
            <div className="flex justify-center mb-1"><Flame className="w-5 h-5 text-orange-500" /></div>
            <p className="text-lg font-bold">{streak?.streak || 0}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "أيام متتالية" : "streak"}</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1"><Trophy className="w-5 h-5 text-yellow-500" /></div>
            <p className="text-lg font-bold">{streak?.totalDaysLogged || 0}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "أيام مسجلة" : "days logged"}</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1"><Target className="w-5 h-5 text-primary" /></div>
            <p className="text-lg font-bold">{goals.length}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "أهداف" : "goals"}</p>
          </div>
        </div>
      </div>

      {/* Recall */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold mb-3">{language === "ar" ? "الاسترجاع (Recall)" : "Recall"}</h3>
        <Tabs defaultValue="lastMeal">
          <TabsList>
            <TabsTrigger value="lastMeal">{language === "ar" ? "آخر وجبة" : "Last meal"}</TabsTrigger>
            <TabsTrigger value="history">{language === "ar" ? "التاريخ" : "History"}</TabsTrigger>
            <TabsTrigger value="diseases">{language === "ar" ? "الأمراض" : "Diseases"}</TabsTrigger>
            <TabsTrigger value="meds">{language === "ar" ? "الأدوية" : "Medications"}</TabsTrigger>
            <TabsTrigger value="prefs">{language === "ar" ? "التفضيلات" : "Preferences"}</TabsTrigger>
          </TabsList>

          <TabsContent value="lastMeal">
            {/* last meal from meals endpoint */}
            <p className="text-sm text-muted-foreground">{language === "ar" ? "عرض آخر وجبة مسجلة." : "Showing your most recent logged meal."}</p>
          </TabsContent>

          <TabsContent value="history">
            <p className="text-sm text-muted-foreground">{language === "ar" ? "تاريخ الوجبات سيظهر هنا." : "Meal history will appear here."}</p>
          </TabsContent>

          <TabsContent value="diseases">
            <p className="text-sm text-muted-foreground">{language === "ar" ? "الحالات الصحية المسجلة." : "Recorded health conditions."}</p>
          </TabsContent>

          <TabsContent value="meds">
            <p className="text-sm text-muted-foreground">{language === "ar" ? "قائمة الأدوية ومسارات الاستعمال." : "List of medications and schedules."}</p>
          </TabsContent>

          <TabsContent value="prefs">
            <p className="text-sm text-muted-foreground">{language === "ar" ? "تفضيلاتك ومفضلات الطعام." : "Your preferences and favorite foods."}</p>
          </TabsContent>
        </Tabs>
      </div>

      {goals.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {language === "ar" ? "أهدافي الصحية" : "My Health Goals"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {goals.map((goal) => (
              <span key={goal} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-sm">
                {GOAL_LABELS[goal]?.icon} {language === "ar" ? GOAL_LABELS[goal]?.ar : GOAL_LABELS[goal]?.en}
              </span>
            ))}
          </div>
          <button className="text-xs text-primary hover:underline mt-3" onClick={() => setLocation("/onboarding")}>
            {language === "ar" ? "تحديث الأهداف" : "Update goals"}
          </button>
        </div>
      )}

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4">{t("profile")}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2"><User className="w-4 h-4" />{t("firstName")}</label>
            <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2"><Mail className="w-4 h-4" />{t("email")}</label>
            <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2"><Phone className="w-4 h-4" />{t("phone")}</label>
            <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />{t("address")}</label>
            <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="mt-2" />
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4">{language === "ar" ? "البيانات الصحية" : "Health Data"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">{t("age")}</label>
            <Input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">{t("height")} (cm)</label>
            <Input type="number" value={profile.height} onChange={(e) => setProfile({ ...profile, height: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">{t("weight")} (kg)</label>
            <Input type="number" value={profile.weight} onChange={(e) => setProfile({ ...profile, weight: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2"><Droplets className="w-4 h-4" />{t("bloodType")}</label>
            <select
              value={profile.bloodType}
              onChange={(e) => setProfile({ ...profile, bloodType: e.target.value })}
              className="flex h-11 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
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
        {kidMode && (
          <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {language === "ar" ? "هيتم اقتراح أكل أطفال صحي أكتر بشكل تلقائي" : "Healthy kid-friendly foods will be prioritized automatically"}
            </p>
            <p className="text-muted-foreground mt-1">
              {language === "ar"
                ? "بمجرد الحفظ، صفحة الأغذية هتعرض وجبات جاهزة للأطفال بشكل صحي مع اختيارات أقرب للأطعمة المحببة."
                : "Once you save, the food database will prioritize healthier kid-friendly ready meals and gentler recommendations."}
            </p>
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          {language === "ar" ? "تخصيص الأكل والتنبيهات" : "Food Personalization & Alerts"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-sm font-medium block mb-2">{language === "ar" ? "نمط الأكل" : "Diet style"}</label>
            <select
              value={profile.dietType}
              onChange={(e) => setProfile({ ...profile, dietType: e.target.value })}
              className="flex h-11 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
            >
              <option value="balanced">{language === "ar" ? "متوازن" : "Balanced"}</option>
              <option value="mediterranean">{language === "ar" ? "متوسطي" : "Mediterranean"}</option>
              <option value="low-carb">{language === "ar" ? "منخفض الكربوهيدرات" : "Low-carb"}</option>
              <option value="high-protein">{language === "ar" ? "عالي البروتين" : "High protein"}</option>
              <option value="keto">{language === "ar" ? "كيتو" : "Keto"}</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium block">{language === "ar" ? "الأكلات المفضلة" : "Favorite foods"}</label>
            <Input
              value={profile.favoriteFoodsAdult}
              onChange={(e) => setProfile({ ...profile, favoriteFoodsAdult: e.target.value })}
              placeholder={language === "ar" ? "للكبار: مثال موز، شوفان، دجاج" : "Adults: banana, oats, chicken"}
            />
            <Input
              value={profile.favoriteFoodsKids}
              onChange={(e) => setProfile({ ...profile, favoriteFoodsKids: e.target.value })}
              placeholder={language === "ar" ? "للأطفال: مثال مكرونة، بان كيك، فواكه" : "Kids: pasta, pancakes, fruits"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {language === "ar"
                ? "اكتب العناصر مفصولة بفاصلة، والنظام هيستخدم قائمة الأطفال أو الكبار حسب عمر المستخدم."
                : "Use comma-separated items; the system will apply kids/adult favorites based on user age."}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm font-medium mb-3">{language === "ar" ? "تفضيلات وحساسيات" : "Diet toggles & sensitivities"}</p>
          <div className="flex flex-wrap gap-2">
            {toggleOptions.map((option) => {
              const active = profile[option.key];
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => updateToggle(option.key)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background/70 hover:border-primary/35 hover:bg-primary/5"
                  }`}
                >
                  {language === "ar" ? option.ar : option.en}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">{language === "ar" ? "حساسيات أو موانع إضافية" : "Extra allergies or foods to avoid"}</label>
            <Textarea
              value={profile.otherAllergies}
              onChange={(e) => setProfile({ ...profile, otherAllergies: e.target.value })}
              placeholder={language === "ar" ? "مثال: سمسم، لاكتوز، نوع أكل معين" : "Example: sesame, lactose, a specific ingredient"}
              className="min-h-[96px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">{language === "ar" ? "حالات صحية نراعيها" : "Medical conditions to consider"}</label>
            <div className="flex flex-wrap gap-2">
              {conditionOptions.map((option) => {
                const active = profile.conditions.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleCondition(option.value)}
                    className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-all ${
                      active
                        ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-200"
                        : "border-border bg-background/70 hover:border-amber-500/35 hover:bg-amber-500/5"
                    }`}
                  >
                    {language === "ar" ? option.ar : option.en}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {language === "ar"
                ? "ده هيخلي النظام يظهر منع أو تحديد كمية أو تنبيه عملي لو الوجبة مش مناسبة."
                : "This lets the system block, limit, or warn about foods when they may not fit your condition."}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-primary" />
          {t("myGoals")}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">{t("dailyCaloricGoal")} (kcal)</label>
            <Input type="number" value={profile.caloricGoal} onChange={(e) => setProfile({ ...profile, caloricGoal: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">{t("proteinGoal")} (g)</label>
            <Input type="number" value={profile.proteinGoal} onChange={(e) => setProfile({ ...profile, proteinGoal: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">{t("weightGoal")} (kg)</label>
            <Input type="number" value={profile.weightGoal} onChange={(e) => setProfile({ ...profile, weightGoal: e.target.value })} />
          </div>
        </div>
      </div>

      {(profile.conditions.length > 0 || profile.otherAllergies.trim()) && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {language === "ar" ? "ملخص التخصيص الحالي" : "Current personalization summary"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.conditions.map((condition) => (
              <span key={condition} className="rounded-full bg-amber-500/15 px-3 py-1 text-sm text-amber-700 dark:text-amber-200">
                {localizeCondition(condition, language)}
              </span>
            ))}
            {profile.otherAllergies.trim() && (
              <span className="rounded-full bg-rose-500/15 px-3 py-1 text-sm text-rose-700 dark:text-rose-200">
                {language === "ar" ? `حساسية: ${profile.otherAllergies}` : `Allergies: ${profile.otherAllergies}`}
              </span>
            )}
            {profile.favoriteFoodsAdult.trim() && (
              <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sm text-sky-700 dark:text-sky-200">
                {language === "ar" ? `مفضلات الكبار: ${profile.favoriteFoodsAdult}` : `Adult favorites: ${profile.favoriteFoodsAdult}`}
              </span>
            )}
            {profile.favoriteFoodsKids.trim() && (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-200">
                {language === "ar" ? `مفضلات الأطفال: ${profile.favoriteFoodsKids}` : `Kids favorites: ${profile.favoriteFoodsKids}`}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button className="flex-1" size="lg" onClick={handleSave}>{t("save")}</Button>
        <Button variant="outline" className="flex-1" size="lg" onClick={handleCancel}>{t("cancel")}</Button>
      </div>
    </div>
  );
}
