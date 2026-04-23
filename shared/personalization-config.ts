export type NutritionFormulaKey = "mifflin_abw" | "katch_lbm" | "clinical_conservative";

export type BmrEquationType = "mifflinStJeor" | "katchMcArdle";

export interface NutritionFormulaPreset {
  key: NutritionFormulaKey;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  bmrEquation: BmrEquationType;
  useAdjustedBodyWeight: boolean;
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
    descriptionEn: "Uses LBM-based BMR for clients with body-composition tracking.",
    descriptionAr: "يعتمد على LBM لحساب BMR للعملاء الذين يتابعون تركيب الجسم.",
    bmrEquation: "katchMcArdle",
    useAdjustedBodyWeight: false,
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
    calorieDelta: { lose: -300, maintain: 0, gain: 180 },
    proteinPerKg: { lose: 1.8, maintain: 1.5, gain: 1.7 },
    fatPerKg: { lose: 0.8, maintain: 0.85, gain: 0.9 },
    noteEn: "Fits chronic-condition workflows where aggressive changes are not preferred.",
    noteAr: "مناسب للحالات المزمنة التي تحتاج تغييرات تدريجية غير حادة.",
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
