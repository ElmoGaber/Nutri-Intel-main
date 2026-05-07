export type NutritionFormulaKey = "mifflin_abw" | "katch_lbm" | "clinical_conservative" | "abw_ter_30";

export type BmrEquationType = "mifflinStJeor" | "katchMcArdle" | "abwTer30";

export interface NutritionFormulaPreset {
  key: NutritionFormulaKey;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  bmrEquation: BmrEquationType;
  useAdjustedBodyWeight: boolean;
  adjustedBodyWeightFactor: number;
  kcalPerKgForTdee?: number;
  calorieDelta: {
    lose: number;
    maintain: number;
    gain: number;
  };
  proteinPerKg: {
    lose: number;
    maintain: number;
    gain: number;
  };
  fatPerKg: {
    lose: number;
    maintain: number;
    gain: number;
  };
  noteEn?: string;
  noteAr?: string;
}

export interface ClientFormulaAssignment {
  enabledFormulaKeys: NutritionFormulaKey[];
  activeFormulaKey: NutritionFormulaKey;
  showEquationSteps: boolean;
}

export interface ClientPersonalizationProfile {
  dietType: string;
  allergies: string[];
  conditions: string[];
  favoriteFoodsAdult: string[];
  favoriteFoodsKids: string[];
  avoidFoods: string[];
  disabledFoodNames: string[];
  preferredReadyMealTags: string[];
  kidFriendlyFocus: boolean;
  emergencyAdviceEn: string;
  emergencyAdviceAr: string;
}

export interface ClientPersonalizationSettings {
  userId: string;
  updatedAt: string;
  profile: ClientPersonalizationProfile;
  formulas: ClientFormulaAssignment;
  nutritionLimits: ClientNutritionLimits;
}

export type NutritionLimitSet = {
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  cholesterol?: number | null;
};

export interface ClientNutritionLimits {
  daily: NutritionLimitSet;
  perMeal: NutritionLimitSet;
}

export const NUTRITION_FORMULA_PRESETS: Record<NutritionFormulaKey, NutritionFormulaPreset> = {
  mifflin_abw: {
    key: "mifflin_abw",
    labelEn: "Mifflin + ABW (Default)",
    labelAr: "Mifflin + ABW (الافتراضي)",
    descriptionEn: "Uses Mifflin-St Jeor with ABW when weight exceeds 120% IBW.",
    descriptionAr: "يستخدم Mifflin-St Jeor مع ABW عند تجاوز الوزن 120% من IBW.",
    bmrEquation: "mifflinStJeor",
    useAdjustedBodyWeight: true,
    adjustedBodyWeightFactor: 0.4,
    calorieDelta: { lose: -500, maintain: 0, gain: 300 },
    proteinPerKg: { lose: 2.2, maintain: 1.6, gain: 1.8 },
    fatPerKg: { lose: 0.9, maintain: 0.9, gain: 1.0 },
    noteEn: "Good all-around baseline for most clients.",
    noteAr: "خيار متوازن مناسب لمعظم العملاء.",
  },
  katch_lbm: {
    key: "katch_lbm",
    labelEn: "Katch-McArdle (LBM Focus)",
    labelAr: "Katch-McArdle (تركيز الكتلة الخالية)",
    descriptionEn: "BMR = 370 + (21.6 x LBM), ideal for clients with body-composition tracking.",
    descriptionAr: "معادلة BMR = 370 + (21.6 x LBM)، مناسبة لمن يتابع تركيب الجسم.",
    bmrEquation: "katchMcArdle",
    useAdjustedBodyWeight: false,
    adjustedBodyWeightFactor: 0.4,
    calorieDelta: { lose: -450, maintain: 0, gain: 320 },
    proteinPerKg: { lose: 2.3, maintain: 1.8, gain: 2.0 },
    fatPerKg: { lose: 0.8, maintain: 0.9, gain: 1.0 },
    noteEn: "Useful for athletic or high-muscle clients.",
    noteAr: "مفيد للحالات الرياضية أو ذوي الكتلة العضلية المرتفعة.",
  },
  clinical_conservative: {
    key: "clinical_conservative",
    labelEn: "Clinical Conservative",
    labelAr: "الخطة العلاجية المحافظة",
    descriptionEn: "Conservative calorie deltas with moderate macro targets for sensitive cases.",
    descriptionAr: "فروق سعرات محافظة مع أهداف ماكرو معتدلة للحالات الحساسة.",
    bmrEquation: "mifflinStJeor",
    useAdjustedBodyWeight: true,
    adjustedBodyWeightFactor: 0.4,
    calorieDelta: { lose: -300, maintain: 0, gain: 180 },
    proteinPerKg: { lose: 1.8, maintain: 1.5, gain: 1.7 },
    fatPerKg: { lose: 0.8, maintain: 0.85, gain: 0.9 },
    noteEn: "Fits chronic-condition workflows where aggressive changes are not preferred.",
    noteAr: "مناسب للحالات المزمنة التي تحتاج تغييرات تدريجية غير حادة.",
  },
  abw_ter_30: {
    key: "abw_ter_30",
    labelEn: "ABW TER x30 (Clinical)",
    labelAr: "ABW TER x30 (سريري)",
    descriptionEn: "Adjusted BW = ideal + (actual - ideal) x 0.38, then total calories = ABW x 30.",
    descriptionAr: "الوزن المعدل = المثالي + (الفعلي - المثالي) x 0.38، ثم إجمالي السعرات = ABW x 30.",
    bmrEquation: "abwTer30",
    useAdjustedBodyWeight: true,
    adjustedBodyWeightFactor: 0.38,
    kcalPerKgForTdee: 30,
    calorieDelta: { lose: -300, maintain: 0, gain: 200 },
    proteinPerKg: { lose: 1.8, maintain: 1.5, gain: 1.7 },
    fatPerKg: { lose: 0.8, maintain: 0.85, gain: 0.9 },
    noteEn: "Uses the clinical total-energy shortcut shown in your protocol image.",
    noteAr: "يعتمد على معادلة السعرات السريرية المختصرة الموجودة في الصورة.",
  },
};

