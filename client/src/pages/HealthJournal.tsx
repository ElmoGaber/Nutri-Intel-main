import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Trash2, Edit, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { downloadCSV, shareContent } from "@/lib/actions";
import { useHealthJournal, useCreateJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry } from "@/hooks/useHealth";

const moodLabels: Record<string, { en: string; ar: string }> = {
  Great: { en: "Great", ar: "ممتاز" },
  Good: { en: "Good", ar: "جيد" },
  Neutral: { en: "Neutral", ar: "محايد" },
  Bad: { en: "Bad", ar: "سيء" },
};

const moodKeys = ["Great", "Good", "Neutral", "Bad"] as const;

function getMoodLabel(mood: string, language: string): string {
  return language === "ar" ? (moodLabels[mood]?.ar || mood) : (moodLabels[mood]?.en || mood);
}

function formatDate(dateStr: string | Date, language: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - entryDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return language === "ar" ? "اليوم" : "Today";
  if (diffDays === 1) return language === "ar" ? "أمس" : "Yesterday";
  if (diffDays === 2) return language === "ar" ? "منذ يومين" : "2 days ago";
  if (diffDays <= 7) return language === "ar" ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;

  if (language === "ar") {
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

type JournalEntry = {
  id: string;
  date: string;
  mood: string;
  energy: number;
  note: string;
  tags: string[];
};

export default function HealthJournal() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: apiEntries = [], isLoading: apiLoading } = useHealthJournal();
  const createJournalEntry = useCreateJournalEntry();
  const updateJournalEntry = useUpdateJournalEntry();
  const deleteJournalEntry = useDeleteJournalEntry();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({ mood: "Good", energy: 7, note: "", tags: "" });

  const entries: JournalEntry[] = (apiEntries as any[])
    .map((e) => ({
      id: e.id,
      date: e.date || e.createdAt,
      mood: e.mood || "Neutral",
      energy: e.energy || 5,
      note: e.content || e.title || "",
      tags: Array.isArray(e.tags) ? e.tags : (typeof e.tags === "string" && e.tags ? e.tags.split(",") : []),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const deleteEntry = (id: string) => {
    deleteJournalEntry.mutate(id);
    toast({ title: language === "ar" ? "تم الحذف" : "Deleted", description: language === "ar" ? "تم حذف الإدخال" : "Journal entry deleted" });
  };

  const addEntry = () => {
    const now = new Date();
    createJournalEntry.mutate({
      title: newEntry.note.slice(0, 60),
      content: newEntry.note,
      mood: newEntry.mood,
      energy: newEntry.energy,
      tags: newEntry.tags.split(",").map((t) => t.trim()).filter(Boolean),
      date: now,
    } as any);
    setNewEntry({ mood: "Good", energy: 7, note: "", tags: "" });
    setShowAddForm(false);
    toast({ title: language === "ar" ? "تمت الإضافة" : "Added", description: language === "ar" ? "تمت إضافة إدخال جديد" : "New journal entry added" });
  };

  const startEdit = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (entry) {
      setEditingId(id);
      setNewEntry({ mood: entry.mood, energy: entry.energy, note: entry.note, tags: entry.tags.join(", ") });
    }
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateJournalEntry.mutate({
      id: editingId,
      content: newEntry.note,
      title: newEntry.note.slice(0, 60),
      mood: newEntry.mood,
      energy: newEntry.energy,
      tags: newEntry.tags.split(",").map((t) => t.trim()).filter(Boolean),
    } as any);
    setEditingId(null);
    setNewEntry({ mood: "Good", energy: 7, note: "", tags: "" });
    toast({ title: language === "ar" ? "تم التحديث" : "Updated", description: language === "ar" ? "تم تحديث الإدخال" : "Journal entry updated" });
  };

  const handleExport = () => {
    const headers = [language === "ar" ? "التاريخ" : "Date", language === "ar" ? "المزاج" : "Mood", language === "ar" ? "الطاقة" : "Energy", language === "ar" ? "الملاحظة" : "Note", language === "ar" ? "العلامات" : "Tags"];
    const rows = entries.map((e) => [formatDate(e.date, language), getMoodLabel(e.mood, language), String(e.energy), e.note, e.tags.join("; ")]);
    downloadCSV("health-journal.csv", headers, rows);
    toast({ title: language === "ar" ? "تم التصدير" : "Exported", description: language === "ar" ? "تم تصدير السجل الصحي" : "Health journal exported" });
  };

  const handleShare = async () => {
    const text = entries.map((e) => `${formatDate(e.date, language)}: ${getMoodLabel(e.mood, language)} (${e.energy}/10) - ${e.note}`).join("\n");
    const ok = await shareContent(language === "ar" ? "سجلي الصحي" : "My Health Journal", text);
    toast({
      title: ok ? (language === "ar" ? "تمت المشاركة" : "Shared") : (language === "ar" ? "تم النسخ" : "Copied"),
      description: ok ? (language === "ar" ? "تمت مشاركة السجل" : "Journal shared successfully") : (language === "ar" ? "تم نسخ السجل إلى الحافظة" : "Journal copied to clipboard"),
    });
  };

  const entryForm = (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium block mb-1">{language === "ar" ? "المزاج" : "Mood"}</label>
        <div className="flex gap-2">
          {moodKeys.map((mood) => (
            <button key={mood} onClick={() => setNewEntry({ ...newEntry, mood })} className={`px-3 py-1 rounded text-xs transition ${newEntry.mood === mood ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
              {getMoodLabel(mood, language)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">{language === "ar" ? "مستوى الطاقة" : "Energy Level"}: {newEntry.energy}/10</label>
        <input type="range" min="1" max="10" value={newEntry.energy} onChange={(e) => setNewEntry({ ...newEntry, energy: Number(e.target.value) })} className="w-full" />
      </div>
      <Input placeholder={language === "ar" ? "اكتب ملاحظتك..." : "Write your note..."} value={newEntry.note} onChange={(e) => setNewEntry({ ...newEntry, note: e.target.value })} />
      <Input placeholder={language === "ar" ? "العلامات (مفصولة بفاصلة)" : "Tags (comma-separated)"} value={newEntry.tags} onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })} />
    </div>
  );

  if (apiLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
          {t("healthJournalTitle")}
        </h1>
        <p className="text-muted-foreground mt-2">{t("journalDescription")}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {language === "ar"
            ? `📅 ${new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
            : `📅 ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
        </p>
      </div>

      {/* Summary Stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{entries.length}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الإدخالات" : "Total Entries"}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{entries.filter((e) => e.mood === "Great" || e.mood === "Good").length}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "أيام جيدة" : "Good Days"}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{entries.length > 0 ? (entries.reduce((s, e) => s + e.energy, 0) / entries.length).toFixed(1) : 0}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "متوسط الطاقة" : "Avg Energy"}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-amber-500">
              {entries.length > 0
                ? getMoodLabel(
                    moodKeys.reduce((best, mood) =>
                      entries.filter((e) => e.mood === mood).length > entries.filter((e) => e.mood === best).length ? mood : best,
                    moodKeys[0]),
                  language)
                : "--"}
            </p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "المزاج الشائع" : "Common Mood"}</p>
          </div>
        </div>
      )}

      {/* New Entry Button / Form */}
      {showAddForm ? (
        <div className="glass-card p-6 border-s-4 border-blue-500 bg-blue-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{language === "ar" ? "إدخال جديد" : "New Entry"}</h2>
            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
          </div>
          {entryForm}
          <Button className="w-full mt-3" onClick={addEntry}>{language === "ar" ? "إضافة" : "Add Entry"}</Button>
        </div>
      ) : (
        <Button className="w-full" size="lg" onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 me-2" />
          {t("addJournalEntry")}
        </Button>
      )}

      {/* Journal Entries */}
      <div className="space-y-3">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <div key={entry.id} className="glass-card p-4">
              {editingId === entry.id ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">{language === "ar" ? "تعديل الإدخال" : "Edit Entry"}</h3>
                    <button onClick={() => { setEditingId(null); setNewEntry({ mood: "Good", energy: 7, note: "", tags: "" }); }} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
                  </div>
                  {entryForm}
                  <Button className="w-full mt-3" onClick={saveEdit}>{language === "ar" ? "حفظ" : "Save"}</Button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium">{formatDate(entry.date, language)}</p>
                      <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white/10 rounded transition" onClick={() => startEdit(entry.id)}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded transition" onClick={() => deleteEntry(entry.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("mood")}</p>
                      <p className="text-sm font-medium">{getMoodLabel(entry.mood, language)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("energyLevel")}</p>
                      <p className="text-sm font-medium">{entry.energy}/10</p>
                    </div>
                  </div>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        ) : (
          <div className="glass-card p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{language === "ar" ? "لا توجد مدخلات حتى الآن. أضف أول إدخال!" : "No entries yet. Add your first entry!"}</p>
          </div>
        )}
      </div>

      {/* Mood Statistics */}
      {entries.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">{language === "ar" ? "اتجاهات المزاج" : "Mood Trends"}</h2>
          <div className="space-y-3">
            {moodKeys.map((mood) => {
              const pct = Math.round((entries.filter((e) => e.mood === mood).length / Math.max(entries.length, 1)) * 100);
              const colors: Record<string, string> = { Great: "bg-green-500", Good: "bg-blue-500", Neutral: "bg-amber-500", Bad: "bg-red-500" };
              if (pct === 0) return null;
              return (
                <div key={mood} className="flex items-center gap-3">
                  <span className="w-16 text-sm">{getMoodLabel(mood, language)}</span>
                  <div className="flex-1 h-3 bg-muted rounded">
                    <div className={`h-full ${colors[mood]} rounded`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {entries.length > 0 && (
        <div className="flex gap-3 pt-4">
          <Button className="flex-1" onClick={handleExport}>{t("export")}</Button>
          <Button variant="outline" className="flex-1" onClick={handleShare}>{t("share")}</Button>
        </div>
      )}
    </div>
  );
}
