import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, BarChart3, Loader, Stethoscope, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { shareContent } from "@/lib/actions";
import { useLocation } from "wouter";

const SYMPTOMS = [
  // General
  { en: "Fatigue", ar: "إرهاق / تعب", category: "general" },
  { en: "Fever", ar: "حمى / ارتفاع حرارة", category: "general" },
  { en: "Chills", ar: "قشعريرة / برودة", category: "general" },
  { en: "Night Sweats", ar: "تعرق ليلي", category: "general" },
  { en: "Unexplained Weight Loss", ar: "فقدان وزن غير مبرر", category: "general" },
  { en: "Loss of Appetite", ar: "فقدان الشهية", category: "general" },
  // Neurological
  { en: "Headache", ar: "صداع", category: "neurological" },
  { en: "Dizziness", ar: "دوخة", category: "neurological" },
  { en: "Insomnia", ar: "أرق / صعوبة في النوم", category: "neurological" },
  { en: "Blurred Vision", ar: "ضبابية الرؤية", category: "neurological" },
  { en: "Numbness or Tingling", ar: "تنميل أو وخز", category: "neurological" },
  { en: "Memory Problems", ar: "مشاكل في الذاكرة", category: "neurological" },
  { en: "Anxiety", ar: "قلق وتوتر", category: "neurological" },
  // Digestive
  { en: "Nausea", ar: "غثيان", category: "digestive" },
  { en: "Vomiting", ar: "قيء", category: "digestive" },
  { en: "Abdominal Pain", ar: "ألم في البطن", category: "digestive" },
  { en: "Bloating", ar: "انتفاخ البطن", category: "digestive" },
  { en: "Diarrhea", ar: "إسهال", category: "digestive" },
  { en: "Constipation", ar: "إمساك", category: "digestive" },
  { en: "Heartburn", ar: "حرقة المعدة", category: "digestive" },
  // Respiratory
  { en: "Shortness of Breath", ar: "ضيق في التنفس", category: "respiratory" },
  { en: "Cough", ar: "سعال", category: "respiratory" },
  { en: "Sore Throat", ar: "التهاب الحلق", category: "respiratory" },
  { en: "Runny Nose", ar: "سيلان الأنف", category: "respiratory" },
  { en: "Wheezing", ar: "صفير في التنفس", category: "respiratory" },
  // Cardiac
  { en: "Chest Pain", ar: "ألم في الصدر", category: "cardiac" },
  { en: "Heart Palpitations", ar: "خفقان القلب", category: "cardiac" },
  { en: "Leg Swelling", ar: "تورم الساقين", category: "cardiac" },
  // Musculoskeletal
  { en: "Back Pain", ar: "ألم في الظهر", category: "musculoskeletal" },
  { en: "Joint Pain", ar: "ألم في المفاصل", category: "musculoskeletal" },
  { en: "Muscle Weakness", ar: "ضعف العضلات", category: "musculoskeletal" },
  { en: "Muscle Cramps", ar: "تشنجات عضلية", category: "musculoskeletal" },
  // Dermatological
  { en: "Skin Rash", ar: "طفح جلدي", category: "dermatological" },
  { en: "Itching", ar: "حكة", category: "dermatological" },
  { en: "Jaundice", ar: "اصفرار الجلد", category: "dermatological" },
  // Urological
  { en: "Frequent Urination", ar: "كثرة التبول", category: "urological" },
  { en: "Painful Urination", ar: "ألم عند التبول", category: "urological" },
  { en: "Blood in Urine", ar: "دم في البول", category: "urological" },
];

const DURATIONS = [
  { value: "1-3d",  en: "1–3 days",   ar: "1–3 أيام" },
  { value: "4-7d",  en: "4–7 days",   ar: "4–7 أيام" },
  { value: "1-2w",  en: "1–2 weeks",  ar: "1–2 أسبوع" },
  { value: "2w+",   en: "2+ weeks",   ar: "أكثر من أسبوعين" },
];