export const DEFAULT_CLIENT_FORMULA_ASSIGNMENT: ClientFormulaAssignment = {
  enabledFormulaKeys: ["mifflin_abw"],
  activeFormulaKey: "mifflin_abw",
  showEquationSteps: true,
};

export const DEFAULT_CLIENT_PERSONALIZATION_PROFILE: ClientPersonalizationProfile = {
  dietType: "balanced",
  allergies: [],
  conditions: [],
  favoriteFoodsAdult: [],
  favoriteFoodsKids: [],
  avoidFoods: [],
  disabledFoodNames: [],
  preferredReadyMealTags: ["ready meal", "kid-friendly"],
  kidFriendlyFocus: true,
  emergencyAdviceEn: "If symptoms worsen after eating, stop the meal and contact your care team.",
  emergencyAdviceAr: "لو الأعراض ساءت بعد الأكل، أوقف الوجبة وتواصل مع الفريق الطبي.",
};

export const DEFAULT_CLIENT_NUTRITION_LIMITS: ClientNutritionLimits = {
  daily: {
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    sugar: null,
    sodium: null,
    cholesterol: null,
  },
  perMeal: {
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    sugar: null,
    sodium: null,
    cholesterol: null,
  },
};

export function createDefaultClientPersonalizationSettings(userId: string): ClientPersonalizationSettings {
  return {
    userId,
    updatedAt: new Date().toISOString(),
    profile: {
      ...DEFAULT_CLIENT_PERSONALIZATION_PROFILE,
      allergies: [...DEFAULT_CLIENT_PERSONALIZATION_PROFILE.allergies],
      conditions: [...DEFAULT_CLIENT_PERSONALIZATION_PROFILE.conditions],
      favoriteFoodsAdult: [...DEFAULT_CLIENT_PERSONALIZATION_PROFILE.favoriteFoodsAdult],
      favoriteFoodsKids: [...DEFAULT_CLIENT_PERSONALIZATION_PROFILE.favoriteFoodsKids],
      avoidFoods: [...DEFAULT_CLIENT_PERSONALIZATION_PROFILE.avoidFoods],
      disabledFoodNames: [...DEFAULT_CLIENT_PERSONALIZATION_PROFILE.disabledFoodNames],
      preferredReadyMealTags: [...DEFAULT_CLIENT_PERSONALIZATION_PROFILE.preferredReadyMealTags],
    },
    formulas: {
      enabledFormulaKeys: [...DEFAULT_CLIENT_FORMULA_ASSIGNMENT.enabledFormulaKeys],
      activeFormulaKey: DEFAULT_CLIENT_FORMULA_ASSIGNMENT.activeFormulaKey,
      showEquationSteps: DEFAULT_CLIENT_FORMULA_ASSIGNMENT.showEquationSteps,
    },
    nutritionLimits: {
      daily: { ...DEFAULT_CLIENT_NUTRITION_LIMITS.daily },
      perMeal: { ...DEFAULT_CLIENT_NUTRITION_LIMITS.perMeal },
    },
  };
}

export function normalizeStringList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => Boolean(value)),
    ),
  );
}

export function splitCsvList(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
