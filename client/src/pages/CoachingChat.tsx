import { useLanguage } from "@/hooks/use-language";
import { Send, Loader, Paperclip, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";

type Message = { id: number; role: "user" | "coach"; content: string; name?: string; attachment?: { type: string; url: string; name: string } };

export default function CoachingChat() {
  const { t, language } = useLanguage();
  const coachName = language === "ar" ? "مساعد نيوتري-إنتل" : "Nutri-Intel Coach";
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "coach",
      name: language === "ar" ? "مساعد نيوتري-إنتل" : "Nutri-Intel Coach",
      content: language === "ar"
        ? "مرحبًا! أنا مساعدك الصحي في Nutri-Intel. كيف يمكنني مساعدتك اليوم؟ يمكنني تقديم نصائح حول التغذية، التمارين، أو أي استفسار صحي. يمكنك أيضاً إرفاق صور للوجبات أو التقارير الطبية."
        : "Hello! I'm your Nutri-Intel health assistant. How can I help you today? I can provide advice on nutrition, exercise, or health questions. You can also attach meal images or medical reports.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; preview: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const preview = URL.createObjectURL(file);
    setAttachment({ file, preview });
  };

  const removeAttachment = () => {
    if (attachment) {
      URL.revokeObjectURL(attachment.preview);
      setAttachment(null);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || loading) return;

    // Upload file to server if attached
    let uploadedUrl: string | null = null;
    let attachmentInfo: { type: string; url: string; name: string } | undefined;
    if (attachment) {
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // Remove data:... prefix
          };
          reader.readAsDataURL(attachment.file);
        });
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            filename: attachment.file.name,
            mimetype: attachment.file.type,
            data: base64,
          }),
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedUrl = uploadData.url;
        }
      } catch { /* fallback to local preview */ }
      attachmentInfo = {
        type: attachment.file.type,
        url: uploadedUrl || attachment.preview,
        name: attachment.file.name,
      };
    }

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: input || (language === "ar" ? "مرفق" : "Attachment"),
    };
    if (attachmentInfo) {
      userMsg.attachment = attachmentInfo;
    }
    setMessages((prev) => [...prev, userMsg]);

    const messageText = attachment
      ? `${input} [${language === "ar" ? "المستخدم أرفق صورة/ملف" : "User attached an image/file"}: ${attachment.file.name}${uploadedUrl ? ` (uploaded to ${uploadedUrl})` : ""}]`
      : input;

    setInput("");
    removeAttachment();
    setLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      }));
      conversationHistory.push({ role: "user", content: messageText });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: language === "ar"
                ? "أنت مساعد صحي وتغذية احترافي في تطبيق Nutri-Intel. قدم نصائح عملية ومفيدة حول التغذية والصحة واللياقة البدنية. أجب بالعربية دائماً. كن ودوداً ومحترفاً. إذا أرفق المستخدم صورة وجبة، قدم تقديراً للسعرات والقيمة الغذائية."
                : "You are a professional health and nutrition coach named Nutri-Intel Coach. Provide practical, helpful advice on nutrition, health, and fitness. Be friendly and professional. Respond in the same language the user writes in.",
            },
            ...conversationHistory,
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed");

      const data = await response.json();
      const coachReply: Message = {
        id: Date.now() + 1,
        role: "coach",
        name: coachName,
        content: data.message || data.choices?.[0]?.message?.content || (language === "ar" ? "عذراً، حدث خطأ." : "Sorry, an error occurred."),
      };
      setMessages((prev) => [...prev, coachReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "coach",
          name: coachName,
          content: language === "ar" ? "عذراً، لم أتمكن من الاتصال بالخادم." : "Sorry, I couldn't connect to the server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">{t("coachingChatTitle")}</h1>
        <p className="text-muted-foreground">{language === "ar" ? "محادثة مع مساعدك الصحي الذكي" : "Chat with your AI health assistant"}</p>
      </div>

      <div className="flex-1 glass-card p-4 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-xs lg:max-w-md">
              {msg.role === "coach" && <p className="text-xs text-muted-foreground mb-1">{msg.name}</p>}
              <div className={`px-4 py-2 rounded-lg ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                {msg.attachment && msg.attachment.type.startsWith("image/") && (
                  <img src={msg.attachment.url} alt={msg.attachment.name} className="max-w-full rounded mb-2 max-h-48 object-cover" />
                )}
                {msg.attachment && !msg.attachment.type.startsWith("image/") && (
                  <div className="text-xs bg-black/10 rounded p-2 mb-2 flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />{msg.attachment.name}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">{language === "ar" ? "Nutri-Intel Coach يكتب..." : "Nutri-Intel Coach is typing..."}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {attachment && (
        <div className="flex items-center gap-2 px-2 py-1 mb-2 bg-muted rounded-lg">
          {attachment.file.type.startsWith("image/") ? (
            <img src={attachment.preview} alt="" className="w-10 h-10 rounded object-cover" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
          <span className="text-xs flex-1 truncate">{attachment.file.name}</span>
          <button onClick={removeAttachment} className="p-1 hover:bg-white/10 rounded"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="flex gap-2">
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />
        <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0">
          <Image className="w-4 h-4" />
        </Button>
        <Input
          placeholder={language === "ar" ? "اكتب رسالتك..." : "Type your message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={loading || (!input.trim() && !attachment)}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
