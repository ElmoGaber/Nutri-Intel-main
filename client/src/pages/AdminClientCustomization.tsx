import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  User,
  ShieldAlert,
  Save,
  Loader2,
  Calculator,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import type {
  ClientPersonalizationSettings,
  NutritionFormulaPreset,
  NutritionFormulaKey,
} from "@shared/personalization-config";
import { DEFAULT_CLIENT_NUTRITION_LIMITS } from "@shared/personalization-config";

type AdminClientCustomizationResponse = {
  user: {
    id: string;
    clientId: string | null;
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    age: number | null;
    height: number | null;
    weight: number | null;
    bloodType: string | null;
    role: string;
  };
  preferences: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    nutAllergy: boolean;
    shellFishAllergy: boolean;
    otherAllergies: string | null;
    dietType: string;
    calorieGoal: number | null;
    proteinGoal: number | null;
  };
  medical: {
    bloodType: string | null;
    allergies: string | null;
    conditions: string | null;
    medications: string | null;
  };
  settings: ClientPersonalizationSettings;
  formulasCatalog: NutritionFormulaPreset[];
};

function cloneResponse(data: AdminClientCustomizationResponse): AdminClientCustomizationResponse {
  return JSON.parse(JSON.stringify(data));
}

function normalizeResponse(data: AdminClientCustomizationResponse): AdminClientCustomizationResponse {
  return {
    ...data,
    settings: {
      ...data.settings,
      nutritionLimits: {
        daily: {
          ...DEFAULT_CLIENT_NUTRITION_LIMITS.daily,
          ...(data.settings.nutritionLimits?.daily || {}),
        },
        perMeal: {
          ...DEFAULT_CLIENT_NUTRITION_LIMITS.perMeal,
          ...(data.settings.nutritionLimits?.perMeal || {}),
        },
      },
    },
  };
}

