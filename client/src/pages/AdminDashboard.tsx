import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Utensils, Activity, MessageSquare, Shield, Trash2,
  ChevronDown, ChevronUp, Search, RefreshCw, TrendingUp,
  Pill, Phone, BarChart3, Eye, LogOut, Crown, Send,
  Bell, X, CheckCheck, Inbox, Droplets, BookOpen,
  Target, Heart, Calendar, Clock, Info, Coffee, Stethoscope,
  Dumbbell, Salad, Scale, SlidersHorizontal, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import type { SystemControlConfig } from "@shared/system-control-config";

// ── Types ────────────────────────────────────────────────────────────────────
type AdminStats = {
  totalUsers: number; newUsersToday: number; totalMeals: number;
  totalHealthMetrics: number; totalMedications: number;
  totalChatMessages: number; totalEmergencyContacts: number;
};
type AdminUser = {
  id: string; username: string; email: string;
  firstName?: string; lastName?: string; age?: number;
  height?: number; weight?: number; bloodType?: string;
  isAdmin?: boolean; onboardingCompleted?: boolean; createdAt: string;
  mealsCount: number; metricsCount: number; medsCount: number; messagesCount: number;
};
type UserDetail = AdminUser & {
  meals: any[]; metrics: any[]; medications: any[];
  messages: any[]; emergencyContacts: any[];
  journalEntries: any[]; waterLogs: any[];
  goals: any[]; dietaryPreference: any | null;
  coachingSessions: any[];
  bloodType?: string; activityLevel?: string; goals_list?: string[];
  onboardingCompleted?: boolean;
};
type AdminMessage = {
  id: string; toUserId: string; fromAdminId: string;
  subject: string; body: string; isRead: boolean; createdAt: string;
};

type RoleCapabilityDraft = {
  canSearchAnyPatientById: boolean;
  canCustomizePatientFormulas: boolean;
  canAccessRoleDashboard: boolean;
};

