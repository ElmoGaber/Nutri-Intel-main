import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Plus, Search, X, Loader, Pill, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { downloadPDF } from "@/lib/actions";
import {
  drugInteractions,
  interactionCategories,
  searchInteractions,
  type DrugInteraction,
} from "@shared/drug-interactions";

export default function DrugInteractions() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDrug, setNewDrug] = useState("");
  const [medications, setMedications] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/health/medications", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data: { name: string }[]) => setMedications(data.map((m) => m.name)))
      .catch(() => {});
  }, []);
  const [aiInteractions, setAiInteractions] = useState<{ id: number; drugs: string; severity: string; description: string }[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Filter static interactions
  const filteredInteractions = useMemo(() => {
    let results = searchInput.trim() ? searchInteractions(searchInput) : drugInteractions;
    if (selectedCategory !== "all") {
      results = results.filter((i) => i.category === selectedCategory);
    }
    return results;
  }, [searchInput, selectedCategory]);

  const checkInteractionAI = async () => {
    if (medications.length < 2) {
      toast({
        title: language === "ar" ? "تنبيه" : "Notice",
        description: language === "ar" ? "أضف دواءين على الأقل للتحقق من التفاعلات" : "Add at least 2 medications to check interactions",
      });
      return;
    }
    setIsChecking(true);
    try {
      const medsStr = medications.join(", ");
      const prompt = language === "ar"
        ? `تحقق من التفاعلات الدوائية بين هذه الأدوية: ${medsStr}. لكل تفاعل اذكر: الأدوية المعنية، مستوى الخطورة (عالي/متوسط/منخفض)، والوصف. أجب بتنسيق محدد: كل تفاعل في سطر بالشكل: الأدوية | الخطورة | الوصف`
        : `Check drug interactions between: ${medsStr}. For each interaction state: drugs involved, severity (high/medium/low), and description. Answer in format: each interaction on a line as: Drugs | Severity | Description`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a pharmacist AI specializing in drug interactions. Provide accurate drug interaction information. Always respond in the language the user writes in." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      const reply = data.message || data.choices?.[0]?.message?.content || "";

      const lines = reply.split("\n").filter((l: string) => l.trim());
      const newInteractions = lines
        .filter((l: string) => l.includes("|"))
        .map((l: string, idx: number) => {
          const parts = l.split("|").map((p: string) => p.trim());
          return {
            id: Date.now() + idx,
            drugs: parts[0] || "Unknown",
            severity: (parts[1] || "medium").toLowerCase().includes("high") ? "high" : (parts[1] || "").toLowerCase().includes("low") ? "low" : "medium",
            description: parts[2] || parts[1] || l,
          };
        });

      if (newInteractions.length > 0) {
        setAiInteractions(newInteractions);
      } else {
        setAiInteractions([{ id: Date.now(), drugs: medsStr, severity: "medium", description: reply }]);
      }
      toast({ title: language === "ar" ? "تم التحليل" : "Analysis Complete", description: language === "ar" ? "تم فحص التفاعلات الدوائية" : "Drug interactions checked" });
    } catch {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "تعذر الاتصال بالخادم" : "Could not connect to server" });
    } finally {
      setIsChecking(false);
    }
  };

  const addMedication = () => {
    if (!newDrug.trim()) return;
    if (medications.includes(newDrug.trim())) {
      toast({ title: language === "ar" ? "موجود" : "Already exists" });
      return;
    }
    setMedications((prev) => [...prev, newDrug.trim()]);
    setNewDrug("");
    setShowAddForm(false);
    toast({ title: language === "ar" ? "تمت الإضافة" : "Added", description: language === "ar" ? `تمت إضافة ${newDrug.trim()}` : `${newDrug.trim()} added` });
  };

  const removeMedication = (med: string) => {
    setMedications((prev) => prev.filter((m) => m !== med));
  };

  const handleExport = () => {
    if (filteredInteractions.length === 0 && aiInteractions.length === 0) {
      toast({ title: language === "ar" ? "لا توجد بيانات" : "No Data" });
      return;
    }
    const sections = [
      ...filteredInteractions.map((i) => ({
        heading: language === "ar" ? `${i.drug1Ar} + ${i.drug2Ar}` : `${i.drug1} + ${i.drug2}`,
        content: `${language === "ar" ? "الخطورة" : "Severity"}: ${i.severity.toUpperCase()}\n${language === "ar" ? i.descriptionAr : i.descriptionEn}`,
      })),
      ...aiInteractions.map((i) => ({
        heading: i.drugs,
        content: `${language === "ar" ? "الخطورة" : "Severity"}: ${i.severity.toUpperCase()}\n${i.description}`,
      })),
    ];
    downloadPDF("drug-interactions.pdf", language === "ar" ? "تفاعلات الأدوية" : "Drug Interactions Report", sections);
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "high") return { border: "border-red-500", bg: "bg-red-500/5", badge: "bg-red-500", icon: "text-red-500" };
    if (severity === "low") return { border: "border-green-500", bg: "bg-green-500/5", badge: "bg-green-500", icon: "text-green-500" };
    return { border: "border-amber-500", bg: "bg-amber-500/5", badge: "bg-amber-500", icon: "text-amber-500" };
  };

  const getSeverityLabel = (severity: string) => {
    if (language === "ar") {
      if (severity === "high") return "خطورة عالية";
      if (severity === "low") return "خطورة منخفضة";
      return "خطورة متوسطة";
    }
    return severity.toUpperCase();
  };

  const visibleCategories = showAllCategories
    ? [{ id: "all", name: "All", nameAr: "الكل" }, ...interactionCategories]
    : [{ id: "all", name: "All", nameAr: "الكل" }, ...interactionCategories.slice(0, 4)];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">{t("drugInteractionsTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("interactionChecker")}</p>
        <p className="text-xs text-muted-foreground">
          {language === "ar" ? `قاعدة بيانات تحتوي على ${drugInteractions.length} تفاعل دوائي معروف` : `Database of ${drugInteractions.length} known drug interactions`}
        </p>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={language === "ar" ? "ابحث عن دواء أو تفاعل..." : "Search drug or interaction..."}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="ps-10 h-11 text-base"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {visibleCategories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              {language === "ar" ? cat.nameAr : cat.name}
            </button>
          );
        })}
        {interactionCategories.length > 4 && (
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-border hover:bg-muted transition-all"
          >
            {showAllCategories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        <span className="font-bold text-foreground">{filteredInteractions.length}</span> {language === "ar" ? "تفاعل" : "interactions"}
      </p>

      {/* Static Interactions Database */}
      {filteredInteractions.length > 0 && (
        <div className="space-y-3">
          {filteredInteractions.map((interaction) => {
            const colors = getSeverityColor(interaction.severity);
            return (
              <div key={interaction.id} className={`glass-card p-4 border-s-4 ${colors.border} ${colors.bg}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors.icon}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm">
                        {language === "ar" ? `${interaction.drug1Ar} + ${interaction.drug2Ar}` : `${interaction.drug1} + ${interaction.drug2}`}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded text-white ${colors.badge}`}>
                        {getSeverityLabel(interaction.severity)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {language === "ar" ? interaction.categoryAr : (interactionCategories.find(c => c.id === interaction.category)?.name || interaction.category)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {language === "ar" ? interaction.descriptionAr : interaction.descriptionEn}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredInteractions.length === 0 && !searchInput && (
        <div className="glass-card p-8 text-center">
          <Pill className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">{language === "ar" ? "لا توجد تفاعلات في هذا التصنيف" : "No interactions in this category"}</p>
        </div>
      )}

      {/* AI Check Section */}
      <div className="glass-card p-4 bg-amber-500/5 border-s-4 border-amber-500">
        <p className="text-sm font-bold mb-2">{language === "ar" ? "فحص بالذكاء الاصطناعي" : "AI Interaction Check"}</p>
        <p className="text-xs text-muted-foreground mb-3">{language === "ar" ? "أضف أدويتك وافحص التفاعلات بينها" : "Add your medications to check interactions"}</p>
        <p className="text-sm font-medium mb-2">{t("currentMedicationsLabel")}</p>
        {medications.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {medications.map((med) => (
              <span key={med} className="text-xs bg-amber-500/20 text-amber-600 px-3 py-1 rounded-full flex items-center gap-1">
                {med}
                <button onClick={() => removeMedication(med)} className="hover:text-red-500 ms-1"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">{language === "ar" ? "لم تتم إضافة أدوية بعد" : "No medications added yet"}</p>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 me-1" />{language === "ar" ? "إضافة دواء" : "Add Drug"}
          </Button>
          <Button size="sm" onClick={checkInteractionAI} disabled={isChecking || medications.length < 2}>
            {isChecking ? (
              <><Loader className="w-4 h-4 me-1 animate-spin" />{language === "ar" ? "جاري الفحص..." : "Checking..."}</>
            ) : (
              <><Pill className="w-4 h-4 me-1" />{language === "ar" ? "فحص التفاعلات" : "Check Interactions"}</>
            )}
          </Button>
        </div>
      </div>

      {/* Add Medication Form */}
      {showAddForm && (
        <div className="glass-card p-4 border-s-4 border-blue-500 bg-blue-500/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">{language === "ar" ? "إضافة دواء" : "Add Medication"}</h3>
            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-2">
            <Input placeholder={language === "ar" ? "اسم الدواء" : "Medication name"} value={newDrug} onChange={(e) => setNewDrug(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMedication()} />
            <Button onClick={addMedication}>{language === "ar" ? "إضافة" : "Add"}</Button>
          </div>
        </div>
      )}

      {/* AI Results */}
      {aiInteractions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">{language === "ar" ? "نتائج الذكاء الاصطناعي" : "AI Results"}</h2>
          {aiInteractions.map((interaction) => {
            const colors = getSeverityColor(interaction.severity);
            return (
              <div key={interaction.id} className={`glass-card p-4 border-s-4 ${colors.border} ${colors.bg}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${colors.icon}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{interaction.drugs}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded text-white ${colors.badge}`}>
                        {getSeverityLabel(interaction.severity)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{interaction.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1" onClick={handleExport}>{language === "ar" ? "تنزيل PDF" : "Download PDF"}</Button>
      </div>
    </div>
  );
}
