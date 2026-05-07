import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Pill, Clock, AlertTriangle, Plus, X, Trash2, Loader, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMedications, useCreateMedication, useDeleteMedication } from "@/hooks/useHealth";
import { downloadPDF } from "@/lib/actions";

// ==================== MEDICATION CATEGORIES DATABASE ====================
type MedCatalogItem = { name: string; nameAr: string; dosage: string; frequency: string; frequencyAr: string; warning?: string; warningAr?: string };
type MedCategory = { id: string; name: string; nameAr: string; icon: string; items: MedCatalogItem[] };

const medicationCategories: MedCategory[] = [
  {
    id: "heart", name: "Heart & Blood Vessels", nameAr: "القلب والأوعية الدموية", icon: "❤️",
    items: [
      { name: "Aspirin", nameAr: "أسبرين", dosage: "81mg", frequency: "Once daily", frequencyAr: "مرة يومياً", warning: "Take with food", warningAr: "تناول مع الطعام" },
      { name: "Atorvastatin (Lipitor)", nameAr: "أتورفاستاتين (ليبيتور)", dosage: "20mg", frequency: "Once daily at night", frequencyAr: "مرة يومياً مساءً" },
      { name: "Amlodipine", nameAr: "أملوديبين", dosage: "5mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Lisinopril", nameAr: "ليسينوبريل", dosage: "10mg", frequency: "Once daily", frequencyAr: "مرة يومياً", warning: "Monitor blood pressure", warningAr: "راقب ضغط الدم" },
      { name: "Losartan", nameAr: "لوسارتان", dosage: "50mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Metoprolol", nameAr: "ميتوبرولول", dosage: "50mg", frequency: "Twice daily", frequencyAr: "مرتين يومياً", warning: "Do not stop suddenly", warningAr: "لا تتوقف فجأة" },
      { name: "Warfarin (Coumadin)", nameAr: "وارفارين (كومادين)", dosage: "5mg", frequency: "Once daily", frequencyAr: "مرة يومياً", warning: "Regular INR monitoring required", warningAr: "مراقبة INR منتظمة مطلوبة" },
      { name: "Clopidogrel (Plavix)", nameAr: "كلوبيدوقريل (بلافيكس)", dosage: "75mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
    ],
  },
  {
    id: "diabetes", name: "Diabetes", nameAr: "السكري", icon: "🩸",
    items: [
      { name: "Metformin", nameAr: "ميتفورمين", dosage: "500mg", frequency: "Twice daily with meals", frequencyAr: "مرتين يومياً مع الوجبات", warning: "Take with food to reduce GI effects", warningAr: "تناول مع الطعام لتقليل الآثار المعوية" },
      { name: "Glimepiride (Amaryl)", nameAr: "جليميبرايد (أماريل)", dosage: "2mg", frequency: "Once daily before breakfast", frequencyAr: "مرة يومياً قبل الإفطار", warning: "May cause low blood sugar", warningAr: "قد يسبب انخفاض السكر" },
      { name: "Insulin Glargine (Lantus)", nameAr: "أنسولين جلارجين (لانتوس)", dosage: "10 units", frequency: "Once daily at bedtime", frequencyAr: "مرة يومياً عند النوم" },
      { name: "Sitagliptin (Januvia)", nameAr: "سيتاجليبتين (جانوفيا)", dosage: "100mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Empagliflozin (Jardiance)", nameAr: "إمباغليفلوزين (جاردينس)", dosage: "10mg", frequency: "Once daily in morning", frequencyAr: "مرة يومياً صباحاً" },
      { name: "Gliclazide (Diamicron)", nameAr: "جليكلازيد (دياميكرون)", dosage: "80mg", frequency: "Once daily before breakfast", frequencyAr: "مرة يومياً قبل الإفطار" },
    ],
  },
  {
    id: "cholesterol", name: "Cholesterol", nameAr: "الكولسترول", icon: "🫀",
    items: [
      { name: "Rosuvastatin (Crestor)", nameAr: "روسوفاستاتين (كريستور)", dosage: "10mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Simvastatin (Zocor)", nameAr: "سيمفاستاتين (زوكور)", dosage: "20mg", frequency: "Once daily at night", frequencyAr: "مرة يومياً مساءً" },
      { name: "Ezetimibe (Zetia)", nameAr: "إزيتيمايب (زيتيا)", dosage: "10mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Fenofibrate (Tricor)", nameAr: "فينوفايبرات (ترايكور)", dosage: "145mg", frequency: "Once daily with food", frequencyAr: "مرة يومياً مع الطعام" },
    ],
  },
  {
    id: "blood-pressure", name: "Blood Pressure", nameAr: "ضغط الدم", icon: "🩺",
    items: [
      { name: "Valsartan", nameAr: "فالسارتان", dosage: "80mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Hydrochlorothiazide", nameAr: "هيدروكلوروثيازيد", dosage: "25mg", frequency: "Once daily in morning", frequencyAr: "مرة يومياً صباحاً" },
      { name: "Enalapril", nameAr: "إنالابريل", dosage: "10mg", frequency: "Once or twice daily", frequencyAr: "مرة أو مرتين يومياً" },
      { name: "Nifedipine", nameAr: "نيفيديبين", dosage: "30mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Indapamide", nameAr: "إنداباميد", dosage: "1.5mg", frequency: "Once daily in morning", frequencyAr: "مرة يومياً صباحاً" },
    ],
  },
  {
    id: "pain", name: "Pain & Inflammation", nameAr: "الألم والالتهاب", icon: "💊",
    items: [
      { name: "Paracetamol (Panadol)", nameAr: "باراسيتامول (بانادول)", dosage: "500mg", frequency: "Every 6 hours as needed", frequencyAr: "كل 6 ساعات عند الحاجة", warning: "Max 4g/day", warningAr: "الحد الأقصى 4 جم/يوم" },
      { name: "Ibuprofen (Brufen)", nameAr: "إيبوبروفين (بروفين)", dosage: "400mg", frequency: "Three times daily after meals", frequencyAr: "ثلاث مرات يومياً بعد الوجبات", warning: "Take after food", warningAr: "تناول بعد الطعام" },
      { name: "Diclofenac (Voltaren)", nameAr: "ديكلوفيناك (فولتارين)", dosage: "50mg", frequency: "Twice daily", frequencyAr: "مرتين يومياً" },
      { name: "Naproxen", nameAr: "نابروكسين", dosage: "500mg", frequency: "Twice daily", frequencyAr: "مرتين يومياً" },
      { name: "Tramadol", nameAr: "ترامادول", dosage: "50mg", frequency: "Every 6 hours as needed", frequencyAr: "كل 6 ساعات عند الحاجة", warning: "Prescription only - may cause drowsiness", warningAr: "بوصفة طبية فقط - قد يسبب النعاس" },
    ],
  },
  {
    id: "stomach", name: "Stomach & Digestive", nameAr: "المعدة والجهاز الهضمي", icon: "🫁",
    items: [
      { name: "Omeprazole (Losec)", nameAr: "أوميبرازول (لوسك)", dosage: "20mg", frequency: "Once daily before breakfast", frequencyAr: "مرة يومياً قبل الإفطار" },
      { name: "Pantoprazole", nameAr: "بانتوبرازول", dosage: "40mg", frequency: "Once daily before breakfast", frequencyAr: "مرة يومياً قبل الإفطار" },
      { name: "Ranitidine", nameAr: "رانيتيدين", dosage: "150mg", frequency: "Twice daily", frequencyAr: "مرتين يومياً" },
      { name: "Domperidone (Motilium)", nameAr: "دومبيريدون (موتيليوم)", dosage: "10mg", frequency: "Three times daily before meals", frequencyAr: "ثلاث مرات يومياً قبل الوجبات" },
      { name: "Loperamide (Imodium)", nameAr: "لوبيراميد (إيموديوم)", dosage: "2mg", frequency: "As needed (max 16mg/day)", frequencyAr: "عند الحاجة (أقصى 16 مجم/يوم)" },
    ],
  },
  {
    id: "antibiotics", name: "Antibiotics", nameAr: "المضادات الحيوية", icon: "🦠",
    items: [
      { name: "Amoxicillin", nameAr: "أموكسيسيلين", dosage: "500mg", frequency: "Three times daily", frequencyAr: "ثلاث مرات يومياً", warning: "Complete full course", warningAr: "أكمل الدورة كاملة" },
      { name: "Azithromycin (Zithromax)", nameAr: "أزيثروميسين (زيثروماكس)", dosage: "500mg", frequency: "Once daily for 3 days", frequencyAr: "مرة يومياً لمدة 3 أيام" },
      { name: "Ciprofloxacin", nameAr: "سيبروفلوكساسين", dosage: "500mg", frequency: "Twice daily", frequencyAr: "مرتين يومياً" },
      { name: "Augmentin", nameAr: "أوجمنتين", dosage: "625mg", frequency: "Three times daily", frequencyAr: "ثلاث مرات يومياً" },
    ],
  },
  {
    id: "vitamins", name: "Vitamins & Supplements", nameAr: "الفيتامينات والمكملات", icon: "✨",
    items: [
      { name: "Vitamin D3", nameAr: "فيتامين د3", dosage: "1000 IU", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Vitamin B12", nameAr: "فيتامين ب12", dosage: "1000 mcg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Iron (Ferrous Sulfate)", nameAr: "حديد (كبريتات الحديدوز)", dosage: "325mg", frequency: "Once daily on empty stomach", frequencyAr: "مرة يومياً على معدة فارغة", warning: "May cause constipation", warningAr: "قد يسبب إمساك" },
      { name: "Calcium + Vitamin D", nameAr: "كالسيوم + فيتامين د", dosage: "600mg/400IU", frequency: "Twice daily", frequencyAr: "مرتين يومياً" },
      { name: "Omega-3 Fish Oil", nameAr: "أوميغا-3 زيت السمك", dosage: "1000mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Folic Acid", nameAr: "حمض الفوليك", dosage: "400mcg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Zinc", nameAr: "زنك", dosage: "50mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
    ],
  },
  {
    id: "allergy", name: "Allergy & Respiratory", nameAr: "الحساسية والجهاز التنفسي", icon: "🌬️",
    items: [
      { name: "Cetirizine (Zyrtec)", nameAr: "سيتريزين (زيرتك)", dosage: "10mg", frequency: "Once daily", frequencyAr: "مرة يومياً", warning: "May cause drowsiness", warningAr: "قد يسبب النعاس" },
      { name: "Loratadine (Claritin)", nameAr: "لوراتادين (كلاريتين)", dosage: "10mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Montelukast (Singulair)", nameAr: "مونتيلوكاست (سينجولير)", dosage: "10mg", frequency: "Once daily at bedtime", frequencyAr: "مرة يومياً عند النوم" },
      { name: "Salbutamol Inhaler (Ventolin)", nameAr: "سالبوتامول بخاخ (فنتولين)", dosage: "2 puffs", frequency: "As needed", frequencyAr: "عند الحاجة" },
    ],
  },
  {
    id: "mental", name: "Mental Health", nameAr: "الصحة النفسية", icon: "🧠",
    items: [
      { name: "Sertraline (Zoloft)", nameAr: "سيرترالين (زولوفت)", dosage: "50mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Escitalopram (Lexapro)", nameAr: "إسيتالوبرام (ليكسابرو)", dosage: "10mg", frequency: "Once daily", frequencyAr: "مرة يومياً" },
      { name: "Alprazolam (Xanax)", nameAr: "ألبرازولام (زاناكس)", dosage: "0.5mg", frequency: "As needed", frequencyAr: "عند الحاجة", warning: "May cause dependence", warningAr: "قد يسبب التعود" },
    ],
  },
];

// ==================== COMPONENT ====================
type Medication = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  relation: string;
  status: string;
  warning: string;
  frequency?: string;
};

export default function Medications() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: apiMeds = [], isLoading } = useMedications();
  const createMed = useCreateMedication();
  const deleteMed = useDeleteMedication();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [newMed, setNewMed] = useState({ name: "", dosage: "", time: "", relation: "Before meal" });
  const addFormRef = useRef<HTMLDivElement>(null);

  const medications: Medication[] = (apiMeds as any[]).map((m) => ({
    id: m.id,
    name: m.name,
    dosage: m.dosage,
    time: m.time || "08:00",
    relation: m.relation || "Before meal",
    status: m.status || "pending",
    warning: m.warning || "",
    frequency: m.frequency,
  }));

  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      addFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddForm]);

  const toggleTaken = async (id: string) => {
    const med = medications.find((m) => m.id === id);
    if (!med) return;
    const newStatus = med.status === "taken" ? "pending" : "taken";
    await fetch(`/api/health/medications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: newStatus }),
    });
    queryClient.invalidateQueries({ queryKey: ["medications"] });
    toast({
      title: newStatus === "taken" ? (language === "ar" ? "تم التناول" : "Taken") : (language === "ar" ? "تم إلغاء التحديد" : "Unmarked"),
      description: newStatus === "taken"
        ? (language === "ar" ? `تم تسجيل تناول ${med.name}` : `${med.name} marked as taken`)
        : (language === "ar" ? `تم إلغاء تحديد ${med.name}` : `${med.name} unmarked`),
    });
  };

  const removeMedication = (id: string) => {
    deleteMed.mutate(id);
    toast({ title: language === "ar" ? "تم الحذف" : "Removed", description: language === "ar" ? "تم حذف الدواء" : "Medication removed" });
  };

  const addMedication = async () => {
    if (!newMed.name.trim() || !newMed.dosage.trim()) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "يرجى ملء اسم الدواء والجرعة" : "Please fill in medication name and dosage" });
      return;
    }
    await createMed.mutateAsync({
      name: newMed.name,
      dosage: newMed.dosage,
      time: newMed.time || "08:00",
      relation: newMed.relation,
      frequency: "once daily",
      status: "pending",
      warning: "",
      startDate: new Date().toISOString(),
    } as any);
    setNewMed({ name: "", dosage: "", time: "", relation: "Before meal" });
    setShowAddForm(false);
    toast({ title: language === "ar" ? "تمت الإضافة" : "Added", description: language === "ar" ? `تمت إضافة ${newMed.name}` : `${newMed.name} added to your medications` });
  };

  const addFromCatalog = (item: MedCatalogItem) => {
    setNewMed({ name: language === "ar" ? item.nameAr : item.name, dosage: item.dosage, time: "08:00", relation: "Before meal" });
    setShowCatalog(false);
    setShowAddForm(true);
  };

  const handleDownload = () => {
    if (medications.length === 0) {
      toast({ title: language === "ar" ? "لا توجد بيانات" : "No Data", description: language === "ar" ? "أضف أدوية أولاً" : "Add medications first" });
      return;
    }
    const sections = [
      {
        heading: language === "ar" ? "جدول الأدوية" : "Medication Schedule",
        content: medications.map((m) =>
          `${m.name} - ${m.dosage}\n${language === "ar" ? "الوقت" : "Time"}: ${m.time} | ${m.relation}\n${language === "ar" ? "الحالة" : "Status"}: ${m.status === "taken" ? (language === "ar" ? "تم التناول" : "Taken") : (language === "ar" ? "في الانتظار" : "Pending")}${m.warning ? `\n${language === "ar" ? "تحذير" : "Warning"}: ${m.warning}` : ""}`
        ).join("\n\n"),
      },
      {
        heading: language === "ar" ? "الملخص" : "Summary",
        content: `${language === "ar" ? "إجمالي الأدوية" : "Total Medications"}: ${medications.length}\n${language === "ar" ? "تم تناولها" : "Taken"}: ${medications.filter((m) => m.status === "taken").length}\n${language === "ar" ? "في الانتظار" : "Pending"}: ${medications.filter((m) => m.status === "pending").length}`,
      },
    ];
    downloadPDF("medications-report.pdf", language === "ar" ? "تقرير الأدوية" : "Medications Report", sections);
    toast({ title: language === "ar" ? "تم التنزيل" : "Downloaded", description: language === "ar" ? "تم تنزيل تقرير الأدوية" : "Medications report downloaded as PDF" });
  };

  // Filter catalog by search
  const filteredCategories = catalogSearch.trim()
    ? medicationCategories.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
          item.nameAr.includes(catalogSearch)
        ),
      })).filter((cat) => cat.items.length > 0)
    : medicationCategories;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">{t("medicationsTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("dosageSchedule")}</p>
      </div>

      {medications.length > 0 && (
        <div className={`glass-card p-4 border-s-4 ${medications.every((m) => m.status === "taken") ? "border-green-500 bg-green-500/5" : "border-amber-500 bg-amber-500/5"}`}>
          <p className="text-sm font-medium">
            {medications.every((m) => m.status === "taken")
              ? (language === "ar" ? "تم تناول جميع الأدوية" : "All medications taken")
              : (language === "ar" ? `${medications.filter((m) => m.status === "pending").length} أدوية متبقية` : `${medications.filter((m) => m.status === "pending").length} medications remaining`)}
          </p>
        </div>
      )}

      {/* Medication Catalog Browser */}
      {showCatalog && (
        <div className="glass-card p-6 border-s-4 border-purple-500 bg-purple-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{language === "ar" ? "قاعدة بيانات الأدوية" : "Medication Database"}</h2>
            <button onClick={() => setShowCatalog(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
          </div>
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={language === "ar" ? "ابحث عن دواء..." : "Search medications..."}
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredCategories.map((cat) => (
              <div key={cat.id}>
                <button
                  className="w-full flex items-center gap-3 p-3 rounded hover:bg-white/10 transition-colors"
                  onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="flex-1 text-start font-medium text-sm">{language === "ar" ? cat.nameAr : cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat.items.length}</span>
                  {expandedCategory === cat.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {expandedCategory === cat.id && (
                  <div className="ms-10 space-y-1 pb-2">
                    {cat.items.map((item) => (
                      <button
                        key={item.name}
                        className="w-full text-start p-2 rounded hover:bg-white/10 transition-colors group"
                        onClick={() => addFromCatalog(item)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{language === "ar" ? item.nameAr : item.name}</span>
                          <span className="text-xs text-muted-foreground">{item.dosage}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{language === "ar" ? item.frequencyAr : item.frequency}</p>
                        {item.warning && (
                          <p className="text-xs text-amber-500 mt-0.5">⚠ {language === "ar" ? item.warningAr : item.warning}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddForm && (
        <div ref={addFormRef} className="glass-card p-6 border-s-4 border-blue-500 bg-blue-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{language === "ar" ? "إضافة دواء جديد" : "Add New Medication"}</h2>
            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3">
            <Input placeholder={language === "ar" ? "اسم الدواء" : "Medication name"} value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} />
            <Input placeholder={language === "ar" ? "الجرعة (مثال: 500mg)" : "Dosage (e.g. 500mg)"} value={newMed.dosage} onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })} />
            <Input type="time" value={newMed.time} onChange={(e) => setNewMed({ ...newMed, time: e.target.value })} />
            <select className="w-full p-2 border border-muted rounded bg-transparent text-sm" value={newMed.relation} onChange={(e) => setNewMed({ ...newMed, relation: e.target.value })}>
              <option value="Before meal">{language === "ar" ? "قبل الأكل" : "Before meal"}</option>
              <option value="After meal">{language === "ar" ? "بعد الأكل" : "After meal"}</option>
              <option value="With meal">{language === "ar" ? "مع الأكل" : "With meal"}</option>
            </select>
            <Button className="w-full" onClick={addMedication}>{language === "ar" ? "إضافة" : "Add"}</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {medications.length > 0 ? (
          medications.map((med) => (
            <div key={med.id} className="glass-card p-4 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{med.name}</h3>
                  <p className="text-sm text-muted-foreground">{med.dosage}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary/60" />
                  <button onClick={() => removeMedication(med.id)} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {med.warning && (
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded mb-3 text-xs text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  {med.warning}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {med.time}
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {med.relation === "Before meal" ? (language === "ar" ? "قبل الأكل" : "Before meal") : med.relation === "After meal" ? (language === "ar" ? "بعد الأكل" : "After meal") : (language === "ar" ? "مع الأكل" : "With meal")}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={med.status === "taken" ? "default" : "outline"}
                  className="ms-auto"
                  onClick={() => toggleTaken(med.id)}
                >
                  {med.status === "taken" ? "✓ " + t("taken") : t("markAsTaken")}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-8 text-center">
            <Pill className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">{language === "ar" ? "لا توجد أدوية مضافة" : "No medications added yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">{language === "ar" ? "أضف أدويتك لتتبع مواعيدها" : "Add your medications to track their schedule"}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button className="flex-1" onClick={() => { setShowCatalog(true); setShowAddForm(false); }}>
          <Search className="w-4 h-4 me-2" />
          {language === "ar" ? "تصفح الأدوية" : "Browse Medications"}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => { setShowAddForm(true); setShowCatalog(false); }}>
          <Plus className="w-4 h-4 me-2" />
          {t("addMedication")}
        </Button>
      </div>
      <Button variant="outline" className="w-full" onClick={handleDownload}>{t("download")} PDF</Button>
    </div>
  );
}
