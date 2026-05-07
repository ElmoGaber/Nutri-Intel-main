import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Moon, Smartphone, Bell, Lock, Globe, Shield, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { saveToLocalStorage, loadFromLocalStorage, downloadPDF, clearAppCache } from "@/lib/actions";
import { useTheme } from "next-themes";

interface SettingsData {
  darkMode: boolean;
  notifications: boolean;
  reminders: boolean;
  twoFactor: boolean;
}

const defaultSettings: SettingsData = {
  darkMode: true,
  notifications: true,
  reminders: true,
  twoFactor: false,
};

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, newPass: false, confirm: false });

  useEffect(() => {
    const saved = loadFromLocalStorage<SettingsData>("nutri-intel-settings");
    if (saved) setSettings(saved);
  }, []);

  const handleToggleDarkMode = () => {
    const newMode = !isDark;
    setTheme(newMode ? "dark" : "light");
    setSettings((prev) => ({ ...prev, darkMode: newMode }));
    toast({
      title: newMode ? (language === "ar" ? "الوضع الداكن" : "Dark Mode") : (language === "ar" ? "الوضع الفاتح" : "Light Mode"),
      description: newMode ? (language === "ar" ? "تم تفعيل الوضع الداكن" : "Dark mode enabled") : (language === "ar" ? "تم تفعيل الوضع الفاتح" : "Light mode enabled"),
    });
  };

  const handleToggleNotifications = async () => {
    if (!settings.notifications) {
      // Turning on - request browser permission
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          setSettings((prev) => ({ ...prev, notifications: true }));
          new Notification("Nutri-Intel", { body: language === "ar" ? "تم تفعيل الإشعارات" : "Notifications enabled" });
          toast({ title: language === "ar" ? "تم التفعيل" : "Enabled", description: language === "ar" ? "تم تفعيل الإشعارات" : "Notifications enabled" });
        } else {
          toast({ title: language === "ar" ? "مرفوض" : "Denied", description: language === "ar" ? "يرجى السماح بالإشعارات من إعدادات المتصفح" : "Please allow notifications in browser settings" });
        }
      } else {
        toast({ title: language === "ar" ? "غير مدعوم" : "Not Supported", description: language === "ar" ? "المتصفح لا يدعم الإشعارات" : "Browser does not support notifications" });
      }
    } else {
      setSettings((prev) => ({ ...prev, notifications: false }));
      toast({ title: language === "ar" ? "تم التعطيل" : "Disabled", description: language === "ar" ? "تم تعطيل الإشعارات" : "Notifications disabled" });
    }
  };

  const handleToggleReminders = async () => {
    const newVal = !settings.reminders;
    setSettings((prev) => ({ ...prev, reminders: newVal }));
    if (newVal && "Notification" in window && Notification.permission === "granted") {
      new Notification("Nutri-Intel", { body: language === "ar" ? "تم تفعيل تذكيرات الوجبات" : "Meal reminders enabled" });
      // Schedule medication reminders via Service Worker
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const meds = loadFromLocalStorage<{ name: string; dosage: string; time: string }[]>("nutri-intel-medications");
        if (meds && reg.active) {
          const now = new Date();
          for (const med of meds) {
            if (med.time) {
              const [h, m] = med.time.split(":").map(Number);
              const target = new Date(now);
              target.setHours(h, m, 0, 0);
              if (target <= now) target.setDate(target.getDate() + 1);
              reg.active.postMessage({
                type: "SCHEDULE_MEDICATION_REMINDER",
                name: med.name,
                dosage: med.dosage,
                time: med.time,
                delay: target.getTime() - now.getTime(),
              });
            }
          }
        }
      }
    }
    toast({
      title: newVal ? (language === "ar" ? "تم التفعيل" : "Enabled") : (language === "ar" ? "تم التعطيل" : "Disabled"),
      description: newVal ? (language === "ar" ? "تم تفعيل تذكيرات الوجبات" : "Meal reminders enabled") : (language === "ar" ? "تم تعطيل تذكيرات الوجبات" : "Meal reminders disabled"),
    });
  };

  const handleSave = () => {
    saveToLocalStorage("nutri-intel-settings", settings);
    toast({ title: language === "ar" ? "تم الحفظ" : "Settings Saved", description: language === "ar" ? "تم حفظ إعداداتك بنجاح" : "Your settings have been saved successfully" });
  };

  const handleCancel = () => {
    const saved = loadFromLocalStorage<SettingsData>("nutri-intel-settings");
    setSettings(saved || defaultSettings);
    toast({ title: language === "ar" ? "تم الإلغاء" : "Cancelled", description: language === "ar" ? "تم استعادة الإعدادات السابقة" : "Settings reverted to last saved state" });
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "يرجى ملء جميع الحقول" : "Please fill in all fields" });
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match" });
      return;
    }
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: language === "ar" ? "خطأ" : "Error", description: data.message || (language === "ar" ? "فشل تغيير كلمة المرور" : "Failed to change password") });
        return;
      }
      setPasswordForm({ current: "", newPass: "", confirm: "" });
      setShowPasswordForm(false);
      toast({ title: language === "ar" ? "تم التغيير" : "Password Changed", description: language === "ar" ? "تم تغيير كلمة المرور بنجاح" : "Your password has been changed successfully" });
    } catch {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "تعذر الاتصال بالخادم" : "Could not connect to server" });
    }
  };

  const handleToggle2FA = () => {
    const newVal = !settings.twoFactor;
    setSettings((prev) => ({ ...prev, twoFactor: newVal }));
    toast({
      title: newVal ? (language === "ar" ? "تم التفعيل" : "2FA Enabled") : (language === "ar" ? "تم التعطيل" : "2FA Disabled"),
      description: newVal
        ? (language === "ar" ? "تم تفعيل المصادقة الثنائية لحسابك" : "Two-factor authentication is now enabled")
        : (language === "ar" ? "تم تعطيل المصادقة الثنائية" : "Two-factor authentication has been disabled"),
    });
  };

  const handleExportData = () => {
    const sections: { heading: string; content: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("nutri-intel")) {
        try {
          const val = JSON.parse(localStorage.getItem(key) || "");
          sections.push({ heading: key.replace("nutri-intel-", "").replace(/-/g, " ").toUpperCase(), content: JSON.stringify(val, null, 2) });
        } catch {
          sections.push({ heading: key, content: localStorage.getItem(key) || "" });
        }
      }
    }
    sections.push({ heading: "Export Info", content: `Date: ${new Date().toISOString()}\nApp Version: 1.0.0` });
    downloadPDF("nutri-intel-data-export.pdf", language === "ar" ? "تصدير بيانات Nutri-Intel" : "Nutri-Intel Data Export", sections);
    toast({ title: language === "ar" ? "تم التصدير" : "Data Exported", description: language === "ar" ? "تم تنزيل جميع بياناتك كـ PDF" : "All your data has been downloaded as PDF" });
  };

  const handleClearCache = () => {
    clearAppCache();
    toast({ title: language === "ar" ? "تم المسح" : "Cache Cleared", description: language === "ar" ? "تم مسح ذاكرة التخزين المؤقت بنجاح" : "Application cache has been cleared successfully" });
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/users/me", { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      localStorage.clear();
      toast({ title: language === "ar" ? "تم الحذف" : "Account Deleted", description: language === "ar" ? "تم حذف جميع بياناتك نهائياً" : "Your account and all data have been permanently deleted" });
      setShowDeleteConfirm(false);
      setTimeout(() => setLocation("/login"), 1500);
    } catch {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "تعذر حذف الحساب" : "Failed to delete account" });
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
          {t("settingsTitle")}
        </h1>
        <p className="text-muted-foreground mt-2">{t("preferences")}</p>
      </div>

      {/* Display Settings */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4">{t("display")}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t("darkMode")}</p>
                <p className="text-xs text-muted-foreground">{t("darkModeDesc")}</p>
              </div>
            </div>
            <button
              onClick={handleToggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition ${isDark ? "bg-primary" : "bg-muted"}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${isDark ? "end-1" : "start-1"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t("language")}</p>
                <p className="text-xs text-muted-foreground">{t("languageDesc")}</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "ar")}
              className="p-2 border border-muted rounded bg-transparent text-sm"
            >
              <option value="en">English</option>
              <option value="ar">{"\u0627\u0644\u0639\u0631\u0628\u064A\u0629"}</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t("responsiveDesign")}</p>
                <p className="text-xs text-muted-foreground">{t("responsiveDesignDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4">{t("notificationsLabel")}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t("enableNotifications")}</p>
                <p className="text-xs text-muted-foreground">{t("receiveNotifications")}</p>
              </div>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`relative w-12 h-6 rounded-full transition ${settings.notifications ? "bg-primary" : "bg-muted"}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${settings.notifications ? "end-1" : "start-1"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div>
              <p className="font-medium">{t("mealReminders")}</p>
              <p className="text-xs text-muted-foreground">{t("getMealReminders")}</p>
            </div>
            <button
              onClick={handleToggleReminders}
              className={`relative w-12 h-6 rounded-full transition ${settings.reminders ? "bg-primary" : "bg-muted"}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${settings.reminders ? "end-1" : "start-1"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4">{t("privacyAndSecurity")}</h2>
        <div className="space-y-3">
          {/* Change Password */}
          <button
            className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded transition"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div className="text-start">
                <p className="font-medium text-sm">{t("changePassword")}</p>
                <p className="text-xs text-muted-foreground">{t("updatePasswordDesc")}</p>
              </div>
            </div>
          </button>

          {showPasswordForm && (
            <div className="p-4 bg-muted/30 rounded-lg space-y-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{language === "ar" ? "تغيير كلمة المرور" : "Change Password"}</p>
                <button onClick={() => setShowPasswordForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
              </div>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  placeholder={language === "ar" ? "كلمة المرور الحالية" : "Current password"}
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                />
                <button className="absolute end-3 top-1/2 -translate-y-1/2" onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}>
                  {showPasswords.current ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPasswords.newPass ? "text" : "password"}
                  placeholder={language === "ar" ? "كلمة المرور الجديدة" : "New password"}
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                />
                <button className="absolute end-3 top-1/2 -translate-y-1/2" onClick={() => setShowPasswords((p) => ({ ...p, newPass: !p.newPass }))}>
                  {showPasswords.newPass ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder={language === "ar" ? "تأكيد كلمة المرور" : "Confirm new password"}
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                />
                <button className="absolute end-3 top-1/2 -translate-y-1/2" onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))}>
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <Button className="w-full" onClick={handleChangePassword}>{language === "ar" ? "تحديث كلمة المرور" : "Update Password"}</Button>
            </div>
          )}

          {/* Two-Factor Auth */}
          <button
            className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded transition"
            onClick={handleToggle2FA}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div className="text-start">
                <p className="font-medium text-sm">{t("twoFactorAuthDesc")}</p>
                <p className="text-xs text-muted-foreground">{t("addExtraSecurityDesc")}</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded ${settings.twoFactor ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}>
              {settings.twoFactor ? (language === "ar" ? "مفعّل" : "ON") : (language === "ar" ? "معطّل" : "OFF")}
            </span>
          </button>

          {/* Privacy Policy */}
          <button
            className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded transition"
            onClick={() => setShowPrivacy(!showPrivacy)}
          >
            <div className="text-start">
              <p className="font-medium text-sm">{t("privacy")}</p>
              <p className="text-xs text-muted-foreground">{t("viewPrivacyPolicyDesc")}</p>
            </div>
          </button>

          {showPrivacy && (
            <div className="p-5 bg-muted/30 rounded-xl border border-white/10 space-y-4 text-sm">
              <p className="font-semibold text-base text-foreground">{language === "ar" ? "سياسة الخصوصية — Nutri-Intel" : "Privacy Policy — Nutri-Intel"}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "آخر تحديث: أبريل 2026" : "Last updated: April 2026"}</p>

              {language === "ar" ? (
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <div><p className="font-medium text-foreground mb-1">1. البيانات التي نجمعها</p><p>نجمع فقط البيانات التي تُدخلها أنت: الوجبات، المؤشرات الصحية، الأدوية، ومعلومات الطوارئ. لا نجمع بيانات تصفح أو بيانات الجهاز.</p></div>
                  <div><p className="font-medium text-foreground mb-1">2. كيف نستخدم بياناتك</p><p>تُستخدم بياناتك حصرياً لتقديم التحليلات الصحية والتوصيات الشخصية داخل التطبيق. لا نشارك بياناتك مع أطراف ثالثة لأغراض تجارية.</p></div>
                  <div><p className="font-medium text-foreground mb-1">3. الذكاء الاصطناعي</p><p>عند استخدام مساعد الذكاء الاصطناعي، تُرسل رسائلك إلى خدمة Groq API لمعالجة اللغة الطبيعية. لا يتم ربط هذه الرسائل بهويتك الشخصية.</p></div>
                  <div><p className="font-medium text-foreground mb-1">4. تخزين البيانات</p><p>تُخزَّن بياناتك بأمان في قاعدة بيانات مشفرة. يمكنك تصدير كل بياناتك أو حذفها نهائياً في أي وقت.</p></div>
                  <div><p className="font-medium text-foreground mb-1">5. حقوقك</p><p>يحق لك الوصول إلى بياناتك وتعديلها وحذفها في أي وقت. لطلب نسخة من بياناتك تواصل معنا عبر: support@nutri-intel.com</p></div>
                </div>
              ) : (
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <div><p className="font-medium text-foreground mb-1">1. Data We Collect</p><p>We only collect data you enter: meals, health metrics, medications, and emergency contacts. We do not collect browsing data or device identifiers.</p></div>
                  <div><p className="font-medium text-foreground mb-1">2. How We Use Your Data</p><p>Your data is used exclusively to provide health analytics and personalized recommendations within the app. We do not sell or share your data with third parties for commercial purposes.</p></div>
                  <div><p className="font-medium text-foreground mb-1">3. AI Services</p><p>When using the AI assistant, your messages are sent to Groq API for natural language processing. These messages are not linked to your personal identity.</p></div>
                  <div><p className="font-medium text-foreground mb-1">4. Data Storage</p><p>Your data is stored securely in an encrypted database. You can export all your data or permanently delete it at any time.</p></div>
                  <div><p className="font-medium text-foreground mb-1">5. Your Rights</p><p>You have the right to access, modify, and delete your data at any time. To request a copy of your data, contact us at: support@nutri-intel.com</p></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4">{t("dataManagement")}</h2>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
            {language === "ar" ? "📥 تصدير جميع البيانات" : "📥 Export All Data"}
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={handleClearCache}>
            {language === "ar" ? "🗑️ مسح ذاكرة التخزين المؤقت" : "🗑️ Clear Cache"}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-500"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {language === "ar" ? "❌ حذف جميع البيانات" : "❌ Delete All Data"}
          </Button>

          {showDeleteConfirm && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg space-y-3">
              <p className="text-sm font-medium text-red-500">
                {language === "ar" ? "هل أنت متأكد؟ سيتم حذف جميع بياناتك نهائيًا." : "Are you sure? All your data will be permanently deleted."}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleDeleteAccount}>
                  {language === "ar" ? "نعم، احذف الكل" : "Yes, Delete Everything"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button className="flex-1" onClick={handleSave}>{t("save")}</Button>
        <Button variant="outline" className="flex-1" onClick={handleCancel}>{t("cancel")}</Button>
      </div>
    </div>
  );
}
