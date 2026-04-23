import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, AlertCircle, Plus, X, Loader2, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { downloadPDF } from "@/lib/actions";
import { useHealthMetrics, useCreateHealthMetric } from "@/hooks/useHealth";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { useQueries } from "@tanstack/react-query";
import { getLast7Days } from "@/lib/dateUtils";

function getUnit(type: string): string {
  const units: Record<string, string> = {
    "Blood Glucose": "mg/dL",
    "Blood Pressure": "mmHg",
    "Heart Rate": "bpm",
    "Temperature": "°F",
    "Weight": "kg",
    "Sleep": "hrs",
  };
  return units[type] || "";
}

type ApiReading = {
  id: string;
  type: string;
  value: string;
  unit?: string;
  date: string | Date;
  notes?: string;
  createdAt: string | Date;
};

function checkWarning(readings: ApiReading[], language: string): { message: string; detail: string } | null {
  if (readings.length === 0) return null;

  const glucoseReadings = readings.filter((r) => r.type === "Blood Glucose");
  const highGlucose = glucoseReadings.filter((r) => parseFloat(r.value) > 140);
  if (highGlucose.length >= 2) {
    return {
      message: language === "ar" ? "ارتفاع متكرر في سكر الدم" : "Repeated High Blood Glucose",
      detail:
        language === "ar"
          ? `${highGlucose.length} قراءات أعلى من 140 mg/dL - يرجى استشارة طبيبك`
          : `${highGlucose.length} readings above 140 mg/dL - please consult your doctor`,
    };
  }

  const bpReadings = readings.filter((r) => r.type === "Blood Pressure");
  // AHA 2017: Stage 1 hypertension >= 130/80
  const highBP = bpReadings.filter((r) => parseInt(r.value) >= 130);
  if (highBP.length >= 2) {
    return {
      message: language === "ar" ? "ارتفاع في ضغط الدم (AHA 2017)" : "Elevated Blood Pressure (AHA 2017)",
      detail:
        language === "ar"
          ? `${highBP.length} قراءات >= 130 mmHg - المعيار الطبيعي <120/80`
          : `${highBP.length} readings >= 130 mmHg - normal is <120/80 (AHA 2017)`,
    };
  }

  const hrReadings = readings.filter((r) => r.type === "Heart Rate");
  const highHR = hrReadings.filter((r) => parseFloat(r.value) > 100);
  if (highHR.length >= 2) {
    return {
      message: language === "ar" ? "معدل ضربات قلب مرتفع" : "Elevated Heart Rate",
      detail: language === "ar" ? "لوحظ ارتفاع متكرر - احرص على الراحة" : "Repeated elevation detected - ensure adequate rest",
    };
  }

  return null;
}

