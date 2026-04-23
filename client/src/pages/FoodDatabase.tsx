import { useMemo, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateMeal } from "@/hooks/useNutrition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Apple,
  Beef,
  Milk,
  Wheat,
  Nut,
  Bean,
  Droplet,
  Candy,
  CupSoda,
  Carrot,
  ChevronDown,
  ChevronUp,
  Scale,
  X,
  BarChart3,
  Sparkles,
  Plus,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  HeartPulse,
  Baby,
  UtensilsCrossed,
} from "lucide-react";
import {
  foodCategories,
  searchFoods,
  calculateNutrition,
  assessFoodForProfile,
  type FoodItem,
  type FoodPersonalizationProfile,
  type FoodConditionStatus,
} from "@shared/food-nutrition";
import type { ClientPersonalizationSettings } from "@shared/personalization-config";
import { getLast7Days } from "@/lib/dateUtils";
import { average, normalizeMetricSeries, type MetricRecord } from "@/lib/metric-insights";

const categoryIcons: Record<string, any> = {
  dairy: Milk,
  fruit: Apple,
  vegetable: Carrot,
  grain: Wheat,
  protein: Beef,
  nut: Nut,
  legume: Bean,
  oil: Droplet,
  sweet: Candy,
  beverage: CupSoda,
};

const categoryKeys: Record<string, string> = {
  dairy: "dairy",
  fruit: "fruits",
  vegetable: "vegetables",
  grain: "grains",
  protein: "proteins",
  nut: "nuts",
  legume: "legumes",
  oil: "oils",
  sweet: "sweets",
  beverage: "beverages",
};

type MealTypeOption = "breakfast" | "lunch" | "dinner" | "snacks";
type DiscoveryFilter = "all" | "safe" | "ready" | "kids";

type GoalRecord = {
  goalType?: string | null;
  createdAt?: string;
};

type PersonalSignals = {
  primaryGoal: string | null;
  avgGlucose: number | null;
  avgSystolic: number | null;
};

type DietaryPreferenceResponse = {
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  nutAllergy?: boolean;
  shellFishAllergy?: boolean;
  otherAllergies?: string | null;
  dietType?: string | null;
};

type MedicalInfoResponse = {
  allergies?: string | null;
  conditions?: string | null;
};

type FoodCustomizationResponse = {
  settings?: ClientPersonalizationSettings;
  preferences?: DietaryPreferenceResponse;
  medical?: MedicalInfoResponse;
};

type FoodFit = {
  score: number;
  tone: "good" | "neutral" | "caution" | "avoid";
  summaryEn: string;
  summaryAr: string;
  suggestedMealType: MealTypeOption;
  recommendation: FoodConditionStatus;
  warningsEn: string[];
  warningsAr: string[];
  actionsEn: string[];
  actionsAr: string[];
  matchedAllergens: string[];
  matchedFavorites: string[];
};

const GOAL_PRIORITY = ["manage_condition", "lose_weight", "gain_muscle", "maintain", "eat_healthy"];

function clampScore(value: number): number {
  return Math.max(12, Math.min(99, Math.round(value)));
}

function parseDelimitedList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickPrimaryGoal(goals: GoalRecord[]): string | null {
  if (!goals || goals.length === 0) return null;

  const sorted = [...goals].sort((a, b) => {
    const aGoal = String(a.goalType || "");
    const bGoal = String(b.goalType || "");
    const aIdx = GOAL_PRIORITY.indexOf(aGoal);
    const bIdx = GOAL_PRIORITY.indexOf(bGoal);
    const safeA = aIdx === -1 ? 999 : aIdx;
    const safeB = bIdx === -1 ? 999 : bIdx;
    if (safeA !== safeB) return safeA - safeB;

    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });

  return sorted[0]?.goalType ? String(sorted[0].goalType) : null;
}

function goalLabel(goalType: string | null, language: string): string {
  switch (goalType) {
    case "lose_weight":
      return language === "ar" ? "خسارة وزن" : "Weight loss";
    case "gain_muscle":
      return language === "ar" ? "بناء عضلات" : "Muscle gain";
    case "maintain":
      return language === "ar" ? "ثبات الوزن" : "Weight maintenance";
    case "eat_healthy":
      return language === "ar" ? "أكل صحي" : "Healthy eating";
    case "manage_condition":
      return language === "ar" ? "إدارة الحالة الصحية" : "Condition management";
    default:
      return language === "ar" ? "توازن عام" : "General balance";
  }
}

function suggestedMealType(calories: number, protein: number): MealTypeOption {
  const hour = new Date().getHours();

  if (calories <= 180 && protein < 10) {
    return "snacks";
  }
  if (hour < 11) {
    return "breakfast";
  }
  if (hour < 17) {
    return "lunch";
  }
  if (protein >= 20 || calories >= 300) {
    return "dinner";
  }

  return "snacks";
}

