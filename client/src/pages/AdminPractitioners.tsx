import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus, Stethoscope, Dumbbell } from "lucide-react";

type Practitioner = {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "doctor" | "coach";
  createdAt?: string;
};

export default function AdminPractitioners() {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "doctor" as "doctor" | "coach",
  });
  const [error, setError] = useState("");

  const { data: practitioners = [], isLoading } = useQuery<Practitioner[]>({
    queryKey: ["admin-practitioners"],
    queryFn: async () => {
      const response = await fetch("/api/admin/practitioners", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to load practitioners");
      return response.json();
    },
  });

  const createPractitioner = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/practitioners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Failed to create practitioner");
      }

      return response.json();
    },
    onSuccess: () => {
      setError("");
      setForm({ username: "", password: "", email: "", firstName: "", lastName: "", role: "doctor" });
      qc.invalidateQueries({ queryKey: ["admin-practitioners"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create practitioner");
    },
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
          {language === "ar" ? "إدارة الأطباء والكوتشات" : "Practitioner Management"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "ar" ? "إضافة ومراجعة حسابات مقدمي الرعاية" : "Create and review care practitioner accounts"}
        </p>
      </div>

      <div className="glass-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          {language === "ar" ? "إضافة ممارس جديد" : "Add Practitioner"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder={language === "ar" ? "اسم المستخدم" : "Username"}
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
          />
          <Input
            type="password"
            placeholder={language === "ar" ? "كلمة المرور" : "Password"}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <Input
            placeholder={language === "ar" ? "البريد الإلكتروني" : "Email"}
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <select
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as "doctor" | "coach" }))}
            title={language === "ar" ? "دور الممارس" : "Practitioner role"}
            aria-label={language === "ar" ? "دور الممارس" : "Practitioner role"}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="doctor">{language === "ar" ? "دكتور" : "Doctor"}</option>
            <option value="coach">{language === "ar" ? "كوتش" : "Coach"}</option>
          </select>
          <Input
            placeholder={language === "ar" ? "الاسم الأول (اختياري)" : "First name (optional)"}
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
          />
          <Input
            placeholder={language === "ar" ? "الاسم الأخير (اختياري)" : "Last name (optional)"}
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={() => createPractitioner.mutate()}
          disabled={!form.username || !form.password || createPractitioner.isPending}
        >
          {createPractitioner.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <UserPlus className="w-4 h-4 me-2" />}
          {language === "ar" ? "إنشاء الحساب" : "Create Account"}
        </Button>
      </div>

      <div className="glass-card p-5">
        <h2 className="font-semibold mb-3">{language === "ar" ? "قائمة الممارسين" : "Practitioners"}</h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : practitioners.length === 0 ? (
          <p className="text-sm text-muted-foreground">{language === "ar" ? "لا يوجد ممارسون بعد" : "No practitioners yet"}</p>
        ) : (
          <div className="space-y-2">
            {practitioners.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">
                    {item.firstName || item.lastName
                      ? `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim()
                      : item.username}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.email}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                  {item.role === "doctor" ? <Stethoscope className="w-3.5 h-3.5" /> : <Dumbbell className="w-3.5 h-3.5" />}
                  {item.role === "doctor" ? (language === "ar" ? "دكتور" : "Doctor") : (language === "ar" ? "كوتش" : "Coach")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
