import { useEffect, useRef } from "react";
import { useMedications } from "./useHealth";

const STORAGE_KEY = "nutri-intel-last-reminder";
const CHECK_INTERVAL_MS = 60 * 1000; // check every minute

type LastReminder = Record<string, number>; // medId → timestamp

function loadLastReminders(): LastReminder {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLastReminders(data: LastReminder) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

// Parse a frequency string like "9:00 AM" or "twice daily" → array of HH:MM strings
function parseReminderTimes(frequency: string): string[] {
  // Explicit time in frequency string: "9:00 AM", "14:30", etc.
  const timePattern = /\b(\d{1,2}):(\d{2})\s*(AM|PM)?\b/gi;
  const timeResults: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = timePattern.exec(frequency)) !== null) {
    let h = parseInt(match[1]);
    const min = match[2];
    const ampm = match[3]?.toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    timeResults.push(`${String(h).padStart(2, "0")}:${min}`);
  }
  if (timeResults.length > 0) return timeResults;

  // Keyword-based fallback
  const lower = frequency.toLowerCase();
  if (lower.includes("twice") || lower.includes("مرتين")) return ["08:00", "20:00"];
  if (lower.includes("three") || lower.includes("ثلاث")) return ["08:00", "14:00", "20:00"];
  if (lower.includes("four") || lower.includes("أربع")) return ["08:00", "12:00", "16:00", "20:00"];
  if (lower.includes("night") || lower.includes("bedtime") || lower.includes("ليل")) return ["22:00"];
  if (lower.includes("morning") || lower.includes("صباح")) return ["08:00"];
  if (lower.includes("noon") || lower.includes("ظهر")) return ["12:00"];
  if (lower.includes("evening") || lower.includes("مساء")) return ["18:00"];
  // Default: once daily at 8 AM
  return ["08:00"];
}

// Returns true if the scheduled time matches current time within ±2 min and not already fired today
function shouldFire(medId: string, scheduledTime: string, lastReminders: LastReminder): boolean {
  const now = new Date();
  const [sh, sm] = scheduledTime.split(":").map(Number);
  const diffMin = (now.getHours() - sh) * 60 + (now.getMinutes() - sm);

  if (Math.abs(diffMin) > 2) return false;

  // Check if already fired within the last hour
  const lastFired = lastReminders[`${medId}:${scheduledTime}`] || 0;
  return Date.now() - lastFired > 60 * 60 * 1000;
}

async function requestPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function fireNotification(medName: string, dosage: string, unit: string, language: string) {
  if (Notification.permission !== "granted") return;
  const title = language === "ar" ? "⏰ تذكير بالدواء" : "⏰ Medication Reminder";
  const body = language === "ar"
    ? `حان وقت تناول ${medName} – ${dosage}${unit ? " " + unit : ""}`
    : `Time to take ${medName} – ${dosage}${unit ? " " + unit : ""}`;
  new Notification(title, { body, icon: "/favicon.ico", tag: `med-${medName}` });
}

export function useMedicationReminders(language: string) {
  const { data: medications = [] } = useMedications();
  const permissionGranted = useRef(false);

  // Request permission once
  useEffect(() => {
    requestPermission().then((granted) => {
      permissionGranted.current = granted;
    });
  }, []);

  useEffect(() => {
    if (medications.length === 0) return;

    const check = () => {
      if (!permissionGranted.current) return;
      const lastReminders = loadLastReminders();
      let changed = false;

      for (const med of medications as any[]) {
        const times = parseReminderTimes(med.frequency || "daily");
        for (const time of times) {
          const key = `${med.id}:${time}`;
          if (shouldFire(med.id, time, lastReminders)) {
            fireNotification(med.name, med.dosage, med.unit || "", language);
            lastReminders[key] = Date.now();
            changed = true;
          }
        }
      }

      if (changed) saveLastReminders(lastReminders);
    };

    check(); // run immediately
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [medications, language]);
}