function evaluateGoalFit(food: FoodItem, signals: PersonalSignals): Omit<FoodFit, "recommendation" | "warningsEn" | "warningsAr" | "actionsEn" | "actionsAr" | "matchedAllergens" | "matchedFavorites"> {
  const nutrition = calculateNutrition(food, food.defaultServingUnit, 1);
  let score = 58;
  const reasonsEn: string[] = [];
  const reasonsAr: string[] = [];

  const pushReason = (en: string, ar: string) => {
    if (reasonsEn.length < 2) {
      reasonsEn.push(en);
      reasonsAr.push(ar);
    }
  };

  const goal = signals.primaryGoal || "maintain";

  if (goal === "lose_weight") {
    if (nutrition.caloricValue <= 220) {
      score += 14;
      pushReason("Lower-calorie serving supports weight loss.", "السعرات الأقل تدعم هدف خسارة الوزن.");
    } else if (nutrition.caloricValue >= 350) {
      score -= 12;
      pushReason("Higher calories may slow weekly weight loss.", "السعرات العالية قد تبطئ خسارة الوزن الأسبوعية.");
    }

    if (nutrition.protein >= 14) {
      score += 10;
      pushReason("Protein level helps satiety.", "مستوى البروتين يساعد على الشبع.");
    }
  }

  if (goal === "gain_muscle") {
    if (nutrition.protein >= 18) {
      score += 14;
      pushReason("High protein supports muscle building.", "البروتين العالي يدعم بناء العضلات.");
    } else if (nutrition.protein < 10) {
      score -= 8;
      pushReason("Protein is relatively low for muscle gain.", "البروتين منخفض نسبيًا لهدف بناء العضلات.");
    }

    if (nutrition.caloricValue >= 250) {
      score += 6;
    }
  }

  if (goal === "eat_healthy") {
    if (nutrition.fiber >= 4) {
      score += 10;
      pushReason("Good fiber content for daily quality.", "الألياف جيدة لتحسين جودة الأكل اليومية.");
    }
    if (nutrition.sugar <= 10) {
      score += 6;
    }
    if (nutrition.nutritionDensity >= 15) {
      score += 6;
    }
  }

  if (goal === "manage_condition") {
    if (nutrition.sugar <= 8) {
      score += 8;
      pushReason("Lower sugar fits condition-focused planning.", "السكر الأقل مناسب للتخطيط المرتبط بالحالة الصحية.");
    }
    if (nutrition.sodium <= 150) {
      score += 8;
      pushReason("Lower sodium is generally safer for pressure control.", "الصوديوم الأقل عادة أفضل للتحكم في الضغط.");
    }
  }

  if (signals.avgGlucose != null && signals.avgGlucose > 110) {
    if (nutrition.sugar <= 8) {
      score += 8;
      pushReason("Aligned with elevated glucose trend.", "متوافق مع اتجاه ارتفاع السكر.");
    } else if (nutrition.sugar >= 12) {
      score -= 10;
      pushReason("Sugar is high for current glucose pattern.", "السكر مرتفع مقارنة بنمط السكر الحالي.");
    }
    if (nutrition.fiber >= 3) {
      score += 4;
    }
  }

  if (signals.avgSystolic != null && signals.avgSystolic >= 130) {
    if (nutrition.sodium <= 150) {
      score += 8;
      pushReason("Supports blood pressure-friendly choices.", "يدعم اختيارات مناسبة لضغط الدم.");
    } else if (nutrition.sodium >= 350) {
      score -= 10;
      pushReason("Sodium is high for your current pressure trend.", "الصوديوم مرتفع مقارنة باتجاه الضغط الحالي.");
    }
  }

  if (nutrition.nutritionDensity >= 15) {
    score += 4;
  }

  const finalScore = clampScore(score);

  return {
    score: finalScore,
    tone: finalScore >= 75 ? "good" : finalScore >= 55 ? "neutral" : "caution",
    summaryEn: reasonsEn[0] || "Balanced choice for your current profile.",
    summaryAr: reasonsAr[0] || "اختيار متوازن مع ملفك الصحي الحالي.",
    suggestedMealType: (food.mealTypes?.[0] as MealTypeOption) || suggestedMealType(nutrition.caloricValue, nutrition.protein),
  };
}

