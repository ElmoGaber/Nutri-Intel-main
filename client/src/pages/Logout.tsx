import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";

export default function Logout() {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
        setLocation("/login");
      } catch (error) {
        console.error("Logout error:", error);
        setLocation("/login");
      }
    };

    handleLogout();
  }, [logout, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">{t("loggingOut")}</p>
      </div>
    </div>
  );
}
