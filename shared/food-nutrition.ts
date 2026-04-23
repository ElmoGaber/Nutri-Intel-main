// ============================================================================
// Food Nutrition Database - Based on Kaggle Food Nutrition Dataset (1441 foods)
// Nutritional values are per 100g
// ============================================================================

export interface ServingUnit {
  unit: string;
  unitAr: string;
  weightInGrams: number;
}

export interface NutritionPer100g {
  caloricValue: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  cholesterol: number;
  sodium: number;
  vitaminA: number;
  vitaminB1: number;
  vitaminB6: number;
  vitaminB12: number;
  vitaminC: number;
  vitaminD: number;
  calcium: number;
  iron: number;
  magnesium: number;
  zinc: number;
  nutritionDensity: number;
}

export interface FoodItem {
  name: string;
  nameAr: string;
  category: string;
  per100g: NutritionPer100g;
  servingUnits: ServingUnit[];
  defaultServingUnit: string;
  image?: string;
  tags?: string[];
  allergens?: string[];
  readyMeal?: boolean;
  childFriendly?: boolean;
  healthyForKids?: boolean;
  mealTypes?: string[];
  conditionGuidance?: FoodConditionGuidance[];
}

export interface FoodCategory {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
}

export type FoodConditionStatus = "recommended" | "limit" | "avoid";

export interface FoodConditionGuidance {
  condition: string;
  status: FoodConditionStatus;
  noteEn: string;
  noteAr: string;
  actionEn?: string;
  actionAr?: string;
  servingLimit?: number;
}

export interface FoodPersonalizationProfile {
  age?: number | null;
  allergies?: string[];
  conditions?: string[];
  favoriteFoods?: string[];
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  nutAllergy?: boolean;
  shellFishAllergy?: boolean;
  dietType?: string | null;
}

export interface FoodPersonalizationResult {
  scoreDelta: number;
  status: FoodConditionStatus;
  highlightEn: string;
  highlightAr: string;
  warningsEn: string[];
  warningsAr: string[];
  actionsEn: string[];
  actionsAr: string[];
  matchedAllergens: string[];
  matchedFavorites: string[];
}

// ---------------------------------------------------------------------------
// Food Categories
// ---------------------------------------------------------------------------
export const foodCategories: FoodCategory[] = [
  { id: "dairy", name: "Dairy", nameAr: "الألبان", icon: "milk" },
  { id: "fruit", name: "Fruits", nameAr: "الفواكه", icon: "apple" },
  { id: "vegetable", name: "Vegetables", nameAr: "الخضروات", icon: "carrot" },
  { id: "grain", name: "Grains", nameAr: "الحبوب", icon: "wheat" },
  { id: "protein", name: "Protein", nameAr: "البروتين", icon: "drumstick" },
  { id: "nut", name: "Nuts", nameAr: "المكسرات", icon: "nut" },
  { id: "oil", name: "Oils", nameAr: "الزيوت", icon: "droplet" },
  { id: "sweet", name: "Sweets", nameAr: "الحلويات", icon: "candy" },
  { id: "beverage", name: "Beverages", nameAr: "المشروبات", icon: "cup-soda" },
  { id: "legume", name: "Legumes", nameAr: "البقوليات", icon: "bean" }
];