function parseCsv(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToCsv(list: string[] | undefined): string {
  return (list || []).join(", ");
}

function getFormulaEquationPreview(preset: NutritionFormulaPreset, language: "ar" | "en") {
  if (preset.bmrEquation === "katchMcArdle") {
    return language === "ar"
      ? "BMR = 370 + (21.6 x LBM)"
      : "BMR = 370 + (21.6 x LBM)";
  }

  if (preset.bmrEquation === "abwTer30") {
    const factor = Number.isFinite(preset.adjustedBodyWeightFactor) ? preset.adjustedBodyWeightFactor : 0.38;
    const kcalPerKg = Number.isFinite(preset.kcalPerKgForTdee) ? preset.kcalPerKgForTdee : 30;
    return language === "ar"
      ? `ABW = IBW + (Actual - IBW) x ${factor.toFixed(2)} | Calories = ABW x ${kcalPerKg}`
      : `ABW = IBW + (Actual - IBW) x ${factor.toFixed(2)} | Calories = ABW x ${kcalPerKg}`;
  }

  return language === "ar"
    ? "BMR (Mifflin-St Jeor) = 10 x W + 6.25 x H - 5 x Age +/- ثابت الجنس"
    : "BMR (Mifflin-St Jeor) = 10 x W + 6.25 x H - 5 x Age +/- sex constant";
}

export default function AdminClientCustomization() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { role, isAdmin } = useAuth();
  const [lookupId, setLookupId] = useState("");
  const [activeLookupId, setActiveLookupId] = useState("");
  const [showFormulas, setShowFormulas] = useState(false);
  const [draft, setDraft] = useState<AdminClientCustomizationResponse | null>(null);
  const isPractitioner = role === "doctor" || role === "coach";
  const baseEndpoint = isAdmin ? "/api/admin" : "/api/practitioner";
  const queryScope = isAdmin ? "admin" : "practitioner";

  const { data, isLoading, isError, refetch } = useQuery<AdminClientCustomizationResponse>({
    queryKey: [queryScope, "client-customization", activeLookupId],
    enabled: Boolean(activeLookupId) && (isAdmin || isPractitioner),
    queryFn: async () => {
      const response = await fetch(`${baseEndpoint}/client-customization/${encodeURIComponent(activeLookupId)}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to load customization");
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (data) {
      setDraft(cloneResponse(normalizeResponse(data)));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeLookupId || !draft) return null;
      const response = await fetch(`${baseEndpoint}/client-customization/${encodeURIComponent(activeLookupId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user: draft.user,
          preferences: draft.preferences,
          medical: draft.medical,
          settings: draft.settings,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to save customization");
      }

      return response.json() as Promise<AdminClientCustomizationResponse>;
    },
    onSuccess: (saved) => {
      if (!saved) return;
      setDraft(cloneResponse(saved));
      toast({
        title: language === "ar" ? "تم الحفظ" : "Saved",
        description:
          language === "ar"
            ? "تم تحديث تخصيص العميل والمعادلات بنجاح"
            : "Client personalization and formula assignment updated successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل الحفظ" : "Save failed",
        description: error instanceof Error ? error.message : language === "ar" ? "حدث خطأ" : "Unexpected error",
      });
    },
  });

  const toggleFormulaEnabled = (key: NutritionFormulaKey) => {
    if (!draft) return;
    const enabled = new Set(draft.settings.formulas.enabledFormulaKeys);
    if (enabled.has(key)) {
      enabled.delete(key);
    } else {
      enabled.add(key);
    }

    let nextEnabled = Array.from(enabled);
    if (nextEnabled.length === 0) {
      nextEnabled = [key];
    }

    let active = draft.settings.formulas.activeFormulaKey;
    if (!nextEnabled.includes(active)) {
      active = nextEnabled[0];
    }

    setDraft({
      ...draft,
      settings: {
        ...draft.settings,
        formulas: {
          ...draft.settings.formulas,
          enabledFormulaKeys: nextEnabled,
          activeFormulaKey: active,
        },
      },
    });
  };

  const setActiveFormula = (key: NutritionFormulaKey) => {
    if (!draft) return;
    const enabled = draft.settings.formulas.enabledFormulaKeys.includes(key)
      ? draft.settings.formulas.enabledFormulaKeys
      : [...draft.settings.formulas.enabledFormulaKeys, key];

    setDraft({
      ...draft,
      settings: {
        ...draft.settings,
        formulas: {
          ...draft.settings.formulas,
          enabledFormulaKeys: enabled,
          activeFormulaKey: key,
        },
      },
    });
  };

  const updateProfileList = (
    field:
      | "allergies"
      | "conditions"
      | "favoriteFoodsAdult"
      | "favoriteFoodsKids"
      | "avoidFoods"
      | "disabledFoodNames"
      | "preferredReadyMealTags",
    value: string,
  ) => {
    if (!draft) return;
    setDraft({
      ...draft,
      settings: {
        ...draft.settings,
        profile: {
          ...draft.settings.profile,
          [field]: parseCsv(value),
        },
      },
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
          {isAdmin
            ? (language === "ar" ? "تخصيص العميل من الأدمن" : "Admin Client Customization")
            : (language === "ar" ? "تخصيص العميل للطبيب/الكوتش" : "Practitioner Client Customization")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "ar"
            ? "ابحث بالـ Client ID أو User ID، وعدّل الحساسية والدايت والحالات الصحية والمفضلات والمعادلات بحيث تنعكس تلقائيا على صفحة العميل والأغذية."
            : "Search by Client ID or User ID, then update allergies, diet, conditions, favorites, and formulas with automatic client-side sync."}
        </p>
      </div>

      {!isAdmin && !isPractitioner && (
        <div className="glass-card p-4 border border-red-500/30 bg-red-500/10 text-sm text-red-500">
          {language === "ar"
            ? "هذه الصفحة متاحة فقط للأدمن أو الطبيب أو الكوتش."
            : "This page is only available to admin, doctor, or coach accounts."}
        </div>
      )}

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{language === "ar" ? "بحث عن عميل" : "Client Lookup"}</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder={language === "ar" ? "اكتب Client ID أو User ID أو username" : "Enter Client ID, User ID, or username"}
          />
          <Button
            onClick={() => setActiveLookupId(lookupId.trim())}
            disabled={!lookupId.trim() || isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {language === "ar" ? "عرض البيانات" : "Load Client"}
          </Button>
        </div>
        {activeLookupId && (
          <p className="text-xs text-muted-foreground">
            {language === "ar" ? "المعرف الحالي:" : "Active lookup:"} <span className="font-medium text-foreground">{activeLookupId}</span>
          </p>
        )}
      </div>

      {isError && (
        <div className="glass-card p-5 border border-destructive/30 bg-destructive/10 text-sm text-destructive">
          {language === "ar" ? "تعذر تحميل بيانات العميل. تأكد من الـ ID." : "Failed to load client data. Verify the identifier."}
        </div>
      )}

      {draft && (
        <div className="space-y-5">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <h2 className="font-semibold">{language === "ar" ? "بيانات العميل الأساسية" : "Client Core Profile"}</h2>
              </div>
              <div className="text-xs text-muted-foreground">
                {language === "ar" ? "Client ID:" : "Client ID:"} <span className="font-medium text-foreground">{draft.user.clientId || draft.user.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                value={draft.user.firstName || ""}
                onChange={(e) => setDraft({ ...draft, user: { ...draft.user, firstName: e.target.value } })}
                placeholder={language === "ar" ? "الاسم الأول" : "First name"}
              />
              <Input
                value={draft.user.lastName || ""}
                onChange={(e) => setDraft({ ...draft, user: { ...draft.user, lastName: e.target.value } })}
                placeholder={language === "ar" ? "الاسم الأخير" : "Last name"}
              />
              <Input
                value={draft.user.email || ""}
                onChange={(e) => setDraft({ ...draft, user: { ...draft.user, email: e.target.value } })}
                placeholder={language === "ar" ? "البريد الإلكتروني" : "Email"}
              />
              <Input
                type="number"
                value={draft.user.age ?? ""}
                onChange={(e) => setDraft({ ...draft, user: { ...draft.user, age: e.target.value ? Number(e.target.value) : null } })}
                placeholder={language === "ar" ? "العمر" : "Age"}
              />
              <Input
                type="number"
                value={draft.user.height ?? ""}
                onChange={(e) => setDraft({ ...draft, user: { ...draft.user, height: e.target.value ? Number(e.target.value) : null } })}
                placeholder={language === "ar" ? "الطول (سم)" : "Height (cm)"}
              />
              <Input
                type="number"
                value={draft.user.weight ?? ""}
                onChange={(e) => setDraft({ ...draft, user: { ...draft.user, weight: e.target.value ? Number(e.target.value) : null } })}
                placeholder={language === "ar" ? "الوزن (كجم)" : "Weight (kg)"}
              />
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">{language === "ar" ? "تخصيص الأكل والتنبيهات" : "Nutrition Personalization & Alerts"}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                value={draft.settings.profile.dietType}
                onChange={(e) => setDraft({
                  ...draft,
                  settings: {
                    ...draft.settings,
                    profile: { ...draft.settings.profile, dietType: e.target.value },
                  },
                })}
                placeholder={language === "ar" ? "نوع الدايت (balanced, keto...)" : "Diet type (balanced, keto...)"}
              />
              <Input
                type="number"
                value={draft.preferences.calorieGoal ?? ""}
                onChange={(e) => setDraft({
                  ...draft,
                  preferences: {
                    ...draft.preferences,
                    calorieGoal: e.target.value ? Number(e.target.value) : null,
                  },
                })}
                placeholder={language === "ar" ? "هدف السعرات" : "Calorie goal"}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Textarea
                value={listToCsv(draft.settings.profile.allergies)}
                onChange={(e) => updateProfileList("allergies", e.target.value)}
                placeholder={language === "ar" ? "الحساسية (مفصولة بفواصل)" : "Allergies (comma separated)"}
                className="min-h-[84px]"
              />
              <Textarea
                value={listToCsv(draft.settings.profile.conditions)}
                onChange={(e) => updateProfileList("conditions", e.target.value)}
                placeholder={language === "ar" ? "الحالات الصحية (مفصولة بفواصل)" : "Health conditions (comma separated)"}
                className="min-h-[84px]"
              />
              <Textarea
                value={listToCsv(draft.settings.profile.favoriteFoodsAdult)}
                onChange={(e) => updateProfileList("favoriteFoodsAdult", e.target.value)}
                placeholder={language === "ar" ? "الأكلات المفضلة للكبار" : "Favorite foods for adults"}
                className="min-h-[84px]"
              />
              <Textarea
                value={listToCsv(draft.settings.profile.favoriteFoodsKids)}
                onChange={(e) => updateProfileList("favoriteFoodsKids", e.target.value)}
                placeholder={language === "ar" ? "الأكلات المفضلة للأطفال" : "Favorite foods for kids"}
                className="min-h-[84px]"
              />
              <Textarea
                value={listToCsv(draft.settings.profile.avoidFoods)}
                onChange={(e) => updateProfileList("avoidFoods", e.target.value)}
                placeholder={language === "ar" ? "أكلات نتجنبها/نحد منها" : "Foods to avoid or limit"}
                className="min-h-[84px]"
              />
              <Textarea
                value={listToCsv(draft.settings.profile.disabledFoodNames)}
                onChange={(e) => updateProfileList("disabledFoodNames", e.target.value)}
                placeholder={language === "ar" ? "أكلات ممنوعة تماما لهذا العميل" : "Foods fully blocked for this client"}
                className="min-h-[84px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Textarea
                value={listToCsv(draft.settings.profile.preferredReadyMealTags)}
                onChange={(e) => updateProfileList("preferredReadyMealTags", e.target.value)}
                placeholder={language === "ar" ? "تصنيفات وجبات نفضّل ترشيحها" : "Preferred recommendation tags"}
                className="min-h-[76px]"
              />
              <Textarea
                value={draft.settings.profile.emergencyAdviceAr || ""}
                onChange={(e) => setDraft({
                  ...draft,
                  settings: {
                    ...draft.settings,
                    profile: { ...draft.settings.profile, emergencyAdviceAr: e.target.value },
                  },
                })}
                placeholder={language === "ar" ? "تنبيه عربي: لو حصل كذا، يعمل إيه؟" : "Arabic emergency action advice"}
                className="min-h-[76px]"
              />
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">{language === "ar" ? "حدود التغذية" : "Nutrition Limits"}</h2>
            </div>

            <p className="text-sm text-muted-foreground">{language === "ar" ? "حدد الحدود اليومية والحدود لكل وجبة لتقييم المخاطر وإعطاء تنبيهات للعميل." : "Set daily and per-meal limits used for risk scoring and client alerts."}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">{language === "ar" ? "الحد اليومي" : "Daily limits"}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder={language === "ar" ? "سعرات (kcal)" : "Calories (kcal)"} value={draft.settings.nutritionLimits.daily.calories ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, daily: { ...draft.settings.nutritionLimits.daily, calories: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "بروتين (g)" : "Protein (g)"} value={draft.settings.nutritionLimits.daily.protein ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, daily: { ...draft.settings.nutritionLimits.daily, protein: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "كربوهيدرات (g)" : "Carbs (g)"} value={draft.settings.nutritionLimits.daily.carbs ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, daily: { ...draft.settings.nutritionLimits.daily, carbs: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "دهون (g)" : "Fat (g)"} value={draft.settings.nutritionLimits.daily.fat ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, daily: { ...draft.settings.nutritionLimits.daily, fat: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "ألياف (g)" : "Fiber (g)"} value={draft.settings.nutritionLimits.daily.fiber ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, daily: { ...draft.settings.nutritionLimits.daily, fiber: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "سكر (g)" : "Sugar (g)"} value={draft.settings.nutritionLimits.daily.sugar ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, daily: { ...draft.settings.nutritionLimits.daily, sugar: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "صوديوم (mg)" : "Sodium (mg)"} value={draft.settings.nutritionLimits.daily.sodium ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, daily: { ...draft.settings.nutritionLimits.daily, sodium: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "كوليسترول (mg)" : "Cholesterol (mg)"} value={draft.settings.nutritionLimits.daily.cholesterol ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, daily: { ...draft.settings.nutritionLimits.daily, cholesterol: e.target.value ? Number(e.target.value) : null } } } })} />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">{language === "ar" ? "الحد لكل وجبة" : "Per-meal limits"}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder={language === "ar" ? "سعرات (kcal)" : "Calories (kcal)"} value={draft.settings.nutritionLimits.perMeal.calories ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, perMeal: { ...draft.settings.nutritionLimits.perMeal, calories: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "بروتين (g)" : "Protein (g)"} value={draft.settings.nutritionLimits.perMeal.protein ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, perMeal: { ...draft.settings.nutritionLimits.perMeal, protein: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "كربوهيدرات (g)" : "Carbs (g)"} value={draft.settings.nutritionLimits.perMeal.carbs ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, perMeal: { ...draft.settings.nutritionLimits.perMeal, carbs: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "دهون (g)" : "Fat (g)"} value={draft.settings.nutritionLimits.perMeal.fat ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, perMeal: { ...draft.settings.nutritionLimits.perMeal, fat: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "ألياف (g)" : "Fiber (g)"} value={draft.settings.nutritionLimits.perMeal.fiber ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, perMeal: { ...draft.settings.nutritionLimits.perMeal, fiber: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "سكر (g)" : "Sugar (g)"} value={draft.settings.nutritionLimits.perMeal.sugar ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, perMeal: { ...draft.settings.nutritionLimits.perMeal, sugar: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "صوديوم (mg)" : "Sodium (mg)"} value={draft.settings.nutritionLimits.perMeal.sodium ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, perMeal: { ...draft.settings.nutritionLimits.perMeal, sodium: e.target.value ? Number(e.target.value) : null } } } })} />
                  <Input type="number" placeholder={language === "ar" ? "كوليسترول (mg)" : "Cholesterol (mg)"} value={draft.settings.nutritionLimits.perMeal.cholesterol ?? ""} onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, nutritionLimits: { ...draft.settings.nutritionLimits, perMeal: { ...draft.settings.nutritionLimits.perMeal, cholesterol: e.target.value ? Number(e.target.value) : null } } } })} />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <button
              type="button"
              onClick={() => setShowFormulas((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 hover:bg-muted/45 transition-colors"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Calculator className="w-4 h-4 text-primary" />
                {language === "ar" ? "المعادلات" : "Formula Assignment"}
              </span>
              {showFormulas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showFormulas && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {language === "ar"
                    ? "اختار المعادلات المتاحة لهذا العميل وحدد المعادلة الفعالة التي ستطبق في صفحة BMI والماكروز."
                    : "Select available formulas for this client, then set the active one used in BMI/macros."}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(draft.formulasCatalog || []).map((preset) => {
                    const enabled = draft.settings.formulas.enabledFormulaKeys.includes(preset.key);
                    const active = draft.settings.formulas.activeFormulaKey === preset.key;
                    return (
                      <div
                        key={preset.key}
                        className={`rounded-xl border p-4 space-y-2 ${active ? "border-primary bg-primary/10" : "border-border bg-background/60"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">
                              {language === "ar" ? preset.labelAr : preset.labelEn}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {language === "ar" ? preset.descriptionAr : preset.descriptionEn}
                            </p>
                            <p className="text-xs text-primary/85 mt-2 font-mono">
                              {getFormulaEquationPreview(preset, language === "ar" ? "ar" : "en")}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => toggleFormulaEnabled(preset.key)}
                            className="mt-1 h-4 w-4"
                            title={language === "ar" ? "تفعيل/تعطيل" : "Enable/disable"}
                          />
                        </div>

                        <Separator />

                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="radio"
                            name="active-formula"
                            title={language === "ar" ? "تعيين المعادلة الفعالة" : "Set active formula"}
                            checked={active}
                            onChange={() => setActiveFormula(preset.key)}
                          />
                          {language === "ar" ? "المعادلة الفعالة للعميل" : "Active client formula"}
                        </label>

                        {(language === "ar" ? preset.noteAr : preset.noteEn) && (
                          <p className="text-xs text-primary/90">
                            {language === "ar" ? preset.noteAr : preset.noteEn}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    {language === "ar" ? "إظهار المعادلات خطوة بخطوة للعميل" : "Show step-by-step equations to client"}
                  </span>
                  <input
                    type="checkbox"
                    title={language === "ar" ? "إظهار المعادلات خطوة بخطوة" : "Show equations step by step"}
                    checked={Boolean(draft.settings.formulas.showEquationSteps)}
                    onChange={(e) => setDraft({
                      ...draft,
                      settings: {
                        ...draft.settings,
                        formulas: {
                          ...draft.settings.formulas,
                          showEquationSteps: e.target.checked,
                        },
                      },
                    })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1" size="lg">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {language === "ar" ? "حفظ كل التعديلات" : "Save All Changes"}
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="flex-1" size="lg">
              {language === "ar" ? "إعادة تحميل" : "Reload"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
