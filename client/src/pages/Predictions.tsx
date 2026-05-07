import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, AlertTriangle, CheckCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumGate from "@/components/ui/premium-gate";
import { downloadJSON } from "@/lib/actions";
import { useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getLast7Days } from "@/lib/dateUtils";
import { average, normalizeMetricSeries, trendDirection, waterAmountToMl, type MetricRecord } from "@/lib/metric-insights";

type Prediction = {
  id: number;
  title: string;
  titleAr: string;
  status: "normal" | "warning";
  prediction: string;
  predictionAr: string;
  confidence: number;
  action: string;
  actionAr: string;
};

type ApiMeal = { calories?: number; protein?: number; carbs?: number; fat?: number; date?: string; name?: string };
type ApiMetric = MetricRecord & { date?: string; createdAt?: string };
type ApiWaterLog = { amount?: number; unit?: string; date?: string | Date };

// Mifflin-St Jeor (1990) — more accurate than Harris-Benedict for modern populations
function mifflinBMR(weight: number, heightCm: number, age: number, gender: "male" | "female"): number {
  const base = 10 * weight + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2, lightlyActive: 1.375, moderatelyActive: 1.55,
  veryActive: 1.725, extraActive: 1.9,
};

// Devine IBW (1974) for clinical protein/calorie targets
function devineIBW(heightCm: number, gender: "male" | "female"): number {
  const inches = heightCm / 2.54;
  return Math.round((gender === "male" ? 50 + 2.3 * (inches - 60) : 45.5 + 2.3 * (inches - 60)) * 10) / 10;
}

function confidenceByCoverage(base: number, sampleCount: number): number {
  return Math.max(65, Math.min(97, base + Math.min(sampleCount, 10)));
}

function positiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function sortPredictions(predictions: Prediction[]): Prediction[] {
  return [...predictions].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "warning" ? -1 : 1;
    }
    return b.confidence - a.confidence;
  });
}

