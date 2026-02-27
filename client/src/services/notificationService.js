// Notification service abstracts Web Notification + Service Worker behavior.
export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
}

export async function pushLocalNotifications(reminders) {
  const permission = await requestNotificationPermission();
  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker?.getRegistration();

  await Promise.all(
    reminders.map(async (item) => {
      if (registration) {
        await registration.showNotification(item.title, { body: item.body, tag: item.id });
      } else {
        const n = new Notification(item.title, { body: item.body });
        setTimeout(() => n.close(), 5000);
      }
    })
  );
}
