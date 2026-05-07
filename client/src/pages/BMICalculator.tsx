import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import {
  Calculator,
  Scale,
  Target,
  Heart,
  Activity,
  TrendingUp,
  TrendingDown,
  Info,
  AlertTriangle,
  CheckCircle2,
  Flame,
  History,
  GitCompare,
  Trash2,
  UserCheck,
  Dumbbell,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  NUTRITION_FORMULA_PRESETS,
  type BmrEquationType,
  type NutritionFormulaKey,
  type NutritionFormulaPreset,
} from "@shared/personalization-config";

type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "lightlyActive" | "moderatelyActive" | "veryActive" | "extraActive";

// Devine formula (1974) — gold standard for IBW in clinical nutrition
function calcIBW(heightCm: number, gender: Gender): number {
  const heightInches = heightCm / 2.54;
  const base = gender === "male" ? 50 : 45.5;
  return Math.round((base + 2.3 * (heightInches - 60)) * 10) / 10;
}

// ABW is used when actual weight > 120% of IBW.
function calcABW(actualWeight: number, ibw: number, obesityFactor: number): number | null {
  if (actualWeight > ibw * 1.2) {
    return Math.round((ibw + obesityFactor * (actualWeight - ibw)) * 10) / 10;
  }
  return null;
}

function pctOfIBW(actual: number, ibw: number): number {
  return Math.round((actual / ibw) * 100);
}

// ── Body Composition Equations ────────────────────────────────────────────────

// US Navy method (Hodgdon & Beckett, 1984) — requires waist, neck, [hip for women]
function calcBFNavy(heightCm: number, gender: Gender, waistCm: number, neckCm: number, hipCm?: number): number {
  if (gender === "male") {
    const val = 86.010 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
    return Math.max(3, Math.round(val * 10) / 10);
  } else {
    const hip = hipCm || 90;
    const val = 163.205 * Math.log10(waistCm + hip - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
    return Math.max(8, Math.round(val * 10) / 10);
  }
}

// Deurenberg (1991) — BMI-based estimate, no measurements needed
function calcBFDeurenberg(bmi: number, age: number, gender: Gender): number {
  const sex = gender === "male" ? 1 : 0;
  const val = 1.20 * bmi + 0.23 * age - 10.8 * sex - 5.4;
  return Math.max(3, Math.round(val * 10) / 10);
}

// Lean Body Mass
function calcLBM(weightKg: number, bfPct: number): number {
  return Math.round(weightKg * (1 - bfPct / 100) * 10) / 10;
}

// Fat-Free Mass Index (FFMI) — more meaningful than BMI for muscular individuals
function calcFFMI(lbm: number, heightM: number): number {
  return Math.round((lbm / (heightM * heightM)) * 10) / 10;
}

// Normalized FFMI adjusts for height (Kouri et al., 1995)
function calcFFMINorm(ffmi: number, heightM: number): number {
  return Math.round((ffmi + 6.1 * (1.8 - heightM)) * 10) / 10;
}

// Katch-McArdle BMR — most accurate formula when LBM is known
function calcKatchBMR(lbm: number): number {
  return Math.round(370 + 21.6 * lbm);
}

// Waist-to-Height Ratio
function calcWHtR(waistCm: number, heightCm: number): number {
  return Math.round((waistCm / heightCm) * 100) / 100;
}

// Waist-Hip Ratio
function calcWHR(waistCm: number, hipCm: number): number {
  return Math.round((waistCm / hipCm) * 100) / 100;
}

// Macro targets based on goal and LBM/weight
type MacroGoal = "lose" | "maintain" | "gain";
interface MacroTargets {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  proteinPct: number;
  fatPct: number;
  carbsPct: number;
}

function calcMacros(
  tdee: number,
  goal: MacroGoal,
  weightKg: number,
  lbm: number | undefined,
  preset: NutritionFormulaPreset,
): MacroTargets {
  const refWeight = lbm ?? weightKg;
  const calories = Math.max(1200, Math.round(tdee + preset.calorieDelta[goal]));
  const proteinPerKg = preset.proteinPerKg[goal];
  const fatPerKg = preset.fatPerKg[goal];

  const proteinG = Math.round(refWeight * proteinPerKg);
  const fatG = Math.round(refWeight * fatPerKg);
  const proteinCals = proteinG * 4;
  const fatCals = fatG * 9;
  const carbsCals = Math.max(0, calories - proteinCals - fatCals);
  const carbsG = Math.round(carbsCals / 4);
  const fiberG = Math.round(calories / 1000 * 14); // IOM: 14g per 1000 kcal

  return {
    calories,
    proteinG, fatG, carbsG, fiberG,
    proteinPct: Math.round((proteinCals / calories) * 100),
    fatPct: Math.round((fatCals / calories) * 100),
    carbsPct: Math.round((carbsCals / calories) * 100),
  };
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightlyActive: 1.375,
  moderatelyActive: 1.55,
  veryActive: 1.725,
  extraActive: 1.9,
};

interface FormulaAssignmentResponse {
  settings?: {
    formulas?: {
      activeFormulaKey?: NutritionFormulaKey;
      enabledFormulaKeys?: NutritionFormulaKey[];
      showEquationSteps?: boolean;
    };
  };
}

interface BMIResult {
  bmi: number;
  category: string;
  categoryKey: string;
  color: string;
  colorClass: string;
  bgColorClass: string;
  descKey: string;
  idealWeightMin: number;
  idealWeightMax: number;
  weightDiff: number;
  weightDiffDirection: "gain" | "lose" | "none";
  dailyCalories: number;
  bmrKcal: number;
  tdeeKcal: number;
  activityMultiplier: number;
  bmrFormulaWeight: number;
  goalCalories: { lose: number; maintain: number; gain: number };
  ibw: number;
  abw: number | null;
  weightUsedForCalories: number;
  weightUsedLabel: "actual" | "abw" | "ibw";
  percentOfIBW: number;
  // Body composition estimates from Deurenberg (no measurements needed)
  bfPctEstimate: number;
  lbmEstimate: number;
  fatMassEstimate: number;
  ffmiEstimate: number;
  formulaKey: NutritionFormulaKey;
  formulaLabel: string;
  formulaBmrEquation: BmrEquationType;
  formulaUsesAbw: boolean;
  formulaAbwFactor: number;
  formulaKcalPerKg: number | null;
}

function calculateBMI(
  weight: number,
  heightCm: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  formulaPreset: NutritionFormulaPreset,
): BMIResult {
  const preset = formulaPreset || NUTRITION_FORMULA_PRESETS.mifflin_abw;
  const abwFactor = Number.isFinite(preset.adjustedBodyWeightFactor)
    ? preset.adjustedBodyWeightFactor
    : 0.4;
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  const roundedBMI = Math.round(bmi * 10) / 10;

  // Determine category
  let category: string;
  let categoryKey: string;
  let color: string;
  let colorClass: string;
  let bgColorClass: string;
  let descKey: string;

  if (bmi < 18.5) {
    category = "Underweight";
    categoryKey = "underweight";
    color = "#3b82f6";
    colorClass = "text-blue-500";
    bgColorClass = "bg-blue-500/10";
    descKey = "bmiUnderweightDesc";
  } else if (bmi < 25) {
    category = "Normal";
    categoryKey = "normalWeight";
    color = "#22c55e";
    colorClass = "text-green-500";
    bgColorClass = "bg-green-500/10";
    descKey = "bmiNormalDesc";
  } else if (bmi < 30) {
    category = "Overweight";
    categoryKey = "overweight";
    color = "#f97316";
    colorClass = "text-orange-500";
    bgColorClass = "bg-orange-500/10";
    descKey = "bmiOverweightDesc";
  } else if (bmi < 35) {
    category = "Obese";
    categoryKey = "obese";
    color = "#ef4444";
    colorClass = "text-red-500";
    bgColorClass = "bg-red-500/10";
    descKey = "bmiObeseDesc";
  } else {
    category = "Severely Obese";
    categoryKey = "severelyObese";
    color = "#991b1b";
    colorClass = "text-red-800";
    bgColorClass = "bg-red-800/10";
    descKey = "bmiSeverelyObeseDesc";
  }

  // Ideal weight range (BMI 18.5 - 24.9)
  const idealWeightMin = Math.round(18.5 * heightM * heightM * 10) / 10;
  const idealWeightMax = Math.round(24.9 * heightM * heightM * 10) / 10;

  // Weight difference to reach normal BMI
  let weightDiff = 0;
  let weightDiffDirection: "gain" | "lose" | "none" = "none";
  if (bmi < 18.5) {
    weightDiff = Math.round((idealWeightMin - weight) * 10) / 10;
    weightDiffDirection = "gain";
  } else if (bmi >= 25) {
    weightDiff = Math.round((weight - idealWeightMax) * 10) / 10;
    weightDiffDirection = "lose";
  }

  // IBW / ABW — determines correct weight for energy equations
  const ibw = calcIBW(heightCm, gender);
  const abw = calcABW(weight, ibw, abwFactor);
  const shouldUseAbw = preset.useAdjustedBodyWeight && abw !== null;
  // Obese cases can use ABW based on the selected formula preset.
  const weightUsedForCalories = shouldUseAbw ? abw : weight;
  const weightUsedLabel: "actual" | "abw" | "ibw" = shouldUseAbw ? "abw" : "actual";
  const percentOfIBW = pctOfIBW(weight, ibw);

  // Body composition estimates (Deurenberg 1991) — no measurements needed
  const bfPctEstimate = calcBFDeurenberg(bmi, age, gender);
  const lbmEstimate = calcLBM(weightUsedForCalories, bfPctEstimate);
  const fatMassEstimate = Math.round((weightUsedForCalories - lbmEstimate) * 10) / 10;
  const ffmiEstimate = calcFFMI(lbmEstimate, heightCm / 100);

  let bmrKcal = 0;
  let activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  let tdeeKcal = 0;

  if (preset.bmrEquation === "katchMcArdle") {
    bmrKcal = calcKatchBMR(lbmEstimate);
    tdeeKcal = Math.round(bmrKcal * activityMultiplier);
  } else if (preset.bmrEquation === "abwTer30") {
    const kcalPerKg = Number.isFinite(preset.kcalPerKgForTdee) ? Number(preset.kcalPerKgForTdee) : 30;
    tdeeKcal = Math.round(weightUsedForCalories * kcalPerKg);
    bmrKcal = tdeeKcal;
    activityMultiplier = 1;
  } else {
    bmrKcal = gender === "male"
      ? Math.round(10 * weightUsedForCalories + 6.25 * heightCm - 5 * age + 5)
      : Math.round(10 * weightUsedForCalories + 6.25 * heightCm - 5 * age - 161);
    tdeeKcal = Math.round(bmrKcal * activityMultiplier);
  }

  const goalCalories = {
    lose: Math.max(1200, Math.round(tdeeKcal + preset.calorieDelta.lose)),
    maintain: Math.max(1200, Math.round(tdeeKcal + preset.calorieDelta.maintain)),
    gain: Math.max(1200, Math.round(tdeeKcal + preset.calorieDelta.gain)),
  };

  return {
    bmi: roundedBMI,
    category,
    categoryKey,
    color,
    colorClass,
    bgColorClass,
    descKey,
    idealWeightMin,
    idealWeightMax,
    weightDiff,
    weightDiffDirection,
    dailyCalories: tdeeKcal,
    bmrKcal,
    tdeeKcal,
    activityMultiplier,
    bmrFormulaWeight: weightUsedForCalories,
    goalCalories,
    ibw,
    abw,
    weightUsedForCalories,
    weightUsedLabel,
    percentOfIBW,
    bfPctEstimate,
    lbmEstimate,
    fatMassEstimate,
    ffmiEstimate,
    formulaKey: preset.key,
    formulaLabel: preset.labelEn,
    formulaBmrEquation: preset.bmrEquation,
    formulaUsesAbw: preset.useAdjustedBodyWeight,
    formulaAbwFactor: abwFactor,
    formulaKcalPerKg: preset.bmrEquation === "abwTer30"
      ? (Number.isFinite(preset.kcalPerKgForTdee) ? Number(preset.kcalPerKgForTdee) : 30)
      : null,
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const BMI_HISTORY_KEY = "nutri-intel-bmi-history";

type HistoryEntry = { date: string; bmi: number; weight: number; height: number; category: string; color: string };

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(BMI_HISTORY_KEY) || "[]"); } catch { return []; }
}