// ---------------------------------------------------------------------------
// Food Database  (219+ items, values per 100 g)
// ---------------------------------------------------------------------------
const baseFoodDatabase: FoodItem[] = [
  // ========================  DAIRY (14)  ========================
  {
    name: "Whole Milk",
    nameAr: "حليب كامل الدسم",
    category: "dairy",
    per100g: {
      caloricValue: 61, protein: 3.2, carbohydrates: 4.8, fat: 3.3,
      fiber: 0, sugar: 5.1, cholesterol: 10, sodium: 43,
      vitaminA: 0.046, vitaminB1: 0.044, vitaminB6: 0.036, vitaminB12: 0.00045,
      vitaminC: 0, vitaminD: 0.001, calcium: 113, iron: 0.03,
      magnesium: 10, zinc: 0.37, nutritionDensity: 14.2,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 15 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Skim Milk",
    nameAr: "حليب خالي الدسم",
    category: "dairy",
    per100g: {
      caloricValue: 34, protein: 3.4, carbohydrates: 5.0, fat: 0.1,
      fiber: 0, sugar: 5.0, cholesterol: 2, sodium: 42,
      vitaminA: 0.001, vitaminB1: 0.045, vitaminB6: 0.04, vitaminB12: 0.0005,
      vitaminC: 0, vitaminD: 0.001, calcium: 122, iron: 0.03,
      magnesium: 11, zinc: 0.42, nutritionDensity: 16.8,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Yogurt (Plain)",
    nameAr: "زبادي",
    category: "dairy",
    per100g: {
      caloricValue: 61, protein: 3.5, carbohydrates: 4.7, fat: 3.3,
      fiber: 0, sugar: 4.7, cholesterol: 13, sodium: 46,
      vitaminA: 0.027, vitaminB1: 0.029, vitaminB6: 0.032, vitaminB12: 0.00037,
      vitaminC: 0.5, vitaminD: 0, calcium: 121, iron: 0.05,
      magnesium: 12, zinc: 0.52, nutritionDensity: 14.0,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 245 },
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 15 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Greek Yogurt",
    nameAr: "زبادي يوناني",
    category: "dairy",
    per100g: {
      caloricValue: 97, protein: 9.0, carbohydrates: 3.6, fat: 5.0,
      fiber: 0, sugar: 3.2, cholesterol: 14, sodium: 35,
      vitaminA: 0.023, vitaminB1: 0.023, vitaminB6: 0.063, vitaminB12: 0.00075,
      vitaminC: 0, vitaminD: 0, calcium: 100, iron: 0.07,
      magnesium: 11, zinc: 0.52, nutritionDensity: 15.4,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 245 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Cheddar Cheese",
    nameAr: "جبنة شيدر",
    category: "dairy",
    per100g: {
      caloricValue: 403, protein: 24.9, carbohydrates: 1.3, fat: 33.1,
      fiber: 0, sugar: 0.5, cholesterol: 105, sodium: 621,
      vitaminA: 0.265, vitaminB1: 0.029, vitaminB6: 0.074, vitaminB12: 0.00083,
      vitaminC: 0, vitaminD: 0.0006, calcium: 721, iron: 0.68,
      magnesium: 28, zinc: 3.11, nutritionDensity: 12.1,
    },
    servingUnits: [
      { unit: "slice", unitAr: "شريحة", weightInGrams: 28 },
      { unit: "cup shredded", unitAr: "كوباية مبشورة", weightInGrams: 113 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "slice",
  },
  {
    name: "Mozzarella Cheese",
    nameAr: "جبنة موزاريلا",
    category: "dairy",
    per100g: {
      caloricValue: 300, protein: 22.2, carbohydrates: 2.2, fat: 22.4,
      fiber: 0, sugar: 1.0, cholesterol: 79, sodium: 486,
      vitaminA: 0.174, vitaminB1: 0.03, vitaminB6: 0.037, vitaminB12: 0.00065,
      vitaminC: 0, vitaminD: 0.0004, calcium: 505, iron: 0.44,
      magnesium: 20, zinc: 2.92, nutritionDensity: 11.8,
    },
    servingUnits: [
      { unit: "slice", unitAr: "شريحة", weightInGrams: 28 },
      { unit: "cup shredded", unitAr: "كوباية مبشورة", weightInGrams: 112 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "slice",
  },
  {
    name: "Cream Cheese",
    nameAr: "جبنة كريمي",
    category: "dairy",
    per100g: {
      caloricValue: 342, protein: 5.9, carbohydrates: 4.1, fat: 34.2,
      fiber: 0, sugar: 3.2, cholesterol: 110, sodium: 321,
      vitaminA: 0.308, vitaminB1: 0.023, vitaminB6: 0.04, vitaminB12: 0.00022,
      vitaminC: 0, vitaminD: 0.0003, calcium: 98, iron: 0.11,
      magnesium: 9, zinc: 0.51, nutritionDensity: 6.5,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 14.5 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 232 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Cottage Cheese",
    nameAr: "جبنة قريش",
    category: "dairy",
    per100g: {
      caloricValue: 98, protein: 11.1, carbohydrates: 3.4, fat: 4.3,
      fiber: 0, sugar: 2.7, cholesterol: 17, sodium: 364,
      vitaminA: 0.037, vitaminB1: 0.027, vitaminB6: 0.046, vitaminB12: 0.00043,
      vitaminC: 0, vitaminD: 0.0001, calcium: 83, iron: 0.07,
      magnesium: 8, zinc: 0.4, nutritionDensity: 13.5,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 226 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Feta Cheese",
    nameAr: "جبنة فيتا",
    category: "dairy",
    per100g: {
      caloricValue: 264, protein: 14.2, carbohydrates: 4.1, fat: 21.3,
      fiber: 0, sugar: 4.1, cholesterol: 89, sodium: 917,
      vitaminA: 0.125, vitaminB1: 0.154, vitaminB6: 0.424, vitaminB12: 0.00166,
      vitaminC: 0, vitaminD: 0.0005, calcium: 493, iron: 0.65,
      magnesium: 19, zinc: 2.88, nutritionDensity: 11.0,
    },
    servingUnits: [
      { unit: "cup crumbled", unitAr: "كوباية مفتتة", weightInGrams: 150 },
      { unit: "slice", unitAr: "شريحة", weightInGrams: 28 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "slice",
  },
  {
    name: "Butter",
    nameAr: "زبدة",
    category: "dairy",
    per100g: {
      caloricValue: 717, protein: 0.9, carbohydrates: 0.1, fat: 81.1,
      fiber: 0, sugar: 0.1, cholesterol: 215, sodium: 11,
      vitaminA: 0.684, vitaminB1: 0.005, vitaminB6: 0.003, vitaminB12: 0.00017,
      vitaminC: 0, vitaminD: 0.0015, calcium: 24, iron: 0.02,
      magnesium: 2, zinc: 0.09, nutritionDensity: 3.2,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 14 },
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 5 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Labneh",
    nameAr: "لبنة",
    category: "dairy",
    per100g: {
      caloricValue: 154, protein: 5.5, carbohydrates: 4.0, fat: 13.0,
      fiber: 0, sugar: 3.5, cholesterol: 40, sodium: 300,
      vitaminA: 0.08, vitaminB1: 0.03, vitaminB6: 0.04, vitaminB12: 0.0004,
      vitaminC: 0, vitaminD: 0.0001, calcium: 130, iron: 0.1,
      magnesium: 12, zinc: 0.5, nutritionDensity: 10.2,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 15 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Halloumi Cheese",
    nameAr: "جبنة حلوم",
    category: "dairy",
    per100g: {
      caloricValue: 321, protein: 21.0, carbohydrates: 2.6, fat: 25.0,
      fiber: 0, sugar: 2.6, cholesterol: 71, sodium: 1230,
      vitaminA: 0.12, vitaminB1: 0.03, vitaminB6: 0.04, vitaminB12: 0.001,
      vitaminC: 0, vitaminD: 0.0003, calcium: 700, iron: 0.3,
      magnesium: 26, zinc: 2.5, nutritionDensity: 10.5,
    },
    servingUnits: [{ unit: "slice", unitAr: "شريحة", weightInGrams: 30 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "slice",
  },
  {
    name: "White Cheese (Akkawi)",
    nameAr: "جبنة عكاوي",
    category: "dairy",
    per100g: {
      caloricValue: 289, protein: 18.0, carbohydrates: 1.5, fat: 23.0,
      fiber: 0, sugar: 1.5, cholesterol: 75, sodium: 920,
      vitaminA: 0.1, vitaminB1: 0.02, vitaminB6: 0.03, vitaminB12: 0.0005,
      vitaminC: 0, vitaminD: 0.0003, calcium: 520, iron: 0.3,
      magnesium: 20, zinc: 2.0, nutritionDensity: 9.5,
    },
    servingUnits: [{ unit: "slice", unitAr: "شريحة", weightInGrams: 28 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "slice",
  },
  {
    name: "Parmesan Cheese",
    nameAr: "جبنة بارميزان",
    category: "dairy",
    per100g: {
      caloricValue: 431, protein: 38.5, carbohydrates: 4.1, fat: 28.6,
      fiber: 0, sugar: 0.9, cholesterol: 88, sodium: 1529,
      vitaminA: 0.165, vitaminB1: 0.039, vitaminB6: 0.091, vitaminB12: 0.0012,
      vitaminC: 0, vitaminD: 0.0005, calcium: 1184, iron: 0.82,
      magnesium: 44, zinc: 2.75, nutritionDensity: 13.0,
    },
    servingUnits: [
      { unit: "tablespoon grated", unitAr: "معلقة مبشور", weightInGrams: 5 },
      { unit: "cup grated", unitAr: "كوباية مبشورة", weightInGrams: 100 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon grated",
  },

  // ========================  FRUITS (15)  ========================
  {
    name: "Apple",
    nameAr: "تفاح",
    category: "fruit",
    per100g: {
      caloricValue: 52, protein: 0.3, carbohydrates: 13.8, fat: 0.2,
      fiber: 2.4, sugar: 10.4, cholesterol: 0, sodium: 1,
      vitaminA: 0.003, vitaminB1: 0.017, vitaminB6: 0.041, vitaminB12: 0,
      vitaminC: 4.6, vitaminD: 0, calcium: 6, iron: 0.12,
      magnesium: 5, zinc: 0.04, nutritionDensity: 7.5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 182 },
      { unit: "cup sliced", unitAr: "كوباية شرائح", weightInGrams: 109 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Banana",
    nameAr: "موز",
    category: "fruit",
    per100g: {
      caloricValue: 89, protein: 1.1, carbohydrates: 22.8, fat: 0.3,
      fiber: 2.6, sugar: 12.2, cholesterol: 0, sodium: 1,
      vitaminA: 0.003, vitaminB1: 0.031, vitaminB6: 0.367, vitaminB12: 0,
      vitaminC: 8.7, vitaminD: 0, calcium: 5, iron: 0.26,
      magnesium: 27, zinc: 0.15, nutritionDensity: 8.3,
    },
    servingUnits: [{ unit: "piece", unitAr: "واحدة", weightInGrams: 118 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Orange",
    nameAr: "برتقال",
    category: "fruit",
    per100g: {
      caloricValue: 47, protein: 0.9, carbohydrates: 11.8, fat: 0.1,
      fiber: 2.4, sugar: 9.4, cholesterol: 0, sodium: 0,
      vitaminA: 0.011, vitaminB1: 0.087, vitaminB6: 0.06, vitaminB12: 0,
      vitaminC: 53.2, vitaminD: 0, calcium: 40, iron: 0.1,
      magnesium: 10, zinc: 0.07, nutritionDensity: 12.8,
    },
    servingUnits: [{ unit: "piece", unitAr: "واحدة", weightInGrams: 131 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Strawberry",
    nameAr: "فراولة",
    category: "fruit",
    per100g: {
      caloricValue: 32, protein: 0.7, carbohydrates: 7.7, fat: 0.3,
      fiber: 2.0, sugar: 4.9, cholesterol: 0, sodium: 1,
      vitaminA: 0.001, vitaminB1: 0.024, vitaminB6: 0.047, vitaminB12: 0,
      vitaminC: 58.8, vitaminD: 0, calcium: 16, iron: 0.41,
      magnesium: 13, zinc: 0.14, nutritionDensity: 17.8,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 12 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 152 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Grape",
    nameAr: "عنب",
    category: "fruit",
    per100g: {
      caloricValue: 69, protein: 0.7, carbohydrates: 18.1, fat: 0.2,
      fiber: 0.9, sugar: 15.5, cholesterol: 0, sodium: 2,
      vitaminA: 0.003, vitaminB1: 0.069, vitaminB6: 0.086, vitaminB12: 0,
      vitaminC: 3.2, vitaminD: 0, calcium: 10, iron: 0.36,
      magnesium: 7, zinc: 0.07, nutritionDensity: 6.2,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 151 },
      { unit: "piece", unitAr: "واحدة", weightInGrams: 5 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Watermelon",
    nameAr: "بطيخ",
    category: "fruit",
    per100g: {
      caloricValue: 30, protein: 0.6, carbohydrates: 7.6, fat: 0.2,
      fiber: 0.4, sugar: 6.2, cholesterol: 0, sodium: 1,
      vitaminA: 0.028, vitaminB1: 0.033, vitaminB6: 0.045, vitaminB12: 0,
      vitaminC: 8.1, vitaminD: 0, calcium: 7, iron: 0.24,
      magnesium: 10, zinc: 0.1, nutritionDensity: 10.3,
    },
    servingUnits: [
      { unit: "cup diced", unitAr: "كوباية مكعبات", weightInGrams: 152 },
      { unit: "slice", unitAr: "شريحة", weightInGrams: 286 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup diced",
  },
  {
    name: "Mango",
    nameAr: "مانجو",
    category: "fruit",
    per100g: {
      caloricValue: 60, protein: 0.8, carbohydrates: 15.0, fat: 0.4,
      fiber: 1.6, sugar: 13.7, cholesterol: 0, sodium: 1,
      vitaminA: 0.054, vitaminB1: 0.028, vitaminB6: 0.119, vitaminB12: 0,
      vitaminC: 36.4, vitaminD: 0, calcium: 11, iron: 0.16,
      magnesium: 10, zinc: 0.09, nutritionDensity: 11.5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 207 },
      { unit: "cup sliced", unitAr: "كوباية شرائح", weightInGrams: 165 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Kiwi",
    nameAr: "كيوي",
    category: "fruit",
    per100g: {
      caloricValue: 61, protein: 1.1, carbohydrates: 14.7, fat: 0.5,
      fiber: 3.0, sugar: 9.0, cholesterol: 0, sodium: 3,
      vitaminA: 0.004, vitaminB1: 0.027, vitaminB6: 0.063, vitaminB12: 0,
      vitaminC: 92.7, vitaminD: 0, calcium: 34, iron: 0.31,
      magnesium: 17, zinc: 0.14, nutritionDensity: 18.7,
    },
    servingUnits: [{ unit: "piece", unitAr: "واحدة", weightInGrams: 76 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Pineapple",
    nameAr: "أناناس",
    category: "fruit",
    per100g: {
      caloricValue: 50, protein: 0.5, carbohydrates: 13.1, fat: 0.1,
      fiber: 1.4, sugar: 9.9, cholesterol: 0, sodium: 1,
      vitaminA: 0.003, vitaminB1: 0.079, vitaminB6: 0.112, vitaminB12: 0,
      vitaminC: 47.8, vitaminD: 0, calcium: 13, iron: 0.29,
      magnesium: 12, zinc: 0.12, nutritionDensity: 12.0,
    },
    servingUnits: [
      { unit: "cup chunks", unitAr: "كوباية قطع", weightInGrams: 165 },
      { unit: "slice", unitAr: "شريحة", weightInGrams: 84 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup chunks",
  },
  {
    name: "Pear",
    nameAr: "كمثرى",
    category: "fruit",
    per100g: {
      caloricValue: 57, protein: 0.4, carbohydrates: 15.2, fat: 0.1,
      fiber: 3.1, sugar: 9.8, cholesterol: 0, sodium: 1,
      vitaminA: 0.001, vitaminB1: 0.012, vitaminB6: 0.029, vitaminB12: 0,
      vitaminC: 4.3, vitaminD: 0, calcium: 9, iron: 0.18,
      magnesium: 7, zinc: 0.1, nutritionDensity: 7.1,
    },
    servingUnits: [{ unit: "piece", unitAr: "واحدة", weightInGrams: 178 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Peach",
    nameAr: "خوخ",
    category: "fruit",
    per100g: {
      caloricValue: 39, protein: 0.9, carbohydrates: 9.5, fat: 0.3,
      fiber: 1.5, sugar: 8.4, cholesterol: 0, sodium: 0,
      vitaminA: 0.016, vitaminB1: 0.024, vitaminB6: 0.025, vitaminB12: 0,
      vitaminC: 6.6, vitaminD: 0, calcium: 6, iron: 0.25,
      magnesium: 9, zinc: 0.17, nutritionDensity: 10.5,
    },
    servingUnits: [{ unit: "piece", unitAr: "واحدة", weightInGrams: 150 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Dates",
    nameAr: "تمر",
    category: "fruit",
    per100g: {
      caloricValue: 277, protein: 1.8, carbohydrates: 75.0, fat: 0.2,
      fiber: 6.7, sugar: 66.5, cholesterol: 0, sodium: 1,
      vitaminA: 0.007, vitaminB1: 0.05, vitaminB6: 0.249, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 64, iron: 0.9,
      magnesium: 54, zinc: 0.44, nutritionDensity: 6.4,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 8 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 147 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Avocado",
    nameAr: "أفوكادو",
    category: "fruit",
    per100g: {
      caloricValue: 160, protein: 2.0, carbohydrates: 8.5, fat: 14.7,
      fiber: 6.7, sugar: 0.7, cholesterol: 0, sodium: 7,
      vitaminA: 0.007, vitaminB1: 0.067, vitaminB6: 0.257, vitaminB12: 0,
      vitaminC: 10.0, vitaminD: 0, calcium: 12, iron: 0.55,
      magnesium: 29, zinc: 0.64, nutritionDensity: 11.6,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 150 },
      { unit: "cup sliced", unitAr: "كوباية شرائح", weightInGrams: 146 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Pomegranate",
    nameAr: "رمان",
    category: "fruit",
    per100g: {
      caloricValue: 83, protein: 1.7, carbohydrates: 18.7, fat: 1.2,
      fiber: 4.0, sugar: 13.7, cholesterol: 0, sodium: 3,
      vitaminA: 0, vitaminB1: 0.067, vitaminB6: 0.075, vitaminB12: 0,
      vitaminC: 10.2, vitaminD: 0, calcium: 10, iron: 0.3,
      magnesium: 12, zinc: 0.35, nutritionDensity: 9.8,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 282 },
      { unit: "cup seeds", unitAr: "كوباية بذور", weightInGrams: 174 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Fig (Fresh)",
    nameAr: "تين طازج",
    category: "fruit",
    per100g: {
      caloricValue: 74, protein: 0.8, carbohydrates: 19.2, fat: 0.3,
      fiber: 2.9, sugar: 16.3, cholesterol: 0, sodium: 1,
      vitaminA: 0.007, vitaminB1: 0.06, vitaminB6: 0.113, vitaminB12: 0,
      vitaminC: 2.0, vitaminD: 0, calcium: 35, iron: 0.37,
      magnesium: 17, zinc: 0.15, nutritionDensity: 8.0,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 50 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },

  // ========================  VEGETABLES (18)  ========================
  {
    name: "Potato",
    nameAr: "بطاطس",
    category: "vegetable",
    per100g: {
      caloricValue: 77, protein: 2.0, carbohydrates: 17.5, fat: 0.1,
      fiber: 2.2, sugar: 0.8, cholesterol: 0, sodium: 6,
      vitaminA: 0, vitaminB1: 0.081, vitaminB6: 0.298, vitaminB12: 0,
      vitaminC: 19.7, vitaminD: 0, calcium: 12, iron: 0.81,
      magnesium: 23, zinc: 0.3, nutritionDensity: 10.1,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 150 },
      { unit: "cup diced", unitAr: "كوباية مكعبات", weightInGrams: 150 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Sweet Potato",
    nameAr: "بطاطا حلوة",
    category: "vegetable",
    per100g: {
      caloricValue: 86, protein: 1.6, carbohydrates: 20.1, fat: 0.1,
      fiber: 3.0, sugar: 4.2, cholesterol: 0, sodium: 55,
      vitaminA: 0.709, vitaminB1: 0.078, vitaminB6: 0.209, vitaminB12: 0,
      vitaminC: 2.4, vitaminD: 0, calcium: 30, iron: 0.61,
      magnesium: 25, zinc: 0.3, nutritionDensity: 12.9,
    },
    servingUnits: [{ unit: "piece", unitAr: "واحدة", weightInGrams: 130 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Tomato",
    nameAr: "طماطم",
    category: "vegetable",
    per100g: {
      caloricValue: 18, protein: 0.9, carbohydrates: 3.9, fat: 0.2,
      fiber: 1.2, sugar: 2.6, cholesterol: 0, sodium: 5,
      vitaminA: 0.042, vitaminB1: 0.037, vitaminB6: 0.08, vitaminB12: 0,
      vitaminC: 14.0, vitaminD: 0, calcium: 10, iron: 0.27,
      magnesium: 11, zinc: 0.17, nutritionDensity: 22.5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 123 },
      { unit: "cup chopped", unitAr: "كوباية مقطعة", weightInGrams: 180 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Carrot",
    nameAr: "جزر",
    category: "vegetable",
    per100g: {
      caloricValue: 41, protein: 0.9, carbohydrates: 9.6, fat: 0.2,
      fiber: 2.8, sugar: 4.7, cholesterol: 0, sodium: 69,
      vitaminA: 0.835, vitaminB1: 0.066, vitaminB6: 0.138, vitaminB12: 0,
      vitaminC: 5.9, vitaminD: 0, calcium: 33, iron: 0.3,
      magnesium: 12, zinc: 0.24, nutritionDensity: 17.0,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 72 },
      { unit: "cup chopped", unitAr: "كوباية مقطعة", weightInGrams: 128 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Broccoli",
    nameAr: "بروكلي",
    category: "vegetable",
    per100g: {
      caloricValue: 34, protein: 2.8, carbohydrates: 6.6, fat: 0.4,
      fiber: 2.6, sugar: 1.7, cholesterol: 0, sodium: 33,
      vitaminA: 0.031, vitaminB1: 0.071, vitaminB6: 0.175, vitaminB12: 0,
      vitaminC: 89.2, vitaminD: 0, calcium: 47, iron: 0.73,
      magnesium: 21, zinc: 0.41, nutritionDensity: 25.3,
    },
    servingUnits: [
      { unit: "cup chopped", unitAr: "كوباية مقطعة", weightInGrams: 91 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup chopped",
  },
  {
    name: "Spinach",
    nameAr: "سبانخ",
    category: "vegetable",
    per100g: {
      caloricValue: 23, protein: 2.9, carbohydrates: 3.6, fat: 0.4,
      fiber: 2.2, sugar: 0.4, cholesterol: 0, sodium: 79,
      vitaminA: 0.469, vitaminB1: 0.078, vitaminB6: 0.195, vitaminB12: 0,
      vitaminC: 28.1, vitaminD: 0, calcium: 99, iron: 2.71,
      magnesium: 79, zinc: 0.53, nutritionDensity: 34.6,
    },
    servingUnits: [
      { unit: "cup raw", unitAr: "كوباية طازة", weightInGrams: 30 },
      { unit: "cup cooked", unitAr: "كوباية مطبوخة", weightInGrams: 180 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup raw",
  },
  {
    name: "Lettuce (Iceberg)",
    nameAr: "خس",
    category: "vegetable",
    per100g: {
      caloricValue: 14, protein: 0.9, carbohydrates: 3.0, fat: 0.1,
      fiber: 1.2, sugar: 1.97, cholesterol: 0, sodium: 10,
      vitaminA: 0.025, vitaminB1: 0.041, vitaminB6: 0.042, vitaminB12: 0,
      vitaminC: 2.8, vitaminD: 0, calcium: 18, iron: 0.41,
      magnesium: 7, zinc: 0.15, nutritionDensity: 18.5,
    },
    servingUnits: [
      { unit: "cup shredded", unitAr: "كوباية مبشورة", weightInGrams: 72 },
      { unit: "leaf", unitAr: "ورقة", weightInGrams: 8 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup shredded",
  },
  {
    name: "Onion",
    nameAr: "بصل",
    category: "vegetable",
    per100g: {
      caloricValue: 40, protein: 1.1, carbohydrates: 9.3, fat: 0.1,
      fiber: 1.7, sugar: 4.2, cholesterol: 0, sodium: 4,
      vitaminA: 0, vitaminB1: 0.046, vitaminB6: 0.12, vitaminB12: 0,
      vitaminC: 7.4, vitaminD: 0, calcium: 23, iron: 0.21,
      magnesium: 10, zinc: 0.17, nutritionDensity: 11.2,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 110 },
      { unit: "cup chopped", unitAr: "كوباية مقطعة", weightInGrams: 160 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Garlic",
    nameAr: "ثوم",
    category: "vegetable",
    per100g: {
      caloricValue: 149, protein: 6.4, carbohydrates: 33.1, fat: 0.5,
      fiber: 2.1, sugar: 1.0, cholesterol: 0, sodium: 17,
      vitaminA: 0, vitaminB1: 0.2, vitaminB6: 1.235, vitaminB12: 0,
      vitaminC: 31.2, vitaminD: 0, calcium: 181, iron: 1.7,
      magnesium: 25, zinc: 1.16, nutritionDensity: 14.5,
    },
    servingUnits: [
      { unit: "clove", unitAr: "فص", weightInGrams: 3 },
      { unit: "tablespoon minced", unitAr: "معلقة مفروم", weightInGrams: 9 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "clove",
  },
  {
    name: "Cucumber",
    nameAr: "خيار",
    category: "vegetable",
    per100g: {
      caloricValue: 15, protein: 0.7, carbohydrates: 3.6, fat: 0.1,
      fiber: 0.5, sugar: 1.7, cholesterol: 0, sodium: 2,
      vitaminA: 0.005, vitaminB1: 0.027, vitaminB6: 0.04, vitaminB12: 0,
      vitaminC: 2.8, vitaminD: 0, calcium: 16, iron: 0.28,
      magnesium: 13, zinc: 0.2, nutritionDensity: 16.8,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 301 },
      { unit: "cup sliced", unitAr: "كوباية شرائح", weightInGrams: 119 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Bell Pepper (Red)",
    nameAr: "فلفل رومي أحمر",
    category: "vegetable",
    per100g: {
      caloricValue: 31, protein: 1.0, carbohydrates: 6.0, fat: 0.3,
      fiber: 2.1, sugar: 4.2, cholesterol: 0, sodium: 4,
      vitaminA: 0.157, vitaminB1: 0.054, vitaminB6: 0.291, vitaminB12: 0,
      vitaminC: 127.7, vitaminD: 0, calcium: 7, iron: 0.43,
      magnesium: 12, zinc: 0.25, nutritionDensity: 28.4,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 119 },
      { unit: "cup chopped", unitAr: "كوباية مقطعة", weightInGrams: 149 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Corn (Sweet)",
    nameAr: "ذرة حلوة",
    category: "vegetable",
    per100g: {
      caloricValue: 86, protein: 3.3, carbohydrates: 19.0, fat: 1.4,
      fiber: 2.7, sugar: 6.3, cholesterol: 0, sodium: 15,
      vitaminA: 0.01, vitaminB1: 0.155, vitaminB6: 0.093, vitaminB12: 0,
      vitaminC: 6.8, vitaminD: 0, calcium: 2, iron: 0.52,
      magnesium: 37, zinc: 0.46, nutritionDensity: 10.0,
    },
    servingUnits: [
      { unit: "ear", unitAr: "كوز", weightInGrams: 90 },
      { unit: "cup kernels", unitAr: "كوباية حبوب", weightInGrams: 154 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "ear",
  },
  {
    name: "Green Peas",
    nameAr: "بازلاء",
    category: "vegetable",
    per100g: {
      caloricValue: 81, protein: 5.4, carbohydrates: 14.5, fat: 0.4,
      fiber: 5.1, sugar: 5.7, cholesterol: 0, sodium: 5,
      vitaminA: 0.038, vitaminB1: 0.266, vitaminB6: 0.169, vitaminB12: 0,
      vitaminC: 40.0, vitaminD: 0, calcium: 25, iron: 1.47,
      magnesium: 33, zinc: 1.24, nutritionDensity: 17.5,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 145 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Zucchini",
    nameAr: "كوسة",
    category: "vegetable",
    per100g: {
      caloricValue: 17, protein: 1.2, carbohydrates: 3.1, fat: 0.3,
      fiber: 1.0, sugar: 2.5, cholesterol: 0, sodium: 8,
      vitaminA: 0.01, vitaminB1: 0.045, vitaminB6: 0.163, vitaminB12: 0,
      vitaminC: 17.9, vitaminD: 0, calcium: 16, iron: 0.37,
      magnesium: 18, zinc: 0.32, nutritionDensity: 24.0,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 196 },
      { unit: "cup sliced", unitAr: "كوباية شرائح", weightInGrams: 113 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Eggplant",
    nameAr: "باذنجان",
    category: "vegetable",
    per100g: {
      caloricValue: 25, protein: 1.0, carbohydrates: 5.9, fat: 0.2,
      fiber: 3.0, sugar: 3.5, cholesterol: 0, sodium: 2,
      vitaminA: 0.001, vitaminB1: 0.039, vitaminB6: 0.084, vitaminB12: 0,
      vitaminC: 2.2, vitaminD: 0, calcium: 9, iron: 0.23,
      magnesium: 14, zinc: 0.16, nutritionDensity: 14.0,
    },
    servingUnits: [
      { unit: "cup cubed", unitAr: "كوباية مكعبات", weightInGrams: 82 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup cubed",
  },
  {
    name: "Cauliflower",
    nameAr: "قرنبيط",
    category: "vegetable",
    per100g: {
      caloricValue: 25, protein: 1.9, carbohydrates: 5.0, fat: 0.3,
      fiber: 2.0, sugar: 1.9, cholesterol: 0, sodium: 30,
      vitaminA: 0, vitaminB1: 0.05, vitaminB6: 0.184, vitaminB12: 0,
      vitaminC: 48.2, vitaminD: 0, calcium: 22, iron: 0.42,
      magnesium: 15, zinc: 0.27, nutritionDensity: 24.0,
    },
    servingUnits: [
      { unit: "cup chopped", unitAr: "كوباية مقطعة", weightInGrams: 107 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup chopped",
  },
  {
    name: "Cabbage",
    nameAr: "ملفوف",
    category: "vegetable",
    per100g: {
      caloricValue: 25, protein: 1.3, carbohydrates: 5.8, fat: 0.1,
      fiber: 2.5, sugar: 3.2, cholesterol: 0, sodium: 18,
      vitaminA: 0.005, vitaminB1: 0.061, vitaminB6: 0.124, vitaminB12: 0,
      vitaminC: 36.6, vitaminD: 0, calcium: 40, iron: 0.47,
      magnesium: 12, zinc: 0.18, nutritionDensity: 21.0,
    },
    servingUnits: [
      { unit: "cup shredded", unitAr: "كوباية مبشورة", weightInGrams: 89 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup shredded",
  },
  {
    name: "Mushroom",
    nameAr: "فطر",
    category: "vegetable",
    per100g: {
      caloricValue: 22, protein: 3.1, carbohydrates: 3.3, fat: 0.3,
      fiber: 1.0, sugar: 2.0, cholesterol: 0, sodium: 5,
      vitaminA: 0, vitaminB1: 0.081, vitaminB6: 0.104, vitaminB12: 0.00004,
      vitaminC: 2.1, vitaminD: 0.0002, calcium: 3, iron: 0.5,
      magnesium: 9, zinc: 0.52, nutritionDensity: 26.0,
    },
    servingUnits: [
      { unit: "cup sliced", unitAr: "كوباية شرائح", weightInGrams: 70 },
      { unit: "piece", unitAr: "واحدة", weightInGrams: 18 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup sliced",
  },

  // ========================  GRAINS (12)  ========================
  {
    name: "White Rice (Cooked)",
    nameAr: "أرز أبيض مطبوخ",
    category: "grain",
    per100g: {
      caloricValue: 130, protein: 2.7, carbohydrates: 28.2, fat: 0.3,
      fiber: 0.4, sugar: 0.1, cholesterol: 0, sodium: 1,
      vitaminA: 0, vitaminB1: 0.02, vitaminB6: 0.093, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 10, iron: 0.2,
      magnesium: 12, zinc: 0.49, nutritionDensity: 4.2,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 186 },
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 12 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Brown Rice (Cooked)",
    nameAr: "أرز بني مطبوخ",
    category: "grain",
    per100g: {
      caloricValue: 111, protein: 2.6, carbohydrates: 23.0, fat: 0.9,
      fiber: 1.8, sugar: 0.4, cholesterol: 0, sodium: 5,
      vitaminA: 0, vitaminB1: 0.096, vitaminB6: 0.145, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 10, iron: 0.42,
      magnesium: 43, zinc: 0.62, nutritionDensity: 6.8,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 195 },
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 12 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "White Bread",
    nameAr: "خبز أبيض",
    category: "grain",
    per100g: {
      caloricValue: 265, protein: 9.4, carbohydrates: 49.0, fat: 3.2,
      fiber: 2.7, sugar: 5.0, cholesterol: 0, sodium: 491,
      vitaminA: 0, vitaminB1: 0.507, vitaminB6: 0.063, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 151, iron: 3.6,
      magnesium: 25, zinc: 0.74, nutritionDensity: 7.1,
    },
    servingUnits: [{ unit: "slice", unitAr: "شريحة", weightInGrams: 30 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "slice",
  },
  {
    name: "Whole Wheat Bread",
    nameAr: "خبز قمح كامل",
    category: "grain",
    per100g: {
      caloricValue: 247, protein: 12.9, carbohydrates: 41.3, fat: 3.4,
      fiber: 6.8, sugar: 6.0, cholesterol: 0, sodium: 472,
      vitaminA: 0, vitaminB1: 0.397, vitaminB6: 0.215, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 107, iron: 2.5,
      magnesium: 75, zinc: 1.65, nutritionDensity: 9.8,
    },
    servingUnits: [{ unit: "slice", unitAr: "شريحة", weightInGrams: 33 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "slice",
  },
  {
    name: "Arabic Flatbread (Pita)",
    nameAr: "خبز عربي",
    category: "grain",
    per100g: {
      caloricValue: 275, protein: 9.1, carbohydrates: 55.7, fat: 1.2,
      fiber: 2.2, sugar: 1.6, cholesterol: 0, sodium: 536,
      vitaminA: 0, vitaminB1: 0.6, vitaminB6: 0.03, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 86, iron: 2.62,
      magnesium: 26, zinc: 0.84, nutritionDensity: 6.5,
    },
    servingUnits: [{ unit: "piece", unitAr: "رغيف", weightInGrams: 60 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Pasta (Cooked)",
    nameAr: "مكرونة مطبوخة",
    category: "grain",
    per100g: {
      caloricValue: 131, protein: 5.0, carbohydrates: 25.4, fat: 1.1,
      fiber: 1.8, sugar: 0.6, cholesterol: 0, sodium: 1,
      vitaminA: 0, vitaminB1: 0.143, vitaminB6: 0.049, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 7, iron: 1.28,
      magnesium: 18, zinc: 0.5, nutritionDensity: 5.5,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 140 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Oatmeal (Cooked)",
    nameAr: "شوفان مطبوخ",
    category: "grain",
    per100g: {
      caloricValue: 71, protein: 2.5, carbohydrates: 12.0, fat: 1.5,
      fiber: 1.7, sugar: 0.3, cholesterol: 0, sodium: 4,
      vitaminA: 0, vitaminB1: 0.076, vitaminB6: 0.005, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 9, iron: 0.9,
      magnesium: 27, zinc: 0.64, nutritionDensity: 8.5,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 234 },
      { unit: "tablespoon dry", unitAr: "معلقة جاف", weightInGrams: 5 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Quinoa (Cooked)",
    nameAr: "كينوا مطبوخة",
    category: "grain",
    per100g: {
      caloricValue: 120, protein: 4.4, carbohydrates: 21.3, fat: 1.9,
      fiber: 2.8, sugar: 0.9, cholesterol: 0, sodium: 7,
      vitaminA: 0.001, vitaminB1: 0.107, vitaminB6: 0.123, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 17, iron: 1.49,
      magnesium: 64, zinc: 1.09, nutritionDensity: 10.2,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 185 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Corn Flakes",
    nameAr: "كورن فليكس",
    category: "grain",
    per100g: {
      caloricValue: 357, protein: 7.5, carbohydrates: 84.4, fat: 0.4,
      fiber: 3.3, sugar: 10.0, cholesterol: 0, sodium: 729,
      vitaminA: 0.375, vitaminB1: 1.29, vitaminB6: 1.29, vitaminB12: 0.006,
      vitaminC: 37.5, vitaminD: 0.0038, calcium: 3, iron: 28.9,
      magnesium: 16, zinc: 0.5, nutritionDensity: 7.3,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 28 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Bulgur (Cooked)",
    nameAr: "برغل مطبوخ",
    category: "grain",
    per100g: {
      caloricValue: 83, protein: 3.1, carbohydrates: 18.6, fat: 0.2,
      fiber: 4.5, sugar: 0.1, cholesterol: 0, sodium: 5,
      vitaminA: 0, vitaminB1: 0.057, vitaminB6: 0.083, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 10, iron: 0.96,
      magnesium: 32, zinc: 0.57, nutritionDensity: 9.4,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 182 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Couscous (Cooked)",
    nameAr: "كسكس مطبوخ",
    category: "grain",
    per100g: {
      caloricValue: 112, protein: 3.8, carbohydrates: 23.2, fat: 0.2,
      fiber: 1.4, sugar: 0.1, cholesterol: 0, sodium: 5,
      vitaminA: 0, vitaminB1: 0.063, vitaminB6: 0.051, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 8, iron: 0.38,
      magnesium: 8, zinc: 0.26, nutritionDensity: 5.0,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 157 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Tortilla (Flour)",
    nameAr: "خبز تورتيلا",
    category: "grain",
    per100g: {
      caloricValue: 312, protein: 8.3, carbohydrates: 51.6, fat: 8.0,
      fiber: 2.1, sugar: 3.4, cholesterol: 0, sodium: 506,
      vitaminA: 0, vitaminB1: 0.41, vitaminB6: 0.03, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 128, iron: 3.65,
      magnesium: 22, zinc: 0.62, nutritionDensity: 5.8,
    },
    servingUnits: [{ unit: "piece", unitAr: "قطعة", weightInGrams: 45 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },

  // ========================  PROTEIN (14)  ========================
  {
    name: "Egg (Whole, Cooked)",
    nameAr: "بيضة مسلوقة",
    category: "protein",
    per100g: {
      caloricValue: 155, protein: 13.0, carbohydrates: 1.1, fat: 11.0,
      fiber: 0, sugar: 1.1, cholesterol: 373, sodium: 124,
      vitaminA: 0.149, vitaminB1: 0.066, vitaminB6: 0.121, vitaminB12: 0.00089,
      vitaminC: 0, vitaminD: 0.002, calcium: 50, iron: 1.19,
      magnesium: 10, zinc: 1.05, nutritionDensity: 12.4,
    },
    servingUnits: [{ unit: "piece", unitAr: "واحدة", weightInGrams: 50 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Chicken Breast (Cooked)",
    nameAr: "صدر دجاج مطبوخ",
    category: "protein",
    per100g: {
      caloricValue: 165, protein: 31.0, carbohydrates: 0, fat: 3.6,
      fiber: 0, sugar: 0, cholesterol: 85, sodium: 74,
      vitaminA: 0.006, vitaminB1: 0.063, vitaminB6: 0.6, vitaminB12: 0.00034,
      vitaminC: 0, vitaminD: 0.0001, calcium: 15, iron: 1.04,
      magnesium: 29, zinc: 1.0, nutritionDensity: 14.8,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 172 },
      { unit: "cup diced", unitAr: "كوباية مكعبات", weightInGrams: 140 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Chicken Thigh (Cooked)",
    nameAr: "فخذ دجاج مطبوخ",
    category: "protein",
    per100g: {
      caloricValue: 209, protein: 26.0, carbohydrates: 0, fat: 10.9,
      fiber: 0, sugar: 0, cholesterol: 130, sodium: 84,
      vitaminA: 0.018, vitaminB1: 0.067, vitaminB6: 0.33, vitaminB12: 0.0003,
      vitaminC: 0, vitaminD: 0.0001, calcium: 12, iron: 1.3,
      magnesium: 23, zinc: 2.4, nutritionDensity: 11.0,
    },
    servingUnits: [{ unit: "piece", unitAr: "قطعة", weightInGrams: 116 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Beef Steak (Cooked)",
    nameAr: "ستيك لحم بقري",
    category: "protein",
    per100g: {
      caloricValue: 271, protein: 26.1, carbohydrates: 0, fat: 17.3,
      fiber: 0, sugar: 0, cholesterol: 87, sodium: 57,
      vitaminA: 0.003, vitaminB1: 0.065, vitaminB6: 0.352, vitaminB12: 0.00267,
      vitaminC: 0, vitaminD: 0.0001, calcium: 12, iron: 2.6,
      magnesium: 22, zinc: 6.31, nutritionDensity: 9.6,
    },
    servingUnits: [{ unit: "piece", unitAr: "قطعة", weightInGrams: 221 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Ground Beef (Cooked)",
    nameAr: "لحم مفروم مطبوخ",
    category: "protein",
    per100g: {
      caloricValue: 250, protein: 25.6, carbohydrates: 0, fat: 15.4,
      fiber: 0, sugar: 0, cholesterol: 82, sodium: 66,
      vitaminA: 0, vitaminB1: 0.04, vitaminB6: 0.34, vitaminB12: 0.00245,
      vitaminC: 0, vitaminD: 0.0001, calcium: 18, iron: 2.24,
      magnesium: 20, zinc: 5.43, nutritionDensity: 9.2,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 135 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Salmon (Cooked)",
    nameAr: "سلمون مطبوخ",
    category: "protein",
    per100g: {
      caloricValue: 208, protein: 20.4, carbohydrates: 0, fat: 13.4,
      fiber: 0, sugar: 0, cholesterol: 55, sodium: 59,
      vitaminA: 0.05, vitaminB1: 0.238, vitaminB6: 0.636, vitaminB12: 0.00318,
      vitaminC: 0, vitaminD: 0.011, calcium: 12, iron: 0.34,
      magnesium: 27, zinc: 0.64, nutritionDensity: 13.5,
    },
    servingUnits: [{ unit: "fillet", unitAr: "فيليه", weightInGrams: 178 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "fillet",
  },
  {
    name: "Tuna (Canned in Water)",
    nameAr: "تونة معلبة بالماء",
    category: "protein",
    per100g: {
      caloricValue: 116, protein: 25.5, carbohydrates: 0, fat: 0.8,
      fiber: 0, sugar: 0, cholesterol: 30, sodium: 338,
      vitaminA: 0.018, vitaminB1: 0.018, vitaminB6: 0.455, vitaminB12: 0.00269,
      vitaminC: 0, vitaminD: 0.0019, calcium: 11, iron: 1.02,
      magnesium: 30, zinc: 0.63, nutritionDensity: 15.5,
    },
    servingUnits: [{ unit: "can", unitAr: "علبة", weightInGrams: 165 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "can",
  },
  {
    name: "Tuna (Canned in Oil)",
    nameAr: "تونة معلبة بالزيت",
    category: "protein",
    per100g: {
      caloricValue: 198, protein: 29.1, carbohydrates: 0, fat: 8.2,
      fiber: 0, sugar: 0, cholesterol: 31, sodium: 396,
      vitaminA: 0.02, vitaminB1: 0.04, vitaminB6: 0.43, vitaminB12: 0.00257,
      vitaminC: 0, vitaminD: 0.0019, calcium: 13, iron: 1.39,
      magnesium: 31, zinc: 0.77, nutritionDensity: 12.8,
    },
    servingUnits: [{ unit: "can", unitAr: "علبة", weightInGrams: 165 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "can",
  },
  {
    name: "Turkey Breast (Cooked)",
    nameAr: "صدر ديك رومي مطبوخ",
    category: "protein",
    per100g: {
      caloricValue: 135, protein: 30.1, carbohydrates: 0, fat: 0.7,
      fiber: 0, sugar: 0, cholesterol: 83, sodium: 46,
      vitaminA: 0, vitaminB1: 0.023, vitaminB6: 0.8, vitaminB12: 0.00036,
      vitaminC: 0, vitaminD: 0.0001, calcium: 10, iron: 1.4,
      magnesium: 32, zinc: 2.04, nutritionDensity: 16.2,
    },
    servingUnits: [
      { unit: "slice", unitAr: "شريحة", weightInGrams: 28 },
      { unit: "cup diced", unitAr: "كوباية مكعبات", weightInGrams: 140 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "slice",
  },
  {
    name: "Shrimp (Cooked)",
    nameAr: "جمبري مطبوخ",
    category: "protein",
    per100g: {
      caloricValue: 99, protein: 24.0, carbohydrates: 0.2, fat: 0.3,
      fiber: 0, sugar: 0, cholesterol: 189, sodium: 111,
      vitaminA: 0.054, vitaminB1: 0.028, vitaminB6: 0.103, vitaminB12: 0.00118,
      vitaminC: 0, vitaminD: 0, calcium: 52, iron: 0.51,
      magnesium: 37, zinc: 1.34, nutritionDensity: 18.0,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 22 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 145 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Lamb (Cooked)",
    nameAr: "لحم ضأن مطبوخ",
    category: "protein",
    per100g: {
      caloricValue: 294, protein: 24.5, carbohydrates: 0, fat: 20.9,
      fiber: 0, sugar: 0, cholesterol: 97, sodium: 59,
      vitaminA: 0, vitaminB1: 0.097, vitaminB6: 0.143, vitaminB12: 0.00269,
      vitaminC: 0, vitaminD: 0, calcium: 17, iron: 1.88,
      magnesium: 23, zinc: 4.46, nutritionDensity: 8.5,
    },
    servingUnits: [{ unit: "piece", unitAr: "قطعة", weightInGrams: 85 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Liver (Beef, Cooked)",
    nameAr: "كبدة بقري مطبوخة",
    category: "protein",
    per100g: {
      caloricValue: 175, protein: 26.5, carbohydrates: 5.1, fat: 4.7,
      fiber: 0, sugar: 0, cholesterol: 396, sodium: 69,
      vitaminA: 9.44, vitaminB1: 0.194, vitaminB6: 1.017, vitaminB12: 0.0709,
      vitaminC: 1.3, vitaminD: 0.0012, calcium: 6, iron: 6.54,
      magnesium: 18, zinc: 5.3, nutritionDensity: 22.0,
    },
    servingUnits: [{ unit: "piece", unitAr: "قطعة", weightInGrams: 85 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Sardines (Canned in Oil)",
    nameAr: "سردين معلب بالزيت",
    category: "protein",
    per100g: {
      caloricValue: 208, protein: 24.6, carbohydrates: 0, fat: 11.5,
      fiber: 0, sugar: 0, cholesterol: 142, sodium: 505,
      vitaminA: 0.032, vitaminB1: 0.08, vitaminB6: 0.167, vitaminB12: 0.00891,
      vitaminC: 0, vitaminD: 0.0048, calcium: 382, iron: 2.92,
      magnesium: 39, zinc: 1.31, nutritionDensity: 13.8,
    },
    servingUnits: [
      { unit: "can", unitAr: "علبة", weightInGrams: 92 },
      { unit: "piece", unitAr: "واحدة", weightInGrams: 12 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "can",
  },
  {
    name: "Tofu (Firm)",
    nameAr: "توفو",
    category: "protein",
    per100g: {
      caloricValue: 144, protein: 17.3, carbohydrates: 2.8, fat: 8.7,
      fiber: 2.3, sugar: 0.6, cholesterol: 0, sodium: 14,
      vitaminA: 0, vitaminB1: 0.155, vitaminB6: 0.092, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 683, iron: 2.66,
      magnesium: 58, zinc: 1.57, nutritionDensity: 14.0,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 252 },
      { unit: "slice", unitAr: "شريحة", weightInGrams: 84 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "slice",
  },

  // ========================  NUTS (7)  ========================
  {
    name: "Almonds",
    nameAr: "لوز",
    category: "nut",
    per100g: {
      caloricValue: 579, protein: 21.2, carbohydrates: 21.6, fat: 49.9,
      fiber: 12.5, sugar: 4.4, cholesterol: 0, sodium: 1,
      vitaminA: 0, vitaminB1: 0.205, vitaminB6: 0.137, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 269, iron: 3.71,
      magnesium: 270, zinc: 3.12, nutritionDensity: 10.8,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 1.2 },
      { unit: "handful", unitAr: "كمشة", weightInGrams: 28 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 143 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "handful",
  },
  {
    name: "Walnuts",
    nameAr: "جوز",
    category: "nut",
    per100g: {
      caloricValue: 654, protein: 15.2, carbohydrates: 13.7, fat: 65.2,
      fiber: 6.7, sugar: 2.6, cholesterol: 0, sodium: 2,
      vitaminA: 0.001, vitaminB1: 0.341, vitaminB6: 0.537, vitaminB12: 0,
      vitaminC: 1.3, vitaminD: 0, calcium: 98, iron: 2.91,
      magnesium: 158, zinc: 3.09, nutritionDensity: 8.8,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 4 },
      { unit: "handful", unitAr: "كمشة", weightInGrams: 28 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 120 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "handful",
  },
  {
    name: "Peanuts",
    nameAr: "فول سوداني",
    category: "nut",
    per100g: {
      caloricValue: 567, protein: 25.8, carbohydrates: 16.1, fat: 49.2,
      fiber: 8.5, sugar: 4.7, cholesterol: 0, sodium: 18,
      vitaminA: 0, vitaminB1: 0.64, vitaminB6: 0.348, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 92, iron: 4.58,
      magnesium: 168, zinc: 3.27, nutritionDensity: 10.3,
    },
    servingUnits: [
      { unit: "handful", unitAr: "كمشة", weightInGrams: 28 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 146 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "handful",
  },
  {
    name: "Cashews",
    nameAr: "كاجو",
    category: "nut",
    per100g: {
      caloricValue: 553, protein: 18.2, carbohydrates: 30.2, fat: 43.9,
      fiber: 3.3, sugar: 5.9, cholesterol: 0, sodium: 12,
      vitaminA: 0, vitaminB1: 0.423, vitaminB6: 0.417, vitaminB12: 0,
      vitaminC: 0.5, vitaminD: 0, calcium: 37, iron: 6.68,
      magnesium: 292, zinc: 5.78, nutritionDensity: 9.5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 1.5 },
      { unit: "handful", unitAr: "كمشة", weightInGrams: 28 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "handful",
  },
  {
    name: "Pistachios",
    nameAr: "فستق",
    category: "nut",
    per100g: {
      caloricValue: 560, protein: 20.2, carbohydrates: 27.2, fat: 45.3,
      fiber: 10.6, sugar: 7.7, cholesterol: 0, sodium: 1,
      vitaminA: 0.026, vitaminB1: 0.87, vitaminB6: 1.7, vitaminB12: 0,
      vitaminC: 5.6, vitaminD: 0, calcium: 105, iron: 3.92,
      magnesium: 121, zinc: 2.2, nutritionDensity: 11.2,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 0.6 },
      { unit: "handful", unitAr: "كمشة", weightInGrams: 28 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "handful",
  },
  {
    name: "Peanut Butter",
    nameAr: "زبدة فول سوداني",
    category: "nut",
    per100g: {
      caloricValue: 588, protein: 25.1, carbohydrates: 20.0, fat: 50.4,
      fiber: 6.0, sugar: 9.2, cholesterol: 0, sodium: 459,
      vitaminA: 0, vitaminB1: 0.15, vitaminB6: 0.441, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 45, iron: 1.74,
      magnesium: 154, zinc: 2.51, nutritionDensity: 8.3,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 16 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 258 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Tahini (Sesame Paste)",
    nameAr: "طحينة",
    category: "nut",
    per100g: {
      caloricValue: 595, protein: 17.0, carbohydrates: 21.2, fat: 53.8,
      fiber: 9.3, sugar: 0.5, cholesterol: 0, sodium: 115,
      vitaminA: 0.003, vitaminB1: 1.22, vitaminB6: 0.149, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 426, iron: 8.95,
      magnesium: 95, zinc: 4.62, nutritionDensity: 9.0,
    },
    servingUnits: [{ unit: "tablespoon", unitAr: "معلقة", weightInGrams: 15 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "tablespoon",
  },

  // ========================  LEGUMES (7)  ========================
  {
    name: "Lentils (Cooked)",
    nameAr: "عدس مطبوخ",
    category: "legume",
    per100g: {
      caloricValue: 116, protein: 9.0, carbohydrates: 20.1, fat: 0.4,
      fiber: 7.9, sugar: 1.8, cholesterol: 0, sodium: 2,
      vitaminA: 0.001, vitaminB1: 0.169, vitaminB6: 0.178, vitaminB12: 0,
      vitaminC: 1.5, vitaminD: 0, calcium: 19, iron: 3.33,
      magnesium: 36, zinc: 1.27, nutritionDensity: 14.5,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 198 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Chickpeas (Cooked)",
    nameAr: "حمص مطبوخ",
    category: "legume",
    per100g: {
      caloricValue: 164, protein: 8.9, carbohydrates: 27.4, fat: 2.6,
      fiber: 7.6, sugar: 4.8, cholesterol: 0, sodium: 7,
      vitaminA: 0.001, vitaminB1: 0.116, vitaminB6: 0.139, vitaminB12: 0,
      vitaminC: 1.3, vitaminD: 0, calcium: 49, iron: 2.89,
      magnesium: 48, zinc: 1.53, nutritionDensity: 12.2,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 164 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Black Beans (Cooked)",
    nameAr: "فاصولياء سوداء مطبوخة",
    category: "legume",
    per100g: {
      caloricValue: 132, protein: 8.9, carbohydrates: 23.7, fat: 0.5,
      fiber: 8.7, sugar: 0.3, cholesterol: 0, sodium: 1,
      vitaminA: 0.001, vitaminB1: 0.244, vitaminB6: 0.069, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 27, iron: 2.1,
      magnesium: 70, zinc: 1.12, nutritionDensity: 13.0,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 172 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Kidney Beans (Cooked)",
    nameAr: "فاصولياء حمراء مطبوخة",
    category: "legume",
    per100g: {
      caloricValue: 127, protein: 8.7, carbohydrates: 22.8, fat: 0.5,
      fiber: 6.4, sugar: 2.0, cholesterol: 0, sodium: 2,
      vitaminA: 0, vitaminB1: 0.16, vitaminB6: 0.12, vitaminB12: 0,
      vitaminC: 1.2, vitaminD: 0, calcium: 28, iron: 2.94,
      magnesium: 45, zinc: 1.07, nutritionDensity: 13.8,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 177 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Fava Beans (Cooked)",
    nameAr: "فول مدمس",
    category: "legume",
    per100g: {
      caloricValue: 110, protein: 7.6, carbohydrates: 19.7, fat: 0.4,
      fiber: 5.4, sugar: 1.8, cholesterol: 0, sodium: 5,
      vitaminA: 0.003, vitaminB1: 0.097, vitaminB6: 0.072, vitaminB12: 0,
      vitaminC: 0.3, vitaminD: 0, calcium: 36, iron: 1.5,
      magnesium: 43, zinc: 1.01, nutritionDensity: 13.2,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 170 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Hummus",
    nameAr: "حمص بطحينة",
    category: "legume",
    per100g: {
      caloricValue: 166, protein: 7.9, carbohydrates: 14.3, fat: 9.6,
      fiber: 6.0, sugar: 0.3, cholesterol: 0, sodium: 379,
      vitaminA: 0.001, vitaminB1: 0.18, vitaminB6: 0.4, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 38, iron: 2.44,
      magnesium: 71, zinc: 1.83, nutritionDensity: 10.5,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 15 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 246 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Green Beans (Cooked)",
    nameAr: "فاصولياء خضراء مطبوخة",
    category: "legume",
    per100g: {
      caloricValue: 35, protein: 1.9, carbohydrates: 7.1, fat: 0.3,
      fiber: 3.2, sugar: 1.4, cholesterol: 0, sodium: 1,
      vitaminA: 0.035, vitaminB1: 0.084, vitaminB6: 0.141, vitaminB12: 0,
      vitaminC: 12.2, vitaminD: 0, calcium: 44, iron: 0.65,
      magnesium: 18, zinc: 0.24, nutritionDensity: 18.8,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 125 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },

  // ========================  OILS (3)  ========================
  {
    name: "Olive Oil",
    nameAr: "زيت زيتون",
    category: "oil",
    per100g: {
      caloricValue: 884, protein: 0, carbohydrates: 0, fat: 100.0,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 2,
      vitaminA: 0, vitaminB1: 0, vitaminB6: 0, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 1, iron: 0.56,
      magnesium: 0, zinc: 0, nutritionDensity: 2.8,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 14 },
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 5 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Coconut Oil",
    nameAr: "زيت جوز الهند",
    category: "oil",
    per100g: {
      caloricValue: 862, protein: 0, carbohydrates: 0, fat: 100.0,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 0,
      vitaminA: 0, vitaminB1: 0, vitaminB6: 0, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 0, iron: 0.04,
      magnesium: 0, zinc: 0, nutritionDensity: 1.5,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 14 },
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 5 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Sesame Oil",
    nameAr: "زيت سمسم",
    category: "oil",
    per100g: {
      caloricValue: 884, protein: 0, carbohydrates: 0, fat: 100.0,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 0,
      vitaminA: 0, vitaminB1: 0, vitaminB6: 0, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 0, iron: 0,
      magnesium: 0, zinc: 0, nutritionDensity: 1.2,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 14 },
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 5 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },

  // ========================  SWEETS (5)  ========================
  {
    name: "Honey",
    nameAr: "عسل",
    category: "sweet",
    per100g: {
      caloricValue: 304, protein: 0.3, carbohydrates: 82.4, fat: 0,
      fiber: 0.2, sugar: 82.1, cholesterol: 0, sodium: 4,
      vitaminA: 0, vitaminB1: 0, vitaminB6: 0.024, vitaminB12: 0,
      vitaminC: 0.5, vitaminD: 0, calcium: 6, iron: 0.42,
      magnesium: 2, zinc: 0.22, nutritionDensity: 2.5,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 21 },
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 7 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Sugar (White)",
    nameAr: "سكر أبيض",
    category: "sweet",
    per100g: {
      caloricValue: 387, protein: 0, carbohydrates: 100.0, fat: 0,
      fiber: 0, sugar: 100.0, cholesterol: 0, sodium: 1,
      vitaminA: 0, vitaminB1: 0, vitaminB6: 0, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 1, iron: 0.01,
      magnesium: 0, zinc: 0, nutritionDensity: 0.5,
    },
    servingUnits: [
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 4 },
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 12.5 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 200 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "teaspoon",
  },
  {
    name: "Dark Chocolate (70-85%)",
    nameAr: "شوكولاتة داكنة",
    category: "sweet",
    per100g: {
      caloricValue: 598, protein: 7.8, carbohydrates: 45.9, fat: 42.6,
      fiber: 10.9, sugar: 24.0, cholesterol: 3, sodium: 20,
      vitaminA: 0.002, vitaminB1: 0.034, vitaminB6: 0.038, vitaminB12: 0.00028,
      vitaminC: 0, vitaminD: 0, calcium: 73, iron: 11.9,
      magnesium: 228, zinc: 3.31, nutritionDensity: 7.5,
    },
    servingUnits: [
      { unit: "square", unitAr: "مربع", weightInGrams: 10 },
      { unit: "bar", unitAr: "لوح", weightInGrams: 40 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "square",
  },
  {
    name: "Milk Chocolate",
    nameAr: "شوكولاتة بالحليب",
    category: "sweet",
    per100g: {
      caloricValue: 535, protein: 7.6, carbohydrates: 59.4, fat: 29.7,
      fiber: 3.4, sugar: 52.0, cholesterol: 23, sodium: 79,
      vitaminA: 0.065, vitaminB1: 0.112, vitaminB6: 0.036, vitaminB12: 0.00075,
      vitaminC: 0, vitaminD: 0, calcium: 189, iron: 2.35,
      magnesium: 63, zinc: 2.3, nutritionDensity: 5.2,
    },
    servingUnits: [
      { unit: "square", unitAr: "مربع", weightInGrams: 10 },
      { unit: "bar", unitAr: "لوح", weightInGrams: 44 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "square",
  },
  {
    name: "Jam (Strawberry)",
    nameAr: "مربى فراولة",
    category: "sweet",
    per100g: {
      caloricValue: 250, protein: 0.4, carbohydrates: 65.0, fat: 0.1,
      fiber: 1.0, sugar: 48.5, cholesterol: 0, sodium: 32,
      vitaminA: 0.001, vitaminB1: 0.01, vitaminB6: 0.023, vitaminB12: 0,
      vitaminC: 9.0, vitaminD: 0, calcium: 20, iron: 0.49,
      magnesium: 5, zinc: 0.06, nutritionDensity: 3.5,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 20 },
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 7 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },

  // ========================  BEVERAGES (7)  ========================
  {
    name: "Orange Juice",
    nameAr: "عصير برتقال",
    category: "beverage",
    per100g: {
      caloricValue: 45, protein: 0.7, carbohydrates: 10.4, fat: 0.2,
      fiber: 0.2, sugar: 8.4, cholesterol: 0, sodium: 1,
      vitaminA: 0.01, vitaminB1: 0.09, vitaminB6: 0.04, vitaminB12: 0,
      vitaminC: 50.0, vitaminD: 0, calcium: 11, iron: 0.2,
      magnesium: 11, zinc: 0.05, nutritionDensity: 12.5,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 248 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Apple Juice",
    nameAr: "عصير تفاح",
    category: "beverage",
    per100g: {
      caloricValue: 46, protein: 0.1, carbohydrates: 11.3, fat: 0.1,
      fiber: 0.1, sugar: 9.6, cholesterol: 0, sodium: 4,
      vitaminA: 0.001, vitaminB1: 0.021, vitaminB6: 0.018, vitaminB12: 0,
      vitaminC: 0.9, vitaminD: 0, calcium: 8, iron: 0.12,
      magnesium: 5, zinc: 0.02, nutritionDensity: 4.5,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 248 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Coffee (Black, Brewed)",
    nameAr: "قهوة سوداء",
    category: "beverage",
    per100g: {
      caloricValue: 1, protein: 0.1, carbohydrates: 0, fat: 0,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 2,
      vitaminA: 0, vitaminB1: 0.014, vitaminB6: 0.001, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 2, iron: 0.01,
      magnesium: 3, zinc: 0.02, nutritionDensity: 15.0,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 237 },
      { unit: "espresso shot", unitAr: "شوت اسبريسو", weightInGrams: 30 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Tea (Black, Brewed)",
    nameAr: "شاي أسود",
    category: "beverage",
    per100g: {
      caloricValue: 1, protein: 0, carbohydrates: 0.3, fat: 0,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 3,
      vitaminA: 0, vitaminB1: 0, vitaminB6: 0, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 0, iron: 0.02,
      magnesium: 1, zinc: 0.01, nutritionDensity: 10.0,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 237 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Green Tea (Brewed)",
    nameAr: "شاي أخضر",
    category: "beverage",
    per100g: {
      caloricValue: 1, protein: 0.2, carbohydrates: 0, fat: 0,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 1,
      vitaminA: 0, vitaminB1: 0.007, vitaminB6: 0.005, vitaminB12: 0,
      vitaminC: 0.3, vitaminD: 0, calcium: 0, iron: 0.02,
      magnesium: 1, zinc: 0.01, nutritionDensity: 12.0,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 237 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },
  {
    name: "Lemon Juice",
    nameAr: "عصير ليمون",
    category: "beverage",
    per100g: {
      caloricValue: 22, protein: 0.4, carbohydrates: 6.9, fat: 0.2,
      fiber: 0.3, sugar: 2.5, cholesterol: 0, sodium: 1,
      vitaminA: 0.001, vitaminB1: 0.024, vitaminB6: 0.046, vitaminB12: 0,
      vitaminC: 38.7, vitaminD: 0, calcium: 6, iron: 0.08,
      magnesium: 6, zinc: 0.05, nutritionDensity: 22.0,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 15 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 244 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Coconut Water",
    nameAr: "ماء جوز الهند",
    category: "beverage",
    per100g: {
      caloricValue: 19, protein: 0.7, carbohydrates: 3.7, fat: 0.2,
      fiber: 1.1, sugar: 2.6, cholesterol: 0, sodium: 105,
      vitaminA: 0, vitaminB1: 0.03, vitaminB6: 0.032, vitaminB12: 0,
      vitaminC: 2.4, vitaminD: 0, calcium: 24, iron: 0.29,
      magnesium: 25, zinc: 0.1, nutritionDensity: 16.0,
    },
    servingUnits: [{ unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "cup",
  },

  // ========================  EXTRAS (herbs, misc)  ========================
  {
    name: "Parsley",
    nameAr: "بقدونس",
    category: "vegetable",
    per100g: {
      caloricValue: 36, protein: 3.0, carbohydrates: 6.3, fat: 0.8,
      fiber: 3.3, sugar: 0.9, cholesterol: 0, sodium: 56,
      vitaminA: 0.421, vitaminB1: 0.086, vitaminB6: 0.09, vitaminB12: 0,
      vitaminC: 133.0, vitaminD: 0, calcium: 138, iron: 6.2,
      magnesium: 50, zinc: 1.07, nutritionDensity: 38.0,
    },
    servingUnits: [
      { unit: "cup chopped", unitAr: "كوباية مفرومة", weightInGrams: 60 },
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 4 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Mint (Fresh)",
    nameAr: "نعناع طازج",
    category: "vegetable",
    per100g: {
      caloricValue: 44, protein: 3.3, carbohydrates: 8.4, fat: 0.7,
      fiber: 6.8, sugar: 0, cholesterol: 0, sodium: 30,
      vitaminA: 0.212, vitaminB1: 0.078, vitaminB6: 0.129, vitaminB12: 0,
      vitaminC: 13.3, vitaminD: 0, calcium: 199, iron: 11.87,
      magnesium: 63, zinc: 1.09, nutritionDensity: 35.0,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 2 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 14 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Okra",
    nameAr: "بامية",
    category: "vegetable",
    per100g: {
      caloricValue: 33, protein: 1.9, carbohydrates: 7.5, fat: 0.2,
      fiber: 3.2, sugar: 1.5, cholesterol: 0, sodium: 7,
      vitaminA: 0.036, vitaminB1: 0.2, vitaminB6: 0.215, vitaminB12: 0,
      vitaminC: 23.0, vitaminD: 0, calcium: 82, iron: 0.62,
      magnesium: 57, zinc: 0.58, nutritionDensity: 22.0,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 100 },
      { unit: "piece", unitAr: "واحدة", weightInGrams: 12 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Whey Protein Powder",
    nameAr: "بروتين مصل اللبن",
    category: "protein",
    per100g: {
      caloricValue: 374, protein: 78.0, carbohydrates: 8.0, fat: 3.5,
      fiber: 0, sugar: 3.0, cholesterol: 40, sodium: 200,
      vitaminA: 0, vitaminB1: 0.05, vitaminB6: 0.1, vitaminB12: 0.001,
      vitaminC: 0, vitaminD: 0, calcium: 400, iron: 2.0,
      magnesium: 80, zinc: 2.5, nutritionDensity: 16.0,
    },
    servingUnits: [{ unit: "scoop", unitAr: "مكيال", weightInGrams: 30 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "scoop",
  },
  {
    name: "Ghee (Clarified Butter)",
    nameAr: "سمن",
    category: "oil",
    per100g: {
      caloricValue: 876, protein: 0, carbohydrates: 0, fat: 99.5,
      fiber: 0, sugar: 0, cholesterol: 256, sodium: 2,
      vitaminA: 0.84, vitaminB1: 0, vitaminB6: 0, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0.0015, calcium: 4, iron: 0,
      magnesium: 0, zinc: 0, nutritionDensity: 2.0,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 14 },
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 5 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Dried Apricots",
    nameAr: "مشمش مجفف",
    category: "fruit",
    per100g: {
      caloricValue: 241, protein: 3.4, carbohydrates: 62.6, fat: 0.5,
      fiber: 7.3, sugar: 53.4, cholesterol: 0, sodium: 10,
      vitaminA: 0.18, vitaminB1: 0.015, vitaminB6: 0.143, vitaminB12: 0,
      vitaminC: 1.0, vitaminD: 0, calcium: 55, iron: 2.66,
      magnesium: 32, zinc: 0.39, nutritionDensity: 7.2,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 7 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 130 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Raisins",
    nameAr: "زبيب",
    category: "fruit",
    per100g: {
      caloricValue: 299, protein: 3.1, carbohydrates: 79.2, fat: 0.5,
      fiber: 3.7, sugar: 59.2, cholesterol: 0, sodium: 11,
      vitaminA: 0, vitaminB1: 0.106, vitaminB6: 0.174, vitaminB12: 0,
      vitaminC: 2.3, vitaminD: 0, calcium: 50, iron: 1.88,
      magnesium: 32, zinc: 0.22, nutritionDensity: 5.5,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 10 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 145 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Celery",
    nameAr: "كرفس",
    category: "vegetable",
    per100g: {
      caloricValue: 14, protein: 0.7, carbohydrates: 3.0, fat: 0.2,
      fiber: 1.6, sugar: 1.3, cholesterol: 0, sodium: 80,
      vitaminA: 0.022, vitaminB1: 0.021, vitaminB6: 0.074, vitaminB12: 0,
      vitaminC: 3.1, vitaminD: 0, calcium: 40, iron: 0.2,
      magnesium: 11, zinc: 0.13, nutritionDensity: 20.0,
    },
    servingUnits: [
      { unit: "stalk", unitAr: "عود", weightInGrams: 40 },
      { unit: "cup chopped", unitAr: "كوباية مقطعة", weightInGrams: 101 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "stalk",
  },
  {
    name: "Radish",
    nameAr: "فجل",
    category: "vegetable",
    per100g: {
      caloricValue: 16, protein: 0.7, carbohydrates: 3.4, fat: 0.1,
      fiber: 1.6, sugar: 1.9, cholesterol: 0, sodium: 39,
      vitaminA: 0.001, vitaminB1: 0.012, vitaminB6: 0.071, vitaminB12: 0,
      vitaminC: 14.8, vitaminD: 0, calcium: 25, iron: 0.34,
      magnesium: 10, zinc: 0.28, nutritionDensity: 21.5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 4.5 },
      { unit: "cup sliced", unitAr: "كوباية شرائح", weightInGrams: 116 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup sliced",
  },
  {
    name: "Turnip",
    nameAr: "لفت",
    category: "vegetable",
    per100g: {
      caloricValue: 28, protein: 0.9, carbohydrates: 6.4, fat: 0.1,
      fiber: 1.8, sugar: 3.8, cholesterol: 0, sodium: 67,
      vitaminA: 0, vitaminB1: 0.04, vitaminB6: 0.09, vitaminB12: 0,
      vitaminC: 21.0, vitaminD: 0, calcium: 30, iron: 0.3,
      magnesium: 11, zinc: 0.27, nutritionDensity: 18.0,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 122 },
      { unit: "cup cubed", unitAr: "كوباية مكعبات", weightInGrams: 130 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Beet",
    nameAr: "شمندر",
    category: "vegetable",
    per100g: {
      caloricValue: 43, protein: 1.6, carbohydrates: 9.6, fat: 0.2,
      fiber: 2.8, sugar: 6.8, cholesterol: 0, sodium: 78,
      vitaminA: 0.002, vitaminB1: 0.031, vitaminB6: 0.067, vitaminB12: 0,
      vitaminC: 4.9, vitaminD: 0, calcium: 16, iron: 0.8,
      magnesium: 23, zinc: 0.35, nutritionDensity: 14.5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 82 },
      { unit: "cup sliced", unitAr: "كوباية شرائح", weightInGrams: 136 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Artichoke",
    nameAr: "خرشوف",
    category: "vegetable",
    per100g: {
      caloricValue: 47, protein: 3.3, carbohydrates: 10.5, fat: 0.2,
      fiber: 5.4, sugar: 1.0, cholesterol: 0, sodium: 94,
      vitaminA: 0.001, vitaminB1: 0.072, vitaminB6: 0.116, vitaminB12: 0,
      vitaminC: 11.7, vitaminD: 0, calcium: 44, iron: 1.28,
      magnesium: 60, zinc: 0.49, nutritionDensity: 19.0,
    },
    servingUnits: [{ unit: "piece", unitAr: "واحدة", weightInGrams: 128 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }],
    defaultServingUnit: "piece",
  },
  {
    name: "Asparagus",
    nameAr: "هليون",
    category: "vegetable",
    per100g: {
      caloricValue: 20, protein: 2.2, carbohydrates: 3.9, fat: 0.1,
      fiber: 2.1, sugar: 1.9, cholesterol: 0, sodium: 2,
      vitaminA: 0.038, vitaminB1: 0.143, vitaminB6: 0.091, vitaminB12: 0,
      vitaminC: 5.6, vitaminD: 0, calcium: 24, iron: 2.14,
      magnesium: 14, zinc: 0.54, nutritionDensity: 27.0,
    },
    servingUnits: [
      { unit: "spear", unitAr: "عود", weightInGrams: 16 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 134 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Molasses (Pomegranate)",
    nameAr: "دبس رمان",
    category: "sweet",
    per100g: {
      caloricValue: 290, protein: 0.5, carbohydrates: 74.0, fat: 0,
      fiber: 0, sugar: 55.0, cholesterol: 0, sodium: 37,
      vitaminA: 0, vitaminB1: 0.01, vitaminB6: 0.02, vitaminB12: 0,
      vitaminC: 3.0, vitaminD: 0, calcium: 15, iron: 0.3,
      magnesium: 5, zinc: 0.1, nutritionDensity: 3.0,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 20 },
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 7 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Molasses (Date)",
    nameAr: "دبس تمر",
    category: "sweet",
    per100g: {
      caloricValue: 282, protein: 2.0, carbohydrates: 73.0, fat: 0.3,
      fiber: 2.0, sugar: 65.0, cholesterol: 0, sodium: 10,
      vitaminA: 0, vitaminB1: 0.03, vitaminB6: 0.15, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 60, iron: 1.2,
      magnesium: 40, zinc: 0.3, nutritionDensity: 4.5,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 20 },
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 7 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Arabic Coffee",
    nameAr: "قهوة عربية",
    category: "beverage",
    per100g: {
      caloricValue: 2, protein: 0.1, carbohydrates: 0.3, fat: 0,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 3,
      vitaminA: 0, vitaminB1: 0.01, vitaminB6: 0.001, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 3, iron: 0.02,
      magnesium: 5, zinc: 0.02, nutritionDensity: 13.0,
    },
    servingUnits: [
      { unit: "cup (finjan)", unitAr: "فنجان", weightInGrams: 80 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup (finjan)",
  },
  {
    name: "Turkish Coffee",
    nameAr: "قهوة تركية",
    category: "beverage",
    per100g: {
      caloricValue: 3, protein: 0.2, carbohydrates: 0.5, fat: 0,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 2,
      vitaminA: 0, vitaminB1: 0.02, vitaminB6: 0.002, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 4, iron: 0.02,
      magnesium: 7, zinc: 0.03, nutritionDensity: 14.0,
    },
    servingUnits: [
      { unit: "cup (finjan)", unitAr: "فنجان", weightInGrams: 60 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 }
    ],
    defaultServingUnit: "cup (finjan)",
  },
  // ========================  DAIRY additions (8)  ========================
  {
    name: "Laban Rayeb (Fermented Milk)",
    nameAr: "لبن رايب",
    category: "dairy",
    per100g: {
      caloricValue: 40, protein: 3.3, carbohydrates: 4.9, fat: 0.9,
      fiber: 0, sugar: 4.9, cholesterol: 4, sodium: 52,
      vitaminA: 0.011, vitaminB1: 0.034, vitaminB6: 0.034, vitaminB12: 0.00022,
      vitaminC: 1, vitaminD: 0.001, calcium: 116, iron: 0.05,
      magnesium: 11, zinc: 0.42, nutritionDensity: 15,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Cream (Heavy)",
    nameAr: "قشطة",
    category: "dairy",
    per100g: {
      caloricValue: 340, protein: 2, carbohydrates: 2.8, fat: 36.1,
      fiber: 0, sugar: 2.8, cholesterol: 137, sodium: 38,
      vitaminA: 0.411, vitaminB1: 0.022, vitaminB6: 0.028, vitaminB12: 0.00017,
      vitaminC: 0.6, vitaminD: 0.0005, calcium: 65, iron: 0.03,
      magnesium: 7, zinc: 0.23, nutritionDensity: 3.5,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 15 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Roumy Cheese",
    nameAr: "جبنة رومي",
    category: "dairy",
    per100g: {
      caloricValue: 380, protein: 28, carbohydrates: 1.5, fat: 29,
      fiber: 0, sugar: 0.5, cholesterol: 95, sodium: 820,
      vitaminA: 0.24, vitaminB1: 0.03, vitaminB6: 0.08, vitaminB12: 0.0015,
      vitaminC: 0, vitaminD: 0.0005, calcium: 720, iron: 0.44,
      magnesium: 30, zinc: 3.5, nutritionDensity: 11,
    },
    servingUnits: [
      { unit: "slice", unitAr: "شريحة", weightInGrams: 28 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "slice",
  },
  {
    name: "Processed Cheese (Nesto)",
    nameAr: "جبنة نستو",
    category: "dairy",
    per100g: {
      caloricValue: 303, protein: 18, carbohydrates: 4.7, fat: 24,
      fiber: 0, sugar: 4.7, cholesterol: 78, sodium: 1200,
      vitaminA: 0.25, vitaminB1: 0.02, vitaminB6: 0.06, vitaminB12: 0.001,
      vitaminC: 0, vitaminD: 0.0006, calcium: 550, iron: 0.35,
      magnesium: 22, zinc: 2.8, nutritionDensity: 8,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 18 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Sweetened Condensed Milk",
    nameAr: "حليب مكثف محلى",
    category: "dairy",
    per100g: {
      caloricValue: 321, protein: 7.9, carbohydrates: 54.4, fat: 8.7,
      fiber: 0, sugar: 54.4, cholesterol: 34, sodium: 142,
      vitaminA: 0.065, vitaminB1: 0.04, vitaminB6: 0.046, vitaminB12: 0.00044,
      vitaminC: 2.6, vitaminD: 0.0008, calcium: 284, iron: 0.19,
      magnesium: 26, zinc: 0.94, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 19 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Milk Powder (Whole)",
    nameAr: "لبن بودرة",
    category: "dairy",
    per100g: {
      caloricValue: 496, protein: 26.3, carbohydrates: 38.4, fat: 26.7,
      fiber: 0, sugar: 38.4, cholesterol: 97, sodium: 371,
      vitaminA: 0.27, vitaminB1: 0.28, vitaminB6: 0.3, vitaminB12: 0.0032,
      vitaminC: 7.6, vitaminD: 0.008, calcium: 912, iron: 0.47,
      magnesium: 85, zinc: 3.34, nutritionDensity: 12,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 8 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Mish Cheese (Aged Egyptian)",
    nameAr: "جبنة مش",
    category: "dairy",
    per100g: {
      caloricValue: 290, protein: 20, carbohydrates: 3, fat: 22,
      fiber: 0, sugar: 1, cholesterol: 70, sodium: 1500,
      vitaminA: 0.18, vitaminB1: 0.03, vitaminB6: 0.07, vitaminB12: 0.001,
      vitaminC: 0, vitaminD: 0.0003, calcium: 500, iron: 0.5,
      magnesium: 25, zinc: 2.5, nutritionDensity: 7,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 15 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Vanilla Ice Cream",
    nameAr: "آيس كريم فانيليا",
    category: "dairy",
    per100g: {
      caloricValue: 207, protein: 3.5, carbohydrates: 23.6, fat: 11,
      fiber: 0, sugar: 21.2, cholesterol: 44, sodium: 80,
      vitaminA: 0.12, vitaminB1: 0.041, vitaminB6: 0.048, vitaminB12: 0.00039,
      vitaminC: 0.6, vitaminD: 0.0003, calcium: 128, iron: 0.09,
      magnesium: 14, zinc: 0.69, nutritionDensity: 5.5,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 132 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },

  // ========================  FRUITS additions (10)  ========================
  {
    name: "Guava",
    nameAr: "جوافة",
    category: "fruit",
    per100g: {
      caloricValue: 68, protein: 2.6, carbohydrates: 14.3, fat: 1,
      fiber: 5.4, sugar: 8.9, cholesterol: 0, sodium: 2,
      vitaminA: 0.031, vitaminB1: 0.067, vitaminB6: 0.11, vitaminB12: 0,
      vitaminC: 228.3, vitaminD: 0, calcium: 18, iron: 0.26,
      magnesium: 22, zinc: 0.23, nutritionDensity: 28,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 55 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Mandarin (Tangerine)",
    nameAr: "يوسفي",
    category: "fruit",
    per100g: {
      caloricValue: 53, protein: 0.8, carbohydrates: 13.3, fat: 0.3,
      fiber: 1.8, sugar: 10.6, cholesterol: 0, sodium: 2,
      vitaminA: 0.034, vitaminB1: 0.058, vitaminB6: 0.078, vitaminB12: 0,
      vitaminC: 26.7, vitaminD: 0, calcium: 37, iron: 0.15,
      magnesium: 12, zinc: 0.07, nutritionDensity: 18,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 88 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Prickly Pear",
    nameAr: "تين شوكي",
    category: "fruit",
    per100g: {
      caloricValue: 41, protein: 0.7, carbohydrates: 9.6, fat: 0.5,
      fiber: 3.6, sugar: 6, cholesterol: 0, sodium: 5,
      vitaminA: 0.002, vitaminB1: 0.014, vitaminB6: 0.06, vitaminB12: 0,
      vitaminC: 14, vitaminD: 0, calcium: 56, iron: 0.3,
      magnesium: 85, zinc: 0.12, nutritionDensity: 16,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 103 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Apricot (Fresh)",
    nameAr: "مشمش",
    category: "fruit",
    per100g: {
      caloricValue: 48, protein: 1.4, carbohydrates: 11.1, fat: 0.4,
      fiber: 2, sugar: 9.2, cholesterol: 0, sodium: 1,
      vitaminA: 0.096, vitaminB1: 0.03, vitaminB6: 0.054, vitaminB12: 0,
      vitaminC: 10, vitaminD: 0, calcium: 13, iron: 0.39,
      magnesium: 10, zinc: 0.2, nutritionDensity: 17.5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 35 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Plum",
    nameAr: "برقوق",
    category: "fruit",
    per100g: {
      caloricValue: 46, protein: 0.7, carbohydrates: 11.4, fat: 0.3,
      fiber: 1.4, sugar: 9.9, cholesterol: 0, sodium: 0,
      vitaminA: 0.017, vitaminB1: 0.028, vitaminB6: 0.029, vitaminB12: 0,
      vitaminC: 9.5, vitaminD: 0, calcium: 6, iron: 0.17,
      magnesium: 7, zinc: 0.1, nutritionDensity: 15,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 66 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Cantaloupe",
    nameAr: "كانتلوب",
    category: "fruit",
    per100g: {
      caloricValue: 34, protein: 0.8, carbohydrates: 8.2, fat: 0.2,
      fiber: 0.9, sugar: 7.9, cholesterol: 0, sodium: 16,
      vitaminA: 0.169, vitaminB1: 0.041, vitaminB6: 0.072, vitaminB12: 0,
      vitaminC: 36.7, vitaminD: 0, calcium: 9, iron: 0.21,
      magnesium: 12, zinc: 0.18, nutritionDensity: 22,
    },
    servingUnits: [
      { unit: "cup diced", unitAr: "كوباية مكعبات", weightInGrams: 160 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup diced",
  },
  {
    name: "Honeydew Melon",
    nameAr: "شمام",
    category: "fruit",
    per100g: {
      caloricValue: 36, protein: 0.5, carbohydrates: 9.1, fat: 0.1,
      fiber: 0.8, sugar: 8.1, cholesterol: 0, sodium: 18,
      vitaminA: 0.003, vitaminB1: 0.038, vitaminB6: 0.088, vitaminB12: 0,
      vitaminC: 18, vitaminD: 0, calcium: 6, iron: 0.17,
      magnesium: 10, zinc: 0.09, nutritionDensity: 16,
    },
    servingUnits: [
      { unit: "cup diced", unitAr: "كوباية مكعبات", weightInGrams: 170 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup diced",
  },
  {
    name: "Lemon",
    nameAr: "ليمون",
    category: "fruit",
    per100g: {
      caloricValue: 29, protein: 1.1, carbohydrates: 9.3, fat: 0.3,
      fiber: 2.8, sugar: 2.5, cholesterol: 0, sodium: 2,
      vitaminA: 0.001, vitaminB1: 0.04, vitaminB6: 0.08, vitaminB12: 0,
      vitaminC: 53, vitaminD: 0, calcium: 26, iron: 0.6,
      magnesium: 8, zinc: 0.06, nutritionDensity: 24,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 58 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Cherry",
    nameAr: "كرز",
    category: "fruit",
    per100g: {
      caloricValue: 63, protein: 1.1, carbohydrates: 16, fat: 0.2,
      fiber: 2.1, sugar: 12.8, cholesterol: 0, sodium: 0,
      vitaminA: 0.003, vitaminB1: 0.027, vitaminB6: 0.049, vitaminB12: 0,
      vitaminC: 7, vitaminD: 0, calcium: 13, iron: 0.36,
      magnesium: 11, zinc: 0.07, nutritionDensity: 14,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 8 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 138 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Mulberry",
    nameAr: "توت",
    category: "fruit",
    per100g: {
      caloricValue: 43, protein: 1.4, carbohydrates: 9.8, fat: 0.4,
      fiber: 1.7, sugar: 8.1, cholesterol: 0, sodium: 10,
      vitaminA: 0.001, vitaminB1: 0.029, vitaminB6: 0.05, vitaminB12: 0,
      vitaminC: 36.4, vitaminD: 0, calcium: 39, iron: 1.85,
      magnesium: 18, zinc: 0.12, nutritionDensity: 20,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 140 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },

  // ========================  VEGETABLES additions (10)  ========================
  {
    name: "Molokhia (Jute Leaves)",
    nameAr: "ملوخية",
    category: "vegetable",
    per100g: {
      caloricValue: 32, protein: 3.5, carbohydrates: 4, fat: 0.2,
      fiber: 2, sugar: 0.5, cholesterol: 0, sodium: 12,
      vitaminA: 0.26, vitaminB1: 0.1, vitaminB6: 0.12, vitaminB12: 0,
      vitaminC: 28, vitaminD: 0, calcium: 210, iron: 3.7,
      magnesium: 58, zinc: 0.6, nutritionDensity: 35,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 160 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Green Bell Pepper",
    nameAr: "فلفل أخضر",
    category: "vegetable",
    per100g: {
      caloricValue: 20, protein: 0.9, carbohydrates: 4.6, fat: 0.2,
      fiber: 1.7, sugar: 2.4, cholesterol: 0, sodium: 3,
      vitaminA: 0.018, vitaminB1: 0.057, vitaminB6: 0.224, vitaminB12: 0,
      vitaminC: 80.4, vitaminD: 0, calcium: 10, iron: 0.34,
      magnesium: 10, zinc: 0.13, nutritionDensity: 26,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 119 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Arugula (Rocket)",
    nameAr: "جرجير",
    category: "vegetable",
    per100g: {
      caloricValue: 25, protein: 2.6, carbohydrates: 3.7, fat: 0.7,
      fiber: 1.6, sugar: 2.1, cholesterol: 0, sodium: 27,
      vitaminA: 0.119, vitaminB1: 0.044, vitaminB6: 0.073, vitaminB12: 0,
      vitaminC: 15, vitaminD: 0, calcium: 160, iron: 1.46,
      magnesium: 47, zinc: 0.47, nutritionDensity: 32,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 20 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Grape Leaves (Raw)",
    nameAr: "ورق عنب",
    category: "vegetable",
    per100g: {
      caloricValue: 93, protein: 5.6, carbohydrates: 17.3, fat: 2.1,
      fiber: 11, sugar: 6.3, cholesterol: 0, sodium: 9,
      vitaminA: 0.161, vitaminB1: 0.04, vitaminB6: 0.4, vitaminB12: 0,
      vitaminC: 11, vitaminD: 0, calcium: 363, iron: 2.63,
      magnesium: 95, zinc: 0.67, nutritionDensity: 22,
    },
    servingUnits: [
      { unit: "leaf", unitAr: "ورقة", weightInGrams: 3 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 50 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "leaf",
  },
  {
    name: "Taro",
    nameAr: "قلقاس",
    category: "vegetable",
    per100g: {
      caloricValue: 112, protein: 1.5, carbohydrates: 26.5, fat: 0.2,
      fiber: 4.1, sugar: 0.4, cholesterol: 0, sodium: 11,
      vitaminA: 0.004, vitaminB1: 0.095, vitaminB6: 0.283, vitaminB12: 0,
      vitaminC: 4.5, vitaminD: 0, calcium: 43, iron: 0.55,
      magnesium: 33, zinc: 0.23, nutritionDensity: 12,
    },
    servingUnits: [
      { unit: "cup sliced", unitAr: "كوباية شرائح", weightInGrams: 132 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup sliced",
  },
  {
    name: "Hot Chili Pepper",
    nameAr: "فلفل حار",
    category: "vegetable",
    per100g: {
      caloricValue: 40, protein: 1.9, carbohydrates: 8.8, fat: 0.4,
      fiber: 1.5, sugar: 5.3, cholesterol: 0, sodium: 9,
      vitaminA: 0.048, vitaminB1: 0.072, vitaminB6: 0.506, vitaminB12: 0,
      vitaminC: 143.7, vitaminD: 0, calcium: 14, iron: 1.03,
      magnesium: 23, zinc: 0.26, nutritionDensity: 30,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 45 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Leek",
    nameAr: "كرات",
    category: "vegetable",
    per100g: {
      caloricValue: 61, protein: 1.5, carbohydrates: 14.2, fat: 0.3,
      fiber: 1.8, sugar: 3.9, cholesterol: 0, sodium: 20,
      vitaminA: 0.083, vitaminB1: 0.06, vitaminB6: 0.233, vitaminB12: 0,
      vitaminC: 12, vitaminD: 0, calcium: 59, iron: 2.1,
      magnesium: 28, zinc: 0.12, nutritionDensity: 18,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 89 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Swiss Chard",
    nameAr: "سلق",
    category: "vegetable",
    per100g: {
      caloricValue: 19, protein: 1.8, carbohydrates: 3.7, fat: 0.2,
      fiber: 1.6, sugar: 1.1, cholesterol: 0, sodium: 213,
      vitaminA: 0.306, vitaminB1: 0.04, vitaminB6: 0.099, vitaminB12: 0,
      vitaminC: 30, vitaminD: 0, calcium: 51, iron: 1.8,
      magnesium: 81, zinc: 0.36, nutritionDensity: 33,
    },
    servingUnits: [
      { unit: "cup chopped", unitAr: "كوباية مقطعة", weightInGrams: 36 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup chopped",
  },
  {
    name: "Green Onion (Scallion)",
    nameAr: "بصل أخضر",
    category: "vegetable",
    per100g: {
      caloricValue: 32, protein: 1.8, carbohydrates: 7.3, fat: 0.2,
      fiber: 2.6, sugar: 2.3, cholesterol: 0, sodium: 16,
      vitaminA: 0.05, vitaminB1: 0.055, vitaminB6: 0.061, vitaminB12: 0,
      vitaminC: 18.8, vitaminD: 0, calcium: 72, iron: 1.48,
      magnesium: 20, zinc: 0.39, nutritionDensity: 24,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 15 },
      { unit: "cup chopped", unitAr: "كوباية مقطعة", weightInGrams: 100 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Dill (Fresh)",
    nameAr: "شبت",
    category: "vegetable",
    per100g: {
      caloricValue: 43, protein: 3.5, carbohydrates: 7, fat: 1.1,
      fiber: 2.1, sugar: 0, cholesterol: 0, sodium: 61,
      vitaminA: 0.386, vitaminB1: 0.058, vitaminB6: 0.185, vitaminB12: 0,
      vitaminC: 85, vitaminD: 0, calcium: 208, iron: 6.59,
      magnesium: 55, zinc: 0.91, nutritionDensity: 36,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 1 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 9 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },

  // ========================  GRAINS additions (8)  ========================
  {
    name: "Freekeh (Cooked)",
    nameAr: "فريك مطبوخ",
    category: "grain",
    per100g: {
      caloricValue: 154, protein: 5.6, carbohydrates: 30, fat: 1,
      fiber: 4.5, sugar: 0.5, cholesterol: 0, sodium: 5,
      vitaminA: 0, vitaminB1: 0.1, vitaminB6: 0.1, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 20, iron: 1.5,
      magnesium: 40, zinc: 1, nutritionDensity: 14,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 180 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Egyptian Baladi Bread",
    nameAr: "عيش بلدي",
    category: "grain",
    per100g: {
      caloricValue: 275, protein: 9.8, carbohydrates: 55.7, fat: 1.2,
      fiber: 4, sugar: 1.8, cholesterol: 0, sodium: 500,
      vitaminA: 0, vitaminB1: 0.3, vitaminB6: 0.15, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 60, iron: 2.8,
      magnesium: 50, zinc: 1.2, nutritionDensity: 13,
    },
    servingUnits: [
      { unit: "loaf", unitAr: "رغيف", weightInGrams: 90 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "loaf",
  },
  {
    name: "Fino Bread Roll",
    nameAr: "عيش فينو",
    category: "grain",
    per100g: {
      caloricValue: 290, protein: 8.5, carbohydrates: 53, fat: 5,
      fiber: 2, sugar: 4.5, cholesterol: 0, sodium: 450,
      vitaminA: 0, vitaminB1: 0.25, vitaminB6: 0.08, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 40, iron: 2,
      magnesium: 22, zinc: 0.7, nutritionDensity: 9,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 60 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Bran Bread",
    nameAr: "عيش سن",
    category: "grain",
    per100g: {
      caloricValue: 250, protein: 10.5, carbohydrates: 46, fat: 3.5,
      fiber: 7, sugar: 2, cholesterol: 0, sodium: 480,
      vitaminA: 0, vitaminB1: 0.35, vitaminB6: 0.2, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 55, iron: 3.2,
      magnesium: 75, zinc: 1.8, nutritionDensity: 15,
    },
    servingUnits: [
      { unit: "slice", unitAr: "شريحة", weightInGrams: 30 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "slice",
  },
  {
    name: "Toast (Rusks)",
    nameAr: "بقسماط",
    category: "grain",
    per100g: {
      caloricValue: 407, protein: 11, carbohydrates: 74, fat: 7.5,
      fiber: 3, sugar: 8, cholesterol: 0, sodium: 380,
      vitaminA: 0, vitaminB1: 0.15, vitaminB6: 0.06, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 30, iron: 1.5,
      magnesium: 18, zinc: 0.5, nutritionDensity: 6,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 10 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Basmati Rice (Cooked)",
    nameAr: "أرز بسمتي مطبوخ",
    category: "grain",
    per100g: {
      caloricValue: 121, protein: 3.5, carbohydrates: 25.2, fat: 0.4,
      fiber: 0.4, sugar: 0, cholesterol: 0, sodium: 1,
      vitaminA: 0, vitaminB1: 0.07, vitaminB6: 0.05, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 7, iron: 0.2,
      magnesium: 12, zinc: 0.4, nutritionDensity: 9,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 180 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Vermicelli (Cooked)",
    nameAr: "شعرية مطبوخة",
    category: "grain",
    per100g: {
      caloricValue: 130, protein: 4.2, carbohydrates: 25.8, fat: 0.6,
      fiber: 1, sugar: 0.5, cholesterol: 0, sodium: 2,
      vitaminA: 0, vitaminB1: 0.08, vitaminB6: 0.03, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 10, iron: 0.7,
      magnesium: 15, zinc: 0.4, nutritionDensity: 8,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 170 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Orzo Pasta (Cooked)",
    nameAr: "لسان عصفور مطبوخ",
    category: "grain",
    per100g: {
      caloricValue: 126, protein: 4.4, carbohydrates: 24.8, fat: 0.7,
      fiber: 1, sugar: 0.4, cholesterol: 0, sodium: 1,
      vitaminA: 0, vitaminB1: 0.06, vitaminB6: 0.04, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 8, iron: 0.6,
      magnesium: 14, zinc: 0.5, nutritionDensity: 8.5,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 165 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },

  // ========================  PROTEIN additions (13)  ========================
  {
    name: "Chicken Liver (Cooked)",
    nameAr: "كبدة فراخ",
    category: "protein",
    per100g: {
      caloricValue: 167, protein: 24.5, carbohydrates: 0.7, fat: 6.5,
      fiber: 0, sugar: 0, cholesterol: 345, sodium: 71,
      vitaminA: 3.296, vitaminB1: 0.291, vitaminB6: 0.75, vitaminB12: 0.01638,
      vitaminC: 17.9, vitaminD: 0.0002, calcium: 8, iron: 8.99,
      magnesium: 19, zinc: 2.67, nutritionDensity: 30,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 20 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 140 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Chicken Gizzards (Cooked)",
    nameAr: "قوانص",
    category: "protein",
    per100g: {
      caloricValue: 154, protein: 30.4, carbohydrates: 0, fat: 2.7,
      fiber: 0, sugar: 0, cholesterol: 240, sodium: 68,
      vitaminA: 0.019, vitaminB1: 0.024, vitaminB6: 0.11, vitaminB12: 0.00131,
      vitaminC: 3.7, vitaminD: 0, calcium: 11, iron: 3.19,
      magnesium: 15, zinc: 4.42, nutritionDensity: 18,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 145 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Sujuk (Sausage)",
    nameAr: "سجق",
    category: "protein",
    per100g: {
      caloricValue: 320, protein: 16, carbohydrates: 2, fat: 28,
      fiber: 0, sugar: 0.5, cholesterol: 80, sodium: 950,
      vitaminA: 0.01, vitaminB1: 0.1, vitaminB6: 0.2, vitaminB12: 0.001,
      vitaminC: 0, vitaminD: 0.0003, calcium: 12, iron: 2,
      magnesium: 15, zinc: 3, nutritionDensity: 7,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 60 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Bastirma (Cured Beef)",
    nameAr: "بسطرمة",
    category: "protein",
    per100g: {
      caloricValue: 230, protein: 32, carbohydrates: 1, fat: 11,
      fiber: 0, sugar: 0, cholesterol: 90, sodium: 2500,
      vitaminA: 0.01, vitaminB1: 0.08, vitaminB6: 0.3, vitaminB12: 0.002,
      vitaminC: 0, vitaminD: 0.0002, calcium: 15, iron: 3.5,
      magnesium: 20, zinc: 5, nutritionDensity: 10,
    },
    servingUnits: [
      { unit: "slice", unitAr: "شريحة", weightInGrams: 10 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "slice",
  },
  {
    name: "Luncheon Meat",
    nameAr: "لانشون",
    category: "protein",
    per100g: {
      caloricValue: 262, protein: 12, carbohydrates: 3, fat: 22,
      fiber: 0, sugar: 1.5, cholesterol: 60, sodium: 1100,
      vitaminA: 0.01, vitaminB1: 0.12, vitaminB6: 0.1, vitaminB12: 0.0008,
      vitaminC: 0, vitaminD: 0.0003, calcium: 10, iron: 1.5,
      magnesium: 12, zinc: 1.8, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "slice", unitAr: "شريحة", weightInGrams: 28 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "slice",
  },
  {
    name: "Duck (Cooked)",
    nameAr: "بط مطبوخ",
    category: "protein",
    per100g: {
      caloricValue: 201, protein: 23.5, carbohydrates: 0, fat: 11.2,
      fiber: 0, sugar: 0, cholesterol: 89, sodium: 65,
      vitaminA: 0.024, vitaminB1: 0.26, vitaminB6: 0.26, vitaminB12: 0.0029,
      vitaminC: 0, vitaminD: 0.0003, calcium: 12, iron: 2.7,
      magnesium: 19, zinc: 2.6, nutritionDensity: 15,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 150 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Pigeon (Squab, Cooked)",
    nameAr: "حمام",
    category: "protein",
    per100g: {
      caloricValue: 175, protein: 22, carbohydrates: 0, fat: 9.5,
      fiber: 0, sugar: 0, cholesterol: 95, sodium: 52,
      vitaminA: 0.02, vitaminB1: 0.2, vitaminB6: 0.4, vitaminB12: 0.003,
      vitaminC: 5, vitaminD: 0.0002, calcium: 12, iron: 4.5,
      magnesium: 22, zinc: 2.5, nutritionDensity: 16,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 200 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Rabbit (Cooked)",
    nameAr: "أرانب",
    category: "protein",
    per100g: {
      caloricValue: 173, protein: 25, carbohydrates: 0, fat: 7.7,
      fiber: 0, sugar: 0, cholesterol: 82, sodium: 45,
      vitaminA: 0.01, vitaminB1: 0.04, vitaminB6: 0.35, vitaminB12: 0.0072,
      vitaminC: 0, vitaminD: 0, calcium: 18, iron: 1.57,
      magnesium: 22, zinc: 2.01, nutritionDensity: 16.5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 140 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Calamari (Squid, Cooked)",
    nameAr: "كاليماري",
    category: "protein",
    per100g: {
      caloricValue: 175, protein: 18, carbohydrates: 7.8, fat: 7.5,
      fiber: 0, sugar: 0, cholesterol: 233, sodium: 260,
      vitaminA: 0.01, vitaminB1: 0.02, vitaminB6: 0.06, vitaminB12: 0.0013,
      vitaminC: 4.7, vitaminD: 0, calcium: 33, iron: 0.68,
      magnesium: 33, zinc: 1.48, nutritionDensity: 11,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 140 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Tilapia (Cooked)",
    nameAr: "بلطي",
    category: "protein",
    per100g: {
      caloricValue: 128, protein: 26.2, carbohydrates: 0, fat: 2.7,
      fiber: 0, sugar: 0, cholesterol: 57, sodium: 52,
      vitaminA: 0, vitaminB1: 0.04, vitaminB6: 0.16, vitaminB12: 0.00158,
      vitaminC: 0, vitaminD: 0.0031, calcium: 14, iron: 0.69,
      magnesium: 34, zinc: 0.43, nutritionDensity: 20,
    },
    servingUnits: [
      { unit: "fillet", unitAr: "فيليه", weightInGrams: 87 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "fillet",
  },
  {
    name: "Mullet (Bouri, Cooked)",
    nameAr: "بوري",
    category: "protein",
    per100g: {
      caloricValue: 150, protein: 24.8, carbohydrates: 0, fat: 4.9,
      fiber: 0, sugar: 0, cholesterol: 63, sodium: 65,
      vitaminA: 0.04, vitaminB1: 0.08, vitaminB6: 0.42, vitaminB12: 0.00025,
      vitaminC: 1.2, vitaminD: 0, calcium: 26, iron: 1.41,
      magnesium: 29, zinc: 0.57, nutritionDensity: 17,
    },
    servingUnits: [
      { unit: "fillet", unitAr: "فيليه", weightInGrams: 120 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "fillet",
  },
  {
    name: "Mackerel (Cooked)",
    nameAr: "ماكريل",
    category: "protein",
    per100g: {
      caloricValue: 262, protein: 24, carbohydrates: 0, fat: 17.8,
      fiber: 0, sugar: 0, cholesterol: 75, sodium: 90,
      vitaminA: 0.05, vitaminB1: 0.13, vitaminB6: 0.4, vitaminB12: 0.019,
      vitaminC: 0.4, vitaminD: 0.016, calcium: 15, iron: 1.57,
      magnesium: 97, zinc: 0.63, nutritionDensity: 18,
    },
    servingUnits: [
      { unit: "fillet", unitAr: "فيليه", weightInGrams: 112 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "fillet",
  },
  {
    name: "Kofta (Grilled)",
    nameAr: "كفتة مشوية",
    category: "protein",
    per100g: {
      caloricValue: 226, protein: 18, carbohydrates: 4, fat: 15.5,
      fiber: 0.5, sugar: 1, cholesterol: 70, sodium: 450,
      vitaminA: 0.01, vitaminB1: 0.08, vitaminB6: 0.25, vitaminB12: 0.002,
      vitaminC: 2, vitaminD: 0.0002, calcium: 20, iron: 2.5,
      magnesium: 18, zinc: 4, nutritionDensity: 10,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 35 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },

  // ========================  LEGUMES additions (5)  ========================
  {
    name: "Sprouted Fava Beans",
    nameAr: "فول نابت",
    category: "legume",
    per100g: {
      caloricValue: 105, protein: 8.8, carbohydrates: 17.6, fat: 0.7,
      fiber: 5.5, sugar: 1.5, cholesterol: 0, sodium: 10,
      vitaminA: 0.003, vitaminB1: 0.19, vitaminB6: 0.08, vitaminB12: 0,
      vitaminC: 12, vitaminD: 0, calcium: 26, iron: 1.9,
      magnesium: 44, zinc: 1, nutritionDensity: 16,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 180 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Lupini Beans (Cooked)",
    nameAr: "ترمس",
    category: "legume",
    per100g: {
      caloricValue: 119, protein: 15.6, carbohydrates: 9.9, fat: 2.9,
      fiber: 2.8, sugar: 0.5, cholesterol: 0, sodium: 4,
      vitaminA: 0.001, vitaminB1: 0.1, vitaminB6: 0.01, vitaminB12: 0,
      vitaminC: 1.1, vitaminD: 0, calcium: 51, iron: 1.2,
      magnesium: 54, zinc: 1.38, nutritionDensity: 17,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 166 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Black-Eyed Peas (Cooked)",
    nameAr: "لوبيا",
    category: "legume",
    per100g: {
      caloricValue: 116, protein: 7.7, carbohydrates: 20.8, fat: 0.5,
      fiber: 6.5, sugar: 3.3, cholesterol: 0, sodium: 4,
      vitaminA: 0.015, vitaminB1: 0.2, vitaminB6: 0.1, vitaminB12: 0,
      vitaminC: 0.4, vitaminD: 0, calcium: 24, iron: 2.51,
      magnesium: 53, zinc: 1.29, nutritionDensity: 15,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 170 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "White Beans (Cooked)",
    nameAr: "فاصوليا بيضاء مطبوخة",
    category: "legume",
    per100g: {
      caloricValue: 139, protein: 9.7, carbohydrates: 25.1, fat: 0.4,
      fiber: 6.3, sugar: 0.3, cholesterol: 0, sodium: 6,
      vitaminA: 0, vitaminB1: 0.15, vitaminB6: 0.12, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 90, iron: 3.7,
      magnesium: 63, zinc: 1.03, nutritionDensity: 14.5,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 179 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Yellow Lentils (Cooked)",
    nameAr: "عدس أصفر مطبوخ",
    category: "legume",
    per100g: {
      caloricValue: 106, protein: 8.3, carbohydrates: 18, fat: 0.4,
      fiber: 3.5, sugar: 1.5, cholesterol: 0, sodium: 10,
      vitaminA: 0.001, vitaminB1: 0.12, vitaminB6: 0.15, vitaminB12: 0,
      vitaminC: 1, vitaminD: 0, calcium: 16, iron: 2,
      magnesium: 22, zinc: 0.8, nutritionDensity: 16,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 198 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },

  // ========================  NUTS additions (8)  ========================
  {
    name: "Hazelnuts",
    nameAr: "بندق",
    category: "nut",
    per100g: {
      caloricValue: 628, protein: 15, carbohydrates: 16.7, fat: 60.8,
      fiber: 9.7, sugar: 4.3, cholesterol: 0, sodium: 0,
      vitaminA: 0.001, vitaminB1: 0.643, vitaminB6: 0.563, vitaminB12: 0,
      vitaminC: 6.3, vitaminD: 0, calcium: 114, iron: 4.7,
      magnesium: 163, zinc: 2.45, nutritionDensity: 12,
    },
    servingUnits: [
      { unit: "handful", unitAr: "كمشة", weightInGrams: 30 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "handful",
  },
  {
    name: "Roasted Peanuts",
    nameAr: "سوداني محمص",
    category: "nut",
    per100g: {
      caloricValue: 585, protein: 23.7, carbohydrates: 21.5, fat: 49.2,
      fiber: 8, sugar: 4.2, cholesterol: 0, sodium: 410,
      vitaminA: 0, vitaminB1: 0.15, vitaminB6: 0.26, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 54, iron: 2.26,
      magnesium: 176, zinc: 3.31, nutritionDensity: 11,
    },
    servingUnits: [
      { unit: "handful", unitAr: "كمشة", weightInGrams: 28 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 146 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "handful",
  },
  {
    name: "Pumpkin Seeds",
    nameAr: "لب أبيض",
    category: "nut",
    per100g: {
      caloricValue: 559, protein: 30.2, carbohydrates: 10.7, fat: 49.1,
      fiber: 6, sugar: 1.4, cholesterol: 0, sodium: 7,
      vitaminA: 0.001, vitaminB1: 0.273, vitaminB6: 0.143, vitaminB12: 0,
      vitaminC: 1.9, vitaminD: 0, calcium: 46, iron: 8.82,
      magnesium: 592, zinc: 7.81, nutritionDensity: 15,
    },
    servingUnits: [
      { unit: "handful", unitAr: "كمشة", weightInGrams: 28 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "handful",
  },
  {
    name: "Sunflower Seeds",
    nameAr: "لب سوبر",
    category: "nut",
    per100g: {
      caloricValue: 584, protein: 20.8, carbohydrates: 20, fat: 51.5,
      fiber: 8.6, sugar: 2.6, cholesterol: 0, sodium: 9,
      vitaminA: 0.003, vitaminB1: 1.48, vitaminB6: 1.345, vitaminB12: 0,
      vitaminC: 1.4, vitaminD: 0, calcium: 78, iron: 5.25,
      magnesium: 325, zinc: 5, nutritionDensity: 14,
    },
    servingUnits: [
      { unit: "handful", unitAr: "كمشة", weightInGrams: 28 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "handful",
  },
  {
    name: "Roasted Chickpeas",
    nameAr: "حمص مسلي",
    category: "nut",
    per100g: {
      caloricValue: 420, protein: 20, carbohydrates: 55, fat: 13,
      fiber: 12, sugar: 4, cholesterol: 0, sodium: 350,
      vitaminA: 0.002, vitaminB1: 0.15, vitaminB6: 0.2, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 60, iron: 4,
      magnesium: 80, zinc: 2, nutritionDensity: 11,
    },
    servingUnits: [
      { unit: "handful", unitAr: "كمشة", weightInGrams: 28 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 150 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "handful",
  },
  {
    name: "Sesame Seeds",
    nameAr: "سمسم",
    category: "nut",
    per100g: {
      caloricValue: 573, protein: 17.7, carbohydrates: 23.5, fat: 49.7,
      fiber: 11.8, sugar: 0.3, cholesterol: 0, sodium: 11,
      vitaminA: 0.001, vitaminB1: 0.791, vitaminB6: 0.79, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 975, iron: 14.55,
      magnesium: 351, zinc: 7.75, nutritionDensity: 16,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 9 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Chia Seeds",
    nameAr: "بذور شيا",
    category: "nut",
    per100g: {
      caloricValue: 486, protein: 16.5, carbohydrates: 42.1, fat: 30.7,
      fiber: 34.4, sugar: 0, cholesterol: 0, sodium: 16,
      vitaminA: 0.001, vitaminB1: 0.62, vitaminB6: 0.1, vitaminB12: 0,
      vitaminC: 1.6, vitaminD: 0, calcium: 631, iron: 7.72,
      magnesium: 335, zinc: 4.58, nutritionDensity: 18,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 12 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Flax Seeds",
    nameAr: "بذور كتان",
    category: "nut",
    per100g: {
      caloricValue: 534, protein: 18.3, carbohydrates: 28.9, fat: 42.2,
      fiber: 27.3, sugar: 1.6, cholesterol: 0, sodium: 30,
      vitaminA: 0, vitaminB1: 1.644, vitaminB6: 0.473, vitaminB12: 0,
      vitaminC: 0.6, vitaminD: 0, calcium: 255, iron: 5.73,
      magnesium: 392, zinc: 4.34, nutritionDensity: 17,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 10 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },

  // ========================  OILS additions (2)  ========================
  {
    name: "Corn Oil",
    nameAr: "زيت ذرة",
    category: "oil",
    per100g: {
      caloricValue: 884, protein: 0, carbohydrates: 0, fat: 100,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 0,
      vitaminA: 0, vitaminB1: 0, vitaminB6: 0, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 0, iron: 0,
      magnesium: 0, zinc: 0, nutritionDensity: 1.5,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 14 },
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 5 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Sunflower Oil",
    nameAr: "زيت عباد الشمس",
    category: "oil",
    per100g: {
      caloricValue: 884, protein: 0, carbohydrates: 0, fat: 100,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 0,
      vitaminA: 0, vitaminB1: 0, vitaminB6: 0, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 0, iron: 0,
      magnesium: 0, zinc: 0, nutritionDensity: 1.5,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 14 },
      { unit: "teaspoon", unitAr: "معلقة صغيرة", weightInGrams: 5 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },

  // ========================  SWEETS additions (10)  ========================
  {
    name: "Basbousa",
    nameAr: "بسبوسة",
    category: "sweet",
    per100g: {
      caloricValue: 370, protein: 4.5, carbohydrates: 52, fat: 16,
      fiber: 0.8, sugar: 32, cholesterol: 30, sodium: 180,
      vitaminA: 0.05, vitaminB1: 0.05, vitaminB6: 0.03, vitaminB12: 0.0001,
      vitaminC: 0, vitaminD: 0, calcium: 40, iron: 0.8,
      magnesium: 15, zinc: 0.4, nutritionDensity: 3.5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 80 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Kunafa",
    nameAr: "كنافة",
    category: "sweet",
    per100g: {
      caloricValue: 390, protein: 6, carbohydrates: 48, fat: 20,
      fiber: 0.5, sugar: 28, cholesterol: 25, sodium: 200,
      vitaminA: 0.06, vitaminB1: 0.04, vitaminB6: 0.02, vitaminB12: 0.0002,
      vitaminC: 0, vitaminD: 0, calcium: 80, iron: 0.6,
      magnesium: 12, zinc: 0.5, nutritionDensity: 3,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 120 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Qatayef",
    nameAr: "قطايف",
    category: "sweet",
    per100g: {
      caloricValue: 350, protein: 7, carbohydrates: 45, fat: 16,
      fiber: 1, sugar: 22, cholesterol: 20, sodium: 150,
      vitaminA: 0.03, vitaminB1: 0.06, vitaminB6: 0.04, vitaminB12: 0.0001,
      vitaminC: 0, vitaminD: 0, calcium: 50, iron: 1,
      magnesium: 20, zinc: 0.6, nutritionDensity: 4,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 50 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Um Ali",
    nameAr: "أم علي",
    category: "sweet",
    per100g: {
      caloricValue: 280, protein: 6.5, carbohydrates: 32, fat: 14,
      fiber: 0.5, sugar: 20, cholesterol: 40, sodium: 120,
      vitaminA: 0.08, vitaminB1: 0.06, vitaminB6: 0.04, vitaminB12: 0.0003,
      vitaminC: 0.5, vitaminD: 0.0002, calcium: 120, iron: 0.8,
      magnesium: 25, zinc: 0.6, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 200 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Rice Pudding",
    nameAr: "رز بلبن",
    category: "sweet",
    per100g: {
      caloricValue: 140, protein: 3.5, carbohydrates: 22, fat: 4,
      fiber: 0.2, sugar: 12, cholesterol: 15, sodium: 60,
      vitaminA: 0.04, vitaminB1: 0.04, vitaminB6: 0.03, vitaminB12: 0.0002,
      vitaminC: 0.5, vitaminD: 0.0003, calcium: 100, iron: 0.2,
      magnesium: 12, zinc: 0.4, nutritionDensity: 7,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 200 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Muhallabia",
    nameAr: "مهلبية",
    category: "sweet",
    per100g: {
      caloricValue: 125, protein: 3, carbohydrates: 18, fat: 4.5,
      fiber: 0, sugar: 14, cholesterol: 12, sodium: 50,
      vitaminA: 0.03, vitaminB1: 0.03, vitaminB6: 0.03, vitaminB12: 0.0002,
      vitaminC: 0.5, vitaminD: 0.0002, calcium: 90, iron: 0.15,
      magnesium: 10, zinc: 0.3, nutritionDensity: 7.5,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 180 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Halva (Tahini-based)",
    nameAr: "حلاوة طحينية",
    category: "sweet",
    per100g: {
      caloricValue: 469, protein: 12.5, carbohydrates: 60, fat: 21.7,
      fiber: 3.5, sugar: 45, cholesterol: 0, sodium: 200,
      vitaminA: 0, vitaminB1: 0.35, vitaminB6: 0.15, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 140, iron: 4.6,
      magnesium: 78, zinc: 2, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "slice", unitAr: "شريحة", weightInGrams: 30 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "slice",
  },
  {
    name: "Balah El Sham",
    nameAr: "بلح الشام",
    category: "sweet",
    per100g: {
      caloricValue: 380, protein: 5, carbohydrates: 42, fat: 22,
      fiber: 0.5, sugar: 25, cholesterol: 35, sodium: 150,
      vitaminA: 0.03, vitaminB1: 0.05, vitaminB6: 0.02, vitaminB12: 0.0001,
      vitaminC: 0, vitaminD: 0, calcium: 20, iron: 0.8,
      magnesium: 10, zinc: 0.3, nutritionDensity: 3,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 25 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Biscuit (Plain)",
    nameAr: "بسكويت",
    category: "sweet",
    per100g: {
      caloricValue: 440, protein: 6.5, carbohydrates: 68, fat: 16,
      fiber: 1.5, sugar: 22, cholesterol: 15, sodium: 350,
      vitaminA: 0.01, vitaminB1: 0.1, vitaminB6: 0.04, vitaminB12: 0.0001,
      vitaminC: 0, vitaminD: 0, calcium: 25, iron: 1.5,
      magnesium: 15, zinc: 0.4, nutritionDensity: 4,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 8 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Cake (Plain Sponge)",
    nameAr: "كيكة",
    category: "sweet",
    per100g: {
      caloricValue: 320, protein: 5.5, carbohydrates: 50, fat: 11,
      fiber: 0.5, sugar: 30, cholesterol: 85, sodium: 280,
      vitaminA: 0.06, vitaminB1: 0.08, vitaminB6: 0.03, vitaminB12: 0.0002,
      vitaminC: 0, vitaminD: 0.0002, calcium: 35, iron: 1,
      magnesium: 10, zinc: 0.3, nutritionDensity: 4.5,
    },
    servingUnits: [
      { unit: "slice", unitAr: "قطعة", weightInGrams: 80 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "slice",
  },

  // ========================  BEVERAGES additions (10)  ========================
  {
    name: "Hibiscus Tea (Karkade)",
    nameAr: "كركديه",
    category: "beverage",
    per100g: {
      caloricValue: 37, protein: 0.4, carbohydrates: 9, fat: 0,
      fiber: 0, sugar: 8.5, cholesterol: 0, sodium: 3,
      vitaminA: 0, vitaminB1: 0.01, vitaminB6: 0.01, vitaminB12: 0,
      vitaminC: 7, vitaminD: 0, calcium: 8, iron: 0.4,
      magnesium: 3, zinc: 0.03, nutritionDensity: 10,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Sahlab",
    nameAr: "سحلب",
    category: "beverage",
    per100g: {
      caloricValue: 85, protein: 2.5, carbohydrates: 14, fat: 2.5,
      fiber: 0, sugar: 10, cholesterol: 8, sodium: 40,
      vitaminA: 0.02, vitaminB1: 0.03, vitaminB6: 0.02, vitaminB12: 0.0002,
      vitaminC: 0.5, vitaminD: 0.0002, calcium: 80, iron: 0.1,
      magnesium: 10, zinc: 0.3, nutritionDensity: 6,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Licorice Drink (Erq Sous)",
    nameAr: "عرقسوس",
    category: "beverage",
    per100g: {
      caloricValue: 30, protein: 0.2, carbohydrates: 7.5, fat: 0,
      fiber: 0, sugar: 7, cholesterol: 0, sodium: 15,
      vitaminA: 0, vitaminB1: 0.01, vitaminB6: 0.01, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 5, iron: 0.2,
      magnesium: 3, zinc: 0.02, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Tamarind Drink",
    nameAr: "تمر هندي",
    category: "beverage",
    per100g: {
      caloricValue: 42, protein: 0.3, carbohydrates: 10.5, fat: 0,
      fiber: 0.2, sugar: 9.5, cholesterol: 0, sodium: 5,
      vitaminA: 0.001, vitaminB1: 0.02, vitaminB6: 0.02, vitaminB12: 0,
      vitaminC: 1.5, vitaminD: 0, calcium: 10, iron: 0.25,
      magnesium: 6, zinc: 0.05, nutritionDensity: 6,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Qamar El Din (Apricot Drink)",
    nameAr: "قمر الدين",
    category: "beverage",
    per100g: {
      caloricValue: 55, protein: 0.5, carbohydrates: 13.5, fat: 0,
      fiber: 0.3, sugar: 12, cholesterol: 0, sodium: 4,
      vitaminA: 0.06, vitaminB1: 0.01, vitaminB6: 0.02, vitaminB12: 0,
      vitaminC: 2, vitaminD: 0, calcium: 8, iron: 0.3,
      magnesium: 5, zinc: 0.04, nutritionDensity: 7,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Nescafe with Milk",
    nameAr: "نسكافيه بلبن",
    category: "beverage",
    per100g: {
      caloricValue: 38, protein: 1.8, carbohydrates: 4.5, fat: 1.5,
      fiber: 0, sugar: 4, cholesterol: 5, sodium: 35,
      vitaminA: 0.01, vitaminB1: 0.02, vitaminB6: 0.02, vitaminB12: 0.0001,
      vitaminC: 0, vitaminD: 0.0005, calcium: 55, iron: 0.1,
      magnesium: 8, zinc: 0.2, nutritionDensity: 9,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Tea with Milk",
    nameAr: "شاي بلبن",
    category: "beverage",
    per100g: {
      caloricValue: 30, protein: 1.5, carbohydrates: 3.5, fat: 1.2,
      fiber: 0, sugar: 3, cholesterol: 4, sodium: 25,
      vitaminA: 0.01, vitaminB1: 0.01, vitaminB6: 0.01, vitaminB12: 0.0001,
      vitaminC: 0, vitaminD: 0.0003, calcium: 50, iron: 0.05,
      magnesium: 6, zinc: 0.15, nutritionDensity: 10,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Sugarcane Juice",
    nameAr: "عصير قصب",
    category: "beverage",
    per100g: {
      caloricValue: 73, protein: 0, carbohydrates: 18.2, fat: 0,
      fiber: 0, sugar: 18.2, cholesterol: 0, sodium: 17,
      vitaminA: 0, vitaminB1: 0.01, vitaminB6: 0.02, vitaminB12: 0,
      vitaminC: 2, vitaminD: 0, calcium: 10, iron: 0.37,
      magnesium: 12, zinc: 0.05, nutritionDensity: 4,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Anise Tea",
    nameAr: "يانسون",
    category: "beverage",
    per100g: {
      caloricValue: 2, protein: 0.1, carbohydrates: 0.4, fat: 0,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 1,
      vitaminA: 0, vitaminB1: 0.01, vitaminB6: 0.005, vitaminB12: 0,
      vitaminC: 0.5, vitaminD: 0, calcium: 5, iron: 0.1,
      magnesium: 3, zinc: 0.02, nutritionDensity: 8,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Fenugreek Tea (Helba)",
    nameAr: "حلبة",
    category: "beverage",
    per100g: {
      caloricValue: 10, protein: 0.5, carbohydrates: 1.5, fat: 0.2,
      fiber: 0.3, sugar: 0, cholesterol: 0, sodium: 5,
      vitaminA: 0.001, vitaminB1: 0.02, vitaminB6: 0.02, vitaminB12: 0,
      vitaminC: 1, vitaminD: 0, calcium: 10, iron: 0.3,
      magnesium: 5, zinc: 0.05, nutritionDensity: 9,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },

  // ========================  ADDITIONAL ITEMS  ========================
  {
    name: "Grapefruit",
    nameAr: "جريب فروت",
    category: "fruit",
    per100g: {
      caloricValue: 42, protein: 0.8, carbohydrates: 10.7, fat: 0.1,
      fiber: 1.6, sugar: 6.9, cholesterol: 0, sodium: 0,
      vitaminA: 0.058, vitaminB1: 0.043, vitaminB6: 0.053, vitaminB12: 0,
      vitaminC: 31.2, vitaminD: 0, calcium: 22, iron: 0.08,
      magnesium: 9, zinc: 0.07, nutritionDensity: 21,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 246 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Fried Egg",
    nameAr: "بيضة مقلية",
    category: "protein",
    per100g: {
      caloricValue: 196, protein: 13.6, carbohydrates: 0.8, fat: 15.3,
      fiber: 0, sugar: 0.4, cholesterol: 401, sodium: 207,
      vitaminA: 0.219, vitaminB1: 0.044, vitaminB6: 0.18, vitaminB12: 0.00076,
      vitaminC: 0, vitaminD: 0.002, calcium: 62, iron: 1.89,
      magnesium: 13, zinc: 1.39, nutritionDensity: 13,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 46 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Mango Juice",
    nameAr: "عصير مانجو",
    category: "beverage",
    per100g: {
      caloricValue: 51, protein: 0.1, carbohydrates: 12.7, fat: 0.1,
      fiber: 0.3, sugar: 12, cholesterol: 0, sodium: 3,
      vitaminA: 0.032, vitaminB1: 0.02, vitaminB6: 0.06, vitaminB12: 0,
      vitaminC: 15, vitaminD: 0, calcium: 8, iron: 0.2,
      magnesium: 5, zinc: 0.02, nutritionDensity: 7,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Guava Juice",
    nameAr: "عصير جوافة",
    category: "beverage",
    per100g: {
      caloricValue: 50, protein: 0.2, carbohydrates: 12, fat: 0.1,
      fiber: 0.5, sugar: 11, cholesterol: 0, sodium: 5,
      vitaminA: 0.01, vitaminB1: 0.015, vitaminB6: 0.03, vitaminB12: 0,
      vitaminC: 45, vitaminD: 0, calcium: 10, iron: 0.15,
      magnesium: 6, zinc: 0.05, nutritionDensity: 9,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Pomegranate Juice",
    nameAr: "عصير رمان",
    category: "beverage",
    per100g: {
      caloricValue: 54, protein: 0.2, carbohydrates: 13.1, fat: 0.3,
      fiber: 0.1, sugar: 12.6, cholesterol: 0, sodium: 9,
      vitaminA: 0, vitaminB1: 0.01, vitaminB6: 0.04, vitaminB12: 0,
      vitaminC: 0.1, vitaminD: 0, calcium: 11, iron: 0.1,
      magnesium: 7, zinc: 0.09, nutritionDensity: 6,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Grape Juice",
    nameAr: "عصير عنب",
    category: "beverage",
    per100g: {
      caloricValue: 60, protein: 0.4, carbohydrates: 14.8, fat: 0.1,
      fiber: 0.2, sugar: 14.2, cholesterol: 0, sodium: 5,
      vitaminA: 0.001, vitaminB1: 0.017, vitaminB6: 0.032, vitaminB12: 0,
      vitaminC: 3.3, vitaminD: 0, calcium: 11, iron: 0.25,
      magnesium: 10, zinc: 0.07, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Creme Caramel",
    nameAr: "كريم كراميل",
    category: "sweet",
    per100g: {
      caloricValue: 140, protein: 3, carbohydrates: 22, fat: 4.5,
      fiber: 0, sugar: 18, cholesterol: 60, sodium: 60,
      vitaminA: 0.04, vitaminB1: 0.03, vitaminB6: 0.04, vitaminB12: 0.0003,
      vitaminC: 0, vitaminD: 0.0003, calcium: 70, iron: 0.2,
      magnesium: 8, zinc: 0.3, nutritionDensity: 6,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 120 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Zalabya (Egyptian Donuts)",
    nameAr: "زلابية",
    category: "sweet",
    per100g: {
      caloricValue: 400, protein: 5, carbohydrates: 48, fat: 21,
      fiber: 0.5, sugar: 28, cholesterol: 25, sodium: 160,
      vitaminA: 0.02, vitaminB1: 0.08, vitaminB6: 0.03, vitaminB12: 0.0001,
      vitaminC: 0, vitaminD: 0, calcium: 20, iron: 1,
      magnesium: 10, zinc: 0.3, nutritionDensity: 3,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 20 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Croissant",
    nameAr: "كرواسون",
    category: "grain",
    per100g: {
      caloricValue: 406, protein: 8.2, carbohydrates: 45.8, fat: 21,
      fiber: 2.6, sugar: 11.3, cholesterol: 67, sodium: 423,
      vitaminA: 0.16, vitaminB1: 0.2, vitaminB6: 0.04, vitaminB12: 0.0002,
      vitaminC: 0, vitaminD: 0.0001, calcium: 37, iron: 2.4,
      magnesium: 15, zinc: 0.63, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 57 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Egyptian Falafel (Taamiya)",
    nameAr: "طعمية",
    category: "legume",
    per100g: {
      caloricValue: 333, protein: 13.3, carbohydrates: 31.8, fat: 17.8,
      fiber: 3.5, sugar: 1.5, cholesterol: 0, sodium: 294,
      vitaminA: 0.006, vitaminB1: 0.146, vitaminB6: 0.09, vitaminB12: 0,
      vitaminC: 2, vitaminD: 0, calcium: 54, iron: 3.43,
      magnesium: 52, zinc: 1.21, nutritionDensity: 9,
    },
    servingUnits: [
      { unit: "piece", unitAr: "واحدة", weightInGrams: 30 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Herring (Renga)",
    nameAr: "رنجة",
    category: "protein",
    per100g: {
      caloricValue: 217, protein: 24.6, carbohydrates: 0, fat: 12.4,
      fiber: 0, sugar: 0, cholesterol: 77, sodium: 870,
      vitaminA: 0.028, vitaminB1: 0.09, vitaminB6: 0.3, vitaminB12: 0.0136,
      vitaminC: 0.8, vitaminD: 0.019, calcium: 74, iron: 1.2,
      magnesium: 36, zinc: 0.99, nutritionDensity: 16,
    },
    servingUnits: [
      { unit: "fillet", unitAr: "فيليه", weightInGrams: 143 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "fillet",
  },
  {
    name: "Coconut (Dried/Desiccated)",
    nameAr: "جوز هند مبشور",
    category: "nut",
    per100g: {
      caloricValue: 660, protein: 6.9, carbohydrates: 23.7, fat: 64.5,
      fiber: 16.3, sugar: 7.4, cholesterol: 0, sodium: 37,
      vitaminA: 0, vitaminB1: 0.05, vitaminB6: 0.3, vitaminB12: 0,
      vitaminC: 1.5, vitaminD: 0, calcium: 26, iron: 3.3,
      magnesium: 90, zinc: 2.01, nutritionDensity: 6,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 7 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 80 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Mixed Nuts (Unsalted)",
    nameAr: "مكسرات مشكلة",
    category: "nut",
    per100g: {
      caloricValue: 607, protein: 20.2, carbohydrates: 21.9, fat: 53.9,
      fiber: 6.9, sugar: 4.2, cholesterol: 0, sodium: 3,
      vitaminA: 0.001, vitaminB1: 0.42, vitaminB6: 0.41, vitaminB12: 0,
      vitaminC: 0.7, vitaminD: 0, calcium: 100, iron: 3.4,
      magnesium: 230, zinc: 4, nutritionDensity: 13,
    },
    servingUnits: [
      { unit: "handful", unitAr: "كمشة", weightInGrams: 28 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "handful",
  },
  {
    name: "Strawberry Juice",
    nameAr: "عصير فراولة",
    category: "beverage",
    per100g: {
      caloricValue: 46, protein: 0.2, carbohydrates: 11, fat: 0.1,
      fiber: 0.3, sugar: 10, cholesterol: 0, sodium: 3,
      vitaminA: 0.001, vitaminB1: 0.01, vitaminB6: 0.02, vitaminB12: 0,
      vitaminC: 32, vitaminD: 0, calcium: 10, iron: 0.2,
      magnesium: 5, zinc: 0.04, nutritionDensity: 8,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Coriander (Fresh)",
    nameAr: "كزبرة خضراء",
    category: "vegetable",
    per100g: {
      caloricValue: 23, protein: 2.1, carbohydrates: 3.7, fat: 0.5,
      fiber: 2.8, sugar: 0.9, cholesterol: 0, sodium: 46,
      vitaminA: 0.337, vitaminB1: 0.067, vitaminB6: 0.149, vitaminB12: 0,
      vitaminC: 27, vitaminD: 0, calcium: 67, iron: 1.77,
      magnesium: 26, zinc: 0.5, nutritionDensity: 34,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 1 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 16 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Water",
    nameAr: "مياه",
    category: "beverage",
    per100g: {
      caloricValue: 0, protein: 0, carbohydrates: 0, fat: 0,
      fiber: 0, sugar: 0, cholesterol: 0, sodium: 4,
      vitaminA: 0, vitaminB1: 0, vitaminB6: 0, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 3, iron: 0,
      magnesium: 1, zinc: 0, nutritionDensity: 0,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },

  // ========================  ARABIC / MIDDLE EASTERN (40)  ========================
  {
    name: "Hummus",
    nameAr: "حمص بالطحينة",
    category: "legume",
    per100g: {
      caloricValue: 177, protein: 7.9, carbohydrates: 14.3, fat: 10.0,
      fiber: 6.0, sugar: 0.5, cholesterol: 0, sodium: 379,
      vitaminA: 0.003, vitaminB1: 0.15, vitaminB6: 0.16, vitaminB12: 0,
      vitaminC: 3.1, vitaminD: 0, calcium: 38, iron: 2.44,
      magnesium: 57, zinc: 1.55, nutritionDensity: 14,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 15 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Baba Ghanoush",
    nameAr: "بابا غنوج",
    category: "vegetable",
    per100g: {
      caloricValue: 72, protein: 2.0, carbohydrates: 5.7, fat: 5.1,
      fiber: 2.4, sugar: 2.2, cholesterol: 0, sodium: 270,
      vitaminA: 0.003, vitaminB1: 0.06, vitaminB6: 0.08, vitaminB12: 0,
      vitaminC: 4.5, vitaminD: 0, calcium: 22, iron: 0.6,
      magnesium: 16, zinc: 0.35, nutritionDensity: 10,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 15 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 230 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Ful Medames (Fava Beans Stew)",
    nameAr: "فول مدمس",
    category: "legume",
    per100g: {
      caloricValue: 110, protein: 7.6, carbohydrates: 14.8, fat: 2.6,
      fiber: 5.4, sugar: 1.2, cholesterol: 0, sodium: 290,
      vitaminA: 0.005, vitaminB1: 0.19, vitaminB6: 0.12, vitaminB12: 0,
      vitaminC: 2.8, vitaminD: 0, calcium: 36, iron: 2.5,
      magnesium: 43, zinc: 1.0, nutritionDensity: 12,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Koshari",
    nameAr: "كشري",
    category: "grain",
    per100g: {
      caloricValue: 150, protein: 6.2, carbohydrates: 27.0, fat: 2.5,
      fiber: 2.8, sugar: 1.8, cholesterol: 0, sodium: 210,
      vitaminA: 0.008, vitaminB1: 0.12, vitaminB6: 0.10, vitaminB12: 0,
      vitaminC: 3.0, vitaminD: 0, calcium: 38, iron: 1.8,
      magnesium: 35, zinc: 0.9, nutritionDensity: 9,
    },
    servingUnits: [
      { unit: "plate", unitAr: "طبق", weightInGrams: 400 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "plate",
  },
  {
    name: "Tabbouleh",
    nameAr: "تبولة",
    category: "vegetable",
    per100g: {
      caloricValue: 75, protein: 2.4, carbohydrates: 9.8, fat: 3.2,
      fiber: 2.5, sugar: 1.5, cholesterol: 0, sodium: 180,
      vitaminA: 0.07, vitaminB1: 0.09, vitaminB6: 0.11, vitaminB12: 0,
      vitaminC: 25, vitaminD: 0, calcium: 40, iron: 1.9,
      magnesium: 22, zinc: 0.55, nutritionDensity: 18,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 150 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Fattoush Salad",
    nameAr: "فتوش",
    category: "vegetable",
    per100g: {
      caloricValue: 68, protein: 1.8, carbohydrates: 9.2, fat: 3.0,
      fiber: 1.8, sugar: 3.4, cholesterol: 0, sodium: 210,
      vitaminA: 0.09, vitaminB1: 0.07, vitaminB6: 0.09, vitaminB12: 0,
      vitaminC: 18, vitaminD: 0, calcium: 35, iron: 1.1,
      magnesium: 18, zinc: 0.4, nutritionDensity: 16,
    },
    servingUnits: [
      { unit: "bowl", unitAr: "طبق", weightInGrams: 200 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "bowl",
  },
  {
    name: "Chicken Shawarma (with bread)",
    nameAr: "شاورما دجاج بالخبز",
    category: "protein",
    per100g: {
      caloricValue: 242, protein: 18.5, carbohydrates: 20.0, fat: 9.0,
      fiber: 1.2, sugar: 1.5, cholesterol: 55, sodium: 620,
      vitaminA: 0.02, vitaminB1: 0.12, vitaminB6: 0.35, vitaminB12: 0.00025,
      vitaminC: 1.5, vitaminD: 0.001, calcium: 42, iron: 1.8,
      magnesium: 28, zinc: 1.6, nutritionDensity: 10,
    },
    servingUnits: [
      { unit: "wrap", unitAr: "لفة", weightInGrams: 280 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "wrap",
  },
  {
    name: "Meat Shawarma (with bread)",
    nameAr: "شاورما لحم بالخبز",
    category: "protein",
    per100g: {
      caloricValue: 268, protein: 16.8, carbohydrates: 19.5, fat: 12.5,
      fiber: 1.1, sugar: 1.4, cholesterol: 65, sodium: 680,
      vitaminA: 0.015, vitaminB1: 0.14, vitaminB6: 0.28, vitaminB12: 0.00085,
      vitaminC: 0.8, vitaminD: 0.0005, calcium: 38, iron: 2.4,
      magnesium: 24, zinc: 2.8, nutritionDensity: 9,
    },
    servingUnits: [
      { unit: "wrap", unitAr: "لفة", weightInGrams: 290 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "wrap",
  },
  {
    name: "Molokhia (Jute Mallow Stew)",
    nameAr: "ملوخية",
    category: "vegetable",
    per100g: {
      caloricValue: 43, protein: 4.8, carbohydrates: 5.1, fat: 0.7,
      fiber: 2.2, sugar: 0.8, cholesterol: 0, sodium: 85,
      vitaminA: 0.565, vitaminB1: 0.09, vitaminB6: 0.15, vitaminB12: 0,
      vitaminC: 53, vitaminD: 0, calcium: 210, iron: 3.1,
      magnesium: 58, zinc: 0.52, nutritionDensity: 28,
    },
    servingUnits: [
      { unit: "bowl", unitAr: "طبق", weightInGrams: 250 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "bowl",
  },
  {
    name: "Medjool Dates",
    nameAr: "تمر مجدول",
    category: "fruit",
    per100g: {
      caloricValue: 277, protein: 1.8, carbohydrates: 74.9, fat: 0.15,
      fiber: 6.7, sugar: 66.5, cholesterol: 0, sodium: 1,
      vitaminA: 0.007, vitaminB1: 0.05, vitaminB6: 0.25, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 64, iron: 0.9,
      magnesium: 54, zinc: 0.44, nutritionDensity: 8,
    },
    servingUnits: [
      { unit: "piece", unitAr: "حبة", weightInGrams: 24 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Labneh (Strained Yogurt)",
    nameAr: "لبنة",
    category: "dairy",
    per100g: {
      caloricValue: 152, protein: 9.3, carbohydrates: 4.9, fat: 10.5,
      fiber: 0, sugar: 4.9, cholesterol: 36, sodium: 335,
      vitaminA: 0.089, vitaminB1: 0.04, vitaminB6: 0.07, vitaminB12: 0.00075,
      vitaminC: 0, vitaminD: 0.0005, calcium: 270, iron: 0.12,
      magnesium: 17, zinc: 0.52, nutritionDensity: 12,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 20 },
      { unit: "cup", unitAr: "كوباية", weightInGrams: 220 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Halloumi Cheese",
    nameAr: "جبنة حلوم",
    category: "dairy",
    per100g: {
      caloricValue: 321, protein: 21.0, carbohydrates: 1.4, fat: 26.0,
      fiber: 0, sugar: 0, cholesterol: 77, sodium: 1440,
      vitaminA: 0.154, vitaminB1: 0.02, vitaminB6: 0.04, vitaminB12: 0.00084,
      vitaminC: 0, vitaminD: 0.001, calcium: 750, iron: 0.3,
      magnesium: 9, zinc: 1.9, nutritionDensity: 11,
    },
    servingUnits: [
      { unit: "slice", unitAr: "شريحة", weightInGrams: 30 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "slice",
  },
  {
    name: "Egyptian Bread (Eish Baladi)",
    nameAr: "عيش بلدي",
    category: "grain",
    per100g: {
      caloricValue: 255, protein: 8.9, carbohydrates: 49.4, fat: 2.0,
      fiber: 6.5, sugar: 1.8, cholesterol: 0, sodium: 390,
      vitaminA: 0, vitaminB1: 0.22, vitaminB6: 0.09, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 28, iron: 2.5,
      magnesium: 62, zinc: 1.5, nutritionDensity: 7,
    },
    servingUnits: [
      { unit: "loaf", unitAr: "رغيف", weightInGrams: 85 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "loaf",
  },
  {
    name: "Pita Bread",
    nameAr: "خبز بيتا",
    category: "grain",
    per100g: {
      caloricValue: 275, protein: 9.1, carbohydrates: 55.7, fat: 1.2,
      fiber: 2.2, sugar: 1.0, cholesterol: 0, sodium: 536,
      vitaminA: 0, vitaminB1: 0.37, vitaminB6: 0.09, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 86, iron: 3.0,
      magnesium: 28, zinc: 0.84, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "خبزة", weightInGrams: 60 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Lentil Soup",
    nameAr: "شوربة عدس",
    category: "legume",
    per100g: {
      caloricValue: 71, protein: 4.5, carbohydrates: 10.8, fat: 1.0,
      fiber: 3.2, sugar: 1.4, cholesterol: 0, sodium: 195,
      vitaminA: 0.025, vitaminB1: 0.12, vitaminB6: 0.12, vitaminB12: 0,
      vitaminC: 2.5, vitaminD: 0, calcium: 22, iron: 2.0,
      magnesium: 28, zinc: 0.8, nutritionDensity: 13,
    },
    servingUnits: [
      { unit: "bowl", unitAr: "طبق", weightInGrams: 300 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "bowl",
  },
  {
    name: "Tahini (Sesame Paste)",
    nameAr: "طحينة",
    category: "nut",
    per100g: {
      caloricValue: 595, protein: 17.0, carbohydrates: 21.2, fat: 53.8,
      fiber: 9.3, sugar: 0.5, cholesterol: 0, sodium: 115,
      vitaminA: 0.002, vitaminB1: 0.87, vitaminB6: 0.15, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 426, iron: 8.95,
      magnesium: 95, zinc: 4.62, nutritionDensity: 22,
    },
    servingUnits: [
      { unit: "tablespoon", unitAr: "معلقة", weightInGrams: 15 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "tablespoon",
  },
  {
    name: "Grilled Chicken (Arabic Style)",
    nameAr: "دجاج مشوي",
    category: "protein",
    per100g: {
      caloricValue: 185, protein: 27.3, carbohydrates: 0.8, fat: 7.5,
      fiber: 0, sugar: 0.4, cholesterol: 85, sodium: 340,
      vitaminA: 0.018, vitaminB1: 0.09, vitaminB6: 0.48, vitaminB12: 0.00034,
      vitaminC: 1.2, vitaminD: 0.0015, calcium: 22, iron: 1.3,
      magnesium: 30, zinc: 1.8, nutritionDensity: 17,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 120 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Kofta (Grilled Minced Meat)",
    nameAr: "كفتة مشوية",
    category: "protein",
    per100g: {
      caloricValue: 248, protein: 18.5, carbohydrates: 6.2, fat: 16.8,
      fiber: 0.8, sugar: 1.5, cholesterol: 75, sodium: 420,
      vitaminA: 0.01, vitaminB1: 0.15, vitaminB6: 0.30, vitaminB12: 0.00095,
      vitaminC: 2.5, vitaminD: 0, calcium: 30, iron: 2.9,
      magnesium: 25, zinc: 3.2, nutritionDensity: 11,
    },
    servingUnits: [
      { unit: "skewer", unitAr: "سيخ", weightInGrams: 120 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "skewer",
  },
  {
    name: "Mahshi (Stuffed Zucchini/Grape Leaves)",
    nameAr: "محشي",
    category: "grain",
    per100g: {
      caloricValue: 145, protein: 5.5, carbohydrates: 18.2, fat: 5.8,
      fiber: 2.0, sugar: 2.5, cholesterol: 15, sodium: 340,
      vitaminA: 0.025, vitaminB1: 0.10, vitaminB6: 0.14, vitaminB12: 0.00012,
      vitaminC: 6.5, vitaminD: 0, calcium: 35, iron: 1.5,
      magnesium: 22, zinc: 0.85, nutritionDensity: 10,
    },
    servingUnits: [
      { unit: "piece", unitAr: "حبة", weightInGrams: 60 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Okra in Tomato Sauce (Bamia)",
    nameAr: "بامية بالصلصة",
    category: "vegetable",
    per100g: {
      caloricValue: 58, protein: 2.5, carbohydrates: 7.8, fat: 2.0,
      fiber: 2.8, sugar: 3.2, cholesterol: 0, sodium: 220,
      vitaminA: 0.04, vitaminB1: 0.08, vitaminB6: 0.12, vitaminB12: 0,
      vitaminC: 15, vitaminD: 0, calcium: 72, iron: 0.7,
      magnesium: 38, zinc: 0.54, nutritionDensity: 14,
    },
    servingUnits: [
      { unit: "bowl", unitAr: "طبق", weightInGrams: 250 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "bowl",
  },
  {
    name: "Basbousa (Semolina Cake)",
    nameAr: "بسبوسة",
    category: "sweet",
    per100g: {
      caloricValue: 370, protein: 6.0, carbohydrates: 58.0, fat: 13.0,
      fiber: 1.5, sugar: 30.0, cholesterol: 45, sodium: 150,
      vitaminA: 0.04, vitaminB1: 0.08, vitaminB6: 0.04, vitaminB12: 0.00012,
      vitaminC: 0, vitaminD: 0.0003, calcium: 55, iron: 1.2,
      magnesium: 18, zinc: 0.6, nutritionDensity: 4,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 80 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Kunafa",
    nameAr: "كنافة",
    category: "sweet",
    per100g: {
      caloricValue: 340, protein: 7.5, carbohydrates: 42.0, fat: 16.0,
      fiber: 1.0, sugar: 22.0, cholesterol: 50, sodium: 210,
      vitaminA: 0.06, vitaminB1: 0.06, vitaminB6: 0.03, vitaminB12: 0.0002,
      vitaminC: 0, vitaminD: 0.0004, calcium: 120, iron: 0.9,
      magnesium: 12, zinc: 0.5, nutritionDensity: 4,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 150 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Om Ali (Egyptian Bread Pudding)",
    nameAr: "أم علي",
    category: "sweet",
    per100g: {
      caloricValue: 280, protein: 6.8, carbohydrates: 33.5, fat: 13.5,
      fiber: 1.2, sugar: 18.0, cholesterol: 42, sodium: 130,
      vitaminA: 0.07, vitaminB1: 0.07, vitaminB6: 0.05, vitaminB12: 0.00018,
      vitaminC: 0.5, vitaminD: 0.0003, calcium: 110, iron: 1.0,
      magnesium: 16, zinc: 0.6, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "bowl", unitAr: "طبق", weightInGrams: 200 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "bowl",
  },
  {
    name: "Konafa Cheese (Nablus style)",
    nameAr: "كنافة نابلسية",
    category: "sweet",
    per100g: {
      caloricValue: 295, protein: 9.5, carbohydrates: 32.0, fat: 15.0,
      fiber: 0.5, sugar: 15.0, cholesterol: 58, sodium: 280,
      vitaminA: 0.07, vitaminB1: 0.05, vitaminB6: 0.03, vitaminB12: 0.00022,
      vitaminC: 0, vitaminD: 0.0005, calcium: 180, iron: 0.7,
      magnesium: 11, zinc: 0.7, nutritionDensity: 6,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 130 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Mint Tea (Arabic/Moroccan)",
    nameAr: "شاي بالنعناع",
    category: "beverage",
    per100g: {
      caloricValue: 22, protein: 0, carbohydrates: 5.8, fat: 0,
      fiber: 0, sugar: 5.8, cholesterol: 0, sodium: 3,
      vitaminA: 0, vitaminB1: 0, vitaminB6: 0, vitaminB12: 0,
      vitaminC: 0.3, vitaminD: 0, calcium: 4, iron: 0.05,
      magnesium: 2, zinc: 0.02, nutritionDensity: 1,
    },
    servingUnits: [
      { unit: "glass", unitAr: "كوب", weightInGrams: 200 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "glass",
  },
  {
    name: "Karkade (Hibiscus Drink)",
    nameAr: "كركديه",
    category: "beverage",
    per100g: {
      caloricValue: 15, protein: 0.1, carbohydrates: 3.7, fat: 0,
      fiber: 0, sugar: 3.5, cholesterol: 0, sodium: 4,
      vitaminA: 0.001, vitaminB1: 0.002, vitaminB6: 0.005, vitaminB12: 0,
      vitaminC: 18, vitaminD: 0, calcium: 8, iron: 0.15,
      magnesium: 6, zinc: 0.06, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "glass", unitAr: "كوب", weightInGrams: 250 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "glass",
  },
  {
    name: "Rice with Vermicelli (Egyptian)",
    nameAr: "أرز بالشعيرية",
    category: "grain",
    per100g: {
      caloricValue: 175, protein: 3.5, carbohydrates: 36.2, fat: 2.5,
      fiber: 0.6, sugar: 0.3, cholesterol: 0, sodium: 180,
      vitaminA: 0, vitaminB1: 0.05, vitaminB6: 0.06, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 12, iron: 0.7,
      magnesium: 20, zinc: 0.55, nutritionDensity: 3,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 180 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Grilled Kofta Kebab",
    nameAr: "كباب مشوي",
    category: "protein",
    per100g: {
      caloricValue: 258, protein: 20.8, carbohydrates: 5.5, fat: 17.2,
      fiber: 0.7, sugar: 1.2, cholesterol: 80, sodium: 450,
      vitaminA: 0.012, vitaminB1: 0.18, vitaminB6: 0.28, vitaminB12: 0.00110,
      vitaminC: 3.0, vitaminD: 0, calcium: 28, iron: 3.1,
      magnesium: 22, zinc: 3.5, nutritionDensity: 12,
    },
    servingUnits: [
      { unit: "skewer", unitAr: "سيخ", weightInGrams: 100 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "skewer",
  },
  {
    name: "Fattah (Egyptian Rice & Meat Dish)",
    nameAr: "فتة مصرية",
    category: "grain",
    per100g: {
      caloricValue: 195, protein: 12.5, carbohydrates: 22.0, fat: 6.5,
      fiber: 1.0, sugar: 2.2, cholesterol: 35, sodium: 380,
      vitaminA: 0.015, vitaminB1: 0.10, vitaminB6: 0.18, vitaminB12: 0.0004,
      vitaminC: 3.5, vitaminD: 0, calcium: 40, iron: 2.2,
      magnesium: 28, zinc: 2.0, nutritionDensity: 9,
    },
    servingUnits: [
      { unit: "plate", unitAr: "طبق", weightInGrams: 350 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "plate",
  },
  {
    name: "Eggah (Egyptian Omelette)",
    nameAr: "عجة",
    category: "protein",
    per100g: {
      caloricValue: 178, protein: 10.5, carbohydrates: 6.5, fat: 12.0,
      fiber: 1.0, sugar: 2.5, cholesterol: 220, sodium: 310,
      vitaminA: 0.115, vitaminB1: 0.06, vitaminB6: 0.12, vitaminB12: 0.0006,
      vitaminC: 4.5, vitaminD: 0.0018, calcium: 55, iron: 1.6,
      magnesium: 18, zinc: 1.0, nutritionDensity: 11,
    },
    servingUnits: [
      { unit: "slice", unitAr: "شريحة", weightInGrams: 80 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "slice",
  },
  {
    name: "Sobia (Egyptian Coconut Drink)",
    nameAr: "سوبيا",
    category: "beverage",
    per100g: {
      caloricValue: 72, protein: 0.8, carbohydrates: 16.5, fat: 1.0,
      fiber: 0.5, sugar: 15.5, cholesterol: 0, sodium: 25,
      vitaminA: 0, vitaminB1: 0.02, vitaminB6: 0.02, vitaminB12: 0,
      vitaminC: 0.5, vitaminD: 0, calcium: 10, iron: 0.1,
      magnesium: 5, zinc: 0.1, nutritionDensity: 2,
    },
    servingUnits: [
      { unit: "glass", unitAr: "كوب", weightInGrams: 250 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "glass",
  },
  {
    name: "Sambousa (Fried Pastry)",
    nameAr: "سمبوسة",
    category: "grain",
    per100g: {
      caloricValue: 310, protein: 8.5, carbohydrates: 28.0, fat: 18.5,
      fiber: 2.0, sugar: 2.5, cholesterol: 25, sodium: 520,
      vitaminA: 0.02, vitaminB1: 0.14, vitaminB6: 0.08, vitaminB12: 0.00008,
      vitaminC: 2.0, vitaminD: 0, calcium: 32, iron: 1.8,
      magnesium: 20, zinc: 0.8, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 50 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Muhallabia (Milk Pudding)",
    nameAr: "مهلبية",
    category: "dairy",
    per100g: {
      caloricValue: 115, protein: 3.5, carbohydrates: 18.5, fat: 3.2,
      fiber: 0.1, sugar: 14.0, cholesterol: 12, sodium: 55,
      vitaminA: 0.033, vitaminB1: 0.04, vitaminB6: 0.04, vitaminB12: 0.0004,
      vitaminC: 0.5, vitaminD: 0.0006, calcium: 118, iron: 0.1,
      magnesium: 12, zinc: 0.38, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوب", weightInGrams: 180 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Qatayef (Stuffed Pancake)",
    nameAr: "قطايف",
    category: "sweet",
    per100g: {
      caloricValue: 295, protein: 8.2, carbohydrates: 40.0, fat: 12.0,
      fiber: 2.0, sugar: 18.0, cholesterol: 30, sodium: 200,
      vitaminA: 0.03, vitaminB1: 0.1, vitaminB6: 0.05, vitaminB12: 0.00015,
      vitaminC: 0.8, vitaminD: 0.0002, calcium: 68, iron: 1.2,
      magnesium: 18, zinc: 0.65, nutritionDensity: 5,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 70 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Zaatar Bread (Manakish)",
    nameAr: "مناقيش بالزعتر",
    category: "grain",
    per100g: {
      caloricValue: 290, protein: 8.0, carbohydrates: 42.0, fat: 10.0,
      fiber: 3.5, sugar: 1.2, cholesterol: 0, sodium: 490,
      vitaminA: 0.008, vitaminB1: 0.20, vitaminB6: 0.09, vitaminB12: 0,
      vitaminC: 1.5, vitaminD: 0, calcium: 90, iron: 3.5,
      magnesium: 45, zinc: 1.0, nutritionDensity: 8,
    },
    servingUnits: [
      { unit: "piece", unitAr: "قطعة", weightInGrams: 120 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "piece",
  },
  {
    name: "Freekeh (Roasted Green Wheat)",
    nameAr: "فريكة",
    category: "grain",
    per100g: {
      caloricValue: 351, protein: 12.6, carbohydrates: 65.0, fat: 2.7,
      fiber: 12.5, sugar: 0.8, cholesterol: 0, sodium: 4,
      vitaminA: 0, vitaminB1: 0.24, vitaminB6: 0.22, vitaminB12: 0,
      vitaminC: 0, vitaminD: 0, calcium: 32, iron: 3.7,
      magnesium: 112, zinc: 3.1, nutritionDensity: 18,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 185 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Loubia (Black-Eyed Beans Stew)",
    nameAr: "لوبيا",
    category: "legume",
    per100g: {
      caloricValue: 116, protein: 8.0, carbohydrates: 20.8, fat: 0.9,
      fiber: 6.0, sugar: 2.8, cholesterol: 0, sodium: 240,
      vitaminA: 0.01, vitaminB1: 0.23, vitaminB6: 0.10, vitaminB12: 0,
      vitaminC: 1.5, vitaminD: 0, calcium: 40, iron: 2.5,
      magnesium: 53, zinc: 1.1, nutritionDensity: 12,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Asha (White Bean Stew)",
    nameAr: "عاشة فاصوليا بيضاء",
    category: "legume",
    per100g: {
      caloricValue: 98, protein: 6.8, carbohydrates: 17.5, fat: 0.5,
      fiber: 5.5, sugar: 1.8, cholesterol: 0, sodium: 210,
      vitaminA: 0.005, vitaminB1: 0.16, vitaminB6: 0.08, vitaminB12: 0,
      vitaminC: 2.0, vitaminD: 0, calcium: 52, iron: 2.2,
      magnesium: 45, zinc: 0.9, nutritionDensity: 11,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوباية", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
  },
  {
    name: "Grilled Hamour (Grouper Fish)",
    nameAr: "هامور مشوي",
    category: "protein",
    per100g: {
      caloricValue: 118, protein: 24.8, carbohydrates: 0, fat: 1.8,
      fiber: 0, sugar: 0, cholesterol: 52, sodium: 64,
      vitaminA: 0.016, vitaminB1: 0.09, vitaminB6: 0.45, vitaminB12: 0.0012,
      vitaminC: 0, vitaminD: 0.012, calcium: 32, iron: 0.9,
      magnesium: 36, zinc: 0.55, nutritionDensity: 20,
    },
    servingUnits: [
      { unit: "fillet", unitAr: "فيليه", weightInGrams: 180 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "fillet",
  },
  {
    name: "Overnight Oats Jar",
    nameAr: "برطمان شوفان ليلي",
    category: "grain",
    per100g: {
      caloricValue: 128, protein: 5.2, carbohydrates: 18.6, fat: 3.5,
      fiber: 3.8, sugar: 5.4, cholesterol: 4, sodium: 54,
      vitaminA: 0.009, vitaminB1: 0.09, vitaminB6: 0.06, vitaminB12: 0.00018,
      vitaminC: 4.8, vitaminD: 0.0002, calcium: 78, iron: 1.5,
      magnesium: 35, zinc: 0.95, nutritionDensity: 16.5,
    },
    servingUnits: [
      { unit: "jar", unitAr: "برطمان", weightInGrams: 220 },
      { unit: "cup", unitAr: "كوب", weightInGrams: 200 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "jar",
    readyMeal: true,
    childFriendly: true,
    healthyForKids: true,
    mealTypes: ["breakfast", "snacks"],
    tags: ["ready meal", "breakfast", "fiber", "kid-friendly"],
    allergens: ["dairy"],
    conditionGuidance: [
      {
        condition: "diabetes",
        status: "recommended",
        noteEn: "Balanced oats and fiber make this a steady breakfast choice.",
        noteAr: "الألياف مع الشوفان تجعلها وجبة فطور متوازنة لسكر الدم.",
        actionEn: "Pair it with cinnamon or extra seeds for slower digestion.",
        actionAr: "أضف قرفة أو بذور لامتصاص أبطأ.",
      },
    ],
  },
  {
    name: "Chicken Rice Bowl",
    nameAr: "بول دجاج وأرز",
    category: "protein",
    per100g: {
      caloricValue: 152, protein: 13.9, carbohydrates: 14.4, fat: 4.1,
      fiber: 1.8, sugar: 1.2, cholesterol: 36, sodium: 198,
      vitaminA: 0.016, vitaminB1: 0.09, vitaminB6: 0.19, vitaminB12: 0.00028,
      vitaminC: 4.6, vitaminD: 0.0003, calcium: 20, iron: 1.0,
      magnesium: 24, zinc: 1.1, nutritionDensity: 15.4,
    },
    servingUnits: [
      { unit: "bowl", unitAr: "بول", weightInGrams: 320 },
      { unit: "plate", unitAr: "طبق", weightInGrams: 350 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "bowl",
    readyMeal: true,
    mealTypes: ["lunch", "dinner"],
    tags: ["ready meal", "protein", "balanced plate"],
    conditionGuidance: [
      {
        condition: "high_cholesterol",
        status: "recommended",
        noteEn: "Lean chicken keeps the meal lighter than high-fat meat bowls.",
        noteAr: "الدجاج القليل الدهن أخف من وجبات اللحوم الدسمة.",
        actionEn: "Choose grilled prep and add extra vegetables if possible.",
        actionAr: "اختره مشويا وأضف خضار أكثر إن أمكن.",
      },
    ],
  },
  {
    name: "Salmon Quinoa Bowl",
    nameAr: "بول سلمون وكينوا",
    category: "protein",
    per100g: {
      caloricValue: 168, protein: 14.2, carbohydrates: 10.1, fat: 7.8,
      fiber: 2.1, sugar: 0.8, cholesterol: 42, sodium: 126,
      vitaminA: 0.018, vitaminB1: 0.07, vitaminB6: 0.29, vitaminB12: 0.0012,
      vitaminC: 3.8, vitaminD: 0.0068, calcium: 24, iron: 1.3,
      magnesium: 34, zinc: 1.05, nutritionDensity: 19.4,
    },
    servingUnits: [
      { unit: "bowl", unitAr: "بول", weightInGrams: 300 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "bowl",
    readyMeal: true,
    mealTypes: ["lunch", "dinner"],
    tags: ["ready meal", "omega 3", "heart friendly"],
    conditionGuidance: [
      {
        condition: "high_cholesterol",
        status: "recommended",
        noteEn: "Salmon supports heart-friendly planning with a better fat profile.",
        noteAr: "السلمون يدعم خطة مناسبة للقلب بتركيبة دهون أفضل.",
        actionEn: "Keep sauces light to preserve the heart-friendly benefit.",
        actionAr: "حافظ على الصوص خفيفا للحفاظ على الفائدة القلبية.",
      },
    ],
  },
  {
    name: "Turkey Avocado Sandwich",
    nameAr: "ساندوتش تركي وأفوكادو",
    category: "grain",
    per100g: {
      caloricValue: 192, protein: 12.1, carbohydrates: 19.6, fat: 7.2,
      fiber: 3.4, sugar: 2.6, cholesterol: 24, sodium: 286,
      vitaminA: 0.015, vitaminB1: 0.14, vitaminB6: 0.16, vitaminB12: 0.0003,
      vitaminC: 4.5, vitaminD: 0.0002, calcium: 46, iron: 1.7,
      magnesium: 28, zinc: 1.1, nutritionDensity: 13.8,
    },
    servingUnits: [
      { unit: "sandwich", unitAr: "ساندوتش", weightInGrams: 210 },
      { unit: "half sandwich", unitAr: "نصف ساندوتش", weightInGrams: 105 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "sandwich",
    readyMeal: true,
    mealTypes: ["breakfast", "lunch"],
    tags: ["ready meal", "sandwich", "portable"],
    allergens: ["gluten"],
  },
  {
    name: "Greek Yogurt Berry Cup",
    nameAr: "كوب زبادي يوناني بالتوت",
    category: "dairy",
    per100g: {
      caloricValue: 112, protein: 8.4, carbohydrates: 10.6, fat: 3.7,
      fiber: 1.9, sugar: 8.2, cholesterol: 12, sodium: 41,
      vitaminA: 0.022, vitaminB1: 0.026, vitaminB6: 0.055, vitaminB12: 0.00068,
      vitaminC: 15.4, vitaminD: 0.0001, calcium: 116, iron: 0.22,
      magnesium: 16, zinc: 0.64, nutritionDensity: 18.2,
    },
    servingUnits: [
      { unit: "cup", unitAr: "كوب", weightInGrams: 170 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "cup",
    readyMeal: true,
    childFriendly: true,
    healthyForKids: true,
    mealTypes: ["breakfast", "snacks"],
    tags: ["ready meal", "kid-friendly", "protein snack"],
    allergens: ["dairy"],
  },
  {
    name: "Hummus Veggie Snack Box",
    nameAr: "بوكس حمص وخضار",
    category: "legume",
    per100g: {
      caloricValue: 141, protein: 5.1, carbohydrates: 12.7, fat: 7.8,
      fiber: 4.6, sugar: 3.1, cholesterol: 0, sodium: 172,
      vitaminA: 0.024, vitaminB1: 0.08, vitaminB6: 0.11, vitaminB12: 0,
      vitaminC: 8.6, vitaminD: 0, calcium: 44, iron: 1.7,
      magnesium: 38, zinc: 0.95, nutritionDensity: 17.1,
    },
    servingUnits: [
      { unit: "box", unitAr: "بوكس", weightInGrams: 180 },
      { unit: "cup", unitAr: "كوب", weightInGrams: 160 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "box",
    readyMeal: true,
    childFriendly: true,
    healthyForKids: true,
    mealTypes: ["snacks", "lunch"],
    tags: ["ready meal", "fiber", "vegetarian"],
    conditionGuidance: [
      {
        condition: "diabetes",
        status: "recommended",
        noteEn: "Fiber and chickpeas are useful for steadier energy.",
        noteAr: "الألياف والحمص مناسبين لطاقة أكثر ثباتا.",
        actionEn: "Keep crackers minimal if you need tighter glucose control.",
        actionAr: "قلل المقرمشات لو محتاج تحكم أقوى في السكر.",
      },
    ],
  },
  {
    name: "Lentil Power Soup",
    nameAr: "شوربة عدس مشبعة",
    category: "legume",
    per100g: {
      caloricValue: 86, protein: 5.9, carbohydrates: 12.8, fat: 1.3,
      fiber: 4.0, sugar: 1.8, cholesterol: 0, sodium: 166,
      vitaminA: 0.028, vitaminB1: 0.13, vitaminB6: 0.13, vitaminB12: 0,
      vitaminC: 3.1, vitaminD: 0, calcium: 28, iron: 2.2,
      magnesium: 34, zinc: 0.9, nutritionDensity: 15.8,
    },
    servingUnits: [
      { unit: "bowl", unitAr: "طبق", weightInGrams: 300 },
      { unit: "cup", unitAr: "كوب", weightInGrams: 240 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "bowl",
    readyMeal: true,
    mealTypes: ["lunch", "dinner"],
    tags: ["ready meal", "fiber", "comfort meal"],
    conditionGuidance: [
      {
        condition: "hypertension",
        status: "recommended",
        noteEn: "Usually safer than salty fast meals when sodium is kept moderate.",
        noteAr: "غالبا أكثر أمانا من الوجبات السريعة المالحة عندما يكون الصوديوم معتدلا.",
        actionEn: "Choose low-salt broth and add lemon instead of more salt.",
        actionAr: "اختر مرقا قليل الملح وأضف ليمونا بدلا من الملح.",
      },
    ],
  },
  {
    name: "Mini Chicken Pasta",
    nameAr: "باستا دجاج للأطفال",
    category: "grain",
    per100g: {
      caloricValue: 158, protein: 9.7, carbohydrates: 17.9, fat: 5.0,
      fiber: 2.1, sugar: 2.3, cholesterol: 22, sodium: 148,
      vitaminA: 0.018, vitaminB1: 0.11, vitaminB6: 0.12, vitaminB12: 0.00018,
      vitaminC: 5.2, vitaminD: 0.0001, calcium: 24, iron: 1.2,
      magnesium: 21, zinc: 0.8, nutritionDensity: 13.6,
    },
    servingUnits: [
      { unit: "bowl", unitAr: "بول", weightInGrams: 240 },
      { unit: "cup", unitAr: "كوب", weightInGrams: 200 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "bowl",
    readyMeal: true,
    childFriendly: true,
    healthyForKids: true,
    mealTypes: ["lunch", "dinner"],
    tags: ["ready meal", "kid-friendly", "balanced carbs"],
    allergens: ["gluten"],
  },
  {
    name: "Banana Oat Pancakes",
    nameAr: "بان كيك موز وشوفان",
    category: "grain",
    per100g: {
      caloricValue: 174, protein: 6.4, carbohydrates: 24.1, fat: 5.1,
      fiber: 3.2, sugar: 8.4, cholesterol: 26, sodium: 118,
      vitaminA: 0.022, vitaminB1: 0.11, vitaminB6: 0.14, vitaminB12: 0.00018,
      vitaminC: 4.2, vitaminD: 0.0003, calcium: 42, iron: 1.4,
      magnesium: 30, zinc: 0.82, nutritionDensity: 14.8,
    },
    servingUnits: [
      { unit: "stack", unitAr: "طبق صغير", weightInGrams: 160 },
      { unit: "piece", unitAr: "قطعة", weightInGrams: 40 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "stack",
    readyMeal: true,
    childFriendly: true,
    healthyForKids: true,
    mealTypes: ["breakfast", "snacks"],
    tags: ["ready meal", "kid-friendly", "healthy breakfast"],
    allergens: ["dairy"],
  },
  {
    name: "Baked Fish Fingers & Veggies",
    nameAr: "أصابع سمك مشوية وخضار",
    category: "protein",
    per100g: {
      caloricValue: 144, protein: 14.8, carbohydrates: 10.1, fat: 4.0,
      fiber: 2.0, sugar: 1.6, cholesterol: 34, sodium: 206,
      vitaminA: 0.021, vitaminB1: 0.09, vitaminB6: 0.19, vitaminB12: 0.0009,
      vitaminC: 6.3, vitaminD: 0.0045, calcium: 26, iron: 0.9,
      magnesium: 25, zinc: 0.74, nutritionDensity: 16.2,
    },
    servingUnits: [
      { unit: "plate", unitAr: "طبق", weightInGrams: 230 },
      { unit: "piece", unitAr: "قطعة", weightInGrams: 35 },
      { unit: "gram", unitAr: "جرام", weightInGrams: 1 },
    ],
    defaultServingUnit: "plate",
    readyMeal: true,
    childFriendly: true,
    healthyForKids: true,
    mealTypes: ["lunch", "dinner"],
    tags: ["ready meal", "kid-friendly", "protein"],
    allergens: ["gluten"],
  },
];

const categoryEmoji: Record<string, string> = {
  dairy: "🥛",
  fruit: "🍎",
  vegetable: "🥗",
  grain: "🍚",
  protein: "🍗",
  nut: "🥜",
  oil: "🫒",
  sweet: "🧁",
  beverage: "🥤",
  legume: "🫘",
};

const categoryGradients: Record<string, [string, string]> = {
  dairy: ["#3b82f6", "#8b5cf6"],
  fruit: ["#f97316", "#ef4444"],
  vegetable: ["#10b981", "#22c55e"],
  grain: ["#f59e0b", "#fb7185"],
  protein: ["#06b6d4", "#0f766e"],
  nut: ["#ca8a04", "#92400e"],
  oil: ["#fbbf24", "#f97316"],
  sweet: ["#ec4899", "#8b5cf6"],
  beverage: ["#38bdf8", "#14b8a6"],
  legume: ["#16a34a", "#14b8a6"],
};

const conditionAliases: Record<string, string[]> = {
  diabetes: ["diabetes", "high sugar", "glucose", "sugar", "سكري", "سكر"],
  hypertension: ["hypertension", "high blood pressure", "pressure", "ضغط", "ضغط الدم"],
  kidney_disease: ["kidney", "kidney disease", "renal", "كلى", "كلوي"],
  high_cholesterol: ["cholesterol", "heart", "cardiac", "كوليسترول", "قلب"],
};

const foodMetadataByName: Record<string, Partial<FoodItem>> = {
  "Apple": {
    childFriendly: true,
    healthyForKids: true,
    tags: ["fresh snack", "kid-friendly", "fruit"],
    mealTypes: ["snacks", "breakfast"],
  },
  "Banana": {
    childFriendly: true,
    healthyForKids: true,
    tags: ["energy snack", "kid-friendly", "fruit"],
    mealTypes: ["breakfast", "snacks"],
  },
  "Strawberry": {
    childFriendly: true,
    healthyForKids: true,
    tags: ["berries", "kid-friendly", "vitamin c"],
    mealTypes: ["breakfast", "snacks"],
  },
  "Greek Yogurt": {
    childFriendly: true,
    healthyForKids: true,
    tags: ["protein snack", "breakfast", "kid-friendly"],
    allergens: ["dairy"],
    conditionGuidance: [
      {
        condition: "diabetes",
        status: "recommended",
        noteEn: "High protein makes it a steadier snack than sweet desserts.",
        noteAr: "البروتين الأعلى يجعله سناكا أكثر ثباتا من الحلويات.",
        actionEn: "Choose plain yogurt and add fruit instead of syrup.",
        actionAr: "اختر الزبادي السادة وأضف فاكهة بدل الشراب السكري.",
      },
    ],
  },
  "Yogurt (Plain)": {
    childFriendly: true,
    healthyForKids: true,
    tags: ["protein snack", "breakfast", "kid-friendly"],
    allergens: ["dairy"],
  },
  "Avocado": {
    tags: ["healthy fats", "heart friendly"],
    conditionGuidance: [
      {
        condition: "high_cholesterol",
        status: "recommended",
        noteEn: "Its fat profile is usually friendlier than processed spreads.",
        noteAr: "تركيبة الدهون فيه عادة أفضل من الدهون المصنعة.",
        actionEn: "Use it instead of creamy sauces when possible.",
        actionAr: "استخدمه بدلا من الصوصات الدسمة عند الإمكان.",
      },
    ],
  },
  "Oatmeal (Cooked)": {
    childFriendly: true,
    healthyForKids: true,
    tags: ["breakfast", "fiber", "steady energy"],
    mealTypes: ["breakfast"],
    conditionGuidance: [
      {
        condition: "diabetes",
        status: "recommended",
        noteEn: "Oats and fiber support steadier glucose planning.",
        noteAr: "الشوفان والألياف يدعمان خطة أكثر ثباتا للسكر.",
        actionEn: "Keep sweet toppings light and add nuts or seeds if tolerated.",
        actionAr: "خفف الإضافات السكرية وأضف مكسرات أو بذور إذا كانت مناسبة.",
      },
    ],
  },
  "Brown Rice (Cooked)": {
    tags: ["whole grain", "balanced carb"],
    conditionGuidance: [
      {
        condition: "diabetes",
        status: "recommended",
        noteEn: "Better fiber support than highly refined rice dishes.",
        noteAr: "يدعم الألياف أفضل من أطباق الأرز المكرر جدا.",
      },
    ],
  },
  "Chicken Breast (Cooked)": {
    tags: ["lean protein", "meal prep"],
    mealTypes: ["lunch", "dinner"],
  },
  "Salmon (Cooked)": {
    tags: ["omega 3", "heart friendly"],
    conditionGuidance: [
      {
        condition: "high_cholesterol",
        status: "recommended",
        noteEn: "Salmon is a stronger heart-friendly protein choice.",
        noteAr: "السلمون خيار بروتين أقوى لصحة القلب.",
        actionEn: "Bake or grill it instead of frying.",
        actionAr: "استخدمه مشويا أو مخبوزا بدل القلي.",
      },
    ],
  },
  "Hummus": {
    childFriendly: true,
    healthyForKids: true,
    tags: ["dip", "fiber", "vegetarian"],
    mealTypes: ["snacks", "lunch"],
  },
  "Lentil Soup": {
    tags: ["warm meal", "fiber", "legume protein"],
    mealTypes: ["lunch", "dinner"],
  },
  "Feta Cheese": {
    conditionGuidance: [
      {
        condition: "hypertension",
        status: "limit",
        noteEn: "Feta can be salty for blood pressure-sensitive plans.",
        noteAr: "الفيتا قد تكون مالحة لخطط التحكم في الضغط.",
        actionEn: "Keep the portion small and add cucumber or tomato beside it.",
        actionAr: "اجعل الحصة صغيرة وأضف خيارا أو طماطم بجانبها.",
        servingLimit: 1,
      },
    ],
  },
  "Halloumi Cheese": {
    conditionGuidance: [
      {
        condition: "hypertension",
        status: "limit",
        noteEn: "Halloumi is typically high in sodium.",
        noteAr: "جبنة الحلوم عادة مرتفعة الصوديوم.",
        actionEn: "Rinse or grill a smaller piece and avoid extra salt.",
        actionAr: "اغسلها أو اشو قطعة أصغر وتجنب إضافة ملح.",
        servingLimit: 1,
      },
    ],
  },
  "Cream Cheese": {
    conditionGuidance: [
      {
        condition: "high_cholesterol",
        status: "limit",
        noteEn: "Cream cheese is richer in fat than lighter dairy choices.",
        noteAr: "الجبنة الكريمية أعلى دهونا من بدائل الألبان الأخف.",
        actionEn: "Swap part of it for labneh or plain yogurt.",
        actionAr: "استبدل جزءا منها بلبنة أو زبادي سادة.",
        servingLimit: 1,
      },
    ],
  },
  "Basbousa (Semolina Cake)": {
    tags: ["dessert", "high sugar"],
    conditionGuidance: [
      {
        condition: "diabetes",
        status: "avoid",
        noteEn: "This dessert is very sugar-dense for glucose-focused plans.",
        noteAr: "هذه الحلوى مرتفعة السكر لخطط التحكم في الجلوكوز.",
        actionEn: "If cravings hit, choose fruit with yogurt instead.",
        actionAr: "إذا ظهرت الرغبة في الحلو، اختر فاكهة مع زبادي بدلا منها.",
      },
    ],
  },
  "Kunafa": {
    tags: ["dessert", "high sugar"],
    conditionGuidance: [
      {
        condition: "diabetes",
        status: "avoid",
        noteEn: "Kunafa is a fast-rising dessert for blood sugar.",
        noteAr: "الكنافة من الحلويات السريعة الرفع لسكر الدم.",
        actionEn: "Keep it for rare occasions and prefer a tiny tasting portion.",
        actionAr: "اجعلها للمناسبات النادرة ويفضل تذوق كمية صغيرة جدا.",
      },
      {
        condition: "high_cholesterol",
        status: "limit",
        noteEn: "Its saturated fat and sugar combination needs tighter portions.",
        noteAr: "اجتماع الدهون المشبعة والسكر فيها يحتاج ضبطا للحصة.",
      },
    ],
  },
  "Sobia (Egyptian Coconut Drink)": {
    tags: ["sweet drink"],
    conditionGuidance: [
      {
        condition: "diabetes",
        status: "limit",
        noteEn: "Sweet drinks can spike glucose faster than whole-food snacks.",
        noteAr: "المشروبات المحلاة قد ترفع السكر أسرع من السناكات الكاملة.",
        actionEn: "Prefer a smaller glass and drink water beside it.",
        actionAr: "اختر كوبا أصغر واشرب ماء بجانبه.",
        servingLimit: 1,
      },
    ],
  },
};

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim())));
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function resolveConditions(values?: string[]): string[] {
  const matches = new Set<string>();
  for (const rawValue of values || []) {
    const normalized = normalizeText(rawValue);
    for (const [condition, aliases] of Object.entries(conditionAliases)) {
      if (aliases.some((alias) => normalized.includes(alias))) {
        matches.add(condition);
      }
    }
  }
  return Array.from(matches);
}

function resolveAllergies(profile: FoodPersonalizationProfile): string[] {
  const matches = new Set<string>();
  const raw = profile.allergies || [];
  raw.forEach((entry) => {
    const normalized = normalizeText(entry);
    if (normalized.includes("dairy") || normalized.includes("milk") || normalized.includes("لبن") || normalized.includes("ألبان")) {
      matches.add("dairy");
    }
    if (normalized.includes("nut") || normalized.includes("peanut") || normalized.includes("مكسر")) {
      matches.add("nuts");
    }
    if (normalized.includes("shell") || normalized.includes("shrimp") || normalized.includes("جمبري") || normalized.includes("قشري")) {
      matches.add("shellfish");
    }
    if (normalized.includes("gluten") || normalized.includes("wheat") || normalized.includes("قمح") || normalized.includes("جلوتين")) {
      matches.add("gluten");
    }
    if (normalized.includes("sesame") || normalized.includes("سمسم")) {
      matches.add("sesame");
    }
  });

  if (profile.dairyFree) matches.add("dairy");
  if (profile.nutAllergy) matches.add("nuts");
  if (profile.shellFishAllergy) matches.add("shellfish");
  if (profile.glutenFree) matches.add("gluten");

  return Array.from(matches);
}

function inferAllergens(food: FoodItem): string[] {
  const name = normalizeText(food.name);
  const allergens = new Set<string>(food.allergens || []);

  if (food.category === "dairy" || /milk|cheese|yogurt|labneh|butter|مهلبية/.test(name)) {
    allergens.add("dairy");
  }
  if (/bread|pasta|wheat|pita|vermicelli|cake|basbousa|kunafa|manakish|semolina|crumb|toast/.test(name)) {
    allergens.add("gluten");
  }
  if (food.category === "nut" || /almond|peanut|cashew|walnut|pistachio/.test(name)) {
    allergens.add("nuts");
  }
  if (/tahini|sesame|سمسم|طحينة/.test(name)) {
    allergens.add("sesame");
  }
  if (/shrimp|prawn|crab|lobster|shellfish/.test(name)) {
    allergens.add("shellfish");
  }

  return Array.from(allergens);
}

function inferMealTypes(food: FoodItem): string[] {
  if (food.mealTypes?.length) return food.mealTypes;
  if (food.readyMeal) return ["lunch", "dinner"];
  if (food.category === "fruit" || food.category === "beverage" || food.category === "sweet" || food.category === "nut") {
    return ["snacks", "breakfast"];
  }
  if (food.category === "dairy") {
    return ["breakfast", "snacks"];
  }
  if (food.category === "protein") {
    return ["lunch", "dinner"];
  }
  if (food.category === "legume") {
    return ["lunch", "dinner"];
  }
  return ["breakfast", "lunch"];
}

function deriveBaseTags(food: FoodItem): string[] {
  const tags = new Set<string>(food.tags || []);
  tags.add(food.category);
  if (food.readyMeal) tags.add("ready meal");
  if (food.childFriendly) tags.add("kid-friendly");
  if (food.healthyForKids) tags.add("healthy kids");
  if (food.per100g.protein >= 12) tags.add("high protein");
  if (food.per100g.fiber >= 4) tags.add("fiber");
  if (food.per100g.sugar >= 18) tags.add("high sugar");
  if (food.per100g.sodium >= 350) tags.add("high sodium");
  return Array.from(tags);
}

function createFoodImage(food: FoodItem): string {
  const [from, to] = categoryGradients[food.category] || ["#2563eb", "#14b8a6"];
  const icon = categoryEmoji[food.category] || "🍽️";
  const title = food.name.length > 22 ? `${food.name.slice(0, 20)}...` : food.name;
  const subtitle = food.readyMeal ? "Ready meal" : (food.childFriendly ? "Healthy pick" : "Food card");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="640" height="400" rx="28" fill="url(#g)" />
      <circle cx="565" cy="72" r="70" fill="rgba(255,255,255,0.14)" />
      <circle cx="82" cy="338" r="92" fill="rgba(255,255,255,0.12)" />
      <text x="50" y="118" font-size="74" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif">${icon}</text>
      <text x="50" y="206" font-size="34" font-weight="700" fill="white" font-family="Inter, Segoe UI, sans-serif">${title}</text>
      <text x="50" y="246" font-size="21" fill="rgba(255,255,255,0.88)" font-family="Inter, Segoe UI, sans-serif">${food.nameAr}</text>
      <text x="50" y="316" font-size="18" fill="rgba(255,255,255,0.82)" font-family="Inter, Segoe UI, sans-serif">${subtitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function enrichFoodItem(food: FoodItem): FoodItem {
  const metadata = foodMetadataByName[food.name] || {};
  const merged: FoodItem = {
    ...food,
    ...metadata,
    readyMeal: metadata.readyMeal ?? food.readyMeal ?? false,
    childFriendly: metadata.childFriendly ?? food.childFriendly ?? false,
    healthyForKids: metadata.healthyForKids ?? food.healthyForKids ?? false,
    tags: uniqueStrings([...(food.tags || []), ...(metadata.tags || [])]),
    allergens: uniqueStrings([...(food.allergens || []), ...(metadata.allergens || [])]),
    mealTypes: metadata.mealTypes || food.mealTypes || inferMealTypes({ ...food, ...metadata }),
    conditionGuidance: [...(food.conditionGuidance || []), ...(metadata.conditionGuidance || [])],
  };

  merged.allergens = uniqueStrings([...(merged.allergens || []), ...inferAllergens(merged)]);
  merged.tags = uniqueStrings([...(merged.tags || []), ...deriveBaseTags(merged)]);
  merged.image = metadata.image || food.image || createFoodImage(merged);

  return merged;
}

export const foodDatabase: FoodItem[] = baseFoodDatabase.map((food) => enrichFoodItem(food));

function isAnimalBasedFood(food: FoodItem): boolean {
  const name = normalizeText(food.name);
  return food.category === "protein" && /chicken|beef|salmon|tuna|fish|hamour|kofta|kebab|lamb|meat|egg/.test(name)
    || food.category === "dairy";
}

function isMeatOrFish(food: FoodItem): boolean {
  const name = normalizeText(food.name);
  return /chicken|beef|salmon|tuna|fish|hamour|kofta|kebab|lamb|meat|shrimp|prawn/.test(name);
}

function elevateStatus(current: FoodConditionStatus, next: FoodConditionStatus): FoodConditionStatus {
  const priority: Record<FoodConditionStatus, number> = {
    recommended: 0,
    limit: 1,
    avoid: 2,
  };
  return priority[next] > priority[current] ? next : current;
}

export function assessFoodForProfile(
  food: FoodItem,
  profile: FoodPersonalizationProfile,
): FoodPersonalizationResult {
  const nutrition = calculateNutrition(food, food.defaultServingUnit, 1);
  const warningsEn: string[] = [];
  const warningsAr: string[] = [];
  const actionsEn: string[] = [];
  const actionsAr: string[] = [];
  const highlightsEn: string[] = [];
  const highlightsAr: string[] = [];
  const matchedAllergens: string[] = [];
  const matchedFavorites: string[] = [];

  let scoreDelta = 0;
  let status: FoodConditionStatus = "recommended";

  const pushWarning = (
    nextStatus: FoodConditionStatus,
    en: string,
    ar: string,
    actionEn?: string,
    actionAr?: string,
    delta = 0,
  ) => {
    status = elevateStatus(status, nextStatus);
    warningsEn.push(en);
    warningsAr.push(ar);
    if (actionEn) actionsEn.push(actionEn);
    if (actionAr) actionsAr.push(actionAr);
    scoreDelta += delta;
  };

  const pushHighlight = (en: string, ar: string, delta = 0) => {
    highlightsEn.push(en);
    highlightsAr.push(ar);
    scoreDelta += delta;
  };

  const activeAllergies = resolveAllergies(profile);
  const activeConditions = resolveConditions(profile.conditions);
  const favoriteFoods = uniqueStrings(profile.favoriteFoods || []).map((item) => normalizeText(item));
  const foodAllergens = new Set(food.allergens || []);

  activeAllergies.forEach((allergy) => {
    if (foodAllergens.has(allergy)) {
      matchedAllergens.push(allergy);
      if (allergy === "dairy") {
        pushWarning(
          "avoid",
          "Contains dairy, which conflicts with your saved allergy or dairy-free setting.",
          "يحتوي على ألبان، وهذا يتعارض مع الحساسية أو إعداد تجنب الألبان المحفوظ.",
          "Choose a dairy-free alternative before adding it as a meal.",
          "اختر بديلا خاليا من الألبان قبل إضافته كوجبة.",
          -55,
        );
      } else if (allergy === "nuts") {
        pushWarning(
          "avoid",
          "Contains nuts and should be blocked for your allergy profile.",
          "يحتوي على مكسرات ويجب منعه مع ملف الحساسية الحالي.",
          "Pick a seed-based or legume-based option instead.",
          "اختر بديلا يعتمد على البذور أو البقول بدلا منه.",
          -60,
        );
      } else if (allergy === "shellfish") {
        pushWarning(
          "avoid",
          "Shellfish-sensitive profile detected for this food.",
          "تم اكتشاف تعارض مع حساسية المأكولات القشرية لهذه الوجبة.",
          "Skip it and use a fish or chicken alternative if approved for you.",
          "تجنبه واختر بديلا من السمك أو الدجاج إذا كان مناسبا لك.",
          -60,
        );
      } else if (allergy === "gluten") {
        pushWarning(
          "avoid",
          "Contains gluten, so it should not be a safe default pick.",
          "يحتوي على جلوتين، لذلك لا يعتبر اختيارا آمنا افتراضيا.",
          "Search for rice, quinoa, vegetables, or gluten-free alternatives.",
          "ابحث عن بدائل الأرز أو الكينوا أو الخضار أو الخيارات الخالية من الجلوتين.",
          -52,
        );
      } else {
        pushWarning("avoid", `Contains ${allergy}.`, `يحتوي على ${allergy}.`, undefined, undefined, -45);
      }
    }
  });

  if (profile.vegetarian && isMeatOrFish(food)) {
    pushWarning(
      "avoid",
      "This food is not vegetarian-friendly.",
      "هذا الطعام غير مناسب للنظام النباتي.",
      "Choose legume, egg, or dairy protein options that fit your plan.",
      "اختر بدائل بروتينية من البقول أو البيض أو الألبان بما يناسب خطتك.",
      -35,
    );
  }

  if (profile.vegan && isAnimalBasedFood(food)) {
    pushWarning(
      "avoid",
      "This food includes animal-based ingredients, so it does not fit a vegan plan.",
      "هذا الطعام يحتوي على مكونات حيوانية، لذلك لا يناسب النظام النباتي الصرف.",
      "Look for fruit, vegetable, legume, or plant-based ready meals instead.",
      "ابحث عن وجبات جاهزة نباتية من الفواكه أو الخضار أو البقول بدلا منه.",
      -45,
    );
  }

  const dietType = normalizeText(profile.dietType || "");
  if ((dietType.includes("low-carb") || dietType.includes("low carb") || dietType.includes("keto")) && nutrition.carbohydrates >= 22) {
    pushWarning(
      "limit",
      "Carb load is on the higher side for your selected diet style.",
      "حمولة الكربوهيدرات أعلى من المناسب لنمط الغذاء الذي اخترته.",
      "Keep the portion smaller or pair it with extra protein and vegetables.",
      "اجعل الحصة أصغر أو أضف معها بروتينا وخضارا أكثر.",
      -14,
    );
  }

  if (profile.age != null && profile.age <= 12) {
    if (food.healthyForKids || food.childFriendly) {
      pushHighlight(
        "Healthy kid-friendly option that fits a younger profile.",
        "خيار صحي مناسب للأطفال ويتماشى مع ملف عمر أصغر.",
        14,
      );
    }
    if (food.category === "sweet" || nutrition.sugar >= 18) {
      pushWarning(
        "limit",
        "For children, this works better as an occasional treat than a default meal.",
        "للأطفال، هذا مناسب أكثر كتحلية أحيانا وليس كوجبة افتراضية.",
        "Use a smaller portion and add fruit, yogurt, or water beside it.",
        "استخدم حصة أصغر وأضف فاكهة أو زبادي أو ماء بجانبه.",
        -12,
      );
    }
  }

  favoriteFoods.forEach((favorite) => {
    if (normalizeText(food.name).includes(favorite) || normalizeText(food.nameAr).includes(favorite)) {
      matchedFavorites.push(favorite);
    }
  });

  if (matchedFavorites.length > 0) {
    pushHighlight(
      "Matches one of the foods you already enjoy, so adherence may be easier.",
      "يتوافق مع أحد الأطعمة التي تفضلها، وبالتالي قد يكون الالتزام أسهل.",
      8,
    );
  }

  const explicitConditionSet = new Set<string>();
  for (const guidance of food.conditionGuidance || []) {
    if (!activeConditions.includes(guidance.condition)) continue;
    explicitConditionSet.add(guidance.condition);
    if (guidance.status === "recommended") {
      pushHighlight(guidance.noteEn, guidance.noteAr, 12);
      if (guidance.actionEn) actionsEn.push(guidance.actionEn);
      if (guidance.actionAr) actionsAr.push(guidance.actionAr);
    } else {
      const delta = guidance.status === "avoid" ? -28 : -14;
      pushWarning(guidance.status, guidance.noteEn, guidance.noteAr, guidance.actionEn, guidance.actionAr, delta);
    }
  }

  activeConditions.forEach((condition) => {
    if (explicitConditionSet.has(condition)) return;

    if (condition === "diabetes") {
      if (nutrition.sugar >= 15) {
        pushWarning(
          "limit",
          "Sugar is relatively high for a glucose-focused meal plan.",
          "السكر مرتفع نسبيا لخطة تركز على التحكم في الجلوكوز.",
          "Pair it with protein and fiber, or switch to a lower-sugar option.",
          "اجمعه مع بروتين وألياف أو اختر بديلا أقل سكرًا.",
          -18,
        );
      } else if (nutrition.fiber >= 3 && nutrition.sugar <= 10) {
        pushHighlight(
          "Fiber and moderate sugar make it easier to fit a diabetes-aware plan.",
          "الألياف مع السكر المعتدل تجعل دمجه أسهل في خطة واعية بالسكري.",
          10,
        );
      }
    }

    if (condition === "hypertension") {
      if (nutrition.sodium >= 350) {
        pushWarning(
          "limit",
          "Sodium is high for blood-pressure-friendly eating.",
          "الصوديوم مرتفع لخطة مناسبة لضغط الدم.",
          "Keep the serving smaller and balance the rest of the day with low-sodium foods.",
          "اجعل الحصة أصغر ووازن باقي اليوم بأطعمة منخفضة الصوديوم.",
          -18,
        );
      } else if (nutrition.sodium <= 170) {
        pushHighlight(
          "Lower sodium makes it easier to fit your blood-pressure goals.",
          "انخفاض الصوديوم يساعد على إدخاله ضمن أهداف ضغط الدم.",
          8,
        );
      }
    }

    if (condition === "kidney_disease") {
      if (nutrition.sodium >= 300 || nutrition.protein >= 30) {
        pushWarning(
          "limit",
          "This may need portion control for kidney-sensitive planning.",
          "قد يحتاج هذا الطعام إلى ضبط الحصة مع الخطط الحساسة للكلى.",
          "Review the portion with your clinician if you are on a renal plan.",
          "راجع الحصة مع المختص إذا كنت على خطة كلوية.",
          -16,
        );
      } else {
        pushHighlight(
          "Moderate portions make it easier to fit kidney-aware planning.",
          "الحصة المتوسطة تجعل دمجه أسهل في الخطة المراعية للكلى.",
          6,
        );
      }
    }

    if (condition === "high_cholesterol") {
      if (nutrition.cholesterol >= 90 || nutrition.fat >= 20) {
        pushWarning(
          "limit",
          "Fat and cholesterol load suggests tighter portion control.",
          "حمولة الدهون والكوليسترول تشير للحاجة إلى ضبط الحصة.",
          "Prefer grilled, baked, or leaner options more often.",
          "يفضل اختيار بدائل مشوية أو مخبوزة أو أقل دهونا بصورة أكبر.",
          -16,
        );
      } else if (/salmon|avocado|oatmeal|quinoa/.test(normalizeText(food.name))) {
        pushHighlight(
          "This supports a more heart-aware food pattern.",
          "هذا الطعام يدعم نمطا غذائيا أكثر ملاءمة للقلب.",
          9,
        );
      }
    }
  });

  if (food.readyMeal) {
    pushHighlight(
      "Counts as a ready-made meal that you can add directly to your day.",
      "تُحسب كوجبة جاهزة ويمكن إضافتها مباشرة ليومك.",
      4,
    );
  }

  if (warningsEn.length === 0 && highlightsEn.length === 0) {
    pushHighlight(
      "Fits your saved preferences without major restrictions.",
      "يتوافق مع تفضيلاتك المحفوظة بدون تعارضات كبيرة.",
      0,
    );
  }

  const highlightEn = warningsEn[0] || highlightsEn[0] || "Fits your current profile.";
  const highlightAr = warningsAr[0] || highlightsAr[0] || "مناسب لملفك الحالي.";

  return {
    scoreDelta,
    status,
    highlightEn,
    highlightAr,
    warningsEn: uniqueStrings(warningsEn),
    warningsAr: uniqueStrings(warningsAr),
    actionsEn: uniqueStrings(actionsEn),
    actionsAr: uniqueStrings(actionsAr),
    matchedAllergens: uniqueStrings(matchedAllergens),
    matchedFavorites: uniqueStrings(matchedFavorites),
  };
}

// ---------------------------------------------------------------------------
// Search function: filters foods by name, Arabic name, tags, and category
// ---------------------------------------------------------------------------
export function searchFoods(query: string, category?: string): FoodItem[] {
  const lowerQuery = query.toLowerCase().trim();
  const arabicQuery = query.trim();

  return foodDatabase.filter((food) => {
    const matchesCategory = category ? food.category === category : true;

    if (!lowerQuery) return matchesCategory;

    const tagMatches = (food.tags || []).some((tag) => tag.toLowerCase().includes(lowerQuery));
    const matchesName =
      food.name.toLowerCase().includes(lowerQuery) ||
      food.nameAr.includes(arabicQuery) ||
      tagMatches;

    return matchesName && matchesCategory;
  });
}

// ---------------------------------------------------------------------------
// Calculated nutrition result type
// ---------------------------------------------------------------------------
export type FoodNutrition = NutritionPer100g;

export interface CalculatedNutrition extends NutritionPer100g {
  totalWeight: number;
}

// ---------------------------------------------------------------------------
// Calculate nutrition for a given food, serving unit, and quantity
// ---------------------------------------------------------------------------
export function calculateNutrition(
  food: FoodItem,
  servingUnit: string,
  quantity: number,
): CalculatedNutrition {
  const serving = food.servingUnits.find(
    (s) => s.unit.toLowerCase() === servingUnit.toLowerCase(),
  );

  const weightInGrams = serving ? serving.weightInGrams : 100;

  // Total weight in grams for the requested quantity
  const totalWeight = weightInGrams * quantity;
  const multiplier = totalWeight / 100;

  const p = food.per100g;

  return {
    caloricValue: Math.round(p.caloricValue * multiplier * 10) / 10,
    protein: Math.round(p.protein * multiplier * 10) / 10,
    carbohydrates: Math.round(p.carbohydrates * multiplier * 10) / 10,
    fat: Math.round(p.fat * multiplier * 10) / 10,
    fiber: Math.round(p.fiber * multiplier * 10) / 10,
    sugar: Math.round(p.sugar * multiplier * 10) / 10,
    cholesterol: Math.round(p.cholesterol * multiplier * 10) / 10,
    sodium: Math.round(p.sodium * multiplier * 10) / 10,
    vitaminA: Math.round(p.vitaminA * multiplier * 1000) / 1000,
    vitaminB1: Math.round(p.vitaminB1 * multiplier * 1000) / 1000,
    vitaminB6: Math.round(p.vitaminB6 * multiplier * 1000) / 1000,
    vitaminB12: Math.round(p.vitaminB12 * multiplier * 100000) / 100000,
    vitaminC: Math.round(p.vitaminC * multiplier * 10) / 10,
    vitaminD: Math.round(p.vitaminD * multiplier * 10000) / 10000,
    calcium: Math.round(p.calcium * multiplier * 10) / 10,
    iron: Math.round(p.iron * multiplier * 100) / 100,
    magnesium: Math.round(p.magnesium * multiplier * 10) / 10,
    zinc: Math.round(p.zinc * multiplier * 100) / 100,
    nutritionDensity: p.nutritionDensity,
    totalWeight,
  };
}
