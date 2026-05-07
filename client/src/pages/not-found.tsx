import { useLanguage } from "@/hooks/use-language";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="text-4xl font-bold mb-3">404</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {language === "ar" ? "الصفحة غير موجودة" : "Page Not Found"}
      </p>
      <Link href="/">
        <Button>
          <Home className="w-4 h-4 me-2" />
          {t("dashboard")}
        </Button>
      </Link>
    </div>
  );
}