export default function BMICalculator() {
  const { t, dir, language } = useLanguage();
  const { toast } = useToast();
  const { data: formulaAssignment } = useQuery<FormulaAssignmentResponse>({
    queryKey: ["bmi-formula-assignment"],
    queryFn: async () => {
      const response = await fetch("/api/profile/customization", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load formula assignment");
      }
      return response.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  const fallbackFormulaKey: NutritionFormulaKey = "mifflin_abw";
  const enabledFormulaKeys = (formulaAssignment?.settings?.formulas?.enabledFormulaKeys || []).filter(
    (key): key is NutritionFormulaKey => Boolean(NUTRITION_FORMULA_PRESETS[key]),
  );
  const assignedFormulaKey = formulaAssignment?.settings?.formulas?.activeFormulaKey;
  const showEquationSteps = formulaAssignment?.settings?.formulas?.showEquationSteps ?? true;
  const selectedFormulaKey: NutritionFormulaKey = assignedFormulaKey && enabledFormulaKeys.includes(assignedFormulaKey)
    ? assignedFormulaKey
    : (enabledFormulaKeys[0] || fallbackFormulaKey);
  const activeFormulaPreset = NUTRITION_FORMULA_PRESETS[selectedFormulaKey] || NUTRITION_FORMULA_PRESETS[fallbackFormulaKey];

  const [activeTab, setActiveTab] = useState<"calculate" | "history" | "compare" | "weight" | "bodycomp" | "macros">("calculate");
  // Body comp tab — precise measurements
  const [waist, setWaist] = useState("");
  const [neck, setNeck] = useState("");
  const [hip, setHip] = useState("");
  // Macros tab
  const [macroGoal, setMacroGoal] = useState<MacroGoal>("maintain");
  const [gender, setGender] = useState<Gender>("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("sedentary");
  const [age, setAge] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [result, setResult] = useState<BMIResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  // Compare tab state
  const [cmpWeight1, setCmpWeight1] = useState("");
  const [cmpHeight1, setCmpHeight1] = useState("");
  const [cmpWeight2, setCmpWeight2] = useState("");
  const [cmpHeight2, setCmpHeight2] = useState("");
  const cmpBMI1 = cmpWeight1 && cmpHeight1 ? Math.round(parseFloat(cmpWeight1) / Math.pow(parseFloat(cmpHeight1) / 100, 2) * 10) / 10 : null;
  const cmpBMI2 = cmpWeight2 && cmpHeight2 ? Math.round(parseFloat(cmpWeight2) / Math.pow(parseFloat(cmpHeight2) / 100, 2) * 10) / 10 : null;

  const handleCalculate = () => {
    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (
      isNaN(ageNum) ||
      isNaN(weightNum) ||
      isNaN(heightNum) ||
      ageNum < 1 ||
      ageNum > 120 ||
      weightNum <= 0 ||
      heightNum <= 0
    ) {
      toast({
        title: dir === "rtl" ? "بيانات غير مكتملة" : "Missing Information",
        description: dir === "rtl" ? "يرجى إدخال العمر والوزن والطول بشكل صحيح" : "Please enter valid age, weight, and height",
      });
      return;
    }

    const bmiResult = calculateBMI(weightNum, heightNum, ageNum, gender, activityLevel, activeFormulaPreset);
    setResult(bmiResult);

    // Save to history
    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      bmi: bmiResult.bmi,
      weight: weightNum,
      height: heightNum,
      category: bmiResult.categoryKey,
      color: bmiResult.color,
    };
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem(BMI_HISTORY_KEY, JSON.stringify(updated));
  };

  // Gauge chart data: scale BMI to a percentage (0-40 BMI range mapped to 0-100%)
  const gaugeValue = result ? Math.min((result.bmi / 40) * 100, 100) : 0;
  const gaugeData = [
    {
      name: "BMI",
      value: gaugeValue,
      fill: result?.color || "#22c55e",
    },
  ];

  // BMI range bar segments
  const bmiRanges = [
    { label: "underweight", min: 0, max: 18.5, color: "#3b82f6" },
    { label: "normalWeight", min: 18.5, max: 24.9, color: "#22c55e" },
    { label: "overweight", min: 25, max: 29.9, color: "#f97316" },
    { label: "obese", min: 30, max: 34.9, color: "#ef4444" },
    { label: "severelyObese", min: 35, max: 40, color: "#991b1b" },
  ];

  // Marker position on the range bar (0-40 scale)
  const markerPosition = result
    ? Math.min(Math.max((result.bmi / 40) * 100, 0), 100)
    : 0;

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentEntriesCount = history.filter((entry) => new Date(entry.date) >= twoWeeksAgo).length;
  const adherenceScore = Math.min(Math.round((recentEntriesCount / 14) * 100), 100);
  const previousEntry = history.length > 1 ? history[1] : null;
  const bmiTrend = result && previousEntry
    ? Math.round((result.bmi - previousEntry.bmi) * 10) / 10
    : null;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4" dir={dir}>
      {/* Header */}
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
          {t("bmiCalculator")}
        </h1>
        <p className="text-muted-foreground mt-2">{t("bmiCalculatorDesc")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/30 flex-wrap">
        {([
          { id: "calculate", icon: Calculator, labelEn: "Calculate", labelAr: "الحساب" },
          { id: "weight", icon: UserCheck, labelEn: "IBW / ABW", labelAr: "الوزن المثالي" },
          { id: "bodycomp", icon: Dumbbell, labelEn: "Body Comp", labelAr: "تكوين الجسم" },
          { id: "macros", icon: Layers, labelEn: "Macros", labelAr: "الماكرو" },
          { id: "history", icon: History, labelEn: "History", labelAr: "السجل" },
          { id: "compare", icon: GitCompare, labelEn: "Compare", labelAr: "مقارنة" },
        ] as const).map(({ id, icon: Icon, labelEn, labelAr }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="w-4 h-4" />
            {language === "ar" ? labelAr : labelEn}
          </button>
        ))}
      </div>

      {/* Body Composition Tab */}
      {activeTab === "bodycomp" && (() => {
        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);
        const ageNum = parseInt(age);
        const hasBasic = !isNaN(weightNum) && !isNaN(heightNum) && heightNum >= 100;
        const heightM = heightNum / 100;
        const bmiVal = hasBasic ? weightNum / (heightM * heightM) : null;

        const waistNum = parseFloat(waist);
        const neckNum = parseFloat(neck);
        const hipNum = parseFloat(hip);
        const hasNavy = !isNaN(waistNum) && !isNaN(neckNum) && waistNum > neckNum &&
          (gender === "male" || (!isNaN(hipNum) && hipNum > 0));

        let bfPct: number | null = null;
        let method = "";
        if (hasNavy && hasBasic) {
          bfPct = calcBFNavy(heightNum, gender, waistNum, neckNum, isNaN(hipNum) ? undefined : hipNum);
          method = language === "ar" ? "US Navy (قياسات)" : "US Navy (measurements)";
        } else if (hasBasic && bmiVal && !isNaN(ageNum)) {
          bfPct = calcBFDeurenberg(bmiVal, ageNum, gender);
          method = language === "ar" ? "Deurenberg (تقدير BMI)" : "Deurenberg (BMI estimate)";
        }

        const lbm = bfPct !== null && hasBasic ? calcLBM(weightNum, bfPct) : null;
        const fatMass = lbm !== null ? Math.round((weightNum - lbm) * 10) / 10 : null;
        const ffmi = lbm !== null ? calcFFMI(lbm, heightM) : null;
        const ffmiNorm = ffmi !== null ? calcFFMINorm(ffmi, heightM) : null;
        const katchBMR = lbm !== null ? calcKatchBMR(lbm) : null;
        const whtRatio = !isNaN(waistNum) && hasBasic ? calcWHtR(waistNum, heightNum) : null;
        const whratio = !isNaN(waistNum) && !isNaN(hipNum) && hipNum > 0 ? calcWHR(waistNum, hipNum) : null;

        const bfCategory = bfPct === null ? "" : gender === "male"
          ? bfPct < 6 ? (language === "ar" ? "أساسي" : "Essential") : bfPct < 14 ? (language === "ar" ? "رياضي" : "Athletic") : bfPct < 18 ? (language === "ar" ? "لياقة" : "Fitness") : bfPct < 25 ? (language === "ar" ? "مقبول" : "Acceptable") : (language === "ar" ? "بدانة" : "Obese")
          : bfPct < 14 ? (language === "ar" ? "أساسي" : "Essential") : bfPct < 21 ? (language === "ar" ? "رياضية" : "Athletic") : bfPct < 25 ? (language === "ar" ? "لياقة" : "Fitness") : bfPct < 32 ? (language === "ar" ? "مقبول" : "Acceptable") : (language === "ar" ? "بدانة" : "Obese");

        const bfColor = bfPct === null ? "text-muted-foreground" : gender === "male"
          ? (bfPct < 6 || bfPct > 25 ? "text-red-500" : bfPct < 18 ? "text-green-500" : "text-amber-500")
          : (bfPct < 14 || bfPct > 32 ? "text-red-500" : bfPct < 25 ? "text-green-500" : "text-amber-500");

        const ffmiLabel = ffmiNorm === null ? "" : gender === "male"
          ? ffmiNorm < 18 ? (language === "ar" ? "تحت المتوسط" : "Below avg") : ffmiNorm < 20 ? (language === "ar" ? "متوسط" : "Average") : ffmiNorm < 22 ? (language === "ar" ? "جيد" : "Good") : ffmiNorm < 23 ? (language === "ar" ? "ممتاز" : "Excellent") : ffmiNorm < 26 ? (language === "ar" ? "متقدم" : "Advanced") : (language === "ar" ? "استثنائي" : "Exceptional")
          : ffmiNorm < 15 ? (language === "ar" ? "تحت المتوسط" : "Below avg") : ffmiNorm < 17 ? (language === "ar" ? "متوسط" : "Average") : ffmiNorm < 19 ? (language === "ar" ? "جيد" : "Good") : ffmiNorm < 21 ? (language === "ar" ? "ممتاز" : "Excellent") : (language === "ar" ? "استثنائي" : "Exceptional");

        return (
          <div className="space-y-5">
            <div className="glass-card p-5 border-s-4 border-primary/40 bg-primary/5">
              <div className="flex items-start gap-3">
                <Dumbbell className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">{language === "ar" ? "تكوين الجسم — أدق من BMI" : "Body Composition — more accurate than BMI"}</p>
                  <p className="text-muted-foreground mt-1">
                    {language === "ar"
                      ? "BMI لا يميز بين الدهون والعضلات. إضافة قياسات الخصر والرقبة يُعطي تحليلاً أدق باستخدام معادلة US Navy."
                      : "BMI can't distinguish fat from muscle. Adding waist & neck measurements gives a more accurate analysis using the US Navy formula."}
                  </p>
                </div>
              </div>
            </div>

            {!hasBasic && (
              <div className="glass-card p-10 text-center space-y-3">
                <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{language === "ar" ? "أدخل الوزن والطول في تبويب الحساب أولاً" : "Enter weight & height in the Calculate tab first"}</p>
                <button onClick={() => setActiveTab("calculate")} className="text-xs text-primary hover:underline">{language === "ar" ? "انتقل للحساب" : "Go to Calculate"}</button>
              </div>
            )}

            {hasBasic && (
              <>
                {/* Optional measurements for US Navy accuracy */}
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Scale className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">
                      {language === "ar" ? "قياسات اختيارية (للدقة العالية — US Navy)" : "Optional measurements (high accuracy — US Navy)"}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">{language === "ar" ? "محيط الخصر (سم)" : "Waist circumference (cm)"}</label>
                      <Input type="number" placeholder="85" value={waist} onChange={(e) => setWaist(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">{language === "ar" ? "محيط الرقبة (سم)" : "Neck circumference (cm)"}</label>
                      <Input type="number" placeholder="37" value={neck} onChange={(e) => setNeck(e.target.value)} className="h-9" />
                    </div>
                    {gender === "female" && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">{language === "ar" ? "محيط الورك (سم)" : "Hip circumference (cm)"}</label>
                        <Input type="number" placeholder="95" value={hip} onChange={(e) => setHip(e.target.value)} className="h-9" />
                      </div>
                    )}
                  </div>
                  {bfPct !== null && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {language === "ar" ? `المعادلة المُستخدَمة: ${method}` : `Formula used: ${method}`}
                    </p>
                  )}
                </div>

                {/* Results grid */}
                {bfPct !== null && lbm !== null && fatMass !== null && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="glass-card p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "نسبة الدهون" : "Body Fat %"}</p>
                      <p className={`text-3xl font-bold ${bfColor}`}>{bfPct}%</p>
                      <p className={`text-xs font-medium mt-1 ${bfColor}`}>{bfCategory}</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "الكتلة العضلية (LBM)" : "Lean Body Mass"}</p>
                      <p className="text-3xl font-bold text-green-500">{lbm}</p>
                      <p className="text-xs text-muted-foreground mt-1">kg</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "كتلة الدهون" : "Fat Mass"}</p>
                      <p className="text-3xl font-bold text-amber-500">{fatMass}</p>
                      <p className="text-xs text-muted-foreground mt-1">kg</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">FFMI</p>
                      <p className="text-3xl font-bold text-primary">{ffmiNorm}</p>
                      <p className="text-xs font-medium text-primary mt-1">{ffmiLabel}</p>
                    </div>
                  </div>
                )}

                {/* Katch-McArdle vs Mifflin comparison */}
                {katchBMR !== null && result && (
                  <div className="glass-card p-5 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {language === "ar" ? "مقارنة معادلات BMR" : "BMR Formula Comparison"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "Katch-McArdle (أدق)" : "Katch-McArdle (most accurate)"}</p>
                        <p className="text-2xl font-bold text-orange-500">{katchBMR}</p>
                        <p className="text-xs text-muted-foreground">kcal BMR</p>
                        <p className="text-xs text-green-600 mt-1">{language === "ar" ? "يستخدم LBM" : "Uses LBM"}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "Mifflin-St Jeor" : "Mifflin-St Jeor"}</p>
                        <p className="text-2xl font-bold text-muted-foreground">{result.bmrKcal}</p>
                        <p className="text-xs text-muted-foreground">kcal BMR</p>
                        <p className="text-xs text-muted-foreground mt-1">{language === "ar" ? "يستخدم الوزن الكلي" : "Uses total weight"}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === "ar"
                        ? "Katch-McArdle هي المعادلة الأدق لأنها تعتمد على الكتلة العضلية النشطة فقط، ليس الوزن الكلي."
                        : "Katch-McArdle is the most accurate BMR formula as it uses lean body mass, not total weight."}
                    </p>
                  </div>
                )}

                {/* WHtR + WHR */}
                {(whtRatio !== null || whratio !== null) && (
                  <div className="glass-card p-5 space-y-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      {language === "ar" ? "مؤشرات خطر القلب والأوعية" : "Cardiovascular Risk Indicators"}
                    </h3>
                    {whtRatio !== null && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">{language === "ar" ? "نسبة الخصر للطول (WHtR)" : "Waist-to-Height Ratio (WHtR)"}</span>
                          <span className={`font-bold ${whtRatio < 0.5 ? "text-green-500" : whtRatio < 0.6 ? "text-amber-500" : "text-red-500"}`}>{whtRatio}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                          <div className={`h-full rounded-full ${whtRatio < 0.5 ? "bg-green-500" : whtRatio < 0.6 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(whtRatio * 150, 100)}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {whtRatio < 0.5
                            ? (language === "ar" ? "✅ منخفض — خصرك أقل من نصف طولك (ممتاز)" : "✅ Low risk — waist < half your height (excellent)")
                            : whtRatio < 0.6
                            ? (language === "ar" ? "⚠️ متوسط — ارتفاع طفيف في خطر القلب" : "⚠️ Moderate — slightly elevated cardiovascular risk")
                            : (language === "ar" ? "🔴 مرتفع — خطر عالٍ على القلب والأوعية" : "🔴 High — significantly elevated cardiovascular risk")}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {language === "ar" ? "الهدف: WHtR < 0.50 (خصرك < نصف طولك)" : "Target: WHtR < 0.50 (waist < half your height)"}
                        </p>
                      </div>
                    )}
                    {whratio !== null && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">{language === "ar" ? "نسبة الخصر للورك (WHR)" : "Waist-Hip Ratio (WHR)"}</span>
                          <span className={`font-bold ${(gender === "male" ? whratio < 0.9 : whratio < 0.85) ? "text-green-500" : "text-red-500"}`}>{whratio}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {language === "ar"
                            ? `الحد الطبيعي: ${gender === "male" ? "< 0.90 للرجال" : "< 0.85 للنساء"} (منظمة الصحة العالمية)`
                            : `Normal: ${gender === "male" ? "< 0.90 for men" : "< 0.85 for women"} (WHO standard)`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* BF% reference table */}
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-sm mb-3">{language === "ar" ? "جدول نسب الدهون المرجعية" : "Body Fat % Reference Ranges"}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border">
                          <th className="text-start pb-2">{language === "ar" ? "التصنيف" : "Category"}</th>
                          <th className="text-center pb-2">{language === "ar" ? "رجال" : "Men"}</th>
                          <th className="text-center pb-2">{language === "ar" ? "نساء" : "Women"}</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-1">
                        {[
                          { cat: language === "ar" ? "أساسي" : "Essential", m: "2–5%", w: "10–13%", color: "text-blue-500" },
                          { cat: language === "ar" ? "رياضي" : "Athletic", m: "6–13%", w: "14–20%", color: "text-green-500" },
                          { cat: language === "ar" ? "لياقة" : "Fitness", m: "14–17%", w: "21–24%", color: "text-green-400" },
                          { cat: language === "ar" ? "مقبول" : "Acceptable", m: "18–24%", w: "25–31%", color: "text-amber-500" },
                          { cat: language === "ar" ? "بدانة" : "Obese", m: ">25%", w: ">32%", color: "text-red-500" },
                        ].map((row) => (
                          <tr key={row.cat} className="border-b border-border/30">
                            <td className={`py-1.5 font-medium ${row.color}`}>{row.cat}</td>
                            <td className="text-center py-1.5 text-muted-foreground">{row.m}</td>
                            <td className="text-center py-1.5 text-muted-foreground">{row.w}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Macros Tab */}
      {activeTab === "macros" && (() => {
        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);
        const hasBasic = !isNaN(weightNum) && !isNaN(heightNum) && heightNum >= 100 && result;
        const tdee = result?.dailyCalories ?? null;

        // LBM from body comp tab inputs if available
        const waistNum = parseFloat(waist);
        const neckNum = parseFloat(neck);
        const hipNum = parseFloat(hip);
        const hasNavy = !isNaN(waistNum) && !isNaN(neckNum) && waistNum > neckNum && heightNum >= 100 &&
          (gender === "male" || !isNaN(hipNum));
        let lbmForMacros: number | undefined;
        if (hasNavy) {
          const bf = calcBFNavy(heightNum, gender, waistNum, neckNum, isNaN(hipNum) ? undefined : hipNum);
          lbmForMacros = calcLBM(weightNum, bf);
        } else if (result) {
          lbmForMacros = result.lbmEstimate;
        }

        const macros = tdee !== null ? calcMacros(tdee, macroGoal, weightNum, lbmForMacros, activeFormulaPreset) : null;

        const goalLabels = {
          lose: { en: "Lose Fat", ar: "خسارة دهون", color: "text-blue-500", desc_en: "Calorie deficit with high protein to preserve muscle", desc_ar: "عجز حراري مع بروتين مرتفع للحفاظ على العضلات" },
          maintain: { en: "Maintain Weight", ar: "الحفاظ على الوزن", color: "text-green-500", desc_en: "Near-maintenance calories with balanced macros", desc_ar: "سعرات قريبة من الاحتياج مع توزيع متوازن للماكرو" },
          gain: { en: "Build Muscle", ar: "بناء عضلات", color: "text-orange-500", desc_en: "Calorie surplus to support lean muscle gain", desc_ar: "فائض حراري لدعم بناء العضلات بشكل نظيف" },
        };

        return (
          <div className="space-y-5">
            <div className="glass-card p-5 border-s-4 border-primary/40 bg-primary/5">
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">{language === "ar" ? "حاسبة الماكرو المُخصَّصة" : "Personalised Macro Calculator"}</p>
                  <p className="text-muted-foreground mt-1">
                    {language === "ar"
                      ? "يستخدم TDEE الخاص بك وكتلتك العضلية (LBM) لحساب أهداف البروتين والكارب والدهن بدقة."
                      : "Uses your TDEE and lean body mass (LBM) to calculate precise protein, carb, and fat targets."}
                  </p>
                  <p className="text-xs text-primary/80 mt-2">
                    {language === "ar"
                      ? `المعادلة النشطة: ${activeFormulaPreset.labelAr}`
                      : `Active formula: ${activeFormulaPreset.labelEn}`}
                  </p>
                </div>
              </div>
            </div>

            {!hasBasic ? (
              <div className="glass-card p-10 text-center space-y-3">
                <Layers className="w-12 h-12 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{language === "ar" ? "احسب BMI أولاً للحصول على TDEE" : "Calculate BMI first to get your TDEE"}</p>
                <button onClick={() => setActiveTab("calculate")} className="text-xs text-primary hover:underline">{language === "ar" ? "انتقل للحساب" : "Go to Calculate"}</button>
              </div>
            ) : (
              <>
                {/* Goal selection */}
                <div className="glass-card p-5 space-y-3">
                  <h3 className="font-semibold text-sm">{language === "ar" ? "اختر هدفك" : "Choose your goal"}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["lose", "maintain", "gain"] as MacroGoal[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => setMacroGoal(g)}
                        className={`p-4 rounded-xl border-2 text-start transition-all ${macroGoal === g ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                      >
                        <p className={`font-semibold text-sm ${macroGoal === g ? "text-primary" : "text-foreground"}`}>
                          {language === "ar" ? goalLabels[g].ar : goalLabels[g].en}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === "ar" ? goalLabels[g].desc_ar : goalLabels[g].desc_en}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {macros && (
                  <>
                    {/* Target calories */}
                    <div className="glass-card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{language === "ar" ? "هدف السعرات اليومي" : "Daily Calorie Target"}</h3>
                        <span className="text-2xl font-bold text-orange-500">{macros.calories.toLocaleString()} kcal</span>
                      </div>
                      {macroGoal === "lose" && macros.calories === 1200 && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-amber-700 dark:text-amber-400">
                            {language === "ar"
                              ? "تحذير: 1200 سعرة هي الحد الأدنى الآمن للنساء. لا تنزل عن هذا الحد لتجنب التأثير السلبي على الأيض."
                              : "Safety floor: 1200 kcal is the minimum safe intake for women. Going lower risks metabolic adaptation and nutrient deficiencies."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Macro breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: language === "ar" ? "بروتين" : "Protein", g: macros.proteinG, pct: macros.proteinPct, cals: macros.proteinG * 4, color: "text-red-500", bg: "bg-red-500", light: "bg-red-500/10", note: language === "ar" ? "4 سعرة/جرام" : "4 kcal/g" },
                        { label: language === "ar" ? "كربوهيدرات" : "Carbs", g: macros.carbsG, pct: macros.carbsPct, cals: macros.carbsG * 4, color: "text-yellow-500", bg: "bg-yellow-500", light: "bg-yellow-500/10", note: language === "ar" ? "4 سعرة/جرام" : "4 kcal/g" },
                        { label: language === "ar" ? "دهون" : "Fat", g: macros.fatG, pct: macros.fatPct, cals: macros.fatG * 9, color: "text-amber-500", bg: "bg-amber-500", light: "bg-amber-500/10", note: language === "ar" ? "9 سعرة/جرام" : "9 kcal/g" },
                      ].map((m) => (
                        <div key={m.label} className={`glass-card p-5 ${m.light} border border-transparent`}>
                          <div className="flex justify-between items-start mb-2">
                            <p className={`font-semibold ${m.color}`}>{m.label}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${m.light} ${m.color} font-medium`}>{m.pct}%</span>
                          </div>
                          <p className="text-3xl font-bold">{m.g}<span className="text-sm font-normal text-muted-foreground ms-1">g</span></p>
                          <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full mt-3 mb-1">
                            <div className={`h-full rounded-full ${m.bg}`} style={{ width: `${m.pct}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground">{m.cals} kcal · {m.note}</p>
                        </div>
                      ))}
                    </div>

                    {/* Fiber + per-meal breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="glass-card p-5 space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {language === "ar" ? "هدف الألياف (IOM)" : "Fiber Goal (IOM)"}
                        </h3>
                        <p className="text-3xl font-bold text-green-500">{macros.fiberG}g<span className="text-sm font-normal text-muted-foreground">/day</span></p>
                        <p className="text-xs text-muted-foreground">
                          {language === "ar"
                            ? `معادلة: 14جم لكل 1000 سعرة × ${(macros.calories / 1000).toFixed(1)} = ${macros.fiberG}جم`
                            : `Formula: 14g per 1000 kcal × ${(macros.calories / 1000).toFixed(1)} = ${macros.fiberG}g`}
                        </p>
                      </div>
                      <div className="glass-card p-5 space-y-3">
                        <h3 className="text-sm font-semibold">{language === "ar" ? "توزيع الوجبات (3 وجبات)" : "Per-meal split (3 meals)"}</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">{language === "ar" ? "سعرات" : "Calories"}</span><span className="font-medium">{Math.round(macros.calories / 3)} kcal</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">{language === "ar" ? "بروتين" : "Protein"}</span><span className="font-medium">{Math.round(macros.proteinG / 3)}g</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">{language === "ar" ? "كارب" : "Carbs"}</span><span className="font-medium">{Math.round(macros.carbsG / 3)}g</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">{language === "ar" ? "دهون" : "Fat"}</span><span className="font-medium">{Math.round(macros.fatG / 3)}g</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground glass-card p-4 space-y-1">
                      <p><span className="font-medium text-foreground">{language === "ar" ? "البروتين:" : "Protein:"}</span> {language === "ar" ? `${activeFormulaPreset.proteinPerKg[macroGoal]}جم × ${lbmForMacros?.toFixed(1) || weightNum} كجم (${lbmForMacros ? "LBM" : language === "ar" ? "وزن" : "weight"})` : `${activeFormulaPreset.proteinPerKg[macroGoal]}g × ${lbmForMacros?.toFixed(1) || weightNum} kg (${lbmForMacros ? "LBM" : "weight"})`}</p>
                      <p><span className="font-medium text-foreground">{language === "ar" ? "الدهون:" : "Fat:"}</span> {language === "ar" ? `${activeFormulaPreset.fatPerKg[macroGoal]}جم × كجم حسب المعادلة النشطة` : `${activeFormulaPreset.fatPerKg[macroGoal]}g/kg from active formula`}</p>
                      <p><span className="font-medium text-foreground">{language === "ar" ? "الكارب:" : "Carbs:"}</span> {language === "ar" ? "السعرات المتبقية بعد البروتين والدهون" : "Remaining calories after protein and fat"}</p>
                      <p><span className="font-medium text-foreground">{language === "ar" ? "الألياف:" : "Fiber:"}</span> {language === "ar" ? "14جم/1000 سعرة (توصية IOM)" : "14g per 1000 kcal (IOM recommendation)"}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* IBW / ABW Tab */}
      {activeTab === "weight" && (() => {
        const heightNum = parseFloat(height);
        const weightNum = parseFloat(weight);
        const hasInputs = !isNaN(heightNum) && !isNaN(weightNum) && heightNum > 0 && weightNum > 0 && heightNum >= 100;
        const ibw = hasInputs ? calcIBW(heightNum, gender) : null;
        const abw = ibw !== null ? calcABW(weightNum, ibw, activeFormulaPreset.adjustedBodyWeightFactor) : null;
        const pct = ibw !== null ? pctOfIBW(weightNum, ibw) : null;
        const abwEligible = abw !== null;
        const useABW = activeFormulaPreset.useAdjustedBodyWeight && abwEligible;
        const effectiveWeight = useABW ? (abw as number) : weightNum;

        // Protein recommendation: 1.2–1.5 g/kg effective weight
        const proteinMin = ibw !== null ? Math.round(effectiveWeight * 1.2) : null;
        const proteinMax = ibw !== null ? Math.round(effectiveWeight * 1.5) : null;

        const pctBarWidth = pct !== null ? Math.min(Math.max((pct / 200) * 100, 2), 100) : 0;
        const pctLabel =
          pct === null ? ""
          : pct < 70 ? (language === "ar" ? "نقص وزن شديد" : "Severely Underweight")
          : pct < 80 ? (language === "ar" ? "نقص وزن" : "Underweight")
          : pct < 90 ? (language === "ar" ? "نقص طفيف" : "Mildly Underweight")
          : pct <= 110 ? (language === "ar" ? "طبيعي" : "Normal")
          : pct <= 120 ? (language === "ar" ? "زيادة طفيفة" : "Slightly Overweight")
          : pct <= 150
            ? (language === "ar"
              ? (activeFormulaPreset.useAdjustedBodyWeight ? "بدانة — استخدم ABW" : "بدانة — المعادلة الحالية تستخدم الوزن الفعلي")
              : (activeFormulaPreset.useAdjustedBodyWeight ? "Obese - use ABW" : "Obese - current formula uses actual weight"))
            : (language === "ar"
              ? (activeFormulaPreset.useAdjustedBodyWeight ? "بدانة مفرطة — استخدم ABW" : "بدانة مفرطة — المعادلة الحالية تستخدم الوزن الفعلي")
              : (activeFormulaPreset.useAdjustedBodyWeight ? "Severely Obese - use ABW" : "Severely Obese - current formula uses actual weight"));

        const pctColor =
          pct === null ? "bg-muted"
          : pct < 80 ? "bg-blue-500"
          : pct <= 120 ? "bg-green-500"
          : "bg-red-500";

        return (
          <div className="space-y-5">
            {/* Explanation banner */}
            <div className="glass-card p-5 border-s-4 border-primary/40 bg-primary/5">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">
                    {language === "ar" ? "لماذا الوزن المثالي مهم؟" : "Why does ideal weight matter for nutrition?"}
                  </p>
                  <p className="text-muted-foreground">
                    {language === "ar"
                      ? "في حالات البدانة، استخدام الوزن الفعلي يُبالغ في تقدير احتياجات السعرات والبروتين. الوزن المُعدَّل (ABW) يعكس الكتلة الخلوية النشطة ويعطي توصية أدق."
                      : "In obesity, using actual weight overestimates calorie and protein needs. Adjusted Body Weight (ABW) reflects metabolically active tissue and gives more accurate recommendations."}
                  </p>
                  <p className="text-xs text-primary/80">
                    {language === "ar"
                      ? `المعادلة النشطة: ${activeFormulaPreset.labelAr}`
                      : `Active formula: ${activeFormulaPreset.labelEn}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Need inputs prompt */}
            {!hasInputs && (
              <div className="glass-card p-10 text-center space-y-3">
                <UserCheck className="w-12 h-12 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">
                  {language === "ar"
                    ? "أدخل الوزن والطول في تبويب الحساب أولاً"
                    : "Enter your weight and height in the Calculate tab first"}
                </p>
                <button
                  onClick={() => setActiveTab("calculate")}
                  className="text-xs text-primary hover:underline"
                >
                  {language === "ar" ? "انتقل إلى الحساب" : "Go to Calculate"}
                </button>
              </div>
            )}

            {hasInputs && ibw !== null && (
              <>
                {/* % of IBW meter */}
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base">
                      {language === "ar" ? "النسبة من الوزن المثالي" : "% of Ideal Body Weight"}
                    </h3>
                    <span className={`text-2xl font-bold ${pct! > 120 ? "text-red-500" : pct! <= 110 ? "text-green-500" : "text-amber-500"}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${pctColor}`}
                      style={{ width: `${pctBarWidth}%` }}
                    />
                    {/* 100% marker */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white/60" style={{ left: "50%" }} />
                    {/* 120% marker */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white/30" style={{ left: "60%" }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="text-white/60">100% {language === "ar" ? "(مثالي)" : "(ideal)"}</span>
                    <span className="text-white/40">120% {language === "ar" ? "(حد ABW)" : "(ABW threshold)"}</span>
                    <span>200%</span>
                  </div>
                  <p className={`text-sm font-medium text-center ${pct! > 120 ? "text-red-500" : pct! <= 110 ? "text-green-500" : "text-amber-500"}`}>
                    {pctLabel}
                  </p>
                </div>

                {/* IBW + ABW cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* IBW card */}
                  <div className={`glass-card p-6 space-y-3 ${!useABW ? "ring-2 ring-primary/40" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">IBW</p>
                        <p className="text-xs text-muted-foreground">
                          {language === "ar" ? "الوزن المثالي (Devine)" : "Ideal Body Weight (Devine)"}
                        </p>
                      </div>
                      {!useABW && (
                        <span className="ms-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          {language === "ar" ? "مُستخدَم" : "In use"}
                        </span>
                      )}
                    </div>
                    <p className="text-4xl font-bold text-primary">{ibw} <span className="text-lg font-normal text-muted-foreground">kg</span></p>
                    <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
                      <p className="font-medium text-foreground">{language === "ar" ? "المعادلة:" : "Formula:"}</p>
                      <p className="font-mono bg-muted/50 px-2 py-1 rounded text-[11px]">
                        {gender === "male"
                          ? `50 + 2.3 × (${Math.round(heightNum / 2.54 * 10) / 10}" − 60") = ${ibw} kg`
                          : `45.5 + 2.3 × (${Math.round(heightNum / 2.54 * 10) / 10}" − 60") = ${ibw} kg`}
                      </p>
                    </div>
                  </div>

                  {/* ABW card */}
                  <div className={`glass-card p-6 space-y-3 ${useABW ? "ring-2 ring-amber-500/40" : "opacity-60"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${useABW ? "bg-amber-500/10" : "bg-muted"}`}>
                        <Scale className={`w-4 h-4 ${useABW ? "text-amber-500" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">ABW</p>
                        <p className="text-xs text-muted-foreground">
                          {language === "ar" ? "الوزن المُعدَّل" : "Adjusted Body Weight"}
                        </p>
                      </div>
                      {useABW && (
                        <span className="ms-auto text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                          {language === "ar" ? "مُستخدَم" : "In use"}
                        </span>
                      )}
                    </div>
                    {useABW && abw !== null ? (
                      <>
                        <p className="text-4xl font-bold text-amber-500">{abw} <span className="text-lg font-normal text-muted-foreground">kg</span></p>
                        <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
                          <p className="font-medium text-foreground">{language === "ar" ? "المعادلة:" : "Formula:"}</p>
                          <p className="font-mono bg-muted/50 px-2 py-1 rounded text-[11px]">
                            {ibw} + {activeFormulaPreset.adjustedBodyWeightFactor.toFixed(2)} × ({weightNum} − {ibw}) = {abw} kg
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-green-500/50" />
                        <p className="text-sm text-muted-foreground">
                          {abwEligible
                            ? (language === "ar"
                              ? "ABW متاح لكن المعادلة النشطة من الأدمن تستخدم الوزن الفعلي"
                              : "ABW is available but disabled by the active admin formula")
                            : (language === "ar"
                              ? "الوزن الفعلي أقل من 120% من IBW - لا حاجة لـ ABW"
                              : "Actual weight < 120% of IBW - ABW not applicable")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommended calorie + protein */}
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold">
                      {language === "ar" ? "التوصيات الغذائية المُعدَّلة" : "Adjusted Nutrition Recommendations"}
                    </h3>
                  </div>

                  <div className={`flex items-start gap-3 p-4 rounded-xl ${useABW ? "bg-amber-500/10 border border-amber-500/20" : "bg-green-500/10 border border-green-500/20"}`}>
                    {useABW
                      ? <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      : <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
                    <div className="text-sm">
                      <p className="font-semibold">
                        {language === "ar" ? "الوزن المُستخدَم للحسابات:" : "Weight used for calculations:"}
                        {" "}<span className={`${useABW ? "text-amber-500" : "text-green-500"}`}>
                          {useABW ? `ABW = ${abw} kg` : `${language === "ar" ? "الوزن الفعلي" : "Actual"} = ${weightNum} kg`}
                        </span>
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {useABW
                          ? (language === "ar"
                              ? "وزنك يتجاوز 120% من IBW — استخدام الوزن الفعلي سيُبالغ في السعرات المحسوبة"
                              : "Your weight exceeds 120% of IBW — using actual weight would overestimate caloric needs")
                          : (abwEligible && !activeFormulaPreset.useAdjustedBodyWeight)
                            ? (language === "ar"
                              ? "المعادلة النشطة تضبط الحساب على الوزن الفعلي حتى مع توفر ABW"
                              : "The active formula keeps calculations on actual weight even when ABW is available")
                          : (language === "ar"
                              ? "وزنك ضمن النطاق الطبيعي — الوزن الفعلي مناسب للحساب"
                              : "Your weight is within normal range — actual weight is appropriate")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/30 text-center">
                      <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "السعرات اليومية" : "Est. Daily Calories"}</p>
                      <p className="text-2xl font-bold text-orange-500">
                        {result ? result.dailyCalories : (language === "ar" ? "—" : "—")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result ? "kcal/day" : (language === "ar" ? "احسب أولاً" : "Calculate first")}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 text-center">
                      <Activity className="w-6 h-6 text-red-500 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "البروتين اليومي" : "Daily Protein"}</p>
                      <p className="text-2xl font-bold text-red-500">
                        {proteinMin}–{proteinMax}
                      </p>
                      <p className="text-xs text-muted-foreground">g/day</p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground border-t border-border pt-3 space-y-1">
                    <p>
                      <span className="font-medium text-foreground">IBW:</span>{" "}
                      {language === "ar" ? "Devine 1974 — للرجال: 50 + 2.3 × (البوصة - 60)، للنساء: 45.5 + 2.3 × (البوصة - 60)" : "Devine 1974 — Male: 50 + 2.3 × (in − 60), Female: 45.5 + 2.3 × (in − 60)"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">ABW:</span>{" "}
                      {language === "ar"
                        ? `يُستخدم عند الوزن > 120% من IBW بمعامل ${activeFormulaPreset.adjustedBodyWeightFactor.toFixed(2)} حسب المعادلة النشطة (${activeFormulaPreset.labelAr})`
                        : `Applied when actual > 120% IBW using factor ${activeFormulaPreset.adjustedBodyWeightFactor.toFixed(2)} from active formula (${activeFormulaPreset.labelEn})`}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">{language === "ar" ? "البروتين:" : "Protein:"}</span>{" "}
                      {language === "ar" ? `1.2–1.5 جم/كجم من ${useABW ? "ABW" : "الوزن الفعلي"}` : `1.2–1.5 g/kg of ${useABW ? "ABW" : "actual weight"}`}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <History className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">{language === "ar" ? "لا يوجد سجل بعد. احسب BMI أولاً" : "No history yet. Calculate your BMI first"}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button onClick={() => { setHistory([]); localStorage.removeItem(BMI_HISTORY_KEY); }} className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" />{language === "ar" ? "مسح السجل" : "Clear history"}
                </button>
              </div>
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg" style={{ color: h.color }}>{h.bmi}</p>
                      <p className="text-xs text-muted-foreground">{t(h.category as any)} · {h.weight}kg / {h.height}cm</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === "compare" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-6 space-y-3">
              <h3 className="font-semibold">{language === "ar" ? "القياس الأول" : "Measurement 1"}</h3>
              <input type="number" placeholder={language === "ar" ? "الوزن (كجم)" : "Weight (kg)"} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" value={cmpWeight1} onChange={(e) => setCmpWeight1(e.target.value)} />
              <input type="number" placeholder={language === "ar" ? "الطول (سم)" : "Height (cm)"} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" value={cmpHeight1} onChange={(e) => setCmpHeight1(e.target.value)} />
              {cmpBMI1 && <div className="text-center pt-2"><p className="text-3xl font-bold">{cmpBMI1}</p><p className="text-sm text-muted-foreground">BMI</p></div>}
            </div>
            <div className="glass-card p-6 space-y-3">
              <h3 className="font-semibold">{language === "ar" ? "القياس الثاني" : "Measurement 2"}</h3>
              <input type="number" placeholder={language === "ar" ? "الوزن (كجم)" : "Weight (kg)"} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" value={cmpWeight2} onChange={(e) => setCmpWeight2(e.target.value)} />
              <input type="number" placeholder={language === "ar" ? "الطول (سم)" : "Height (cm)"} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" value={cmpHeight2} onChange={(e) => setCmpHeight2(e.target.value)} />
              {cmpBMI2 && <div className="text-center pt-2"><p className="text-3xl font-bold">{cmpBMI2}</p><p className="text-sm text-muted-foreground">BMI</p></div>}
            </div>
          </div>
          {cmpBMI1 && cmpBMI2 && (
            <div className="glass-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">{language === "ar" ? "الفرق" : "Difference"}</p>
              <p className={`text-4xl font-bold ${cmpBMI2 < cmpBMI1 ? "text-green-500" : cmpBMI2 > cmpBMI1 ? "text-red-500" : "text-muted-foreground"}`}>
                {cmpBMI2 > cmpBMI1 ? "+" : ""}{Math.round((cmpBMI2 - cmpBMI1) * 10) / 10}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{cmpBMI2 < cmpBMI1 ? (language === "ar" ? "تحسن ✓" : "Improved ✓") : cmpBMI2 > cmpBMI1 ? (language === "ar" ? "زيادة" : "Increased") : (language === "ar" ? "لا تغيير" : "No change")}</p>
            </div>
          )}
        </div>
      )}

      {/* Calculate Tab */}
      {activeTab === "calculate" && <>

      {/* Input Section */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">{t("calculateBMI")}</h2>
        </div>

        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">{t("gender")}</Label>
            <Select value={gender} onValueChange={(v: string) => setGender(v as Gender)}>
              <SelectTrigger id="gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("male")}</SelectItem>
                <SelectItem value="female">{t("female")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activity Level */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="activityLevel">{t("activityLevel")}</Label>
            <Select value={activityLevel} onValueChange={(v: string) => setActivityLevel(v as ActivityLevel)}>
              <SelectTrigger id="activityLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">{t("sedentary")}</SelectItem>
                <SelectItem value="lightlyActive">{t("lightlyActive")}</SelectItem>
                <SelectItem value="moderatelyActive">{t("moderatelyActive")}</SelectItem>
                <SelectItem value="veryActive">{t("veryActive")}</SelectItem>
                <SelectItem value="extraActive">{t("extraActive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="age">
              {t("age")} ({t("yearsUnit")})
            </Label>
            <Input
              id="age"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="25"
              value={age}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setAge(v);
              }}
            />
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight">
              {t("weight")}
            </Label>
            <Input
              id="weight"
              type="text"
              inputMode="decimal"
              pattern="[0-9.]*"
              placeholder="70"
              value={weight}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                setWeight(v);
              }}
            />
          </div>

          {/* Height */}
          <div className="space-y-2">
            <Label htmlFor="height">
              {t("height")}
            </Label>
            <Input
              id="height"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="175"
              value={height}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setHeight(v);
              }}
            />
          </div>
        </div>

        <Button className="w-full mt-6" size="lg" onClick={handleCalculate}>
          <Calculator className="w-4 h-4 me-2" />
          {t("calculateBMI")}
        </Button>
      </div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6"
          >
            {/* BMI Value Display - Radial Gauge */}
            <motion.div variants={itemVariants} className="glass-card p-6">
              <div className="flex flex-col items-center">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="70%"
                      outerRadius="90%"
                      barSize={14}
                      startAngle={225}
                      endAngle={-45}
                      data={gaugeData}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        background={{ fill: "hsl(var(--muted))" }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  {/* Center text overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm text-muted-foreground font-medium">
                      {t("yourBMI")}
                    </span>
                    <span
                      className="text-5xl font-extrabold tracking-tight"
                      style={{ color: result.color }}
                    >
                      {result.bmi}
                    </span>
                    <span className={`text-sm font-semibold mt-1 ${result.colorClass}`}>
                      {t(result.categoryKey as any)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* BMI Categories Reference Bar */}
            <motion.div variants={itemVariants} className="glass-card p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                {t("bmiCategory")}
              </h3>

              {/* Range Bar */}
              <div className="relative mt-2 mb-8">
                <div className="flex h-4 rounded-full overflow-hidden">
                  {bmiRanges.map((range) => {
                    const widthPercent = ((range.max - range.min) / 40) * 100;
                    return (
                      <div
                        key={range.label}
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: range.color,
                        }}
                        className="relative"
                      />
                    );
                  })}
                </div>

                {/* Marker */}
                <div
                  className="absolute top-0 -translate-x-1/2 transition-all duration-700 ease-out"
                  style={{ left: `${markerPosition}%` }}
                >
                  <div className="w-1 h-4 bg-white rounded-full shadow-lg shadow-white/50" />
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-white mx-auto mt-0.5 rotate-180" />
                </div>

                {/* Range Labels */}
                <div className="flex mt-3">
                  {bmiRanges.map((range) => {
                    const widthPercent = ((range.max - range.min) / 40) * 100;
                    return (
                      <div
                        key={range.label}
                        style={{ width: `${widthPercent}%` }}
                        className="text-center"
                      >
                        <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                          {t(range.label as any)}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">
                          {range.min === 0 ? "<" : range.min}-
                          {range.max === 40 ? "40+" : range.max}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Interpretation Card */}
            <motion.div variants={itemVariants} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2.5 rounded-xl ${result.bgColorClass}`}
                >
                  {result.bmi < 18.5 ? (
                    <Info className={`w-5 h-5 ${result.colorClass}`} />
                  ) : result.bmi < 25 ? (
                    <CheckCircle2 className={`w-5 h-5 ${result.colorClass}`} />
                  ) : (
                    <AlertTriangle className={`w-5 h-5 ${result.colorClass}`} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{t("bmiInterpretation")}</h3>
                  <p className={`text-sm font-semibold ${result.colorClass}`}>
                    {t(result.categoryKey as any)}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4 text-sm leading-relaxed">
                <p className="text-muted-foreground">
                  {t(result.descKey as any)}
                </p>

                {/* Health Risks */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    {result.bmi < 18.5
                      ? (dir === "rtl" ? "المخاطر الصحية لنقص الوزن" : "Health Risks of Being Underweight")
                      : result.bmi < 25
                        ? (dir === "rtl" ? "الحفاظ على وزن صحي" : "Maintaining a Healthy Weight")
                        : (dir === "rtl" ? "المخاطر الصحية المرتبطة" : "Associated Health Risks")}
                  </h4>
                  <ul className="space-y-1.5 text-muted-foreground ms-6 list-disc">
                    {result.bmi < 18.5 && (
                      <>
                        <li>{dir === "rtl" ? "ضعف الجهاز المناعي وزيادة خطر العدوى" : "Weakened immune system and increased infection risk"}</li>
                        <li>{dir === "rtl" ? "نقص التغذية (الحديد، ب12، حمض الفوليك)" : "Nutritional deficiencies (iron, B12, folate)"}</li>
                        <li>{dir === "rtl" ? "فقدان كثافة العظام وزيادة خطر الكسور" : "Bone density loss and increased fracture risk"}</li>
                        <li>{dir === "rtl" ? "مشاكل في الخصوبة واختلالات هرمونية" : "Fertility issues and hormonal imbalances"}</li>
                      </>
                    )}
                    {result.bmi >= 18.5 && result.bmi < 25 && (
                      <>
                        <li>{dir === "rtl" ? "خطر أقل للإصابة بأمراض القلب والأوعية الدموية" : "Lower risk of cardiovascular disease"}</li>
                        <li>{dir === "rtl" ? "تنظيم أفضل لسكر الدم" : "Better blood sugar regulation"}</li>
                        <li>{dir === "rtl" ? "انخفاض خطر مشاكل المفاصل" : "Reduced risk of joint problems"}</li>
                        <li>{dir === "rtl" ? "تحسن مستويات الطاقة وجودة النوم" : "Improved energy levels and sleep quality"}</li>
                      </>
                    )}
                    {result.bmi >= 25 && result.bmi < 30 && (
                      <>
                        <li>{dir === "rtl" ? "زيادة خطر الإصابة بالسكري من النوع الثاني" : "Increased risk of type 2 diabetes"}</li>
                        <li>{dir === "rtl" ? "ارتفاع ضغط الدم والكوليسترول" : "Higher blood pressure and cholesterol"}</li>
                        <li>{dir === "rtl" ? "ضغط أكبر على المفاصل خاصة الركبتين" : "Greater strain on joints, especially knees"}</li>
                        <li>{dir === "rtl" ? "ارتفاع خطر انقطاع التنفس أثناء النوم" : "Elevated risk of sleep apnea"}</li>
                      </>
                    )}
                    {result.bmi >= 30 && (
                      <>
                        <li>{dir === "rtl" ? "ارتفاع ملحوظ في خطر أمراض القلب والسكتة الدماغية" : "Significantly elevated risk of heart disease and stroke"}</li>
                        <li>{dir === "rtl" ? "خطر مرتفع للسكري من النوع الثاني ومقاومة الأنسولين" : "High risk of type 2 diabetes and insulin resistance"}</li>
                        <li>{dir === "rtl" ? "زيادة خطر الإصابة ببعض أنواع السرطان" : "Increased risk of certain cancers"}</li>
                        <li>{dir === "rtl" ? "احتمال أكبر لانقطاع التنفس أثناء النوم ومشاكل التنفس" : "Greater likelihood of sleep apnea and breathing issues"}</li>
                        <li>{dir === "rtl" ? "مشاكل المفاصل وانخفاض القدرة على الحركة" : "Joint problems and reduced mobility"}</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Personalized Recommendations */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    {dir === "rtl" ? "توصيات مخصصة" : "Personalized Recommendations"}
                  </h4>
                  <ul className="space-y-1.5 text-muted-foreground ms-6 list-disc">
                    {result.bmi < 18.5 && (
                      <>
                        <li>
                          {dir === "rtl"
                            ? "زيادة السعرات الحرارية بمقدار 300-500 سعرة/يوم بأطعمة غنية بالعناصر الغذائية"
                            : `Increase caloric intake by 300-500 kcal/day with nutrient-dense foods`}
                        </li>
                        <li>
                          {dir === "rtl"
                            ? `التركيز على الأطعمة الغنية بالبروتين (${gender === "male" ? "1.2-1.5" : "1.0-1.2"} جم لكل كجم من وزن الجسم)`
                            : `Focus on protein-rich foods (${gender === "male" ? "1.2-1.5" : "1.0-1.2"}g per kg body weight)`}
                        </li>
                        <li>{dir === "rtl" ? "تضمين الدهون الصحية: المكسرات، الأفوكادو، زيت الزيتون" : "Include healthy fats: nuts, avocado, olive oil"}</li>
                        <li>
                          {dir === "rtl"
                            ? "تمارين القوة 2-3 مرات أسبوعياً لبناء الكتلة العضلية"
                            : "Strength training 2-3 times per week to build lean mass"}
                        </li>
                        {parseInt(age) > 50 && (
                          <li>
                            {dir === "rtl"
                              ? "ينصح بفحص كثافة العظام بسبب المخاطر المرتبطة بالعمر"
                              : "Consider bone density screening due to age-related risk"}
                          </li>
                        )}
                      </>
                    )}
                    {result.bmi >= 18.5 && result.bmi < 25 && (
                      <>
                        <li>
                          {dir === "rtl"
                            ? `حافظ على نظامك الغذائي المتوازن الحالي بمقدار ${result.dailyCalories} سعرة/يوم`
                            : `Maintain current balanced diet with ${result.dailyCalories} kcal/day`}
                        </li>
                        <li>
                          {dir === "rtl"
                            ? "استمر في النشاط البدني المنتظم (150 دقيقة تمارين معتدلة/أسبوع)"
                            : "Continue regular physical activity (150 min moderate exercise/week)"}
                        </li>
                        <li>{dir === "rtl" ? "فحوصات صحية سنوية لمراقبة المؤشرات الحيوية" : "Annual health screenings to monitor key biomarkers"}</li>
                        {parseInt(age) > 40 && (
                          <li>
                            {dir === "rtl"
                              ? "راقب المؤشرات الأيضية بشكل أكثر تكراراً بالنظر لعمرك"
                              : "Monitor metabolic markers more frequently given your age"}
                          </li>
                        )}
                      </>
                    )}
                    {result.bmi >= 25 && result.bmi < 30 && (
                      <>
                        <li>
                          {dir === "rtl"
                            ? "قلل السعرات اليومية بمقدار 300-500 سعرة لخسارة تدريجية 0.5-1 كجم/أسبوع"
                            : "Reduce daily intake by 300-500 kcal to target gradual weight loss of 0.5-1 kg/week"}
                        </li>
                        <li>
                          {dir === "rtl"
                            ? "زد تناول الألياف إلى 25-30 جم/يوم لتحسين الشبع"
                            : "Increase fiber intake to 25-30g/day for improved satiety"}
                        </li>
                        <li>
                          {dir === "rtl"
                            ? "استهدف 200+ دقيقة من النشاط الهوائي المعتدل أسبوعياً"
                            : "Aim for 200+ minutes of moderate aerobic activity per week"}
                        </li>
                        <li>
                          {dir === "rtl"
                            ? "قلل من الأطعمة المصنعة والسكريات المضافة والدهون المشبعة"
                            : "Limit processed foods, added sugars, and saturated fats"}
                        </li>
                        {gender === "male" && parseInt(age) > 45 && (
                          <li>
                            {dir === "rtl"
                              ? "افحص عوامل خطر القلب والأوعية الدموية بانتظام"
                              : "Screen for cardiovascular risk factors regularly"}
                          </li>
                        )}
                        {gender === "female" && parseInt(age) > 55 && (
                          <li>
                            {dir === "rtl"
                              ? "راقبي ضغط الدم ومستويات الدهون بانتظام"
                              : "Monitor blood pressure and lipid profiles closely"}
                          </li>
                        )}
                      </>
                    )}
                    {result.bmi >= 30 && (
                      <>
                        <li>
                          {dir === "rtl"
                            ? "استشر مقدم رعاية صحية لخطة إدارة وزن مخصصة"
                            : "Consult a healthcare provider for a personalized weight management plan"}
                        </li>
                        <li>
                          {dir === "rtl"
                            ? "استهدف تقليل 5-10% من وزن الجسم خلال 6 أشهر كهدف أولي"
                            : "Target a 5-10% reduction in body weight over 6 months as an initial goal"}
                        </li>
                        <li>
                          {dir === "rtl"
                            ? "فكر في العمل مع أخصائي تغذية لتخطيط الوجبات"
                            : "Consider working with a registered dietitian for meal planning"}
                        </li>
                        <li>
                          {dir === "rtl"
                            ? "ابدأ بتمارين خفيفة (المشي، السباحة) وازد تدريجياً"
                            : "Start with low-impact exercise (walking, swimming) and gradually increase"}
                        </li>
                        <li>
                          {dir === "rtl"
                            ? "راقب سكر الدم وضغط الدم والدهون بانتظام"
                            : "Monitor blood glucose, blood pressure, and lipids regularly"}
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Ideal Weight Range Card */}
            <motion.div variants={itemVariants} className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">{t("idealWeightRange")}</h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Ideal range visualization */}
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {result.idealWeightMin} {t("kgUnit")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {result.idealWeightMax} {t("kgUnit")}
                    </span>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-green-500 to-green-500/20 rounded-full" />
                    {/* Current weight marker */}
                    {(() => {
                      const range = result.idealWeightMax - result.idealWeightMin;
                      const extendedMin = result.idealWeightMin - range * 0.3;
                      const extendedMax = result.idealWeightMax + range * 0.3;
                      const currentWeight = parseFloat(weight);
                      const pos =
                        ((currentWeight - extendedMin) /
                          (extendedMax - extendedMin)) *
                        100;
                      const clampedPos = Math.min(Math.max(pos, 2), 98);
                      return (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-700"
                          style={{
                            left: `${clampedPos}%`,
                            backgroundColor: result.color,
                          }}
                        />
                      );
                    })()}
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-xs text-muted-foreground">
                      {t("weight")}: {weight} {t("kgUnit")}
                    </p>
                  </div>
                </div>

                {/* Weight difference info */}
                <div className="flex-shrink-0 text-center sm:text-start">
                  {result.weightDiffDirection === "none" ? (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">{t("atIdealWeight" as any)}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {result.weightDiffDirection === "lose" ? (
                          <TrendingDown className="w-5 h-5 text-orange-500" />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                        )}
                        <span className="text-2xl font-bold">
                          {result.weightDiff} {t("kgUnit")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.weightDiffDirection === "lose"
                          ? t("weightToLose" as any)
                          : t("weightToGain" as any)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <motion.div variants={itemVariants}>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Current BMI */}
                <div className="glass-card p-5 relative overflow-hidden group">
                  <div className="absolute top-3 end-3">
                    <Scale className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t("yourBMI")}
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: result.color }}
                  >
                    {result.bmi}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">kg/m²</p>
                </div>

                {/* BMI Category */}
                <div className="glass-card p-5 relative overflow-hidden group">
                  <div className="absolute top-3 end-3">
                    <Activity className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t("bmiCategory")}
                  </p>
                  <p className={`text-xl font-bold ${result.colorClass}`}>
                    {t(result.categoryKey as any)}
                  </p>
                  <div
                    className="h-1 rounded-full mt-3"
                    style={{ backgroundColor: result.color }}
                  />
                </div>

                {/* Ideal Weight Range */}
                <div className="glass-card p-5 relative overflow-hidden group">
                  <div className="absolute top-3 end-3">
                    <Target className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t("idealWeightRange")}
                  </p>
                  <p className="text-xl font-bold">
                    {result.idealWeightMin} - {result.idealWeightMax}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("kgUnit")}
                  </p>
                </div>

                {/* Daily Calorie Needs */}
                <div className="glass-card p-5 relative overflow-hidden group">
                  <div className="absolute top-3 end-3">
                    <Flame className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t("dailyCalorieNeeds")}
                  </p>
                  <p className="text-xl font-bold text-amber-500">
                    {result.dailyCalories}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">kcal/day</p>
                </div>
              </div>
            </motion.div>

            {/* Step-by-step equation cards + progress indicators */}
            {showEquationSteps && (
            <motion.div variants={itemVariants} className="glass-card p-6 space-y-5">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                {language === "ar" ? "المعادلات خطوة بخطوة" : "Step-by-Step Equations"}
              </h3>

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-semibold text-primary">
                  {language === "ar" ? "المعادلة النشطة من الأدمن" : "Admin-assigned active formula"}
                </p>
                <p className="text-muted-foreground mt-1">
                  {language === "ar" ? activeFormulaPreset.labelAr : activeFormulaPreset.labelEn}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">{language === "ar" ? "1) BMI" : "1) BMI"}</p>
                  <p className="font-mono text-sm bg-muted/40 rounded-lg px-3 py-2">
                    BMI = {parseFloat(weight).toFixed(1)} / ({(parseFloat(height) / 100).toFixed(2)} x {(parseFloat(height) / 100).toFixed(2)}) = {result.bmi}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {result.formulaBmrEquation === "abwTer30"
                      ? (language === "ar"
                        ? `2) ABW (معامل ${result.formulaAbwFactor.toFixed(2)})`
                        : `2) ABW (factor ${result.formulaAbwFactor.toFixed(2)})`)
                      : (language === "ar"
                        ? `2) BMR (${result.formulaBmrEquation === "katchMcArdle" ? "Katch-McArdle" : "Mifflin-St Jeor"})`
                        : `2) BMR (${result.formulaBmrEquation === "katchMcArdle" ? "Katch-McArdle" : "Mifflin-St Jeor"})`)}
                  </p>
                  <p className="font-mono text-sm bg-muted/40 rounded-lg px-3 py-2">
                    {result.formulaBmrEquation === "abwTer30"
                      ? `${result.ibw} + (${parseFloat(weight)} - ${result.ibw}) x ${result.formulaAbwFactor.toFixed(2)} = ${result.weightUsedForCalories}`
                      : result.formulaBmrEquation === "katchMcArdle"
                      ? `370 + (21.6 x ${result.lbmEstimate}) = ${result.bmrKcal}`
                      : (gender === "male"
                        ? `10 x ${result.bmrFormulaWeight} + 6.25 x ${parseFloat(height)} - 5 x ${parseInt(age)} + 5 = ${result.bmrKcal}`
                        : `10 x ${result.bmrFormulaWeight} + 6.25 x ${parseFloat(height)} - 5 x ${parseInt(age)} - 161 = ${result.bmrKcal}`)}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {result.formulaBmrEquation === "abwTer30"
                      ? (language === "ar"
                        ? `3) السعرات الكلية (ABW x ${result.formulaKcalPerKg ?? 30})`
                        : `3) Total Calories (ABW x ${result.formulaKcalPerKg ?? 30})`)
                      : (language === "ar" ? "3) TDEE" : "3) TDEE")}
                  </p>
                  <p className="font-mono text-sm bg-muted/40 rounded-lg px-3 py-2">
                    {result.formulaBmrEquation === "abwTer30"
                      ? `${result.weightUsedForCalories} x ${(result.formulaKcalPerKg ?? 30)} = ${result.tdeeKcal} kcal`
                      : `${result.bmrKcal} x ${result.activityMultiplier} = ${result.tdeeKcal} kcal`}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">{language === "ar" ? "4) سعرات الهدف" : "4) Goal Calories"}</p>
                  <div className="text-sm grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-blue-500/10 px-2 py-1 text-center">
                      <p className="text-[10px] text-muted-foreground">{language === "ar" ? "خسارة" : "Lose"}</p>
                      <p className="font-semibold text-blue-500">{result.goalCalories.lose}</p>
                    </div>
                    <div className="rounded-lg bg-green-500/10 px-2 py-1 text-center">
                      <p className="text-[10px] text-muted-foreground">{language === "ar" ? "ثبات" : "Maintain"}</p>
                      <p className="font-semibold text-green-500">{result.goalCalories.maintain}</p>
                    </div>
                    <div className="rounded-lg bg-orange-500/10 px-2 py-1 text-center">
                      <p className="text-[10px] text-muted-foreground">{language === "ar" ? "زيادة" : "Gain"}</p>
                      <p className="font-semibold text-orange-500">{result.goalCalories.gain}</p>
                    </div>
                  </div>
                </div>
              </div>

              {result.formulaUsesAbw && result.abw !== null && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                  <p className="font-semibold text-amber-600 mb-1">
                    {language === "ar" ? "تم تفعيل ABW" : "ABW was applied"}
                  </p>
                  <p className="text-muted-foreground">
                    {language === "ar"
                      ? `لأن الوزن الفعلي (${weight} كجم) أكبر من 120% من IBW (${result.ibw} كجم)، تم استخدام ABW (${result.abw} كجم) داخل BMR/TDEE/الماكروز لتفادي المبالغة في الاحتياج.`
                      : `Because actual weight (${weight} kg) exceeds 120% of IBW (${result.ibw} kg), ABW (${result.abw} kg) was used in BMR/TDEE/macros to avoid overestimation.`}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "مؤشر الالتزام (14 يوم)" : "Adherence Indicator (14 days)"}</p>
                  <p className="text-3xl font-bold text-primary">{adherenceScore}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "ar"
                      ? `${recentEntriesCount} قياس/14 يوم`
                      : `${recentEntriesCount} check-ins over 14 days`}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "اتجاه BMI" : "BMI Trend"}</p>
                  <p className={`text-3xl font-bold ${bmiTrend === null ? "text-muted-foreground" : bmiTrend <= 0 ? "text-green-500" : "text-red-500"}`}>
                    {bmiTrend === null ? "-" : `${bmiTrend > 0 ? "+" : ""}${bmiTrend}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "ar"
                      ? "مقارنة بآخر قياس محفوظ"
                      : "Compared to your previous saved entry"}
                  </p>
                </div>
              </div>
            </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </>}
    </div>
  );
}