export default function HealthMonitoring() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReading, setNewReading] = useState({ type: "Blood Glucose", value: "", unit: "mg/dL" });
  const addFormRef = useRef<HTMLDivElement>(null);

  // Fetch all readings without a date filter.
  const { data: rawMetrics = [], isLoading } = useHealthMetrics();
  const createMetric = useCreateHealthMetric();

  const last7Days = getLast7Days();
  const trendQueries = useQueries({
    queries: last7Days.map((date) => ({
      queryKey: ["health-metrics", date],
      queryFn: async () => {
        const r = await fetch(`/api/health/metrics?date=${encodeURIComponent(date)}`, { credentials: "include" });
        return r.ok ? r.json() : [];
      },
    })),
  });

  const trendData = last7Days.map((date, i) => {
    const dayReadings: ApiReading[] = ((trendQueries[i]?.data as any[]) || []).map((m: any) => ({
      id: m.id,
      type: m.type || "general",
      value: String(m.value ?? ""),
      unit: m.unit,
      date: m.date ?? m.createdAt,
      notes: m.notes,
      createdAt: m.createdAt,
    }));

    const bp = dayReadings.find((r) => r.type === "Blood Pressure");
    const sleep = dayReadings.find((r) => r.type === "Sleep");
    const label = new Date(date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { weekday: "short" });

    return {
      date: label,
      systolic: bp ? parseInt(bp.value) : null,
      sleep: sleep ? parseFloat(sleep.value) : null,
    };
  });

  const readings: ApiReading[] = rawMetrics.map((m: any) => ({
    id: m.id,
    type: m.type || "general",
    value: String(m.value ?? ""),
    unit: m.unit ?? getUnit(m.type),
    date: m.date ?? m.createdAt,
    notes: m.notes,
    createdAt: m.createdAt,
  }));

  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      addFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddForm]);

  const warning = checkWarning(readings, language);

  const vitalTypes = ["Blood Glucose", "Blood Pressure", "Heart Rate", "Temperature", "Sleep"];
  const vitalIcons: Record<string, string> = {
    "Blood Glucose": "🩸",
    "Blood Pressure": "❤️",
    "Heart Rate": "💓",
    "Temperature": "🌡️",
    "Sleep": "🌙",
  };
  const vitalNormals: Record<string, string> = {
    "Blood Glucose": "70-100",
    "Blood Pressure": "<120/80",
    "Heart Rate": "60-100",
    "Temperature": "98.6",
    "Sleep": "7-9 hrs",
  };
  const vitalNamesAr: Record<string, string> = {
    "Blood Glucose": "سكر الدم",
    "Blood Pressure": "ضغط الدم",
    "Heart Rate": "معدل ضربات القلب",
    "Temperature": "درجة الحرارة",
    "Weight": "الوزن",
    "Sleep": "النوم",
  };

  const latestVitals = vitalTypes.map((type) => {
    const latest = readings.find((r) => r.type === type);
    return { type, value: latest ? latest.value : "--", unit: getUnit(type), icon: vitalIcons[type], normal: vitalNormals[type] };
  });

  const addReading = async () => {
    if (!newReading.value.trim()) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى إدخال القيمة" : "Please enter a value",
      });
      return;
    }

    await createMetric.mutateAsync({
      type: newReading.type,
      value: newReading.value,
      unit: newReading.unit,
      date: new Date(),
    } as any);

    setNewReading({ type: "Blood Glucose", value: "", unit: "mg/dL" });
    setShowAddForm(false);

    toast({
      title: language === "ar" ? "تمت الإضافة" : "Added",
      description: language === "ar" ? "تمت إضافة القراءة بنجاح" : "Reading added successfully",
    });
  };

  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(date);
    }
  };

  const handleDownload = () => {
    if (readings.length === 0) {
      toast({
        title: language === "ar" ? "لا توجد بيانات" : "No Data",
        description: language === "ar" ? "أضف قراءات أولًا" : "Add readings first",
      });
      return;
    }

    const sections = [
      {
        heading: language === "ar" ? "أحدث المؤشرات الحيوية" : "Latest Vitals",
        content: latestVitals
          .map((v) => `${language === "ar" ? vitalNamesAr[v.type] || v.type : v.type}: ${v.value} ${v.unit} (${language === "ar" ? "الطبيعي" : "Normal"}: ${v.normal})`)
          .join("\n"),
      },
      {
        heading: language === "ar" ? "جميع القراءات" : "All Readings",
        content: readings.map((r) => `[${formatDate(r.date)}] ${language === "ar" ? vitalNamesAr[r.type] || r.type : r.type}: ${r.value} ${r.unit}`).join("\n"),
      },
    ];

    if (warning) {
      sections.unshift({
        heading: language === "ar" ? "تحذير" : "Warning",
        content: `${warning.message}\n${warning.detail}`,
      });
    }

    downloadPDF("health-readings.pdf", language === "ar" ? "تقرير مراقبة الصحة" : "Health Monitoring Report", sections);
    toast({
      title: language === "ar" ? "تم التنزيل" : "Downloaded",
      description: language === "ar" ? "تم تنزيل تقرير القراءات الصحية" : "Health report downloaded as PDF",
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">{t("healthMonitoringTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("recentReadings")}</p>
      </div>

      {warning && (
        <div className="glass-card p-4 border-s-4 border-amber-500 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{warning.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{warning.detail}</p>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div ref={addFormRef} className="glass-card p-6 border-s-4 border-blue-500 bg-blue-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{language === "ar" ? "إضافة قراءة جديدة" : "Add New Reading"}</h2>
            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-white/10 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            <select
              className="w-full p-2 border border-muted rounded bg-transparent text-sm"
              value={newReading.type}
              onChange={(e) => {
                const type = e.target.value;
                setNewReading({ ...newReading, type, unit: getUnit(type) });
              }}
            >
              <option value="Blood Glucose">{language === "ar" ? "سكر الدم" : "Blood Glucose"}</option>
              <option value="Blood Pressure">{language === "ar" ? "ضغط الدم" : "Blood Pressure"}</option>
              <option value="Heart Rate">{language === "ar" ? "معدل ضربات القلب" : "Heart Rate"}</option>
              <option value="Temperature">{language === "ar" ? "درجة الحرارة" : "Temperature"}</option>
              <option value="Weight">{language === "ar" ? "الوزن" : "Weight"}</option>
              <option value="Sleep">{language === "ar" ? "ساعات النوم" : "Sleep Hours"}</option>
            </select>
            <Input
              placeholder={language === "ar" ? "القيمة" : "Value"}
              value={newReading.value}
              onChange={(e) => setNewReading({ ...newReading, value: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {language === "ar" ? "الوحدة" : "Unit"}: {newReading.unit}
            </p>
            <Button className="w-full" onClick={addReading} disabled={createMetric.isPending}>
              {createMetric.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {language === "ar" ? "إضافة القراءة" : "Add Reading"}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-6 animate-pulse space-y-3">
                <div className="w-8 h-8 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-8 bg-muted rounded w-16" />
                <div className="h-1 bg-muted rounded-full" />
              </div>
            ))
          : latestVitals.map((vital) => (
              <div key={vital.type} className="glass-card p-6 relative overflow-hidden group">
                <div className="text-2xl mb-2">{vital.icon}</div>
                <p className="text-sm text-muted-foreground mb-3">{language === "ar" ? vitalNamesAr[vital.type] : vital.type}</p>
                <div className="mb-2">
                  <p className="text-3xl font-bold">{vital.value}</p>
                  <p className="text-xs text-muted-foreground">{vital.unit}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{t("normal")}: {vital.normal}</p>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full w-full ${vital.value === "--" ? "bg-muted" : "bg-gradient-to-r from-green-500 to-cyan-500"}`} />
                </div>
              </div>
            ))}
      </div>

      {trendData.some((d) => d.systolic !== null) && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">❤️</span>
            <h2 className="text-lg font-bold">{language === "ar" ? "اتجاه ضغط الدم (7 أيام)" : "Blood Pressure Trend (7 days)"}</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="bpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 180]} tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || payload[0].value == null) return null;
                  const val = payload[0].value as number;
                  const stage =
                    val >= 140
                      ? language === "ar"
                        ? "ارتفاع شديد"
                        : "Stage 2 HTN"
                      : val >= 130
                        ? language === "ar"
                          ? "ارتفاع"
                          : "Stage 1 HTN"
                        : val >= 120
                          ? language === "ar"
                            ? "مرتفع حدّي"
                            : "Elevated"
                          : language === "ar"
                            ? "طبيعي"
                            : "Normal";

                  return (
                    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
                      <p className="text-muted-foreground mb-1">{label}</p>
                      <p className="font-bold">
                        {val} mmHg - <span className={val >= 130 ? "text-red-500" : "text-green-500"}>{stage}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="4 2" label={{ value: language === "ar" ? "طبيعي 120" : "Normal 120", position: "right", fontSize: 10, fill: "#22c55e" }} />
              <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: language === "ar" ? "مرتفع 130" : "Elevated 130", position: "right", fontSize: 10, fill: "#f59e0b" }} />
              <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="4 2" label={{ value: "HTN2 140", position: "right", fontSize: 10, fill: "#ef4444" }} />
              <Area type="monotone" dataKey="systolic" stroke="#ef4444" fill="url(#bpGrad)" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-2">{language === "ar" ? "الحدود وفق معايير AHA 2017" : "Thresholds per AHA 2017 guidelines"}</p>
        </div>
      )}

      {trendData.some((d) => d.sleep !== null) && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold">{language === "ar" ? "اتجاه النوم (7 أيام)" : "Sleep Trend (7 days)"}</h2>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || payload[0].value == null) return null;
                  const val = payload[0].value as number;
                  const ok = val >= 7 && val <= 9;

                  return (
                    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
                      <p className="text-muted-foreground mb-1">{label}</p>
                      <p className={`font-bold ${ok ? "text-green-500" : "text-amber-500"}`}>
                        {val}h - {ok ? (language === "ar" ? "مثالي" : "Ideal") : language === "ar" ? "خارج النطاق" : "Off target"}
                      </p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={7} stroke="#22c55e" strokeDasharray="4 2" />
              <ReferenceLine y={9} stroke="#22c55e" strokeDasharray="4 2" label={{ value: language === "ar" ? "7-9 ساعة" : "7-9h ideal", position: "right", fontSize: 10, fill: "#22c55e" }} />
              <Area type="monotone" dataKey="sleep" stroke="#6366f1" fill="url(#sleepGrad)" strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4">{t("recentReadings")}</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : readings.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {readings.map((reading) => (
              <div key={reading.id} className="flex items-center justify-between p-2 rounded hover:bg-white/10 transition-colors">
                <div>
                  <p className="text-sm font-medium">{language === "ar" ? vitalNamesAr[reading.type] || reading.type : reading.type}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(reading.date)}</p>
                </div>
                <p className="font-bold text-primary">
                  {reading.value} {reading.unit}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">{language === "ar" ? "لا توجد قراءات بعد" : "No readings yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">{language === "ar" ? "أضف قراءة جديدة للبدء" : "Add a new reading to get started"}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button className="flex-1" onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 me-2" />
          {t("addReading")}
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleDownload}>
          {t("download")} PDF
        </Button>
      </div>
    </div>
  );
}
