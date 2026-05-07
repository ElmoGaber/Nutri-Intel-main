import { useLanguage } from "@/hooks/use-language";
import { Pill, Check, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMedications } from "@/hooks/useHealth";
import { useLocation } from "wouter";

export default function Medications() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [takenMeds, setTakenMeds] = useState<Set<string>>(new Set());
  const { data: apiMeds = [], isLoading } = useMedications();

  const handleMarkAsTaken = (medId: string) => {
    setTakenMeds((prev) => {
      const next = new Set(prev);
      if (next.has(medId)) next.delete(medId);
      else next.add(medId);
      return next;
    });
  };

  return (
    <div className="glass-card p-6 flex flex-col h-full animate-in fade-in slide-in-from-left-8 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
          <Pill className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          {t("upcomingMedications")}
        </h2>
      </div>

      <div className="space-y-4 flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-border animate-pulse flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : apiMeds.length > 0 ? (
          apiMeds.slice(0, 4).map((med: any) => {
            const taken = takenMeds.has(String(med.id));
            return (
              <div
                key={med.id}
                className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border flex gap-4 items-center justify-between hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      taken
                        ? "border-green-500 bg-green-500/10 text-green-500"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {taken ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${taken ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {med.name}{" "}
                      <span className="text-sm font-normal text-muted-foreground no-underline ms-1">{med.dosage}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{med.frequency}</p>
                  </div>
                </div>
                <Button
                  variant={taken ? "ghost" : "default"}
                  size="sm"
                  className={`rounded-full shrink-0 ${taken ? "opacity-50" : "shadow-md shadow-primary/20"}`}
                  onClick={() => handleMarkAsTaken(String(med.id))}
                >
                  {taken ? (language === "ar" ? "تم" : "Done") : (language === "ar" ? "تناول" : "Take")}
                </Button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Pill className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">
              {language === "ar" ? "لم تتم إضافة أدوية بعد" : "No medications added yet"}
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setLocation("/medications")}>
              {language === "ar" ? "إضافة دواء" : "Add Medication"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
