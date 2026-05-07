// Nutri-Intel Service Worker
// Handles offline caching, scheduled notifications, and background sync

const CACHE_NAME = "nutri-intel-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/favicon.png",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Skip non-GET and API requests
  if (request.method !== "GET" || request.url.includes("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});

// Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Nutri-Intel";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/favicon.png",
    badge: "/favicon.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/" },
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

// Handle scheduled medication reminders via message
self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_MEDICATION_REMINDER") {
    const { name, dosage, time, delay } = event.data;
    setTimeout(() => {
      self.registration.showNotification("Nutri-Intel - Medication Reminder", {
        body: `Time to take ${name} (${dosage}) - Scheduled at ${time}`,
        icon: "/favicon.png",
        badge: "/favicon.png",
        vibrate: [200, 100, 200],
        tag: `med-${name}`,
        requireInteraction: true,
        actions: [
          { action: "taken", title: "Mark as Taken" },
          { action: "snooze", title: "Snooze 10min" },
        ],
        data: { url: "/medications", medicationName: name },
      });
    }, delay);
  }

  if (event.data?.type === "SCHEDULE_MEAL_REMINDER") {
    const { mealType, delay } = event.data;
    setTimeout(() => {
      self.registration.showNotification("Nutri-Intel - Meal Reminder", {
        body: `Time for ${mealType}! Don't forget to log your meal.`,
        icon: "/favicon.png",
        badge: "/favicon.png",
        vibrate: [100, 50, 100],
        tag: `meal-${mealType}`,
        data: { url: "/meal-planner" },
      });
    }, delay);
  }
});