function generatePredictions(
  user: any,
  meals: ApiMeal[],
  metrics: ApiMetric[],
  waterLogs: ApiWaterLog[]
): Prediction[] {
  const predictions: Prediction[] = [];
  let id = 1;

  const metricSeries = normalizeMetricSeries(metrics);
  const glucoseReadings = metricSeries.glucose;
  const systolicReadings = metricSeries.systolic;
  const sleepReadings = metricSeries.sleepHours;

  const weightKg = positiveNumber(user?.weight);
  const heightCm = positiveNumber(user?.height);
  const age = positiveNumber(user?.age);
  const gender: "male" | "female" | null = user?.gender === "male" || user?.gender === "female" ? user.gender : null;
  const activity: string | null = typeof user?.activityLevel === "string" ? user.activityLevel : null;
  const activityMultiplier = activity ? ACTIVITY_MULTIPLIERS[activity] : null;

  // ── TDEE from Mifflin-St Jeor ─────────────────────────────────────────
  let tdee: number | null = null;
  let ibw: number | null = null;
  let abw: number | null = null;
  let weightForNutrition = weightKg;

  const hasMetabolicProfile =
    weightKg !== null &&
    heightCm !== null &&
    age !== null &&
    gender !== null &&
    typeof activityMultiplier === "number";

  if (hasMetabolicProfile) {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    ibw = devineIBW(heightCm, gender);
    if (weightKg > ibw * 1.2) {
      abw = Math.round((ibw + 0.4 * (weightKg - ibw)) * 10) / 10;
      weightForNutrition = abw;
    }
    const bmr = mifflinBMR(weightUsedForCalories(weightKg, ibw), heightCm, age, gender);
    tdee = Math.round(bmr * activityMultiplier);

    // ── BMI / weight ────────────────────────────────────────────────────
    if (bmi > 30) {
      predictions.push({
        id: id++, title: "Obesity — Adjusted Targets Applied", titleAr: "بدانة — تم تعديل الأهداف",
        status: "warning",
        prediction: `BMI ${bmi.toFixed(1)}. Using Adjusted Body Weight (${abw} kg) for calorie/protein calculations to avoid overestimation. Target TDEE: ~${tdee} kcal.`,
        predictionAr: `مؤشر كتلة الجسم ${bmi.toFixed(1)}. تم استخدام الوزن المُعدَّل (${abw} كجم) لتجنب المبالغة في تقدير السعرات. TDEE المستهدف: ~${tdee} سعرة.`,
        confidence: confidenceByCoverage(80, meals.length + metrics.length),
        action: "Apply a moderate calorie deficit and keep 4-5 protein servings daily.",
        actionAr: "اعمل عجز سعرات معتدل وحافظ على 4-5 حصص بروتين يوميا.",
      });
    } else if (bmi > 25) {
      predictions.push({
        id: id++, title: "Weight Management", titleAr: "إدارة الوزن",
        status: "warning",
        prediction: `BMI ${bmi.toFixed(1)} (overweight). Your estimated TDEE is ${tdee} kcal. A 500 kcal/day deficit targets ~0.5 kg/week loss.`,
        predictionAr: `مؤشر كتلة الجسم ${bmi.toFixed(1)} (زيادة وزن). إجمالي إنفاقك اليومي المقدر ${tdee} سعرة. عجز 500 سعرة/يوم يستهدف خسارة ~0.5 كجم/أسبوع.`,
        confidence: confidenceByCoverage(78, meals.length + metrics.length),
        action: "Keep your weekly deficit steady and track weight twice per week.",
        actionAr: "ثبت العجز الأسبوعي وتابع الوزن مرتين أسبوعيا.",
      });
    } else if (bmi < 18.5) {
      predictions.push({
        id: id++, title: "Weight Gain Needed", titleAr: "زيادة الوزن مطلوبة",
        status: "warning",
        prediction: `BMI ${bmi.toFixed(1)} (underweight). TDEE ~${tdee} kcal — add 300–500 kcal/day with protein-rich foods for healthy gain.`,
        predictionAr: `مؤشر كتلة الجسم ${bmi.toFixed(1)} (نقص وزن). TDEE ~${tdee} سعرة — أضف 300–500 سعرة مع أطعمة غنية بالبروتين.`,
        confidence: confidenceByCoverage(76, meals.length + metrics.length),
        action: "Increase calories gradually and include a protein source in every main meal.",
        actionAr: "زود السعرات تدريجيا وأضف مصدر بروتين في كل وجبة رئيسية.",
      });
    } else {
      predictions.push({
        id: id++, title: "Healthy Weight", titleAr: "وزن صحي",
        status: "normal",
        prediction: `BMI ${bmi.toFixed(1)} — healthy range. Your estimated daily energy need (TDEE) is ~${tdee} kcal.`,
        predictionAr: `مؤشر كتلة الجسم ${bmi.toFixed(1)} — نطاق صحي. احتياجك اليومي المقدر (TDEE) ~${tdee} سعرة.`,
        confidence: confidenceByCoverage(88, meals.length + metrics.length),
        action: "Maintain your current pattern and keep logging to detect changes early.",
        actionAr: "حافظ على نمطك الحالي واستمر في التسجيل لاكتشاف أي تغيير مبكرا.",
      });
    }
  } else {
    predictions.push({
      id: id++,
      title: "Profile Data Incomplete",
      titleAr: "بيانات الملف الشخصي غير مكتملة",
      status: "warning",
      prediction: "Personalized metabolism predictions require age, height, weight, gender, and activity level.",
      predictionAr: "التوقعات الأيضية المخصصة تحتاج: العمر، الطول، الوزن، الجنس، ومستوى النشاط.",
      confidence: 72,
      action: "Complete your profile data to unlock assumption-free metabolic benchmarks.",
      actionAr: "أكمل بيانات ملفك الشخصي لتفعيل معايير أيضية دقيقة بدون افتراضات.",
    });
  }

  // ── Calorie intake vs. personalised TDEE ────────────────────────────
  if (meals.length === 0) {
    predictions.push({
      id: id++,
      title: "More Meal Data Needed",
      titleAr: "نحتاج بيانات وجبات أكثر",
      status: "warning",
      prediction: "No meals were logged in the last 7 days, so calorie and protein predictions are less reliable.",
      predictionAr: "لا توجد وجبات مسجلة خلال آخر 7 أيام، لذلك دقة توقعات السعرات والبروتين أقل.",
      confidence: 70,
      action: "Log at least 2 meals per day for one week to unlock more precise nutrition predictions.",
      actionAr: "سجل على الأقل وجبتين يوميا لمدة أسبوع للحصول على توقعات تغذية أدق.",
    });
  } else {
    const totalCals = meals.reduce((s, m) => s + (Number(m.calories) || 0), 0);
    const avgDailyCals = Math.round(totalCals / 7);

    if (avgDailyCals > 0 && tdee !== null && avgDailyCals > tdee + 350) {
      predictions.push({
        id: id++, title: "Calorie Surplus", titleAr: "فائض السعرات",
        status: "warning",
        prediction: `Avg intake: ${avgDailyCals} kcal/day vs. your estimated TDEE of ${tdee} kcal — surplus of ${avgDailyCals - tdee} kcal. Consider reducing portion sizes.`,
        predictionAr: `متوسط الاستهلاك: ${avgDailyCals} سعرة/يوم مقابل TDEE المقدر ${tdee} — فائض ${avgDailyCals - tdee} سعرة. حاول تقليل الحصص.`,
        confidence: confidenceByCoverage(79, meals.length),
        action: "Reduce dense-calorie snacks and rebalance dinner portions this week.",
        actionAr: "قلل السناكس عالية السعرات واضبط حجم العشاء هذا الأسبوع.",
      });
    } else if (avgDailyCals > 0 && tdee !== null && avgDailyCals < tdee - 450) {
      predictions.push({
        id: id++, title: "Low Calorie Intake", titleAr: "انخفاض السعرات",
        status: "warning",
        prediction: `Avg intake: ${avgDailyCals} kcal/day — ${tdee - avgDailyCals} kcal below your TDEE. Eating too little can slow metabolism and cause muscle loss.`,
        predictionAr: `متوسط الاستهلاك: ${avgDailyCals} سعرة/يوم — أقل من TDEE بـ ${tdee - avgDailyCals} سعرة. تناول القليل جداً قد يُبطئ الأيض ويُسبب فقدان العضلات.`,
        confidence: confidenceByCoverage(78, meals.length),
        action: "Add a balanced snack (protein + complex carbs) to close the gap safely.",
        actionAr: "أضف سناك متوازن (بروتين + كربوهيدرات معقدة) لسد الفجوة بشكل آمن.",
      });
    } else if (avgDailyCals > 0 && tdee !== null) {
      predictions.push({
        id: id++, title: "Calorie Intake On Track", titleAr: "السعرات في المسار الصحيح",
        status: "normal",
        prediction: `Avg intake: ${avgDailyCals} kcal/day — closely matching your estimated TDEE of ${tdee} kcal. Well balanced!`,
        predictionAr: `متوسط الاستهلاك: ${avgDailyCals} سعرة/يوم — يتوافق مع TDEE المقدر ${tdee} سعرة. متوازن جداً!`,
        confidence: confidenceByCoverage(85, meals.length),
        action: "Keep your meal consistency and avoid large weekend swings.",
        actionAr: "حافظ على ثبات الوجبات وتجنب التقلبات الكبيرة في نهاية الأسبوع.",
      });
    } else if (avgDailyCals > 0) {
      predictions.push({
        id: id++,
        title: "Calories Logged Without Personal Benchmark",
        titleAr: "تم تسجيل السعرات بدون مرجع شخصي",
        status: "warning",
        prediction: `Average intake is ${avgDailyCals} kcal/day, but a personalized benchmark cannot be computed until profile data is complete.`,
        predictionAr: `متوسط الاستهلاك ${avgDailyCals} سعرة/يوم، لكن لا يمكن حساب مرجع شخصي قبل استكمال بيانات الملف الشخصي.`,
        confidence: confidenceByCoverage(73, meals.length),
        action: "Complete age, height, weight, gender, and activity level to enable personalized comparison.",
        actionAr: "أكمل العمر والطول والوزن والجنس ومستوى النشاط لتفعيل المقارنة الشخصية.",
      });
    }

    // ── Protein — uses IBW/ABW, not just actual weight ─────────────────
    const activityFactor = activity
      ? ["veryActive", "extraActive"].includes(activity)
        ? 1.5
        : ["moderatelyActive"].includes(activity)
          ? 1.3
          : ["sedentary", "lightlyActive"].includes(activity)
            ? 1.0
            : null
      : null;

    const totalProtein = meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
    const avgProtein = Math.round(totalProtein / 7);

    if (weightForNutrition !== null && activityFactor !== null) {
      const refWeight = weightForNutrition;
      const targetProtein = Math.round(refWeight * activityFactor);
      const weightLabel = abw ? `ABW=${abw}kg` : ibw && weightKg && weightKg < ibw ? `actual=${weightKg}kg` : `${refWeight}kg`;

      if (avgProtein > 0 && avgProtein < targetProtein * 0.75) {
        predictions.push({
          id: id++, title: "Low Protein Intake", titleAr: "انخفاض البروتين",
          status: "warning",
          prediction: `Avg protein: ${avgProtein}g/day. Target: ~${targetProtein}g (${activityFactor}g/kg × ${weightLabel}). Increase lean meats, legumes, or dairy.`,
          predictionAr: `متوسط البروتين: ${avgProtein}ج/يوم. الهدف: ~${targetProtein}ج (${activityFactor}ج/كجم × ${weightLabel}). زد اللحوم الخالية من الدهون والبقوليات والألبان.`,
          confidence: confidenceByCoverage(74, meals.length),
          action: "Add 20-30g protein at breakfast and one protein snack daily.",
          actionAr: "أضف 20-30 جم بروتين في الفطار وسناك بروتيني يوميا.",
        });
      } else if (avgProtein >= targetProtein) {
        predictions.push({
          id: id++, title: "Protein Intake Adequate", titleAr: "البروتين كافٍ",
          status: "normal",
          prediction: `Avg protein: ${avgProtein}g/day — meets your target of ${targetProtein}g (${activityFactor}g/kg × ${weightLabel}). Good work!`,
          predictionAr: `متوسط البروتين: ${avgProtein}ج/يوم — يُحقق هدفك ${targetProtein}ج. ممتاز!`,
          confidence: confidenceByCoverage(84, meals.length),
          action: "Maintain current protein distribution across meals.",
          actionAr: "استمر على توزيع البروتين الحالي عبر الوجبات.",
        });
      }
    } else if (avgProtein > 0) {
      predictions.push({
        id: id++, title: "Protein Benchmark Unavailable", titleAr: "مرجع البروتين غير متاح",
        status: "warning",
        prediction: `Avg protein is ${avgProtein}g/day, but personalized protein target cannot be calculated until profile/activity data is complete.`,
        predictionAr: `متوسط البروتين ${avgProtein}ج/يوم، لكن لا يمكن حساب الهدف الشخصي للبروتين قبل اكتمال بيانات الملف الشخصي والنشاط.`,
        confidence: confidenceByCoverage(71, meals.length),
        action: "Complete profile and activity level to unlock personalized protein targets.",
        actionAr: "أكمل بيانات الملف الشخصي ومستوى النشاط لتفعيل هدف بروتين شخصي.",
      });
    }
  }

  // ── Blood glucose ─────────────────────────────────────────────────────
  if (glucoseReadings.length > 0) {
    const avg = average(glucoseReadings) || 0;
    const highCount = glucoseReadings.filter((value) => value > 140).length;
    const glucoseTrend = trendDirection(glucoseReadings);
    const glucoseTrendEn = glucoseTrend === "up" ? "Trend is rising over the week." : glucoseTrend === "down" ? "Trend is improving over the week." : "Trend is stable over the week.";
    const glucoseTrendAr = glucoseTrend === "up" ? "الاتجاه في ارتفاع خلال الأسبوع." : glucoseTrend === "down" ? "الاتجاه يتحسن خلال الأسبوع." : "الاتجاه مستقر خلال الأسبوع.";

    if (avg > 126 && highCount >= 2) {
      predictions.push({
        id: id++, title: "Persistently High Blood Glucose", titleAr: "ارتفاع متكرر في سكر الدم",
        status: "warning",
        prediction: `${highCount}/${glucoseReadings.length} readings above 140 mg/dL. Average: ${avg.toFixed(0)} mg/dL. ${glucoseTrendEn}`,
        predictionAr: `${highCount}/${glucoseReadings.length} قراءات فوق 140 ملجم/ديسيلتر. المتوسط: ${avg.toFixed(0)} ملجم/ديسيلتر. ${glucoseTrendAr}`,
        confidence: confidenceByCoverage(80, glucoseReadings.length),
        action: "Cut refined sugars for 10-14 days and repeat glucose checks at consistent times.",
        actionAr: "قلل السكريات المكررة لمدة 10-14 يوم وكرر قياسات السكر في أوقات ثابتة.",
      });
    } else if (avg > 100) {
      predictions.push({
        id: id++, title: "Slightly Elevated Blood Glucose", titleAr: "ارتفاع طفيف في سكر الدم",
        status: "warning",
        prediction: `Average blood glucose: ${avg.toFixed(0)} mg/dL — mildly elevated. ${glucoseTrendEn}`,
        predictionAr: `متوسط سكر الدم: ${avg.toFixed(0)} ملجم/ديسيلتر — مرتفع قليلا. ${glucoseTrendAr}`,
        confidence: confidenceByCoverage(74, glucoseReadings.length),
        action: "Pair carbohydrates with fiber/protein and avoid sugary drinks.",
        actionAr: "اربط الكربوهيدرات بالألياف/البروتين وتجنب المشروبات السكرية.",
      });
    } else {
      predictions.push({
        id: id++, title: "Blood Glucose Normal", titleAr: "سكر الدم طبيعي",
        status: "normal",
        prediction: `Average blood glucose: ${avg.toFixed(0)} mg/dL — within normal range (<100 mg/dL fasting target).`,
        predictionAr: `متوسط سكر الدم: ${avg.toFixed(0)} ملجم/ديسيلتر — ضمن الطبيعي (الهدف <100 ملجم/ديسيلتر صيام).`,
        confidence: confidenceByCoverage(87, glucoseReadings.length),
        action: "Keep the same meal quality and continue regular glucose logging.",
        actionAr: "استمر على جودة الوجبات الحالية وواصل تسجيل قياسات السكر بانتظام.",
      });
    }
  }

  // ── Blood pressure ────────────────────────────────────────────────────
  if (systolicReadings.length > 0) {
    const highBP = systolicReadings.filter((value) => value >= 130);
    const avgBP = Math.round(average(systolicReadings) || 0);
    const bpTrend = trendDirection(systolicReadings, 0.03);
    const bpTrendEn = bpTrend === "up" ? "Weekly trend is rising." : bpTrend === "down" ? "Weekly trend is improving." : "Weekly trend is stable.";
    const bpTrendAr = bpTrend === "up" ? "اتجاه الأسبوع في ارتفاع." : bpTrend === "down" ? "اتجاه الأسبوع يتحسن." : "اتجاه الأسبوع مستقر.";

    if (highBP.length / systolicReadings.length > 0.35) {
      predictions.push({
        id: id++, title: "Elevated Blood Pressure", titleAr: "ارتفاع ضغط الدم",
        status: "warning",
        prediction: `${highBP.length}/${systolicReadings.length} systolic readings were >=130 mmHg (avg: ${avgBP}). ${bpTrendEn}`,
        predictionAr: `${highBP.length}/${systolicReadings.length} قراءة انقباضي كانت >=130 ملم زئبق (متوسط: ${avgBP}). ${bpTrendAr}`,
        confidence: confidenceByCoverage(79, systolicReadings.length),
        action: "Reduce sodium, add potassium-rich foods, and monitor BP at the same time daily.",
        actionAr: "قلل الصوديوم، وزود أطعمة البوتاسيوم، وقس الضغط يوميا في نفس التوقيت.",
      });
    } else {
      predictions.push({
        id: id++, title: "Blood Pressure In Range", titleAr: "ضغط الدم ضمن النطاق",
        status: "normal",
        prediction: `Average systolic blood pressure is ${avgBP} mmHg over your recent logs. ${bpTrendEn}`,
        predictionAr: `متوسط الضغط الانقباضي ${avgBP} ملم زئبق في آخر القراءات. ${bpTrendAr}`,
        confidence: confidenceByCoverage(85, systolicReadings.length),
        action: "Maintain your current sodium and activity routine.",
        actionAr: "حافظ على نمط الصوديوم والنشاط الحالي.",
      });
    }
  }

  // ── Age-based screening recommendations ───────────────────────────────
  if (glucoseReadings.length === 0 && age !== null && age > 40) {
    predictions.push({
      id: id++, title: "Blood Sugar Screening Due", titleAr: "فحص سكر الدم مُستحق",
      status: "warning",
      prediction: "ADA recommends annual fasting glucose screening after age 40, or earlier with risk factors. Log readings to enable trend analysis.",
      predictionAr: "توصي جمعية السكري الأمريكية بفحص سكر الدم الصيامي سنوياً بعد 40 أو مبكراً مع عوامل الخطر. سجل قراءاتك لتمكين تحليل الاتجاهات.",
      confidence: 78,
      action: "Add at least one fasting glucose reading this week.",
      actionAr: "أضف على الأقل قراءة سكر صائم واحدة هذا الأسبوع.",
    });
  }

  // ── Sleep quality ─────────────────────────────────────────────────────
  if (sleepReadings.length > 0) {
    const avgSleep = average(sleepReadings) || 0;
    if (avgSleep < 6.5) {
      predictions.push({
        id: id++, title: "Sleep Deficit", titleAr: "عجز في النوم",
        status: "warning",
        prediction: `Average sleep is ${avgSleep.toFixed(1)} hours/night over your recent logs, below the 7-9 hour target range.`,
        predictionAr: `متوسط النوم ${avgSleep.toFixed(1)} ساعة/ليلة في آخر قراءاتك، أقل من النطاق المستهدف 7-9 ساعات.`,
        confidence: confidenceByCoverage(75, sleepReadings.length),
        action: "Set a fixed sleep window and reduce caffeine after mid-day.",
        actionAr: "حدد مواعيد نوم ثابتة وقلل الكافيين بعد منتصف اليوم.",
      });
    } else {
      predictions.push({
        id: id++, title: "Sleep Pattern Acceptable", titleAr: "نمط النوم مقبول",
        status: "normal",
        prediction: `Average sleep is ${avgSleep.toFixed(1)} hours/night, close to the recommended range.`,
        predictionAr: `متوسط النوم ${avgSleep.toFixed(1)} ساعة/ليلة، قريب من النطاق الموصى به.`,
        confidence: confidenceByCoverage(84, sleepReadings.length),
        action: "Keep your bedtime routine consistent.",
        actionAr: "حافظ على روتين نوم ثابت.",
      });
    }
  }

  // ── Hydration based on water logs ─────────────────────────────────────
  const targetWater = weightKg ? Math.round(weightKg * 0.033 * 10) / 10 : null;
  const totalWaterMl = waterLogs.reduce((sum, log) => sum + waterAmountToMl(log.amount, log.unit), 0);
  const avgWaterLiters = totalWaterMl > 0 ? (totalWaterMl / 1000) / 7 : 0;

  if (targetWater === null && waterLogs.length === 0) {
    predictions.push({
      id: id++,
      title: "Hydration Baseline Missing",
      titleAr: "مرجع الترطيب غير متوفر",
      status: "warning",
      prediction: "No water logs were recorded, and weight is missing, so a personalized hydration target cannot be computed.",
      predictionAr: "لا توجد سجلات ماء، والوزن غير متوفر، لذلك لا يمكن حساب هدف ترطيب شخصي.",
      confidence: 70,
      action: "Add your weight in Profile and start logging water intake daily.",
      actionAr: "أضف وزنك في الملف الشخصي وابدأ تسجيل الماء يومياً.",
    });
  } else if (targetWater === null) {
    predictions.push({
      id: id++,
      title: "Hydration Logged Without Target",
      titleAr: "تم تسجيل الترطيب بدون هدف شخصي",
      status: "warning",
      prediction: `Average hydration is ${avgWaterLiters.toFixed(1)}L/day, but a personalized target is unavailable until weight is set.`,
      predictionAr: `متوسط الترطيب ${avgWaterLiters.toFixed(1)} لتر/يوم، لكن الهدف الشخصي غير متاح قبل تسجيل الوزن.`,
      confidence: confidenceByCoverage(72, waterLogs.length),
      action: "Add your current weight in Profile to enable personalized hydration targets.",
      actionAr: "أضف وزنك الحالي في الملف الشخصي لتفعيل هدف ترطيب مخصص.",
    });
  } else if (waterLogs.length === 0) {
    predictions.push({
      id: id++,
      title: "Hydration Data Missing",
      titleAr: "بيانات الترطيب غير متوفرة",
      status: "warning",
      prediction: `Your personalized water target is ${targetWater}L/day, but no water logs were recorded this week.`,
      predictionAr: `هدف الماء المخصص لك هو ${targetWater} لتر/يوم، لكن لا توجد سجلات مياه هذا الأسبوع.`,
      confidence: 72,
      action: "Start logging water intake 3-4 times daily to unlock hydration prediction accuracy.",
      actionAr: "ابدأ تسجيل الماء 3-4 مرات يوميا لرفع دقة توقعات الترطيب.",
    });
  } else if (avgWaterLiters < targetWater * 0.7) {
    predictions.push({
      id: id++,
      title: "Hydration Below Target",
      titleAr: "الترطيب أقل من الهدف",
      status: "warning",
      prediction: `Average hydration is ${avgWaterLiters.toFixed(1)}L/day vs. your target ${targetWater}L/day.`,
      predictionAr: `متوسط الترطيب ${avgWaterLiters.toFixed(1)} لتر/يوم مقابل هدفك ${targetWater} لتر/يوم.`,
      confidence: confidenceByCoverage(76, waterLogs.length),
      action: "Add one extra 300-500ml serving in the morning and another in the evening.",
      actionAr: "أضف 300-500 مل صباحا و300-500 مل مساءً.",
    });
  } else {
    predictions.push({
      id: id++,
      title: "Hydration On Track",
      titleAr: "الترطيب في المسار الصحيح",
      status: "normal",
      prediction: `Average hydration is ${avgWaterLiters.toFixed(1)}L/day and your personalized target is ${targetWater}L/day.`,
      predictionAr: `متوسط الترطيب ${avgWaterLiters.toFixed(1)} لتر/يوم وهدفك المخصص ${targetWater} لتر/يوم.`,
      confidence: confidenceByCoverage(86, waterLogs.length),
      action: "Maintain current hydration routine and increase on workout days.",
      actionAr: "استمر على روتين الترطيب الحالي وزود الكمية أيام التمرين.",
    });
  }

  if (predictions.length === 0) {
    predictions.push({
      id: id++,
      title: "Not Enough Data Yet",
      titleAr: "لا توجد بيانات كافية بعد",
      status: "warning",
      prediction: "Add meals, water logs, and health readings to generate personalized AI predictions.",
      predictionAr: "أضف وجبات وماء وقراءات صحية لتوليد توقعات ذكاء اصطناعي مخصصة.",
      confidence: 65,
      action: "Log daily data for 7 days, then revisit this page for a richer analysis.",
      actionAr: "سجل بياناتك يوميا لمدة 7 أيام ثم ارجع لهذه الصفحة لتحليل أدق.",
    });
  }

  return sortPredictions(predictions);
}

