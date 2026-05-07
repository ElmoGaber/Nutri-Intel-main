import { useLanguage } from "@/hooks/use-language";
import { Calendar, Clock, User, Stethoscope, Apple, Dumbbell, Brain, Heart, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const SPECIALTIES = [
  { id: "nutrition", iconEl: Apple, en: "Nutrition Specialist", ar: "أخصائي تغذية" },
  { id: "fitness", iconEl: Dumbbell, en: "Fitness Coach", ar: "مدرب لياقة" },
  { id: "mental", iconEl: Brain, en: "Mental Wellness", ar: "الصحة النفسية" },
  { id: "chronic", iconEl: Heart, en: "Chronic Disease", ar: "الأمراض المززمنة" },
  { id: "general", iconEl: Stethoscope, en: "General Health", ar: "الصحة العامة" },
];

export default function CoachingConsultation() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { role } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ specialty: "nutrition", notes: "", scheduledAt: "", coachUserId: "", patientId: "" });
  const [showForm, setShowForm] = useState(false);

  const { data: sessions = [], isLoading } = useQuery<any[]>({
    queryKey: ["coaching-sessions"],
    queryFn: async () => {
      const r = await fetch("/api/coaching/sessions", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const book = useMutation({
    mutationFn: async (body: object) => {
      const r = await fetch("/api/coaching/sessions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coaching-sessions"] });
      setShowForm(false);
      setForm({ specialty: "nutrition", notes: "", scheduledAt: "", coachUserId: "", patientId: "" });
      toast({ title: language === "ar" ? "تم الحجز" : "Booked", description: language === "ar" ? "تم تسجيل طلب استشارتك" : "Your consultation request has been submitted" });
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/coaching/sessions/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coaching-sessions"] }),
  });

  const handleBook = () => {
    if (!form.scheduledAt) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "اختر موعداً" : "Please select a date and time" });
      return;
    }
    if ((role === "doctor" || role === "coach") && !form.patientId.trim()) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "اكتب Patient ID أو User ID للمريض" : "Enter a patient ID or user ID",
      });
      return;
    }

    book.mutate({
      title: SPECIALTIES.find(s => s.id === form.specialty)?.[language === "ar" ? "ar" : "en"] ?? form.specialty,
      notes: form.notes,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      status: "pending",
      coachUserId: form.coachUserId || undefined,
      patientId: form.patientId || undefined,
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
          {language === "ar" ? "استشارات التغذية والصحة" : "Health Consultations"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "ar" ? "احجز استشارة مع متخصص صحي" : "Book a session with a health specialist"}
        </p>
      </div>

      {/* Specialties grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SPECIALTIES.map((s) => (
          <button
            key={s.id}
            onClick={() => { setForm(f => ({ ...f, specialty: s.id })); setShowForm(true); }}
            className={`glass-card p-4 flex flex-col items-center gap-2 text-center transition-all hover:scale-105 ${form.specialty === s.id && showForm ? "ring-2 ring-primary" : ""}`}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <s.iconEl className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-medium">{language === "ar" ? s.ar : s.en}</p>
          </button>
        ))}
      </div>

      {/* Booking form */}
      {showForm && (
        <div className="glass-card p-6 border-t-4 border-primary">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {language === "ar" ? "تفاصيل الحجز" : "Booking Details"}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">{language === "ar" ? "التخصص" : "Specialty"}</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.specialty}
                onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                title={language === "ar" ? "التخصص" : "Specialty"}
                aria-label={language === "ar" ? "التخصص" : "Specialty"}
              >
                {SPECIALTIES.map(s => (
                  <option key={s.id} value={s.id}>{language === "ar" ? s.ar : s.en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{language === "ar" ? "الموعد المفضل *" : "Preferred Date & Time *"}</label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
            {(role === "doctor" || role === "coach") && (
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  {language === "ar" ? "Patient ID أو User ID *" : "Patient ID or User ID *"}
                </label>
                <Input
                  value={form.patientId}
                  onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
                  placeholder={language === "ar" ? "مثال: PAT-1001" : "e.g. PAT-1001"}
                />
              </div>
            )}
            {role === "patient" && (
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  {language === "ar" ? "معرف الطبيب/الكوتش (اختياري)" : "Doctor/Coach User ID (optional)"}
                </label>
                <Input
                  value={form.coachUserId}
                  onChange={e => setForm(f => ({ ...f, coachUserId: e.target.value }))}
                  placeholder={language === "ar" ? "مثال: user_xxx" : "e.g. user_xxx"}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1.5">{language === "ar" ? "ملاحظات (اختياري)" : "Notes (optional)"}</label>
              <textarea
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                rows={3}
                placeholder={language === "ar" ? "اذكر أي مخاوف أو أسئلة..." : "Mention any concerns or questions..."}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleBook} disabled={book.isPending}>
                {book.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Calendar className="w-4 h-4 me-2" />}
                {language === "ar" ? "تأكيد الحجز" : "Confirm Booking"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          {language === "ar" ? "استشاراتي" : "My Consultations"}
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : sessions.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <User className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{language === "ar" ? "لا توجد استشارات بعد" : "No consultations yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s: any) => (
              <div key={s.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  {s.scheduledAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3 inline me-1" />
                      {new Date(s.scheduledAt).toLocaleString(language === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  )}
                  {s.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.notes}</p>}
                  {s.meetingUrl && (
                    <a
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    >
                      <Video className="w-3.5 h-3.5" />
                      {language === "ar" ? "دخول Google Meet" : "Join Google Meet"}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === "completed" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
                    {s.status === "completed" ? (language === "ar" ? "مكتمل" : "Completed") : (language === "ar" ? "قيد الانتظار" : "Pending")}
                  </span>
                  <button
                    onClick={() => cancel.mutate(s.id)}
                    title={language === "ar" ? "إلغاء الجلسة" : "Cancel session"}
                    className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
