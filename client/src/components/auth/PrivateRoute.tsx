import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/use-language";

interface PrivateRouteProps {
  component: React.ComponentType<Record<string, unknown>>;
  [key: string]: unknown;
}

export function PrivateRoute({ component: Component, ...rest }: PrivateRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">{t("loading")}</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Redirect to="/login" />;
  if (isAdmin) return <Redirect to="/admin" />;

  return <Component {...rest} />;
}