function weightUsedForCalories(actualWeight: number, ibw: number): number {
  if (actualWeight > ibw * 1.2) return ibw + 0.4 * (actualWeight - ibw);
  return actualWeight;
}

// Fetch last 7 days' meals from API
function useRecentMeals() {
  return useQuery<ApiMeal[]>({
    queryKey: ["recent-meals-7d", getLast7Days()[0]],
    queryFn: async () => {
      const dates = getLast7Days();
      const results = await Promise.all(
        dates.map((date) =>
          fetch(`/api/nutrition/meals?date=${date}`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        )
      );
      return results.flat();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch recent health metrics
function useRecentMetrics() {
  return useQuery<ApiMetric[]>({
    queryKey: ["recent-metrics-7d", getLast7Days()[0]],
    queryFn: async () => {
      const dates = getLast7Days();
      const results = await Promise.all(
        dates.map((date) =>
          fetch(`/api/health/metrics?date=${date}`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        )
      );
      return results.flat();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useRecentWaterLogs() {
  return useQuery<ApiWaterLog[]>({
    queryKey: ["recent-water-logs-7d", getLast7Days()[0]],
    queryFn: async () => {
      const dates = getLast7Days();
      const results = await Promise.all(
        dates.map((date) =>
          fetch(`/api/water/logs?date=${date}`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        )
      );
      return results.flat();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export default function Predictions() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: meals = [] } = useRecentMeals();
  const { data: metrics = [] } = useRecentMetrics();
  const { data: waterLogs = [] } = useRecentWaterLogs();

  const predictions = useMemo(() => generatePredictions(user, meals, metrics, waterLogs), [user, meals, metrics, waterLogs]);
  const metricSeries = useMemo(() => normalizeMetricSeries(metrics), [metrics]);

  const avgConfidence = predictions.length > 0
    ? Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length)
    : 0;

  const dataPoints = meals.length + metrics.length + waterLogs.length;
  const avgDailyCalories = meals.length > 0 ? Math.round(meals.reduce((s, m) => s + (Number(m.calories) || 0), 0) / 7) : null;
  const avgDailyWater = waterLogs.length > 0
    ? Math.round((((waterLogs.reduce((s, w) => s + waterAmountToMl(w.amount, w.unit), 0) / 1000) / 7) * 10)) / 10
    : null;
  const avgGlucose = average(metricSeries.glucose);
  const avgSystolic = average(metricSeries.systolic);
  const targetWater = user?.weight ? Math.round(Number(user.weight) * 0.033 * 10) / 10 : null;

  const recommendations = useMemo(() => {
    const source = predictions.filter((p) => p.status === "warning");
    const pool = source.length > 0 ? source : predictions;
    const unique = Array.from(
      new Set(
        pool
          .map((item) => (language === "ar" ? item.actionAr : item.action))
          .filter(Boolean)
      )
    );
    return unique.slice(0, 4);
  }, [predictions, language]);

  const handleViewReport = () => {
    reportRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleExport = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      user: user ? { age: user.age, height: user.height, weight: user.weight, bloodType: user.bloodType } : null,
      dataPoints: { meals: meals.length, healthMetrics: metrics.length, waterLogs: waterLogs.length },
      overallConfidence: `${avgConfidence}%`,
      predictions: predictions.map((p) => ({
        title: language === "ar" ? p.titleAr : p.title,
        status: p.status,
        prediction: language === "ar" ? p.predictionAr : p.prediction,
        confidence: p.confidence,
      })),
      recommendations,
    };
    downloadJSON("health-predictions.json", exportData);
    toast({ title: language === "ar" ? "تم التصدير" : "Exported", description: language === "ar" ? "تم تصدير التوقعات الصحية" : "Health predictions exported" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PremiumGate featureLabel="Predictions">
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">{t("predictionsTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("aiInsights")}</p>
      </div>

      {/* Data badges */}
      <div className="flex flex-wrap gap-2 text-xs">
        {user?.age && <span className="bg-muted px-2 py-1 rounded">{language === "ar" ? "العمر" : "Age"}: {user.age}</span>}
        {user?.weight && <span className="bg-muted px-2 py-1 rounded">{language === "ar" ? "الوزن" : "Weight"}: {user.weight} kg</span>}
        {user?.height && <span className="bg-muted px-2 py-1 rounded">{language === "ar" ? "الطول" : "Height"}: {user.height} cm</span>}
        {meals.length > 0 && <span className="bg-blue-500/20 text-blue-600 px-2 py-1 rounded">{meals.length} {language === "ar" ? "وجبة (7 أيام)" : "meals (7 days)"}</span>}
        {metrics.length > 0 && <span className="bg-green-500/20 text-green-600 px-2 py-1 rounded">{metrics.length} {language === "ar" ? "قراءة صحية" : "health readings"}</span>}
        {waterLogs.length > 0 && <span className="bg-cyan-500/20 text-cyan-600 px-2 py-1 rounded">{waterLogs.length} {language === "ar" ? "سجل ماء" : "water logs"}</span>}
      </div>

      {/* AI Confidence Score */}
      <div className="glass-card p-6 bg-blue-500/5 border-s-4 border-blue-500">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm">{t("overallAIConfidence")}</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{avgConfidence}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "ar" ? `بناءً على ${dataPoints} نقطة بيانات` : `Based on ${dataPoints} data points`}
            </p>
          </div>
          <div className="text-4xl">🤖</div>
        </div>
      </div>

      {/* Predictions */}
      <div className="space-y-3">
        {predictions.map((pred) => (
          <div key={pred.id} className="glass-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{language === "ar" ? pred.titleAr : pred.title}</h3>
                  {pred.status === "normal" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{language === "ar" ? pred.predictionAr : pred.prediction}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-xs text-muted-foreground">{t("confidence")}</span>
              <span className="font-bold text-primary">{pred.confidence}%</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${pred.confidence}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Insights */}
      <div ref={reportRef} className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {t("detailedAnalysis")}
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">{language === "ar" ? "ملخص 7 أيام" : "7-Day Summary"}</p>
            <p className="text-xs text-muted-foreground">
              {language === "ar"
                ? `خلال آخر 7 أيام: ${meals.length} وجبة، ${metrics.length} قراءة صحية، ${waterLogs.length} سجل ماء.${avgDailyCalories != null ? ` متوسط السعرات ${avgDailyCalories} سعرة/يوم.` : ""}${avgGlucose != null ? ` متوسط الجلوكوز ${avgGlucose.toFixed(0)} ملجم/ديسيلتر.` : ""}${avgSystolic != null ? ` متوسط الضغط الانقباضي ${avgSystolic.toFixed(0)} ملم زئبق.` : ""}${avgDailyWater != null ? targetWater !== null ? ` متوسط الترطيب ${avgDailyWater} لتر/يوم (الهدف ${targetWater} لتر).` : ` متوسط الترطيب ${avgDailyWater} لتر/يوم (الهدف الشخصي غير متاح بدون وزن).` : ""}`
                : `Last 7 days: ${meals.length} meals, ${metrics.length} health readings, and ${waterLogs.length} water logs.${avgDailyCalories != null ? ` Avg calories: ${avgDailyCalories} kcal/day.` : ""}${avgGlucose != null ? ` Avg glucose: ${avgGlucose.toFixed(0)} mg/dL.` : ""}${avgSystolic != null ? ` Avg systolic BP: ${avgSystolic.toFixed(0)} mmHg.` : ""}${avgDailyWater != null ? targetWater !== null ? ` Avg hydration: ${avgDailyWater}L/day (target ${targetWater}L).` : ` Avg hydration: ${avgDailyWater}L/day (personal target unavailable without weight).` : ""}`}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{language === "ar" ? "التوصيات" : "Recommendations"}</p>
            {recommendations.length > 0 ? (
              <ul className="text-xs text-muted-foreground space-y-1 list-disc ps-5">
                {recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                {language === "ar"
                  ? "استمر في تسجيل بياناتك اليومية للحصول على توصيات أكثر دقة."
                  : "Keep logging daily data to receive more precise recommendations."}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button className="flex-1" onClick={handleViewReport}>{t("viewReport")}</Button>
        <Button variant="outline" className="flex-1" onClick={handleExport}>{t("exportPredictions")}</Button>
      </div>
    </div>
    </PremiumGate>
  );
}
