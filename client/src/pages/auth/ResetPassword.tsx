import { useLanguage } from "@/hooks/use-language";
import { Lock, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";

export default function ResetPassword() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError(language === "ar" ? "رابط إعادة التعيين غير صالح" : "Invalid reset link");
  }, [token, language]);

  const handleSubmit = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError(language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || (language === "ar" ? "فشل إعادة التعيين" : "Reset failed"));
      } else {
        setSuccess(true);
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
          <p className="text-muted-foreground">
            {language === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
          </p>
        </div>

        {success ? (
          <div className="glass-card p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {language === "ar" ? "تم تغيير كلمة المرور" : "Password Changed"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {language === "ar"
                  ? "تم تغيير كلمة مرورك بنجاح. يمكنك الآن تسجيل الدخول."
                  : "Your password has been changed. You can now log in."}
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={() => setLocation("/login")}>
              {language === "ar" ? "تسجيل الدخول" : "Log In"}
            </Button>
          </div>
        ) : (
          <div className="glass-card p-8 space-y-6">
            {!token ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-red-500">{error}</p>
                <Button variant="outline" onClick={() => setLocation("/forgot-password")}>
                  {language === "ar" ? "طلب رابط جديد" : "Request New Link"}
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter your new password"}
                </p>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4" />
                    {language === "ar" ? "كلمة المرور الجديدة" : "New Password"}
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4" />
                    {language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!newPassword || !confirmPassword || loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                  {language === "ar" ? "تعيين كلمة المرور" : "Set Password"}
                </Button>
                <button onClick={() => setLocation("/login")} className="flex items-center justify-center gap-2 text-sm text-primary hover:underline w-full">
                  <ArrowLeft className="w-4 h-4" />
                  {language === "ar" ? "العودة لتسجيل الدخول" : "Back to Login"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
