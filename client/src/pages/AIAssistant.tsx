import { useLanguage } from "@/hooks/use-language";
import { MessageSquare, Send, Loader, Trash2, Info, Flame, Pill, Activity, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumGate from "@/components/ui/premium-gate";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMeals } from "@/hooks/useNutrition";
import { useHealthMetrics, useMedications } from "@/hooks/useHealth";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

function ContextSidebar({ language }: { language: string }) {
  const { data: meals = [] } = useMeals();
  const { data: metrics = [] } = useHealthMetrics();
  const { data: medications = [] } = useMedications();

  const todayCalories = (meals as any[]).reduce((s: number, m: any) => s + (m.calories || 0), 0);
  const lastMeal = (meals as any[]).slice(-1)[0];
  const latestBP = (metrics as any[]).find((m: any) => m.type === "bloodPressure" || m.type === "blood_pressure");
  const latestGlucose = (metrics as any[]).find((m: any) => m.type === "glucose");
  const pendingMeds = (medications as any[]).filter((m: any) => m.status === "pending");

  return (
    <div className="glass-card p-4 space-y-4 text-sm">
      <div className="flex items-center gap-2 font-semibold text-base">
        <Info className="w-4 h-4 text-primary" />
        {language === "ar" ? "سياقك اليوم" : "Your Context"}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground"><Flame className="w-4 h-4 text-orange-500" />{language === "ar" ? "سعرات اليوم" : "Today's cal"}</span>
          <span className="font-medium">{todayCalories} kcal</span>
        </div>
        {lastMeal && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{language === "ar" ? "آخر وجبة" : "Last meal"}</span>
            <span className="font-medium truncate max-w-[120px]">{lastMeal.name}</span>
          </div>
        )}
        {latestBP && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground"><Activity className="w-4 h-4 text-blue-500" />{language === "ar" ? "ضغط الدم" : "Blood pressure"}</span>
            <span className="font-medium">{latestBP.value}</span>
          </div>
        )}
        {latestGlucose && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{language === "ar" ? "الجلوكوز" : "Glucose"}</span>
            <span className="font-medium">{latestGlucose.value} {latestGlucose.unit}</span>
          </div>
        )}
        {pendingMeds.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground"><Pill className="w-4 h-4 text-purple-500" />{language === "ar" ? "أدوية متبقية" : "Pending meds"}</span>
            <span className="font-medium text-amber-500">{pendingMeds.length}</span>
          </div>
        )}
      </div>
      {(meals as any[]).length === 0 && (metrics as any[]).length === 0 && (
        <p className="text-xs text-muted-foreground">{language === "ar" ? "سجل وجباتك وقراءاتك الصحية لمساعدة أفضل من الذكاء الاصطناعي" : "Log meals and health readings for better AI context"}</p>
      )}
    </div>
  );
}

export default function AIAssistant() {
  const { t, language } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: language === "ar"
        ? "مرحبًا! أنا NutriMate، مساعدك الذكي للتغذية والصحة. كيف يمكنني مساعدتك اليوم؟"
        : "Hello! I'm NutriMate, your AI nutrition and health assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id > 1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage.content,
          history,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: "assistant",
          content: data.reply || (language === "ar" ? "عذرًا، حدث خطأ. حاول مرة أخرى." : "Sorry, something went wrong. Please try again."),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: "assistant",
          content: language === "ar"
            ? "عذرًا، لم أتمكن من الاتصال بالخادم. تأكد من أن الخادم يعمل وحاول مرة أخرى."
            : "Sorry, I couldn't connect to the server. Please make sure the server is running and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 1,
        role: "assistant",
        content: language === "ar"
          ? "مرحبًا! أنا NutriMate، مساعدك الذكي للتغذية والصحة. كيف يمكنني مساعدتك اليوم؟"
          : "Hello! I'm NutriMate, your AI nutrition and health assistant. How can I help you today?",
      },
    ]);
  };

  const quickQuestions = language === "ar"
    ? [
        "ما هي أفضل وجبة فطور صحية؟",
        "كم سعرة حرارية أحتاج يوميًا؟",
        "نصائح لتخفيف الوزن",
        "ما هي فوائد الصيام المتقطع؟",
      ]
    : [
        "What's a healthy breakfast?",
        "How many calories do I need daily?",
        "Tips for weight loss",
        "What are the benefits of intermittent fasting?",
      ];

  return (
    <PremiumGate featureLabel="AI Assistant">
    <div className="flex gap-4 h-[calc(100vh-120px)] animate-in fade-in slide-in-from-bottom-4">
      {/* Context sidebar - desktop only */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 space-y-4">
        <ContextSidebar language={language} />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
            {t("aiAssistantTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("askAnything")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Trash2 className="w-4 h-4 me-1" />
          {t("reset")}
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 glass-card p-4 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] lg:max-w-[60%] px-4 py-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted rounded-bl-sm"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">{t("thinking")}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q}
                className="px-3 py-1.5 text-xs border border-border rounded-full hover:bg-primary/10 hover:border-primary/30 transition-all"
                onClick={() => {
                  setInput(q);
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="glass-card p-3 flex gap-2">
        <Input
          placeholder={t("typeYourQuestion")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0"
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
      </div>
    </div>
    </PremiumGate>
  );
}
