import avatarImg from "@/assets/avatar.png";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useState } from "react";
import {
  LayoutDashboard,
  Apple,
  CalendarDays,
  Activity,
  Heart,
  TrendingUp,
  Pill,
  Stethoscope,
  ShieldAlert,
  BarChart3,
  FileText,
  BookOpen,
  MessageSquare,
  Sparkles,
  Video,
  User,
  Settings,
  PhoneCall,
  LogOut,
  X,
  ChevronDown,
  BrainCircuit,
  Database,
  Calculator,
  Droplets
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) {
  const { t, dir, language } = useLanguage();
  const { role } = useAuth();
  const [location] = useLocation();
  const isPractitioner = role === "doctor" || role === "coach";
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    wellness: false,
    tools: false,
    coaching: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const navItems = isPractitioner
    ? [
        { icon: LayoutDashboard, label: language === "ar" ? "لوحة الطبيب" : "Practitioner Dashboard", href: "/doctor" },
        { icon: CalendarDays, label: t('myCoachingSessions'), href: "/coaching/sessions" },
      ]
    : [
        { icon: LayoutDashboard, label: t('dashboard'), href: "/" },
        { icon: Apple, label: t('nutrition'), href: "/nutrition" },
        { icon: CalendarDays, label: t('mealPlanner'), href: "/meal-planner" },
      ];

  const wellnessItems = [
    { icon: Heart, label: t('healthMonitoring'), href: "/health" },
    { icon: TrendingUp, label: t('predictions'), href: "/predictions" },
    { icon: Pill, label: t('medications'), href: "/medications" },
    { icon: BarChart3, label: t('healthReport'), href: "/health-report" },
    { icon: BookOpen, label: t('healthJournal'), href: "/health-journal" },
    { icon: Droplets, label: t('waterTracking') || "Water Tracking", href: "/water" },
  ];

  const smartToolsItems = [
    { icon: Sparkles, label: t('aiAssistant'), href: "/ai-assistant" },
    { icon: Stethoscope, label: t('symptomChecker'), href: "/symptom-checker" },
    { icon: ShieldAlert, label: t('drugInteractions'), href: "/drug-interactions" },
    { icon: Database, label: t('foodDatabase'), href: "/food-database" },
    { icon: Calculator, label: t('bmiCalculator'), href: "/bmi-calculator" },
  ];

  const coachingItems = [
    { icon: Video, label: t('onlineConsultation'), href: "/coaching/consultation" },
    { icon: CalendarDays, label: t('myCoachingSessions'), href: "/coaching/sessions" },
    { icon: MessageSquare, label: t('chatWithCoach'), href: "/coaching/chat" },
  ];

  const secondaryItems = [
    { icon: User, label: t('profile'), href: "/profile" },
    { icon: Settings, label: t('settings'), href: "/settings" },
    { icon: PhoneCall, label: t('emergencyBtn'), href: "/emergency", destructive: true },
    { icon: LogOut, label: t('logOut'), href: "/logout" },
  ];

  const sidebarClasses = cn(
    "fixed inset-y-0 z-50 flex w-64 flex-col glass transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-white/20 dark:border-white/10",
    dir === 'rtl' ? (isOpen ? "right-0 translate-x-0" : "right-0 translate-x-full lg:translate-x-0") : (isOpen ? "left-0 translate-x-0" : "left-0 -translate-x-full lg:translate-x-0")
  );

  return (
    <aside className={sidebarClasses}>
      <div className="flex items-center justify-between h-16 px-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
            Nutri-Intel
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          title={language === "ar" ? "إغلاق القائمة" : "Close menu"}
          className="lg:hidden p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-none">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                location === item.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
              )}>
                {location === item.href && (
                  <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full",
                    dir === 'rtl' ? "right-0" : "left-0"
                  )} />
                )}
                <item.icon className={cn("w-5 h-5", location === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.label}</span>
              </a>
            </Link>
          ))}
        </div>

        {/* Health & Wellness Section */}
        {!isPractitioner && <div className="pt-4 border-t border-border">
          <button
            onClick={() => toggleSection('wellness')}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left",
              "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
            )}
            dir="auto"
          >
            <Heart className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1">{t('healthWellness')}</span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              expandedSections.wellness && "rotate-180"
            )} />
          </button>

          {expandedSections.wellness && (
            <div className="space-y-1 mt-2 ms-2 border-s border-primary/20 ps-2">
              {wellnessItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm group relative",
                    location === item.href
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                  )}>
                    {location === item.href && (
                      <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full",
                        dir === 'rtl' ? "right-0" : "left-0"
                      )} />
                    )}
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>}

        {/* Smart Tools Section */}
        {!isPractitioner && <div className="pt-4 border-t border-border">
          <button
            onClick={() => toggleSection('tools')}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left",
              "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
            )}
            dir="auto"
          >
            <Sparkles className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1">{t('smartTools')}</span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              expandedSections.tools && "rotate-180"
            )} />
          </button>

          {expandedSections.tools && (
            <div className="space-y-1 mt-2 ms-2 border-s border-primary/20 ps-2">
              {smartToolsItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm group relative",
                    location === item.href
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                  )}>
                    {location === item.href && (
                      <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full",
                        dir === 'rtl' ? "right-0" : "left-0"
                      )} />
                    )}
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>}

        {/* Coaching Section */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => toggleSection('coaching')}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left",
              "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
            )}
            dir="auto"
          >
            <Video className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1">{t('coaching')}</span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              expandedSections.coaching && "rotate-180"
            )} />
          </button>

          {expandedSections.coaching && (
            <div className="space-y-1 mt-2 ms-2 border-s border-primary/20 ps-2">
              {coachingItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm group relative",
                    location === item.href
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                  )}>
                    {location === item.href && (
                      <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full",
                        dir === 'rtl' ? "right-0" : "left-0"
                      )} />
                    )}
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <div className="space-y-1">
            {secondaryItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  item.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                )}>
                  <item.icon className={cn("w-5 h-5", item.destructive ? "text-destructive" : "")} />
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