function buildFoodFit(food: FoodItem, signals: PersonalSignals, profile: FoodPersonalizationProfile): FoodFit {
  const goalFit = evaluateGoalFit(food, signals);
  const personalization = assessFoodForProfile(food, profile);
  const score = clampScore(goalFit.score + personalization.scoreDelta);

  let tone: FoodFit["tone"] = goalFit.tone;
  if (personalization.status === "avoid") {
    tone = "avoid";
  } else if (personalization.status === "limit") {
    tone = "caution";
  } else if (score >= 80) {
    tone = "good";
  } else if (score >= 58) {
    tone = "neutral";
  } else {
    tone = "caution";
  }

  return {
    score,
    tone,
    summaryEn: personalization.highlightEn || goalFit.summaryEn,
    summaryAr: personalization.highlightAr || goalFit.summaryAr,
    suggestedMealType: (food.mealTypes?.[0] as MealTypeOption) || goalFit.suggestedMealType,
    recommendation: personalization.status,
    warningsEn: personalization.warningsEn,
    warningsAr: personalization.warningsAr,
    actionsEn: personalization.actionsEn,
    actionsAr: personalization.actionsAr,
    matchedAllergens: personalization.matchedAllergens,
    matchedFavorites: personalization.matchedFavorites,
  };
}

function applyAdminFoodControls(
  food: FoodItem,
  fit: FoodFit,
  profileSettings: ClientPersonalizationSettings["profile"] | undefined,
  isChild: boolean,
): FoodFit {
  if (!profileSettings) return fit;

  const lowerName = food.name.trim().toLowerCase();
  const lowerNameAr = food.nameAr.trim().toLowerCase();
  const hasBlockedName = (profileSettings.disabledFoodNames || []).some((item) => {
    const token = item.trim().toLowerCase();
    return token && (lowerName.includes(token) || lowerNameAr.includes(token));
  });

  const hasAvoidName = (profileSettings.avoidFoods || []).some((item) => {
    const token = item.trim().toLowerCase();
    return token && (lowerName.includes(token) || lowerNameAr.includes(token));
  });

  const preferredTagHit = (profileSettings.preferredReadyMealTags || []).some((tag) => {
    const token = tag.trim().toLowerCase();
    return token && (food.tags || []).some((foodTag) => foodTag.toLowerCase().includes(token));
  });

  const next: FoodFit = {
    ...fit,
    warningsEn: [...fit.warningsEn],
    warningsAr: [...fit.warningsAr],
    actionsEn: [...fit.actionsEn],
    actionsAr: [...fit.actionsAr],
  };

  if (hasBlockedName) {
    next.score = clampScore(8);
    next.tone = "avoid";
    next.recommendation = "avoid";
    next.summaryEn = "Blocked by admin customization for this specific client.";
    next.summaryAr = "تم حظره من إعدادات الأدمن لهذا العميل.";
    next.warningsEn.unshift("This item is blocked by your care admin and should not be added.");
    next.warningsAr.unshift("هذا العنصر محظور من الأدمن المسؤول عن متابعتك ولا يجب إضافته.");
    if (profileSettings.emergencyAdviceEn) next.actionsEn.unshift(profileSettings.emergencyAdviceEn);
    if (profileSettings.emergencyAdviceAr) next.actionsAr.unshift(profileSettings.emergencyAdviceAr);
    return next;
  }

  if (hasAvoidName) {
    next.score = clampScore(next.score - 22);
    next.recommendation = next.recommendation === "avoid" ? "avoid" : "limit";
    if (next.tone !== "avoid") {
      next.tone = "caution";
    }
    next.warningsEn.unshift("Marked by admin to avoid or keep as a rare meal.");
    next.warningsAr.unshift("محدد من الأدمن كوجبة تُتجنب أو تُستخدم نادرًا.");
    next.actionsEn.unshift("If chosen, use a smaller portion and follow your care plan alerts.");
    next.actionsAr.unshift("إذا تم اختيارها، استخدم حصة أصغر واتبع تنبيهات الخطة العلاجية.");
  }

  if (preferredTagHit && next.recommendation !== "avoid") {
    next.score = clampScore(next.score + 8);
    if (next.score >= 78 && next.tone !== "caution") {
      next.tone = "good";
    }
  }

  if (isChild && profileSettings.kidFriendlyFocus && food.childFriendly && food.healthyForKids && next.recommendation !== "avoid") {
    next.score = clampScore(next.score + 6);
  }

  return next;
}

function fitToneClass(tone: FoodFit["tone"]) {
  if (tone === "good") {
    return {
      badge: "text-emerald-700 bg-emerald-500/15 dark:text-emerald-200",
      text: "text-emerald-700 dark:text-emerald-200",
      panel: "bg-emerald-500/10 border-emerald-500/25",
    };
  }
  if (tone === "neutral") {
    return {
      badge: "text-sky-700 bg-sky-500/15 dark:text-sky-200",
      text: "text-sky-700 dark:text-sky-200",
      panel: "bg-sky-500/10 border-sky-500/25",
    };
  }
  if (tone === "avoid") {
    return {
      badge: "text-rose-700 bg-rose-500/15 dark:text-rose-200",
      text: "text-rose-700 dark:text-rose-200",
      panel: "bg-rose-500/10 border-rose-500/25",
    };
  }
  return {
    badge: "text-amber-700 bg-amber-500/15 dark:text-amber-200",
    text: "text-amber-700 dark:text-amber-200",
    panel: "bg-amber-500/10 border-amber-500/25",
  };
}

