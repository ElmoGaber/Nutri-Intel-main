import { useLanguage } from "@/hooks/use-language";
import { BookOpen, Clock, CheckCircle2, Trash2, Loader2, Plus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function CoachingSessions() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery<any[]>({
    queryKey: ["coaching-sessions"],
    queryFn: async () => {
      const r = await fetch("/api/coaching/sessions", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/coaching/sessions/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coaching-sessions"] }),
  });

  const pending = sessions.filter((s: any) => s.status !== "completed");
  const completed = sessions.filter((s: any) => s.status === "completed");

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
            {language === "ar" ? "جلساتي" : "My Sessions"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "ar" ? "استشاراتك الصحية المجدولة" : "Your scheduled health consultations"}
          </p>
        </div>
        <Button onClick={() => setLocation("/coaching/consultation")}>
          <Plus className="w-4 h-4 me-2" />
          {language === "ar" ? "حجز جديد" : "New Booking"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center gap-4 text-center">
          <BookOpen className="w-14 h-14 text-muted-foreground/30" />
          <div>
            <p className="font-semibold">{language === "ar" ? "لا توجد جلسات بعد" : "No sessions yet"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "ar" ? "احجز استشارتك الأولى الآن" : "Book your first consultation now"}
            </p>
          </div>
          <Button onClick={() => setLocation("/coaching/consultation")}>
            {language === "ar" ? "احجز الآن" : "Book Now"}
          </Button>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {language === "ar" ? "قيد الانتظار" : "Upcoming"}
              </h2>
              <div className="space-y-3">
                {pending.map((s: any) => (
                  <div key={s.id} className="glass-card p-4 flex items-center justify-between border-s-4 border-amber-500">
                    <div className="flex-1">
                      <p className="font-medium">{s.title}</p>
                      {s.scheduledAt && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(s.scheduledAt).toLocaleString(language === "ar" ? "ar-EG" : "en-US", { dateStyle: "long", timeStyle: "short" })}
                        </p>
                      )}
                      {s.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.notes}</p>}
                      {s.meetingUrl && (
                        <a
                          href={s.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          {language === "ar" ? "رابط Google Meet" : "Google Meet Link"}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => deleteSession.mutate(s.id)}
                      title={language === "ar" ? "حذف الجلسة" : "Delete session"}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors ms-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {language === "ar" ? "مكتملة" : "Completed"}
              </h2>
              <div className="space-y-3">
                {completed.map((s: any) => (
                  <div key={s.id} className="glass-card p-4 flex items-center justify-between opacity-70">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{s.title}</p>
                        {s.scheduledAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.scheduledAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                          </p>
                        )}
                        {s.meetingUrl && (
                          <a
                            href={s.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                          >
                            <Video className="w-3.5 h-3.5" />
                            {language === "ar" ? "دخول الجلسة" : "Join session"}
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSession.mutate(s.id)}
                      title={language === "ar" ? "حذف الجلسة" : "Delete session"}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
