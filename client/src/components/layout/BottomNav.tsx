import { Home, Utensils, Heart, MessageSquare, User } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";

const navItems = [
  { path: "/", icon: Home, labelEn: "Home", labelAr: "الرئيسية" },
  { path: "/meal-planner", icon: Utensils, labelEn: "Meals", labelAr: "الوجبات" },
  { path: "/health", icon: Heart, labelEn: "Health", labelAr: "الصحة" },
  { path: "/ai-assistant", icon: MessageSquare, labelEn: "AI", labelAr: "مساعد" },
  { path: "/profile", icon: User, labelEn: "Profile", labelAr: "ملفي" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const { language } = useLanguage();

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-40 lg:hidden glass border-t border-white/20 dark:border-white/10">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, icon: Icon, labelEn, labelAr }) => {
          const active = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-0 ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium truncate">
                {language === "ar" ? labelAr : labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
