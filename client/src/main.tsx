import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register Service Worker for PWA + notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      (reg) => {
        console.log("[SW] Registered:", reg.scope);

        // Schedule default meal reminders if notifications are enabled
        if ("Notification" in window && Notification.permission === "granted") {
          scheduleMealReminders(reg);
        }
      },
      (err) => console.log("[SW] Registration failed:", err)
    );
  });
}

function scheduleMealReminders(reg: ServiceWorkerRegistration) {
  const now = new Date();
  const meals = [
    { type: "Breakfast", hour: 8, minute: 0 },
    { type: "Lunch", hour: 13, minute: 0 },
    { type: "Dinner", hour: 19, minute: 0 },
  ];

  for (const meal of meals) {
    const target = new Date(now);
    target.setHours(meal.hour, meal.minute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    const delay = target.getTime() - now.getTime();
    if (reg.active) {
      reg.active.postMessage({
        type: "SCHEDULE_MEAL_REMINDER",
        mealType: meal.type,
        delay,
      });
    }
  }
}

createRoot(document.getElementById("root")!).render(<App />);