type SystemControlDraft = Omit<SystemControlConfig, "customSettings"> & {
  customSettingsText: string;
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <div className="glass-card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-green-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Send Message Modal ────────────────────────────────────────────────────────
function SendMessageModal({ user, onClose, language }: {
  user: AdminUser; onClose: () => void; language: string;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const send = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ toUserId: user.id, subject, body }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      toast({ title: language === "ar" ? "تم الإرسال" : "Sent", description: language === "ar" ? `تم إرسال الرسالة لـ ${user.firstName || user.username}` : `Message sent to ${user.firstName || user.username}` });
      onClose();
    },
    onError: () => toast({ variant: "destructive", title: language === "ar" ? "فشل الإرسال" : "Send failed" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              {language === "ar" ? "إرسال رسالة" : "Send Message"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {language === "ar" ? "إلى: " : "To: "}
              <span className="font-medium text-foreground">{user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.username}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            title={language === "ar" ? "إغلاق النافذة" : "Close dialog"}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">{language === "ar" ? "العنوان" : "Subject"}</label>
            <Input
              placeholder={language === "ar" ? "موضوع الرسالة..." : "Message subject..."}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">{language === "ar" ? "نص الرسالة *" : "Message *"}</label>
            <textarea
              className="w-full min-h-[140px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={language === "ar" ? "اكتب رسالتك هنا..." : "Write your message here..."}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => send.mutate()} disabled={send.isPending || !body.trim()}>
              {send.isPending ? <RefreshCw className="w-4 h-4 animate-spin me-2" /> : <Send className="w-4 h-4 me-2" />}
              {language === "ar" ? "إرسال" : "Send"}
            </Button>
            <Button variant="outline" onClick={onClose}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sent Messages Panel ───────────────────────────────────────────────────────
function SentMessagesPanel({ users, language }: { users: AdminUser[]; language: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: messages = [], isLoading } = useQuery<AdminMessage[]>({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const r = await fetch("/api/admin/messages", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const deleteMsg = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/messages/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: (_, id) => {
      qc.setQueryData(["admin-messages"], (old: AdminMessage[]) => (old ?? []).filter((m) => m.id !== id));
      toast({ title: language === "ar" ? "تم الحذف" : "Deleted" });
    },
  });

  const getUserName = (id: string) => {
    const u = users.find((u) => u.id === id);
    return u ? (u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.username) : id;
  };

  if (isLoading) return <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Inbox className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{language === "ar" ? "لا توجد رسائل مرسلة بعد" : "No sent messages yet"}</p>
        </div>
      ) : messages.map((msg) => (
        <div key={msg.id} className="glass-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {language === "ar" ? "إلى: " : "To: "}{getUserName(msg.toUserId)}
                </span>
                {msg.isRead
                  ? <span className="text-xs flex items-center gap-1 text-green-500"><CheckCheck className="w-3 h-3" />{language === "ar" ? "تمت القراءة" : "Read"}</span>
                  : <span className="text-xs text-orange-400">{language === "ar" ? "لم تُقرأ" : "Unread"}</span>
                }
                <span className="text-xs text-muted-foreground ms-auto">
                  {new Date(msg.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                </span>
              </div>
              {msg.subject && <p className="font-medium text-sm mt-1">{msg.subject}</p>}
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{msg.body}</p>
            </div>
            <button
              onClick={() => deleteMsg.mutate(msg.id)}
              title={language === "ar" ? "حذف الرسالة" : "Delete message"}
              className="p-1.5 hover:bg-red-500/10 rounded-lg transition shrink-0"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── User Detail Modal ─────────────────────────────────────────────────────────
function Section({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/30 transition"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 font-semibold text-sm">
          <span className={`w-6 h-6 rounded-md flex items-center justify-center ${color}`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </span>
          {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-3 space-y-2">{children}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm py-1 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-end">{value || "—"}</span>
    </div>
  );
}

function UserDetailModal({ userId, onClose, onSendMessage, language }: {
  userId: string; onClose: () => void;
  onSendMessage: () => void; language: string;
}) {
  const ar = language === "ar";
  const { data: d, isLoading } = useQuery<UserDetail>({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
      const r = await fetch(`/api/admin/users/${userId}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const fmt = (date: string) => date ? new Date(date).toLocaleDateString(ar ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const fmtTime = (date: string) => date ? new Date(date).toLocaleString(ar ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {d && (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-lg">
                {(d.firstName?.[0] || d.username[0]).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-bold text-base">{d ? `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.username : (ar ? "تفاصيل المستخدم" : "User Details")}</h2>
              {d && <p className="text-xs text-muted-foreground">@{d.username} · {d.email}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onSendMessage}>
              <Send className="w-4 h-4 me-1.5" />
              {ar ? "رسالة" : "Message"}
            </Button>
            <button
              onClick={onClose}
              title={ar ? "إغلاق النافذة" : "Close dialog"}
              className="p-1.5 hover:bg-muted rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><RefreshCw className="w-7 h-7 animate-spin text-muted-foreground" /></div>
        ) : d ? (
          <div className="overflow-y-auto p-4 space-y-3 flex-1">

            {/* Activity summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { icon: Utensils, label: ar ? "وجبات" : "Meals", value: d.mealsCount, color: "bg-orange-500" },
                { icon: Activity, label: ar ? "مقاييس" : "Metrics", value: d.metricsCount, color: "bg-blue-500" },
                { icon: Pill, label: ar ? "أدوية" : "Meds", value: d.medsCount, color: "bg-purple-500" },
                { icon: MessageSquare, label: ar ? "AI" : "AI Msgs", value: d.messagesCount, color: "bg-green-500" },
              ].map((i) => (
                <div key={i.label} className="glass-card p-3 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${i.color}`}><i.icon className="w-3.5 h-3.5 text-white" /></div>
                  <div><p className="font-bold text-sm">{i.value}</p><p className="text-xs text-muted-foreground">{i.label}</p></div>
                </div>
              ))}
            </div>

            {/* Profile */}
            <Section title={ar ? "الملف الشخصي" : "Profile"} icon={Users} color="bg-primary">
              <Row label={ar ? "اسم المستخدم" : "Username"} value={d.username} />
              <Row label={ar ? "الاسم الكامل" : "Full Name"} value={`${d.firstName || ""} ${d.lastName || ""}`.trim() || null} />
              <Row label={ar ? "البريد الإلكتروني" : "Email"} value={d.email} />
              <Row label={ar ? "السن" : "Age"} value={d.age ? `${d.age} ${ar ? "سنة" : "yrs"}` : null} />
              <Row label={ar ? "الطول" : "Height"} value={d.height ? `${d.height} cm` : null} />
              <Row label={ar ? "الوزن" : "Weight"} value={d.weight ? `${d.weight} kg` : null} />
              <Row label={ar ? "فصيلة الدم" : "Blood Type"} value={d.bloodType} />
              <Row label={ar ? "مستوى النشاط" : "Activity Level"} value={d.activityLevel} />
              <Row label={ar ? "تاريخ التسجيل" : "Joined"} value={fmt(d.createdAt)} />
              <Row label={ar ? "الإعداد مكتمل" : "Onboarding"} value={d.onboardingCompleted ? (ar ? "مكتمل ✓" : "Done ✓") : (ar ? "غير مكتمل" : "Incomplete")} />
            </Section>

            {/* Dietary Preferences */}
            {d.dietaryPreference && (
              <Section title={ar ? "التفضيلات الغذائية" : "Dietary Preferences"} icon={Salad} color="bg-emerald-500">
                <Row label={ar ? "نوع النظام الغذائي" : "Diet Type"} value={d.dietaryPreference.dietType} />
                <Row label={ar ? "هدف السعرات" : "Calorie Goal"} value={d.dietaryPreference.calorieGoal ? `${d.dietaryPreference.calorieGoal} kcal` : null} />
                <Row label={ar ? "نباتي" : "Vegetarian"} value={d.dietaryPreference.vegetarian ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")} />
                <Row label={ar ? "نباتي صرف" : "Vegan"} value={d.dietaryPreference.vegan ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")} />
                <Row label={ar ? "خالي من الجلوتين" : "Gluten Free"} value={d.dietaryPreference.glutenFree ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")} />
                <Row label={ar ? "خالي من الألبان" : "Dairy Free"} value={d.dietaryPreference.dairyFree ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")} />
                {d.dietaryPreference.allergies && <Row label={ar ? "الحساسية" : "Allergies"} value={d.dietaryPreference.allergies} />}
              </Section>
            )}

            {/* Goals */}
            {d.goals?.length > 0 && (
              <Section title={ar ? "الأهداف الصحية" : "Health Goals"} icon={Target} color="bg-yellow-500">
                {d.goals.map((g: any) => (
                  <div key={g.id} className="glass-card px-3 py-2 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{g.goalType?.replace(/_/g, " ")}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${g.isActive ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"}`}>
                        {g.isActive ? (ar ? "نشط" : "Active") : (ar ? "منتهي" : "Ended")}
                      </span>
                    </div>
                    {g.targetWeight && <Row label={ar ? "الوزن المستهدف" : "Target Weight"} value={`${g.targetWeight} kg`} />}
                    {g.startWeight && <Row label={ar ? "الوزن الابتدائي" : "Start Weight"} value={`${g.startWeight} kg`} />}
                    {g.targetCalories && <Row label={ar ? "هدف السعرات" : "Target Calories"} value={`${g.targetCalories} kcal`} />}
                    {g.targetDate && <Row label={ar ? "تاريخ الهدف" : "Target Date"} value={fmt(g.targetDate)} />}
                  </div>
                ))}
              </Section>
            )}

            {/* Meals */}
            {d.meals?.length > 0 && (
              <Section title={ar ? `الوجبات (${d.meals.length})` : `Meals (${d.meals.length})`} icon={Utensils} color="bg-orange-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="text-start pb-2 font-medium">{ar ? "الاسم" : "Name"}</th>
                        <th className="text-start pb-2 font-medium">{ar ? "النوع" : "Type"}</th>
                        <th className="text-end pb-2 font-medium">{ar ? "سعرات" : "kcal"}</th>
                        <th className="text-end pb-2 font-medium">{ar ? "بروتين" : "Protein"}</th>
                        <th className="text-end pb-2 font-medium">{ar ? "كارب" : "Carbs"}</th>
                        <th className="text-end pb-2 font-medium">{ar ? "دهون" : "Fat"}</th>
                        <th className="text-end pb-2 font-medium">{ar ? "التاريخ" : "Date"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...d.meals].reverse().map((m: any) => (
                        <tr key={m.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                          <td className="py-1.5 pe-2">{m.name}</td>
                          <td className="py-1.5 pe-2 text-muted-foreground capitalize">{m.mealType}</td>
                          <td className="py-1.5 text-end">{m.calories ?? "—"}</td>
                          <td className="py-1.5 text-end">{m.protein != null ? `${m.protein}g` : "—"}</td>
                          <td className="py-1.5 text-end">{m.carbs != null ? `${m.carbs}g` : "—"}</td>
                          <td className="py-1.5 text-end">{m.fat != null ? `${m.fat}g` : "—"}</td>
                          <td className="py-1.5 text-end text-muted-foreground">{fmt(m.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* Health Metrics */}
            {d.metrics?.length > 0 && (
              <Section title={ar ? `المقاييس الصحية (${d.metrics.length})` : `Health Metrics (${d.metrics.length})`} icon={Activity} color="bg-blue-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="text-start pb-2 font-medium">{ar ? "النوع" : "Type"}</th>
                        <th className="text-end pb-2 font-medium">{ar ? "القيمة" : "Value"}</th>
                        <th className="text-end pb-2 font-medium">{ar ? "التاريخ" : "Date"}</th>
                        <th className="text-start pb-2 font-medium ps-3">{ar ? "ملاحظات" : "Notes"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...d.metrics].reverse().map((m: any) => (
                        <tr key={m.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                          <td className="py-1.5 pe-2 capitalize">{m.type?.replace(/_/g, " ")}</td>
                          <td className="py-1.5 text-end font-medium">{m.value}{m.unit ? ` ${m.unit}` : ""}</td>
                          <td className="py-1.5 text-end text-muted-foreground">{fmt(m.date)}</td>
                          <td className="py-1.5 ps-3 text-muted-foreground">{m.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* Medications */}
            {d.medications?.length > 0 && (
              <Section title={ar ? `الأدوية (${d.medications.length})` : `Medications (${d.medications.length})`} icon={Pill} color="bg-purple-500">
                {d.medications.map((m: any) => (
                  <div key={m.id} className="glass-card px-3 py-2 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{m.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === "active" ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"}`}>
                        {m.status || (ar ? "نشط" : "active")}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
                      {m.dosage && <span>{ar ? "الجرعة: " : "Dose: "}<b className="text-foreground">{m.dosage}{m.unit ? ` ${m.unit}` : ""}</b></span>}
                      {m.frequency && <span>{ar ? "التكرار: " : "Freq: "}<b className="text-foreground">{m.frequency}</b></span>}
                      {m.reason && <span>{ar ? "السبب: " : "Reason: "}<b className="text-foreground">{m.reason}</b></span>}
                      {m.prescribedBy && <span>{ar ? "الطبيب: " : "Doctor: "}<b className="text-foreground">{m.prescribedBy}</b></span>}
                      {m.startDate && <span>{ar ? "من: " : "From: "}<b className="text-foreground">{fmt(m.startDate)}</b></span>}
                      {m.endDate && <span>{ar ? "إلى: " : "Until: "}<b className="text-foreground">{fmt(m.endDate)}</b></span>}
                    </div>
                    {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
                    {m.warning && <p className="text-xs text-yellow-600">⚠ {m.warning}</p>}
                  </div>
                ))}
              </Section>
            )}

            {/* Water Logs */}
            {d.waterLogs?.length > 0 && (
              <Section title={ar ? `سجل المياه (${d.waterLogs.length})` : `Water Logs (${d.waterLogs.length})`} icon={Droplets} color="bg-cyan-500">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[...d.waterLogs].reverse().slice(0, 20).map((w: any) => (
                    <div key={w.id} className="glass-card px-2 py-1.5 text-xs text-center">
                      <p className="font-bold text-cyan-500">{w.amount}{w.unit || "ml"}</p>
                      <p className="text-muted-foreground">{fmt(w.date)}</p>
                    </div>
                  ))}
                </div>
                {d.waterLogs.length > 20 && <p className="text-xs text-muted-foreground text-center">+{d.waterLogs.length - 20} {ar ? "أكثر" : "more"}</p>}
              </Section>
            )}

            {/* Journal */}
            {d.journalEntries?.length > 0 && (
              <Section title={ar ? `المذكرة الصحية (${d.journalEntries.length})` : `Health Journal (${d.journalEntries.length})`} icon={BookOpen} color="bg-pink-500">
                {[...d.journalEntries].reverse().map((j: any) => (
                  <div key={j.id} className="glass-card px-3 py-2 text-sm space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{j.title || (ar ? "بدون عنوان" : "Untitled")}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {j.mood && <span className="text-xs bg-pink-500/10 text-pink-600 px-2 py-0.5 rounded-full">{j.mood}</span>}
                        <span className="text-xs text-muted-foreground">{fmt(j.date)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{j.content}</p>
                    {j.symptoms && <p className="text-xs text-yellow-600">⚠ {j.symptoms}</p>}
                    {j.tags && <p className="text-xs text-muted-foreground/70">#{j.tags}</p>}
                  </div>
                ))}
              </Section>
            )}

            {/* Coaching Sessions */}
            {d.coachingSessions?.length > 0 && (
              <Section title={ar ? `جلسات التدريب (${d.coachingSessions.length})` : `Coaching Sessions (${d.coachingSessions.length})`} icon={Dumbbell} color="bg-indigo-500">
                {[...d.coachingSessions].reverse().map((s: any) => (
                  <div key={s.id} className="glass-card px-3 py-2 text-sm flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{s.title}</p>
                      {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                      {s.scheduledAt && <p className="text-xs text-muted-foreground mt-0.5">{fmtTime(s.scheduledAt)}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${s.status === "completed" ? "bg-green-500/20 text-green-600" : s.status === "cancelled" ? "bg-red-500/20 text-red-600" : "bg-blue-500/20 text-blue-600"}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </Section>
            )}

            {/* AI Chat Messages */}
            {d.messages?.length > 0 && (
              <Section title={ar ? `محادثات AI (${d.messages.length})` : `AI Conversations (${d.messages.length})`} icon={MessageSquare} color="bg-green-500">
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {[...d.messages].reverse().slice(0, 20).map((m: any) => (
                    <div key={m.id} className={`text-xs px-3 py-1.5 rounded-lg ${m.role === "user" ? "bg-primary/10 text-start" : "bg-muted/40"}`}>
                      <span className={`font-semibold me-2 ${m.role === "user" ? "text-primary" : "text-muted-foreground"}`}>{m.role === "user" ? (ar ? "المستخدم" : "User") : "AI"}:</span>
                      <span className="line-clamp-2">{m.content}</span>
                    </div>
                  ))}
                </div>
                {d.messages.length > 20 && <p className="text-xs text-muted-foreground text-center">+{d.messages.length - 20} {ar ? "رسالة أكثر" : "more messages"}</p>}
              </Section>
            )}

            {/* Emergency Contacts */}
            {d.emergencyContacts?.length > 0 && (
              <Section title={ar ? `جهات الطوارئ (${d.emergencyContacts.length})` : `Emergency Contacts (${d.emergencyContacts.length})`} icon={Phone} color="bg-red-500">
                {d.emergencyContacts.map((c: any) => (
                  <div key={c.id} className="glass-card px-3 py-2 text-sm flex items-center gap-3">
                    <Phone className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{c.name}</p>
                      {c.relationship && <p className="text-xs text-muted-foreground">{c.relationship}</p>}
                    </div>
                    <span className="text-sm font-mono">{c.countryCode || ""} {c.phone}</span>
                    {c.isPrimary && <span className="text-xs bg-red-500/20 text-red-600 px-2 py-0.5 rounded-full">{ar ? "رئيسي" : "Primary"}</span>}
                  </div>
                ))}
              </Section>
            )}

          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [msgTarget, setMsgTarget] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "messages" | "system">("users");
  const [sortBy, setSortBy] = useState<"createdAt" | "mealsCount" | "metricsCount">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [systemDraft, setSystemDraft] = useState<SystemControlDraft | null>(null);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const r = await fetch("/api/admin/stats", { credentials: "include" });
      if (!r.ok) throw new Error("Forbidden");
      return r.json();
    },
  });

  const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/users", { credentials: "include" });
      if (!r.ok) throw new Error("Forbidden");
      return r.json();
    },
  });

  // Exclude admin accounts from client list
  const usersList = allUsers.filter((u: any) => {
    const role = (u.role || (u.isAdmin ? "admin" : "patient")) as string;
    return role === "patient";
  });

  const { data: sentMessages = [] } = useQuery<AdminMessage[]>({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const r = await fetch("/api/admin/messages", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const { data: systemControl, isLoading: systemLoading, refetch: refetchSystem } = useQuery<SystemControlConfig>({
    queryKey: ["admin-system-control"],
    queryFn: async () => {
      const r = await fetch("/api/admin/system-control", { credentials: "include" });
      if (!r.ok) throw new Error("Forbidden");
      return r.json();
    },
  });

  useEffect(() => {
    if (!systemControl) return;
    const customSettingsText = JSON.stringify(systemControl.customSettings || {}, null, 2);
    setSystemDraft({
      ...systemControl,
      customSettingsText,
    });
  }, [systemControl]);

  const saveSystemMutation = useMutation({
    mutationFn: async () => {
      if (!systemDraft) {
        throw new Error("No system draft to save");
      }
      let parsedCustomSettings: Record<string, unknown> = {};
      try {
        parsedCustomSettings = JSON.parse(systemDraft.customSettingsText || "{}");
      } catch {
        throw new Error(language === "ar" ? "صيغة JSON غير صحيحة في الإعدادات المخصصة" : "Invalid custom settings JSON");
      }

      const payload: SystemControlConfig = {
        updatedAt: systemDraft.updatedAt,
        branding: systemDraft.branding,
        uiLabels: systemDraft.uiLabels,
        roleCapabilities: systemDraft.roleCapabilities,
        customSettings: parsedCustomSettings,
      };

      const response = await fetch("/api/admin/system-control", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to update system control");
      }

      return response.json() as Promise<SystemControlConfig>;
    },
    onSuccess: (saved) => {
      const customSettingsText = JSON.stringify(saved.customSettings || {}, null, 2);
      setSystemDraft({ ...saved, customSettingsText });
      qc.setQueryData(["admin-system-control"], saved);
      toast({
        title: language === "ar" ? "تم حفظ إعدادات النظام" : "System settings saved",
        description: language === "ar" ? "تم تحديث الصلاحيات والأسماء والواجهة بنجاح" : "Permissions, labels, and UI settings were updated successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل تحديث النظام" : "System update failed",
        description: error instanceof Error ? error.message : (language === "ar" ? "حدث خطأ غير متوقع" : "Unexpected error"),
      });
    },
  });

  const unreadCount = sentMessages.filter((m) => !m.isRead).length;

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: (_, id) => {
      qc.setQueryData(["admin-users"], (old: AdminUser[]) => (old ?? []).filter((u) => u.id !== id));
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: language === "ar" ? "تم حذف العميل" : "Client deleted" });
    },
  });

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
  };

  const filtered = usersList
    .filter((u) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let va: any = a[sortBy], vb: any = b[sortBy];
      if (sortBy === "createdAt") { va = new Date(va).getTime(); vb = new Date(vb).getTime(); }
      return sortDir === "asc" ? va - vb : vb - va;
    });

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null;

  const selectedUser = selectedUserId ? allUsers.find((u) => u.id === selectedUserId) || null : null;

  const setBrandingField = (field: keyof SystemControlConfig["branding"], value: string) => {
    if (!systemDraft) return;
    setSystemDraft({
      ...systemDraft,
      branding: {
        ...systemDraft.branding,
        [field]: value,
      },
    });
  };

  const setUiLabelField = (field: keyof SystemControlConfig["uiLabels"], value: string) => {
    if (!systemDraft) return;
    setSystemDraft({
      ...systemDraft,
      uiLabels: {
        ...systemDraft.uiLabels,
        [field]: value,
      },
    });
  };

  const setRoleCapabilityField = (
    role: keyof SystemControlConfig["roleCapabilities"],
    field: keyof RoleCapabilityDraft,
    value: boolean,
  ) => {
    if (!systemDraft) return;
    setSystemDraft({
      ...systemDraft,
      roleCapabilities: {
        ...systemDraft.roleCapabilities,
        [role]: {
          ...systemDraft.roleCapabilities[role],
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">
              {language === "ar"
                ? (systemDraft?.uiLabels.adminHeaderAr || "لوحة تحكم المشرف")
                : (systemDraft?.uiLabels.adminHeaderEn || "Admin Dashboard")}
            </h1>
            <p className="text-xs text-muted-foreground">{systemDraft?.branding.appNameEn || "Nutri-Intel"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={() => setLocation("/admin/customization")}>
            <SlidersHorizontal className="w-4 h-4 me-1.5" />
            {language === "ar" ? "تخصيص العملاء" : "Client Customization"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setLocation("/admin/practitioners")}>
            <Stethoscope className="w-4 h-4 me-1.5" />
            {language === "ar" ? "إدارة الممارسين" : "Practitioners"}
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span>{user?.firstName || user?.username}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => { logout(); setLocation("/login"); }}>
            <LogOut className="w-4 h-4 me-1.5" />
            {language === "ar" ? "خروج" : "Logout"}
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <div key={i} className="glass-card p-5 h-20 animate-pulse bg-muted/20" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label={language === "ar" ? "إجمالي العملاء" : "Total Clients"} value={usersList.length} sub={stats.newUsersToday > 0 ? `+${stats.newUsersToday} ${language === "ar" ? "اليوم" : "today"}` : undefined} color="bg-primary" />
            <StatCard icon={Utensils} label={language === "ar" ? "وجبات مسجلة" : "Meals Logged"} value={stats.totalMeals} color="bg-orange-500" />
            <StatCard icon={BarChart3} label={language === "ar" ? "مقاييس صحية" : "Health Metrics"} value={stats.totalHealthMetrics} color="bg-blue-500" />
            <StatCard icon={MessageSquare} label={language === "ar" ? "رسائل AI" : "AI Messages"} value={stats.totalChatMessages} color="bg-green-500" />
            <StatCard icon={Pill} label={language === "ar" ? "أدوية مسجلة" : "Medications"} value={stats.totalMedications} color="bg-purple-500" />
            <StatCard icon={Phone} label={language === "ar" ? "جهات طوارئ" : "Emergency Contacts"} value={stats.totalEmergencyContacts} color="bg-red-500" />
            <StatCard icon={TrendingUp} label={language === "ar" ? "معدل النشاط" : "Activity Rate"} value={usersList.length > 0 ? `${Math.round((stats.totalMeals / usersList.length) * 10) / 10}` : 0} sub={language === "ar" ? "وجبة/عميل" : "meals/client"} color="bg-teal-500" />
            <StatCard icon={Bell} label={language === "ar" ? "رسائل الأدمن" : "Admin Messages"} value={sentMessages.length} sub={unreadCount > 0 ? `${unreadCount} ${language === "ar" ? "لم تُقرأ" : "unread"}` : undefined} color="bg-yellow-500" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/30 rounded-xl w-fit">
          {([
            { key: "users", label: language === "ar" ? `العملاء (${usersList.length})` : `Clients (${usersList.length})`, icon: Users },
            { key: "messages", label: language === "ar" ? `الرسائل (${sentMessages.length})` : `Messages (${sentMessages.length})`, icon: Send },
            { key: "system", label: language === "ar" ? "تحكم السيستم" : "System Control", icon: Settings2 },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {language === "ar" ? "قائمة العملاء" : "Client List"}
              </h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input className="ps-9 h-9 text-sm" placeholder={language === "ar" ? "ابحث..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Button size="sm" variant="outline" onClick={() => { refetchStats(); refetchUsers(); }}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {usersLoading ? (
              <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                      <th className="text-start px-4 py-3 font-medium">{language === "ar" ? "العميل" : "Client"}</th>
                      <th className="text-center px-3 py-3 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("mealsCount")}>
                        <span className="flex items-center justify-center gap-1"><Utensils className="w-3.5 h-3.5" />{language === "ar" ? "وجبات" : "Meals"}<SortIcon col="mealsCount" /></span>
                      </th>
                      <th className="text-center px-3 py-3 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("metricsCount")}>
                        <span className="flex items-center justify-center gap-1"><Activity className="w-3.5 h-3.5" />{language === "ar" ? "مقاييس" : "Metrics"}<SortIcon col="metricsCount" /></span>
                      </th>
                      <th className="text-center px-3 py-3 font-medium hidden md:table-cell">
                        <span className="flex items-center justify-center gap-1"><Pill className="w-3.5 h-3.5" />{language === "ar" ? "أدوية" : "Meds"}</span>
                      </th>
                      <th className="text-center px-3 py-3 font-medium hidden md:table-cell">
                        <span className="flex items-center justify-center gap-1"><MessageSquare className="w-3.5 h-3.5" />AI</span>
                      </th>
                      <th className="text-center px-3 py-3 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("createdAt")}>
                        <span className="flex items-center justify-center gap-1">{language === "ar" ? "تسجيل" : "Joined"}<SortIcon col="createdAt" /></span>
                      </th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                              {(u.firstName?.[0] || u.username[0]).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.username}</p>
                              <p className="text-xs text-muted-foreground">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center"><span className={`font-medium ${u.mealsCount > 0 ? "text-orange-500" : "text-muted-foreground"}`}>{u.mealsCount}</span></td>
                        <td className="px-3 py-3 text-center"><span className={`font-medium ${u.metricsCount > 0 ? "text-blue-500" : "text-muted-foreground"}`}>{u.metricsCount}</span></td>
                        <td className="px-3 py-3 text-center hidden md:table-cell"><span className={`font-medium ${u.medsCount > 0 ? "text-purple-500" : "text-muted-foreground"}`}>{u.medsCount}</span></td>
                        <td className="px-3 py-3 text-center hidden md:table-cell"><span className={`font-medium ${u.messagesCount > 0 ? "text-green-500" : "text-muted-foreground"}`}>{u.messagesCount}</span></td>
                        <td className="px-3 py-3 text-center text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setSelectedUserId(u.id)} className="p-1.5 hover:bg-primary/10 rounded-lg transition text-primary" title={language === "ar" ? "عرض التفاصيل" : "View details"}>
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => setMsgTarget(u)} className="p-1.5 hover:bg-green-500/10 rounded-lg transition text-green-500" title={language === "ar" ? "إرسال رسالة" : "Send message"}>
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm(language === "ar" ? `حذف ${u.username}؟` : `Delete ${u.username}?`)) deleteUser.mutate(u.id); }}
                              title={language === "ar" ? "حذف المستخدم" : "Delete user"}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg transition text-red-500"
                              disabled={deleteUser.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                        {language === "ar" ? "لا يوجد عملاء بعد" : "No clients yet"}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                {language === "ar" ? "الرسائل المرسلة" : "Sent Messages"}
              </h2>
            </div>
            <SentMessagesPanel users={usersList} language={language} />
          </div>
        )}

        {activeTab === "system" && (
          <div className="space-y-4">
            <div className="glass-card p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" />
                  {language === "ar" ? "مركز تحكم السيستم" : "System Control Center"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "ar"
                    ? "تحكم في أسماء النظام وصلاحيات كل دور (أدمن/دكتور/كوتش/مريض) وإعدادات مخصصة عامة."
                    : "Manage labels, role capabilities (admin/doctor/coach/patient), and global custom settings."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => refetchSystem()}>
                  <RefreshCw className="w-4 h-4 me-1.5" />
                  {language === "ar" ? "تحديث" : "Refresh"}
                </Button>
                <Button size="sm" onClick={() => saveSystemMutation.mutate()} disabled={!systemDraft || saveSystemMutation.isPending}>
                  {saveSystemMutation.isPending ? <RefreshCw className="w-4 h-4 me-1.5 animate-spin" /> : <SlidersHorizontal className="w-4 h-4 me-1.5" />}
                  {language === "ar" ? "حفظ الإعدادات" : "Save Settings"}
                </Button>
              </div>
            </div>

            {systemLoading || !systemDraft ? (
              <div className="glass-card p-8 flex justify-center"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="glass-card p-4 space-y-3">
                    <h3 className="font-semibold">{language === "ar" ? "الهوية والأسماء" : "Branding and Names"}</h3>
                    <Input value={systemDraft.branding.appNameEn} onChange={(e) => setBrandingField("appNameEn", e.target.value)} placeholder="App Name (EN)" />
                    <Input value={systemDraft.branding.appNameAr} onChange={(e) => setBrandingField("appNameAr", e.target.value)} placeholder="اسم التطبيق (AR)" />
                    <Input value={systemDraft.branding.doctorLabelEn} onChange={(e) => setBrandingField("doctorLabelEn", e.target.value)} placeholder="Doctor Label (EN)" />
                    <Input value={systemDraft.branding.doctorLabelAr} onChange={(e) => setBrandingField("doctorLabelAr", e.target.value)} placeholder="اسم الطبيب (AR)" />
                    <Input value={systemDraft.branding.coachLabelEn} onChange={(e) => setBrandingField("coachLabelEn", e.target.value)} placeholder="Coach Label (EN)" />
                    <Input value={systemDraft.branding.coachLabelAr} onChange={(e) => setBrandingField("coachLabelAr", e.target.value)} placeholder="اسم الكوتش (AR)" />
                    <Input value={systemDraft.branding.patientLabelEn} onChange={(e) => setBrandingField("patientLabelEn", e.target.value)} placeholder="Patient Label (EN)" />
                    <Input value={systemDraft.branding.patientLabelAr} onChange={(e) => setBrandingField("patientLabelAr", e.target.value)} placeholder="اسم المريض (AR)" />
                  </div>

                  <div className="glass-card p-4 space-y-3">
                    <h3 className="font-semibold">{language === "ar" ? "عناوين الواجهات" : "Interface Labels"}</h3>
                    <Input value={systemDraft.uiLabels.adminHeaderEn} onChange={(e) => setUiLabelField("adminHeaderEn", e.target.value)} placeholder="Admin Header (EN)" />
                    <Input value={systemDraft.uiLabels.adminHeaderAr} onChange={(e) => setUiLabelField("adminHeaderAr", e.target.value)} placeholder="عنوان الأدمن (AR)" />
                    <Input value={systemDraft.uiLabels.practitionerHeaderEn} onChange={(e) => setUiLabelField("practitionerHeaderEn", e.target.value)} placeholder="Practitioner Header (EN)" />
                    <Input value={systemDraft.uiLabels.practitionerHeaderAr} onChange={(e) => setUiLabelField("practitionerHeaderAr", e.target.value)} placeholder="عنوان الطبيب/الكوتش (AR)" />
                  </div>
                </div>

                <div className="glass-card p-4 space-y-3">
                  <h3 className="font-semibold">{language === "ar" ? "صلاحيات الأنظمة الثلاثة" : "Role Capabilities"}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-start py-2">{language === "ar" ? "الدور" : "Role"}</th>
                          <th className="text-center py-2">{language === "ar" ? "بحث بأي Patient ID" : "Search any patient"}</th>
                          <th className="text-center py-2">{language === "ar" ? "تخصيص المعادلات للمريض" : "Customize patient formulas"}</th>
                          <th className="text-center py-2">{language === "ar" ? "الوصول للداشبورد" : "Dashboard access"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Object.keys(systemDraft.roleCapabilities) as Array<keyof SystemControlConfig["roleCapabilities"]>).map((roleKey) => {
                          const row = systemDraft.roleCapabilities[roleKey];
                          return (
                            <tr key={roleKey} className="border-b border-border/50 last:border-0">
                              <td className="py-2 font-medium">{roleKey}</td>
                              <td className="py-2 text-center">
                                <input type="checkbox" title="Toggle patient search permission" checked={Boolean(row.canSearchAnyPatientById)} onChange={(e) => setRoleCapabilityField(roleKey, "canSearchAnyPatientById", e.target.checked)} />
                              </td>
                              <td className="py-2 text-center">
                                <input type="checkbox" title="Toggle formula customization permission" checked={Boolean(row.canCustomizePatientFormulas)} onChange={(e) => setRoleCapabilityField(roleKey, "canCustomizePatientFormulas", e.target.checked)} />
                              </td>
                              <td className="py-2 text-center">
                                <input type="checkbox" title="Toggle dashboard access" checked={Boolean(row.canAccessRoleDashboard)} onChange={(e) => setRoleCapabilityField(roleKey, "canAccessRoleDashboard", e.target.checked)} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-card p-4 space-y-2">
                  <h3 className="font-semibold">{language === "ar" ? "إعدادات مخصصة (JSON)" : "Custom Settings (JSON)"}</h3>
                  <textarea
                    className="w-full min-h-[180px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
                    value={systemDraft.customSettingsText}
                    onChange={(e) => setSystemDraft({ ...systemDraft, customSettingsText: e.target.value })}
                    placeholder={language === "ar" ? "أدخل JSON صالح" : "Enter valid JSON"}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUserId && selectedUser && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onSendMessage={() => { setMsgTarget(selectedUser); setSelectedUserId(null); }}
          language={language}
        />
      )}

      {/* Send Message Modal */}
      {msgTarget && (
        <SendMessageModal
          user={msgTarget}
          onClose={() => setMsgTarget(null)}
          language={language}
        />
      )}
    </div>
  );
}