const SEVERITIES = [
  { value: "mild",     en: "Mild",     ar: "خفيفة",   color: "text-green-600 bg-green-500/10" },
  { value: "moderate", en: "Moderate", ar: "متوسطة",  color: "text-amber-600 bg-amber-500/10" },
  { value: "severe",   en: "Severe",   ar: "شديدة",   color: "text-red-600 bg-red-500/10" },
];

const CATEGORIES: Record<string, { en: string; ar: string }> = {
  general:       { en: "General", ar: "عام" },
  neurological:  { en: "Neurological", ar: "عصبي" },
  digestive:     { en: "Digestive", ar: "هضمي" },
  respiratory:   { en: "Respiratory", ar: "تنفسي" },
  cardiac:       { en: "Cardiac", ar: "قلبي" },
  musculoskeletal: { en: "Musculoskeletal", ar: "عضلي/مفصلي" },
  dermatological: { en: "Skin", ar: "جلدي" },
  urological:    { en: "Urological", ar: "بولي" },
};

export default function SymptomChecker() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState("1-3d");
  const [severity, setSeverity] = useState("mild");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleSymptom = (symptomEn: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomEn) ? prev.filter((s) => s !== symptomEn) : [...prev, symptomEn]
    );
    setAiAnalysis(null);
  };

  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "اختر أعراض أولاً" : "Select symptoms first" });
      return;
    }
    setIsAnalyzing(true);
    try {
      const symptomNames = selectedSymptoms.map((en) => {
        const s = SYMPTOMS.find((sym) => sym.en === en);
        return language === "ar" ? s?.ar || en : en;
      });
      const durationLabel = DURATIONS.find(d => d.value === duration)?.[language === "ar" ? "ar" : "en"] ?? duration;
      const severityLabel = SEVERITIES.find(s => s.value === severity)?.[language === "ar" ? "ar" : "en"] ?? severity;

      const prompt = language === "ar"
        ? `أعاني من الأعراض التالية لمدة ${durationLabel} وشدتها ${severityLabel}:\n${symptomNames.join("، ")}\n\nقدم تحليلاً أولياً منظماً يشمل: الأسباب المحتملة، التوصيات، ومتى يجب زيارة الطبيب فوراً.`
        : `I'm experiencing these symptoms for ${durationLabel} with ${severityLabel} severity:\n${symptomNames.join(", ")}\n\nProvide an organized preliminary analysis including: possible causes, recommendations, and when to seek immediate medical care.`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: language === "ar"
                ? "أنت طبيب افتراضي متخصص في التحليل الأولي للأعراض. قدم تحليلاً منظماً يشمل: الحالات المحتملة، التوصيات، ومتى يجب زيارة الطبيب. أجب بالعربية دائماً. لا تقدم تشخيصاً نهائياً. نبّه دائماً بأن هذا ليس بديلاً عن الاستشارة الطبية."
                : "You are a virtual medical assistant specializing in preliminary symptom analysis. Provide organized analysis including: possible conditions, recommendations, and when to seek emergency care. Never give a definitive diagnosis. Always note this is not a substitute for professional medical advice.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      setAiAnalysis(data.message || data.choices?.[0]?.message?.content || (language === "ar" ? "تعذر التحليل" : "Analysis failed"));
    } catch {
      setAiAnalysis(
        language === "ar"
          ? "تعذر الاتصال بالخادم. بناءً على الأعراض المحددة، ننصح بالراحة، الترطيب الكافي، ومراقبة الأعراض. إذا استمرت الأعراض أكثر من 3 أيام أو تفاقمت، يرجى استشارة طبيب."
          : "Could not connect to server. Based on selected symptoms, we recommend rest, adequate hydration, and monitoring. If symptoms persist for more than 3 days or worsen, please consult a doctor."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredSymptoms = activeCategory ? SYMPTOMS.filter(s => s.category === activeCategory) : SYMPTOMS;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">{t("symptomCheckerTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("symptomDescription")}</p>
      </div>

      <div className="glass-card p-4 bg-red-500/5 border-s-4 border-red-500">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">{t("infoOnly")}</p>
        </div>
      </div>

      {/* Duration */}
      <div className="glass-card p-4">
        <p className="text-sm font-medium mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {language === "ar" ? "مدة الأعراض" : "Duration"}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map(d => (
            <button key={d.value} onClick={() => setDuration(d.value)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition ${duration === d.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
              {language === "ar" ? d.ar : d.en}
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div className="glass-card p-4">
        <p className="text-sm font-medium mb-3">{language === "ar" ? "شدة الأعراض" : "Severity"}</p>
        <div className="grid grid-cols-3 gap-2">
          {SEVERITIES.map(s => (
            <button key={s.value} onClick={() => setSeverity(s.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${severity === s.value ? s.color + " ring-2 ring-current/30" : "bg-muted hover:bg-muted/80"}`}>
              {language === "ar" ? s.ar : s.en}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div>
        <p className="text-sm font-medium mb-2">{language === "ar" ? "تصفية حسب الفئة" : "Filter by category"}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory(null)}
            className={`px-3 py-1 rounded-full text-xs transition ${!activeCategory ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
            {language === "ar" ? "الكل" : "All"}
          </button>
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <button key={key} onClick={() => setActiveCategory(key === activeCategory ? null : key)}
              className={`px-3 py-1 rounded-full text-xs transition ${activeCategory === key ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
              {language === "ar" ? label.ar : label.en}
            </button>
          ))}
        </div>
      </div>

      {/* Symptoms grid */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">{language === "ar" ? "اختر الأعراض" : "Select Symptoms"}</h2>
          {selectedSymptoms.length > 0 && (
            <button onClick={() => setSelectedSymptoms([])} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
              {language === "ar" ? "مسح الكل" : "Clear all"}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredSymptoms.map((symptom) => (
            <button
              key={symptom.en}
              onClick={() => toggleSymptom(symptom.en)}
              className={`p-2 text-xs rounded-lg transition text-start leading-snug ${
                selectedSymptoms.includes(symptom.en)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {language === "ar" ? symptom.ar : symptom.en}
            </button>
          ))}
        </div>
      </div>

      {selectedSymptoms.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {language === "ar" ? `${selectedSymptoms.length} أعراض مختارة` : `${selectedSymptoms.length} symptoms selected`}
          </p>
          <Button onClick={analyzeSymptoms} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <><Loader className="w-4 h-4 me-2 animate-spin" />{language === "ar" ? "جاري التحليل..." : "Analyzing..."}</>
            ) : (
              <><Stethoscope className="w-4 h-4 me-2" />{language === "ar" ? "تحليل بالذكاء الاصطناعي" : "AI Analysis"}</>
            )}
          </Button>
        </div>
      )}

      {aiAnalysis && (
        <div className="glass-card p-6 bg-blue-500/5 border-s-4 border-blue-500">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {language === "ar" ? "التحليل بالذكاء الاصطناعي" : "AI Analysis"}
          </h2>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{aiAnalysis}</div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button className="flex-1" onClick={() => setLocation("/coaching/consultation")}>{t("consultDoctor")}</Button>
        <Button variant="outline" className="flex-1" onClick={async () => {
          const names = selectedSymptoms.map(en => { const s = SYMPTOMS.find(sym => sym.en === en); return language === "ar" ? s?.ar || en : en; });
          const text = `${language === "ar" ? "الأعراض" : "Symptoms"}:\n${names.join(", ")}\n\n${aiAnalysis || ""}`;
          const ok = await shareContent(language === "ar" ? "نتائج فحص الأعراض" : "Symptom Checker Results", text);
          toast({ title: ok ? (language === "ar" ? "تمت المشاركة" : "Shared") : (language === "ar" ? "تم النسخ" : "Copied") });
        }} disabled={selectedSymptoms.length === 0}>{t("shareResults")}</Button>
      </div>
    </div>
  );
}
