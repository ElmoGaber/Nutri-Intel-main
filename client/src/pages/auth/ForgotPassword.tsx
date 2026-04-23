import { useLanguage } from "@/hooks/use-language";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";

export default function ForgotPassword() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || (language === "ar" ? "حدث خطأ" : "An error occurred"));
      } else {
        setSent(true);
      }
    } catch {
      setError(language === "ar" ? "تعذر الاتصال بالخادم" : "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pb-20 animate-in fade-in">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">Nutri-Intel</h1>
          <p className="text-muted-foreground">{t("passwordReset")}</p>
        </div>

        {!sent ? (
          <div className="glass-card p-8 space-y-6">
            <p className="text-sm text-muted-foreground">{t("enterEmailDesc")}</p>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                {t("email")}
              </label>
              <Input
                type="email"
                placeholder={t("email")}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!email.trim() || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {t("send")}
            </Button>

            <button onClick={() => setLocation("/login")} className="flex items-center justify-center gap-2 text-sm text-primary hover:underline w-full">
              <ArrowLeft className="w-4 h-4" />
              {t("backToLogin")}
            </button>
          </div>
        ) : (
          <div className="glass-card p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {language === "ar" ? "تم إرسال رابط إعادة التعيين" : "Reset Link Sent"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {language === "ar"
                  ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}. تحقق من بريدك الإلكتروني.`
                  : `A password reset link has been sent to ${email}. Check your inbox.`}
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={() => setLocation("/login")}>
              {t("backToLogin")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
