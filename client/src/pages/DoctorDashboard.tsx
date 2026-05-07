import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Search, UserRound, HeartPulse, Pill, CalendarClock, Activity, Loader2, AlertTriangle, SlidersHorizontal } from "lucide-react";

type PatientOverview = {
  id: string;
  clientId: string | null;
  username: string;
  firstName: string | null;
  lastName: string | null;
  age: number | null;
  bloodType: string | null;
  height: number | string | null;
  weight: number | string | null;
  bmi: number | null;
  activeGoalsCount: number;
  medicationsCount: number;
  sessionsCount: number;
  latestSession: {
    id: string;
    title: string;
    status: string;
    scheduledAt?: string;
  } | null;
  latestMetric: {
    type?: string;
    value?: string;
    unit?: string;
    date?: string;
  } | null;
};

type SystemControlCurrent = {
  role: "admin" | "doctor" | "coach" | "patient";
  roleCapabilities: {
    canSearchAnyPatientById: boolean;
    canCustomizePatientFormulas: boolean;
    canAccessRoleDashboard: boolean;
  };
  branding: {
    appNameEn: string;
    appNameAr: string;
  };
  uiLabels: {
    practitionerHeaderEn: string;
    practitionerHeaderAr: string;
  };
};

export default function DoctorDashboard() {
  const { language } = useLanguage();
  const { role } = useAuth();
  const [, setLocation] = useLocation();
  const [patientId, setPatientId] = useState("");
  const [result, setResult] = useState<PatientOverview | null>(null);
  const [searchError, setSearchError] = useState("");

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<any[]>({
    queryKey: ["coaching-sessions"],
    queryFn: async () => {
      const response = await fetch("/api/coaching/sessions", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: systemControl } = useQuery<SystemControlCurrent>({
    queryKey: ["system-control-current"],
    queryFn: async () => {
      const response = await fetch("/api/system-control/current", { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to load system control");
      }
      return response.json();
    },
    retry: 0,
  });

  const searchPatient = useMutation({
    mutationFn: async (lookup: string) => {
      const response = await fetch(`/api/patients/${encodeURIComponent(lookup)}/overview`, {
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Patient lookup failed");
      }

      return response.json() as Promise<PatientOverview>;
    },
    onSuccess: (data) => {
      setSearchError("");
      setResult(data);
    },
    onError: (error) => {
      setResult(null);
      setSearchError(error instanceof Error ? error.message : "Lookup failed");
    },
  });

  const isPractitioner = role === "doctor" || role === "coach";
  const canAccessRoleDashboard = systemControl?.roleCapabilities?.canAccessRoleDashboard ?? isPractitioner;
  const canSearchAnyPatient = systemControl?.roleCapabilities?.canSearchAnyPatientById ?? isPractitioner;
  const canCustomizePatientFormulas = systemControl?.roleCapabilities?.canCustomizePatientFormulas ?? isPractitioner;
  const upcomingSessions = sessions.filter((s: any) => s.status !== "completed");

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
          {language === "ar"
            ? (systemControl?.uiLabels?.practitionerHeaderAr || "لوحة الطبيب/الكوتش")
            : (systemControl?.uiLabels?.practitionerHeaderEn || "Practitioner Dashboard")}
        </h1>
        <p className="text-muted-foreground">
          {language === "ar"
            ? "مؤشرات مختصرة للمرضى والجلسات"
            : "Essential patient and session indicators"}
        </p>
      </div>

      {!isPractitioner && (
        <div className="glass-card p-5 border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {language === "ar"
              ? "هذه الصفحة مخصصة للأطباء والكوتشات."
              : "This page is intended for doctors and coaches."}
          </p>
        </div>
      )}

      {isPractitioner && !canAccessRoleDashboard && (
        <div className="glass-card p-5 border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {language === "ar"
              ? "تم إيقاف الوصول للوحة الطبيب/الكوتش لهذا الدور من إعدادات السيستم."
              : "Practitioner dashboard access is disabled for this role by system control settings."}
          </p>
        </div>
      )}

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            {language === "ar" ? "بحث بالمريض عبر Patient ID" : "Patient Search by Patient ID"}
          </h2>
          {isPractitioner && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setLocation("/doctor/customization")}
              disabled={!canCustomizePatientFormulas || !canAccessRoleDashboard}
            >
              <SlidersHorizontal className="w-4 h-4 me-1.5" />
              {language === "ar" ? "تخصيص معادلات العميل" : "Client Formula Control"}
            </Button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder={language === "ar" ? "اكتب Patient ID أو User ID" : "Enter Patient ID or User ID"}
          />
          <Button
            onClick={() => searchPatient.mutate(patientId.trim())}
            disabled={!patientId.trim() || searchPatient.isPending || !canSearchAnyPatient || !canAccessRoleDashboard}
            className="sm:w-44"
          >
            {searchPatient.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Search className="w-4 h-4 me-2" />}
            {language === "ar" ? "بحث" : "Search"}
          </Button>
        </div>
        {!canSearchAnyPatient && (
          <p className="text-sm text-amber-500">
            {language === "ar"
              ? "ميزة البحث عن أي مريض معطلة لهذا الدور من إعدادات الأدمن."
              : "Patient lookup is disabled for this role by admin system control."}
          </p>
        )}
        {!canCustomizePatientFormulas && (
          <p className="text-sm text-amber-500">
            {language === "ar"
              ? "ميزة تخصيص المعادلات للمريض معطلة لهذا الدور من إعدادات الأدمن."
              : "Client formula customization is disabled for this role by admin system control."}
          </p>
        )}
        {searchError && <p className="text-sm text-red-500">{searchError}</p>}
      </div>

      {result && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "المريض" : "Patient"}</p>
                <h3 className="text-xl font-bold">
                  {result.firstName || result.lastName
                    ? `${result.firstName ?? ""} ${result.lastName ?? ""}`.trim()
                    : result.username}
                </h3>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{language === "ar" ? "Patient ID" : "Patient ID"}: <span className="font-semibold text-foreground">{result.clientId ?? result.id}</span></p>
                <p>{language === "ar" ? "فصيلة الدم" : "Blood Type"}: <span className="font-semibold text-foreground">{result.bloodType || "-"}</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> BMI</p>
              <p className="text-3xl font-bold text-primary">{result.bmi ?? "-"}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Pill className="w-3.5 h-3.5" />{language === "ar" ? "الأدوية" : "Medications"}</p>
              <p className="text-3xl font-bold text-orange-500">{result.medicationsCount}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><UserRound className="w-3.5 h-3.5" />{language === "ar" ? "الأهداف النشطة" : "Active Goals"}</p>
              <p className="text-3xl font-bold text-green-500">{result.activeGoalsCount}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" />{language === "ar" ? "إجمالي الجلسات" : "Total Sessions"}</p>
              <p className="text-3xl font-bold text-blue-500">{result.sessionsCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-red-500" />
                {language === "ar" ? "آخر مؤشر صحي" : "Latest Health Indicator"}
              </h4>
              {result.latestMetric ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium capitalize">{result.latestMetric.type || "-"}</p>
                  <p className="text-muted-foreground">
                    {result.latestMetric.value || "-"} {result.latestMetric.unit || ""}
                  </p>
                  {result.latestMetric.date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(result.latestMetric.date).toLocaleString(language === "ar" ? "ar-EG" : "en-US")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{language === "ar" ? "لا توجد قراءات بعد" : "No metrics yet"}</p>
              )}
            </div>

            <div className="glass-card p-5">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-primary" />
                {language === "ar" ? "آخر جلسة" : "Latest Session"}
              </h4>
              {result.latestSession ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{result.latestSession.title}</p>
                  <p className="text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}: {result.latestSession.status}</p>
                  {result.latestSession.scheduledAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(result.latestSession.scheduledAt).toLocaleString(language === "ar" ? "ar-EG" : "en-US")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{language === "ar" ? "لا توجد جلسات بعد" : "No sessions yet"}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-5">
        <h2 className="font-semibold mb-3">{language === "ar" ? "جلساتي القادمة" : "My Upcoming Sessions"}</h2>
        {sessionsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : upcomingSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{language === "ar" ? "لا توجد جلسات قادمة" : "No upcoming sessions"}</p>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.slice(0, 5).map((session: any) => (
              <div key={session.id} className="rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.scheduledAt
                      ? new Date(session.scheduledAt).toLocaleString(language === "ar" ? "ar-EG" : "en-US")
                      : (language === "ar" ? "موعد غير محدد" : "No scheduled time")}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{session.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
