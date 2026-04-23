import { Menu, Search, Bell, Sun, Moon, Type, MessageSquare, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTheme } from "next-themes";
import { useFontSize } from "@/hooks/use-font-size";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SEARCH_PAGES = [
  { path: "/", keys: ["dashboard", "الرئيسية", "home"] },
  { path: "/nutrition", keys: ["nutrition", "تغذية", "calories", "سعرات"] },
  { path: "/meal-planner", keys: ["meal", "وجبة", "planner", "مخطط"] },
  { path: "/health", keys: ["health", "صحة", "monitoring", "مراقبة", "bp", "glucose"] },
  { path: "/medications", keys: ["medication", "دواء", "pill", "أدوية"] },
  { path: "/predictions", keys: ["prediction", "تنبؤ", "forecast", "توقع"] },
  { path: "/health-journal", keys: ["journal", "مذكرة", "diary", "يوميات"] },
  { path: "/emergency", keys: ["emergency", "طوارئ", "contact"] },
  { path: "/ai-assistant", keys: ["ai", "ذكاء", "assistant", "مساعد", "chat", "محادثة"] },
  { path: "/drug-interactions", keys: ["drug", "interaction", "تفاعل", "أدوية"] },
  { path: "/bmi-calculator", keys: ["bmi", "وزن", "weight", "calculator"] },
  { path: "/food-database", keys: ["food", "طعام", "database", "قاعدة"] },
  { path: "/profile", keys: ["profile", "ملف", "account", "حساب"] },
  { path: "/settings", keys: ["settings", "إعدادات", "options"] },
];

type AdminMessage = {
  id: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: notifications = [], isLoading: notifsLoading } = useQuery<AdminMessage[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const r = await fetch("/api/notifications", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT", credentials: "include" });
    },
    onSuccess: (_, id) => {
      qc.setQueryData<AdminMessage[]>(["notifications"], (old = []) =>
        old.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    },
  });

  const searchResults = searchQuery.trim()
    ? SEARCH_PAGES.filter((p) =>
        p.keys.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSelect = (path: string) => {
    setLocation(path);
    setSearchQuery("");
    setShowResults(false);
  };

  const pageName = (path: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      "/": { en: "Dashboard", ar: "الرئيسية" },
      "/nutrition": { en: "Nutrition", ar: "التغذية" },
      "/meal-planner": { en: "Meal Planner", ar: "مخطط الوجبات" },
      "/health": { en: "Health Monitoring", ar: "مراقبة الصحة" },
      "/medications": { en: "Medications", ar: "الأدوية" },
      "/predictions": { en: "Predictions", ar: "التنبؤات" },
      "/health-journal": { en: "Health Journal", ar: "المذكرة الصحية" },
      "/emergency": { en: "Emergency", ar: "الطوارئ" },
      "/ai-assistant": { en: "AI Assistant", ar: "مساعد الذكاء الاصطناعي" },
      "/drug-interactions": { en: "Drug Interactions", ar: "التفاعلات الدوائية" },
      "/bmi-calculator": { en: "BMI Calculator", ar: "حاسبة BMI" },
      "/food-database": { en: "Food Database", ar: "قاعدة بيانات الأغذية" },
      "/profile": { en: "Profile", ar: "الملف الشخصي" },
      "/settings": { en: "Settings", ar: "الإعدادات" },
    };
    return language === "ar" ? (map[path]?.ar || path) : (map[path]?.en || path);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between glass z-30 sticky top-0 border-b border-white/20 dark:border-white/10">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search */}
        <div className="relative max-w-md w-full hidden sm:block" ref={searchRef}>
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            className="ps-9 bg-black/5 dark:bg-white/5 border-transparent focus-visible:ring-primary/30 rounded-xl w-full"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
            onFocus={() => searchQuery && setShowResults(true)}
          />
          {searchQuery && (
            <button className="absolute end-3 top-1/2 -translate-y-1/2" onClick={() => { setSearchQuery(""); setShowResults(false); }}>
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 start-0 end-0 glass rounded-xl shadow-xl border border-white/20 overflow-hidden z-50">
              {searchResults.map((r) => (
                <button
                  key={r.path}
                  className="w-full text-start px-4 py-2.5 hover:bg-primary/10 transition-colors text-sm"
                  onClick={() => handleSearchSelect(r.path)}
                >
                  {pageName(r.path)}
                </button>
              ))}
            </div>
          )}
          {showResults && searchQuery && searchResults.length === 0 && (
            <div className="absolute top-full mt-1 start-0 end-0 glass rounded-xl shadow-xl border border-white/20 p-3 text-sm text-muted-foreground z-50">
              {language === "ar" ? "لا توجد نتائج" : "No results found"}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex rounded-full gap-2 hover:bg-primary/10"
          onClick={() => setLocation("/ai-assistant")}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden lg:inline">{t("askAI")}</span>
        </Button>

        <Button variant="destructive" size="sm" className="hidden md:flex rounded-full shadow-lg hover:shadow-destructive/20 transition-all" onClick={() => setLocation("/emergency")}>
          {t("emergencyBtn")}
        </Button>

        {/* Font Size Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Type className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => setFontSize("small")} className={fontSize === "small" ? "bg-primary/10" : ""}>
              {language === "ar" ? "صغير" : "Small"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFontSize("medium")} className={fontSize === "medium" ? "bg-primary/10" : ""}>
              {language === "ar" ? "متوسط" : "Medium"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFontSize("large")} className={fontSize === "large" ? "bg-primary/10" : ""}>
              {language === "ar" ? "كبير" : "Large"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full font-medium"
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
        >
          {language === "en" ? "ع" : "EN"}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </Button>
          {showNotifications && (
            <div className="absolute end-0 top-full mt-1 w-80 glass rounded-xl shadow-xl border border-white/20 z-50 overflow-hidden">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-sm font-medium">{language === "ar" ? "رسائل الإدارة" : "Admin Messages"}</span>
                {unreadCount > 0 && <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{unreadCount}</span>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifsLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center p-4">
                    {language === "ar" ? "لا توجد رسائل" : "No messages"}
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-white/5 last:border-0 cursor-pointer transition-colors ${!n.isRead ? "bg-primary/5" : "hover:bg-white/5"}`}
                      onClick={() => {
                        setExpandedId(expandedId === n.id ? null : n.id);
                        if (!n.isRead) markRead.mutate(n.id);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${!n.isRead ? "font-semibold" : ""}`}>{n.subject}</p>
                          {expandedId === n.id ? (
                            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{n.body}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                          )}
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {new Date(n.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