function NutrientBar({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}{unit}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FoodDetailPanel({
  food,
  onClose,
  fit,
  t,
  language,
}: {
  food: FoodItem;
  onClose: () => void;
  fit: FoodFit;
  t: (key: any) => string;
  language: string;
}) {
  const [selectedUnit, setSelectedUnit] = useState(food.defaultServingUnit);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [selectedMealType, setSelectedMealType] = useState<MealTypeOption>(fit.suggestedMealType);
  const createMeal = useCreateMeal();
  const fitTone = fitToneClass(fit.tone);

  const nutrition = useMemo(
    () => calculateNutrition(food, selectedUnit, quantity),
    [food, selectedUnit, quantity],
  );

  const handleQuantityChange = (val: string) => {
    setQuantityInput(val);
    const num = parseFloat(val);
    if (!Number.isNaN(num) && num > 0) {
      setQuantity(num);
    }
  };

  const handleAddMeal = () => {
    const safeQuantity = quantity > 0 ? quantity : 1;

    createMeal.mutate(
      {
        name: food.name,
        mealType: selectedMealType,
        description:
          language === "ar"
            ? `${food.readyMeal ? "وجبة جاهزة" : "من قاعدة الأغذية"}: ${safeQuantity} ${selectedUnit}`
            : `${food.readyMeal ? "Ready meal" : "From food database"}: ${safeQuantity} ${selectedUnit}`,
        date: new Date(),
        calories: nutrition.caloricValue,
        protein: nutrition.protein,
        carbs: nutrition.carbohydrates,
        fat: nutrition.fat,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  const displayName = language === "ar" ? food.nameAr : food.name;
  const warningList = language === "ar" ? fit.warningsAr : fit.warningsEn;
  const actionList = language === "ar" ? fit.actionsAr : fit.actionsEn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 end-4 z-10 rounded-full bg-background/80 p-2 hover:bg-muted transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-56 overflow-hidden">
          <img src={food.image} alt={displayName} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 start-0 end-0 p-6 text-white">
            <div className="flex flex-wrap gap-2 mb-3">
              {food.readyMeal && <Badge className="bg-white/20 text-white border-transparent">{language === "ar" ? "وجبة جاهزة" : "Ready meal"}</Badge>}
              {food.childFriendly && <Badge className="bg-white/20 text-white border-transparent">{language === "ar" ? "مناسب للأطفال" : "Kid-friendly"}</Badge>}
              {fit.matchedAllergens.length > 0 && <Badge className="bg-rose-500/85 text-white border-transparent">{language === "ar" ? "تحذير حساسية" : "Allergy alert"}</Badge>}
            </div>
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="text-sm text-white/80 mt-1">
              {language === "ar" ? food.nameAr : food.name}
              {language !== "ar" && food.nameAr !== food.name && ` - ${food.nameAr}`}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className={`glass-card p-4 mb-4 border ${fitTone.panel}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {language === "ar" ? "الملاءمة الحالية" : "Current personal fit"}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${fitTone.badge}`}>
                {language === "ar" ? `ملاءمة ${fit.score}%` : `Fit ${fit.score}%`}
              </span>
            </div>
            <p className={`text-sm mt-2 ${fitTone.text}`}>{language === "ar" ? fit.summaryAr : fit.summaryEn}</p>
          </div>

          {warningList.length > 0 && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 mb-4">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                {language === "ar" ? "تنبيهات مهمة" : "Important alerts"}
              </p>
              <ul className="mt-2 space-y-2 text-sm text-rose-800 dark:text-rose-100">
                {warningList.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {actionList.length > 0 && (
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 mb-4">
              <p className="text-sm font-semibold text-sky-700 dark:text-sky-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {language === "ar" ? "ماذا تفعل لو اخترتها" : "What to do if you choose it"}
              </p>
              <ul className="mt-2 space-y-2 text-sm text-sky-800 dark:text-sky-100">
                {actionList.map((action) => (
                  <li key={action}>• {action}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="glass-card p-4 mb-4 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{t("servingSize")}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                {food.servingUnits.map((u) => (
                  <option key={u.unit} value={u.unit}>
                    {language === "ar" ? u.unitAr : u.unit} ({u.weightInGrams}g)
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0.1"
                step="any"
                value={quantityInput}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full md:w-28 rounded-xl border border-input bg-background/80 px-3 py-2 text-sm font-bold text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                placeholder={t("quantity")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <select
                value={selectedMealType}
                onChange={(e) => setSelectedMealType(e.target.value as MealTypeOption)}
                className="w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                {["breakfast", "lunch", "dinner", "snacks"].map((type) => (
                  <option key={type} value={type}>
                    {t(type as any)}
                  </option>
                ))}
              </select>

              <Button type="button" onClick={handleAddMeal} disabled={createMeal.isPending}>
                {createMeal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {language === "ar" ? "إضافة كوجبة اليوم" : "Add to today's meals"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              {t("totalCalories")}: <span className="font-bold text-foreground">{nutrition.caloricValue} {t("kcal")}</span>
              {" | "}
              {nutrition.totalWeight}g
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              {t("macronutrients")}
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <NutrientBar label={t("calories")} value={nutrition.caloricValue} max={500} unit=" kcal" color="bg-orange-500" />
              <NutrientBar label={t("protein")} value={nutrition.protein} max={50} unit="g" color="bg-red-500" />
              <NutrientBar label={t("carbs")} value={nutrition.carbohydrates} max={100} unit="g" color="bg-blue-500" />
              <NutrientBar label={t("fats")} value={nutrition.fat} max={50} unit="g" color="bg-amber-500" />
              <NutrientBar label={t("fiber")} value={nutrition.fiber} max={15} unit="g" color="bg-green-500" />
              <NutrientBar label={t("sugar")} value={nutrition.sugar} max={30} unit="g" color="bg-pink-500" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3">{language === "ar" ? "الفيتامينات والمعادن" : "Vitamins & minerals"}</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <NutrientBar label={t("vitaminA")} value={nutrition.vitaminA} max={1} unit=" mg" color="bg-orange-400" />
              <NutrientBar label={t("vitaminC")} value={nutrition.vitaminC} max={100} unit=" mg" color="bg-yellow-500" />
              <NutrientBar label={t("calcium")} value={nutrition.calcium} max={500} unit=" mg" color="bg-slate-500" />
              <NutrientBar label={t("iron")} value={nutrition.iron} max={10} unit=" mg" color="bg-red-700" />
              <NutrientBar label={t("sodium")} value={nutrition.sodium} max={500} unit=" mg" color="bg-orange-600" />
              <NutrientBar label={t("cholesterol")} value={nutrition.cholesterol} max={300} unit=" mg" color="bg-red-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FoodCard({
  food,
  fit,
  onClick,
  language,
}: {
  food: FoodItem;
  fit: FoodFit;
  onClick: () => void;
  language: string;
}) {
  const displayName = language === "ar" ? food.nameAr : food.name;
  const defaultNutrition = calculateNutrition(food, food.defaultServingUnit, 1);
  const defaultUnit = food.servingUnits.find((u) => u.unit === food.defaultServingUnit);
  const unitLabel = language === "ar" && defaultUnit ? defaultUnit.unitAr : food.defaultServingUnit;
  const fitTone = fitToneClass(fit.tone);

  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card overflow-hidden text-start hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 group w-full"
    >
      <div className="relative h-40 overflow-hidden">
        <img src={food.image} alt={displayName} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute top-3 start-3 flex flex-wrap gap-2">
          {food.readyMeal && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-900">{language === "ar" ? "جاهزة" : "Ready"}</span>}
          {food.childFriendly && <span className="rounded-full bg-emerald-400/90 px-2.5 py-1 text-[11px] font-semibold text-slate-950">{language === "ar" ? "أطفال" : "Kids"}</span>}
        </div>
        <div className="absolute bottom-3 start-3 end-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-white truncate">{displayName}</h3>
            <p className="text-[11px] text-white/80">
              1 {unitLabel} = {defaultUnit?.weightInGrams || 100}g
            </p>
          </div>
          <span className={`text-[10px] px-2 py-1 rounded-full font-semibold whitespace-nowrap ${fitTone.badge}`}>
            {language === "ar" ? `ملاءمة ${fit.score}%` : `Fit ${fit.score}%`}
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className={`text-[12px] mb-3 ${fitTone.text}`}>
          {language === "ar" ? fit.summaryAr : fit.summaryEn}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {fit.matchedAllergens.length > 0 && (
            <span className="rounded-full bg-rose-500/12 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-200">
              {language === "ar" ? "تحذير حساسية" : "Allergy warning"}
            </span>
          )}
          {fit.matchedFavorites.length > 0 && (
            <span className="rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-200">
              {language === "ar" ? "من مفضلاتك" : "Matches your favorites"}
            </span>
          )}
          {fit.recommendation === "limit" && (
            <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-200">
              {language === "ar" ? "بحصة محددة" : "Portion watch"}
            </span>
          )}
          {fit.recommendation === "avoid" && (
            <span className="rounded-full bg-rose-500/12 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-200">
              {language === "ar" ? "يُفضّل تجنبه" : "Better avoid"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-orange-500 font-medium">{defaultNutrition.caloricValue} kcal</span>
          <span className="text-red-500">P: {defaultNutrition.protein}g</span>
          <span className="text-blue-500">C: {defaultNutrition.carbohydrates}g</span>
          <span className="text-amber-500">F: {defaultNutrition.fat}g</span>
        </div>
      </div>
    </button>
  );
}

function FoodSection({
  title,
  description,
  items,
  onPick,
  language,
}: {
  title: string;
  description: string;
  items: Array<{ food: FoodItem; fit: FoodFit }>;
  onPick: (food: FoodItem) => void;
  language: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-xs rounded-full bg-primary/10 px-3 py-1 text-primary font-semibold">
          {language === "ar" ? `${items.length} اقتراح` : `${items.length} picks`}
        </span>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ food, fit }) => (
          <FoodCard
            key={`${food.name}-section`}
            food={food}
            fit={fit}
            onClick={() => onPick(food)}
            language={language}
          />
        ))}
      </div>
    </section>
  );
}

export default function FoodDatabase() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [smartSort, setSmartSort] = useState(true);
  const [discoveryFilter, setDiscoveryFilter] = useState<DiscoveryFilter>("all");

  const { data: goals = [] } = useQuery<GoalRecord[]>({
    queryKey: ["food-db-goals-context"],
    queryFn: async () => {
      const response = await fetch("/api/goals", { credentials: "include" });
      return response.ok ? response.json() : [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: recentMetrics = [] } = useQuery<MetricRecord[]>({
    queryKey: ["food-db-health-context-7d", getLast7Days()[0]],
    queryFn: async () => {
      const dates = getLast7Days();
      const results = await Promise.all(
        dates.map((date) =>
          fetch(`/api/health/metrics?date=${date}`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
        ),
      );
      return results.flat();
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: preferences = {} } = useQuery<DietaryPreferenceResponse>({
    queryKey: ["food-db-preferences"],
    queryFn: async () => {
      const response = await fetch("/api/users/preferences", { credentials: "include" });
      return response.ok ? response.json() : {};
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: medicalInfo = {} } = useQuery<MedicalInfoResponse>({
    queryKey: ["food-db-medical-info"],
    queryFn: async () => {
      const response = await fetch("/api/emergency/medical-info", { credentials: "include" });
      return response.ok ? response.json() : {};
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: customization = {} } = useQuery<FoodCustomizationResponse>({
    queryKey: ["food-db-customization"],
    queryFn: async () => {
      const response = await fetch("/api/profile/customization", { credentials: "include" });
      return response.ok ? response.json() : {};
    },
    staleTime: 10 * 60 * 1000,
  });
  const settingsProfile = customization.settings?.profile;

  const personalizationProfile = useMemo<FoodPersonalizationProfile>(() => {
    const ageFromUser = typeof user?.age === "number" ? user.age : undefined;
    const ageResolved = ageFromUser ?? null;
    const useKidsFavorites = ageResolved != null && ageResolved > 0 && ageResolved <= 12;
    const favoriteFoodsFromSettings = useKidsFavorites
      ? settingsProfile?.favoriteFoodsKids || []
      : settingsProfile?.favoriteFoodsAdult || [];
    const favoriteFoods = favoriteFoodsFromSettings.length
      ? favoriteFoodsFromSettings
      : [];
    const allergies = [
      ...(settingsProfile?.allergies || []),
      ...parseDelimitedList(medicalInfo.allergies),
      ...parseDelimitedList(preferences.otherAllergies),
      preferences.nutAllergy ? "nut allergy" : "",
      preferences.shellFishAllergy ? "shellfish allergy" : "",
      preferences.dairyFree ? "dairy" : "",
      preferences.glutenFree ? "gluten" : "",
    ].filter(Boolean);

    return {
      age: ageResolved,
      allergies,
      conditions: settingsProfile?.conditions?.length
        ? settingsProfile.conditions
        : parseDelimitedList(medicalInfo.conditions),
      favoriteFoods,
      vegetarian: Boolean(preferences.vegetarian),
      vegan: Boolean(preferences.vegan),
      glutenFree: Boolean(preferences.glutenFree),
      dairyFree: Boolean(preferences.dairyFree),
      nutAllergy: Boolean(preferences.nutAllergy),
      shellFishAllergy: Boolean(preferences.shellFishAllergy),
      dietType: settingsProfile?.dietType || preferences.dietType || "balanced",
    };
  }, [settingsProfile, medicalInfo.allergies, medicalInfo.conditions, preferences, user?.age]);

  const personalSignals = useMemo<PersonalSignals>(() => {
    const series = normalizeMetricSeries(recentMetrics);
    const fallbackGoal = Array.isArray((user as any)?.goals) && (user as any).goals.length > 0
      ? String((user as any).goals[0])
      : null;

    return {
      primaryGoal: pickPrimaryGoal(goals) || fallbackGoal,
      avgGlucose: average(series.glucose),
      avgSystolic: average(series.systolic),
    };
  }, [goals, recentMetrics, user]);

  const filteredFoods = useMemo(() => {
    return searchFoods(searchQuery, selectedCategory === "all" ? undefined : selectedCategory);
  }, [searchQuery, selectedCategory]);

  const foodsWithFit = useMemo(() => {
    const isChildProfile = Number(personalizationProfile.age || 0) > 0 && Number(personalizationProfile.age || 0) <= 12;
    return filteredFoods.map((food) => ({
      food,
      fit: applyAdminFoodControls(
        food,
        buildFoodFit(food, personalSignals, personalizationProfile),
        settingsProfile,
        isChildProfile,
      ),
    }));
  }, [filteredFoods, personalSignals, personalizationProfile, settingsProfile]);

  const rankedFoods = useMemo(() => {
    if (!smartSort) return foodsWithFit;
    return [...foodsWithFit].sort((a, b) => b.fit.score - a.fit.score);
  }, [foodsWithFit, smartSort]);

  const discoveryFoods = useMemo(() => {
    return rankedFoods.filter(({ food, fit }) => {
      if (discoveryFilter === "safe") return fit.recommendation !== "avoid";
      if (discoveryFilter === "ready") return food.readyMeal;
      if (discoveryFilter === "kids") return food.childFriendly && food.healthyForKids;
      return true;
    });
  }, [discoveryFilter, rankedFoods]);

  const readyMeals = useMemo(
    () => rankedFoods.filter(({ food }) => food.readyMeal).slice(0, 6),
    [rankedFoods],
  );

  const kidFoods = useMemo(
    () => rankedFoods.filter(({ food }) => food.childFriendly && food.healthyForKids).slice(0, 6),
    [rankedFoods],
  );

  const selectedFoodFit = useMemo(() => {
    if (!selectedFood) return null;
    const found = foodsWithFit.find((entry) => entry.food.name === selectedFood.name);
    return found?.fit || buildFoodFit(selectedFood, personalSignals, personalizationProfile);
  }, [selectedFood, foodsWithFit, personalSignals, personalizationProfile]);

  const contextSummary = useMemo(() => {
    const goalText = goalLabel(personalSignals.primaryGoal, language);
    const glucoseText = personalSignals.avgGlucose != null
      ? (language === "ar"
        ? `متوسط الجلوكوز 7 أيام: ${personalSignals.avgGlucose.toFixed(0)} ملجم/ديسيلتر`
        : `7-day avg glucose: ${personalSignals.avgGlucose.toFixed(0)} mg/dL`)
      : null;
    const pressureText = personalSignals.avgSystolic != null
      ? (language === "ar"
        ? `متوسط الضغط الانقباضي: ${personalSignals.avgSystolic.toFixed(0)} ملم زئبق`
        : `Avg systolic BP: ${personalSignals.avgSystolic.toFixed(0)} mmHg`)
      : null;

    return {
      goalText,
      glucoseText,
      pressureText,
    };
  }, [personalSignals, language]);

  const visibleCategories = showAllCategories
    ? [{ id: "all", name: "All", nameAr: "الكل", icon: "" }, ...foodCategories]
    : [{ id: "all", name: "All", nameAr: "الكل", icon: "" }, ...foodCategories.slice(0, 5)];

  const activeAllergies = personalizationProfile.allergies || [];
  const activeConditions = personalizationProfile.conditions || [];
  const isChild = Number(personalizationProfile.age || 0) > 0 && Number(personalizationProfile.age || 0) <= 12;

  const filterOptions: Array<{ value: DiscoveryFilter; labelEn: string; labelAr: string }> = [
    { value: "all", labelEn: "All picks", labelAr: "كل الاقتراحات" },
    { value: "safe", labelEn: "Safer picks", labelAr: "اختيارات أنسب" },
    { value: "ready", labelEn: "Ready meals", labelAr: "وجبات جاهزة" },
    { value: "kids", labelEn: "Healthy kids", labelAr: "أكل أطفال صحي" },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
          {t("foodDatabase")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "ar"
            ? "اكتشف أطعمة وصور ووجبات جاهزة مصنفة حسب هدفك، الحساسية، الحالة الصحية، والعمر مع تنبيهات عملية واضحة."
            : "Browse foods, visuals, and ready meals ranked by your goal, allergies, health conditions, and age with clear action alerts."}
        </p>
      </div>

      <div className="glass-card p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <HeartPulse className="w-4 h-4 text-primary" />
              {language === "ar" ? "التخصيص الحالي" : "Current personalization"}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{language === "ar" ? `الهدف: ${contextSummary.goalText}` : `Goal: ${contextSummary.goalText}`}</Badge>
              <Badge variant="outline">{language === "ar" ? `النمط: ${personalizationProfile.dietType || "متوازن"}` : `Diet: ${personalizationProfile.dietType || "balanced"}`}</Badge>
              {isChild && <Badge className="bg-emerald-500/15 text-emerald-700 border-transparent dark:text-emerald-200"><Baby className="w-3.5 h-3.5" />{language === "ar" ? "وضع الطفل الصحي" : "Healthy kid mode"}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {contextSummary.glucoseText || ""}
              {contextSummary.glucoseText && contextSummary.pressureText ? " | " : ""}
              {contextSummary.pressureText || ""}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">{language === "ar" ? "حساسيات نشطة" : "Active allergies"}</p>
              <p className="text-xl font-bold mt-1">{activeAllergies.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">{language === "ar" ? "حالات نراعيها" : "Conditions watched"}</p>
              <p className="text-xl font-bold mt-1">{activeConditions.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">{language === "ar" ? "وجبات جاهزة متاحة" : "Ready meals available"}</p>
              <p className="text-xl font-bold mt-1">{readyMeals.length}</p>
            </div>
          </div>
        </div>

        {(activeAllergies.length > 0 || activeConditions.length > 0 || (personalizationProfile.favoriteFoods || []).length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeAllergies.map((allergy) => (
              <span key={allergy} className="rounded-full bg-rose-500/12 px-3 py-1 text-xs font-medium text-rose-700 dark:text-rose-200">
                {language === "ar" ? `تحسس: ${allergy}` : `Allergy: ${allergy}`}
              </span>
            ))}
            {activeConditions.map((condition) => (
              <span key={condition} className="rounded-full bg-amber-500/12 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-200">
                {language === "ar" ? `حالة: ${condition}` : `Condition: ${condition}`}
              </span>
            ))}
            {(personalizationProfile.favoriteFoods || []).map((favorite) => (
              <span key={favorite} className="rounded-full bg-sky-500/12 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-200">
                {language === "ar" ? `مفضل: ${favorite}` : `Favorite: ${favorite}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "ar" ? "ابحث عن طعام أو وجبة أو تصنيف..." : "Search foods, ready meals, or tags..."}
            className="ps-10 h-12 text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDiscoveryFilter(option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                discoveryFilter === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background/70 hover:border-primary/35 hover:bg-primary/5"
              }`}
            >
              {language === "ar" ? option.labelAr : option.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-2">
          {visibleCategories.map((cat) => {
            const CatIcon = categoryIcons[cat.id] || Apple;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-background/70 hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                {cat.id !== "all" && <CatIcon className="w-3.5 h-3.5" />}
                <span>{cat.id === "all" ? t("allCategories") : t((categoryKeys[cat.id] || cat.id) as any)}</span>
              </button>
            );
          })}
          {foodCategories.length > 5 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-medium border border-border bg-background/70 hover:bg-muted transition-all"
            >
              {showAllCategories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      <FoodSection
        title={language === "ar" ? "وجبات جاهزة مقترحة" : "Recommended ready meals"}
        description={
          language === "ar"
            ? "وجبات محسوبة مسبقا وتقدر تضيفها مباشرة ليومك."
            : "Pre-counted meal ideas that can be added directly to your day."
        }
        items={readyMeals}
        onPick={setSelectedFood}
        language={language}
      />

      {isChild && (
        <FoodSection
          title={language === "ar" ? "أكل أطفال صحي ومحبب" : "Healthy kid-friendly foods"}
          description={
            language === "ar"
              ? "اختيارات أسهل للأطفال لكن بشكل صحي ومتوازن."
              : "Gentler, healthier foods chosen to be easier for kids to enjoy."
          }
          items={kidFoods}
          onPick={setSelectedFood}
          language={language}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{discoveryFoods.length}</span> {t("foodResults")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "ar"
              ? "كل نتيجة هنا فيها تقييم ذكي + تخصيص حسب الحساسية والحالة الصحية."
              : "Each result blends smart goal ranking with your saved sensitivities and conditions."}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant={smartSort ? "default" : "outline"}
          onClick={() => setSmartSort((prev) => !prev)}
          className="shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          {language === "ar" ? "ترتيب ذكي حسب ملفك" : "Smart ranking for your profile"}
        </Button>
      </div>

      {discoveryFoods.length > 0 ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {discoveryFoods.map(({ food, fit }, idx) => (
            <FoodCard
              key={`${food.name}-${idx}`}
              food={food}
              fit={fit}
              onClick={() => setSelectedFood(food)}
              language={language}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold mb-2">{language === "ar" ? "لا توجد نتائج مطابقة" : "No matching foods found"}</h3>
          <p className="text-sm text-muted-foreground">
            {language === "ar"
              ? "جرّب تعديل البحث أو الفلتر أو أكمل بيانات التخصيص من صفحة البروفايل."
              : "Try another search, filter, or add more personalization details from your profile page."}
          </p>
        </div>
      )}

      {selectedFood && selectedFoodFit && (
        <FoodDetailPanel
          key={selectedFood.name}
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
          fit={selectedFoodFit}
          t={t}
          language={language}
        />
      )}
    </div>
  );
}
