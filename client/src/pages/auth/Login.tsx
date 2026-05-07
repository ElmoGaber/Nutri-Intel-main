import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { t, language } = useLanguage();
  const { login, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError(t("errorOccurred"));
      return;
    }

    try {
      setIsSubmitting(true);
      await login(username, password);
      setLocation("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("registrationFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pb-20 animate-in fade-in">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">Nutri-Intel</h1>
          <p className="text-muted-foreground">{t("loginTitle")}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="glass-card p-4 bg-red-500/5 border-s-4 border-red-500 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="glass-card p-8 space-y-6">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4" />
              {t("username")} / {t("email")}
            </label>
            <Input
              type="text"
              placeholder={t("username")}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" />
              {t("password")}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("password")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                disabled={isSubmitting || isLoading}
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting || isLoading}
                className="w-4 h-4 rounded border border-muted"
              />
              <span className="text-sm">{t("rememberMe")}</span>
            </label>
            <button type="button" onClick={() => setLocation("/forgot-password")} className="text-sm text-primary hover:underline">
              {t("forgotPassword")}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {t("login")}
              </>
            ) : (
              t("login")
            )}
          </Button>

        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <button onClick={() => setLocation("/register")} className="text-primary hover:underline font-medium">
            {t("registerNow")}
          </button>
        </p>
      </div>
    </div>
  );
}

