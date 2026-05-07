import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";
import { useHealthJournal } from "@/hooks/useHealth";
import { BookOpen, Smile, Zap, Edit3, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";

const moodLabels: Record<string, { en: string; ar: string }> = {
  Great: { en: "Great", ar: "ممتاز" },
  Good: { en: "Good", ar: "جيد" },
  Neutral: { en: "Neutral", ar: "محايد" },
  Bad: { en: "Bad", ar: "سيء" },
};

function getMoodLabel(mood: string, language: string): string {
  return language === "ar" ? (moodLabels[mood]?.ar || mood) : (moodLabels[mood]?.en || mood);
}

function formatRelativeDate(dateStr: string | Date, language: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - entryDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return language === "ar" ? "اليوم" : "Today";
  if (diffDays === 1) return language === "ar" ? "أمس" : "Yesterday";
  if (diffDays <= 7) return language === "ar" ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;

  if (language === "ar") {
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

type LocalJournalEntry = {
  id: string;
  date: string;
  mood: string;
  energy: number;
  note: string;
  tags: string[];
};

const JOURNAL_STORAGE_KEY = "nutri-intel-journal";

export default function HealthJournal() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const { data: apiEntries, isLoading } = useHealthJournal();
  const [localEntries, setLocalEntries] = useState<LocalJournalEntry[]>([]);

  // Load local entries
  useEffect(() => {
    try {
      const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (stored) setLocalEntries(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Merge API + local entries
  const allEntries = useMemo(() => {
    const apiMapped: LocalJournalEntry[] = (apiEntries || []).map((e: any) => ({
      id: e.id,
      date: e.date || e.createdAt,
      mood: e.mood || "Neutral",
      energy: e.energy || 5,
      note: e.content || e.title || "",
      tags: Array.isArray(e.tags) ? e.tags : [],
    }));

    const apiIds = new Set(apiMapped.map((e) => e.id));
    const combined = [...apiMapped, ...localEntries.filter((e) => !apiIds.has(e.id))];
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return combined;
  }, [apiEntries, localEntries]);

  const latestEntry = allEntries.length > 0 ? allEntries[0] : null;
  const totalEntries = allEntries.length;
  const avgEnergy = totalEntries > 0 ? (allEntries.reduce((s, e) => s + e.energy, 0) / totalEntries).toFixed(1) : "0";

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-full relative overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
      {/* Background decoration */}
      <div className="absolute -top-10 -end-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {t('journalSnapshot')}
          </h2>
        </div>
        {totalEntries > 0 && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
            {totalEntries} {language === "ar" ? "إدخال" : totalEntries === 1 ? "entry" : "entries"}
          </span>
        )}
      </div>

      {latestEntry ? (
        <div className="flex-1 relative z-10 space-y-4">
          {/* Latest entry card */}
          <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-transparent">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatRelativeDate(latestEntry.date, language)}
            </div>
            <p className="text-sm leading-relaxed line-clamp-2">{latestEntry.note}</p>
            {latestEntry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {latestEntry.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03]">
              <div className="flex items-center gap-2 mb-1">
                <Smile className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">{language === "ar" ? "المزاج" : "Mood"}</span>
              </div>
              <p className="font-medium text-sm">{getMoodLabel(latestEntry.mood, language)}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03]">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">{language === "ar" ? "الطاقة" : "Energy"}</span>
              </div>
              <p className="font-medium text-sm">{latestEntry.energy}/10 <span className="text-xs text-muted-foreground">({language === "ar" ? "متوسط" : "avg"}: {avgEnergy})</span></p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{language === "ar" ? "لا توجد مدخلات حتى الآن" : "No journal entries yet"}</p>
            <p className="text-xs mt-1">{language === "ar" ? "أضف أول إدخال لتتبع حالتك" : "Add your first entry to track your health"}</p>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border relative z-10">
        <Button onClick={() => setLocation("/health-journal")} className="w-full rounded-xl bg-gradient-to-r from-primary to-teal-500 hover:opacity-90 shadow-lg shadow-primary/20 text-white gap-2">
          <Edit3 className="w-4 h-4" />
          {t('writeEntry')}
        </Button>
      </div>
    </div>
  );
}
