import { todayKey } from "./storage";

function daysBetween(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diff = to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0);
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

// Reminder logic: evaluate local state once per minute and raise due notifications.
export function collectReminders({ budget, loans, jobs }) {
  const today = todayKey();
  const now = new Date();
  const reminders = [];
  const badges = {
    budget: false,
    loans: false,
    jobs: false
  };

  if (budget && budget.profile && budget.profile.dailyReminderTime) {
    const hourMinute = budget.profile.dailyReminderTime.split(":");
    const targetHour = Number(hourMinute[0] || 0);
    const targetMinute = Number(hourMinute[1] || 0);
    const lastDate = budget.meta?.lastExpenseLogDate || "";

    if (
      now.getHours() > targetHour ||
      (now.getHours() === targetHour && now.getMinutes() >= targetMinute)
    ) {
      if (lastDate !== today) {
        badges.budget = true;
        reminders.push({
          id: `expense-${today}`,
          title: "Daily Expense Reminder",
          body: "Update today's expenses"
        });
      }
    }
  }

  (loans || []).forEach((loan) => {
    const dueDate = new Date(loan.nextDueDate);
    const days = daysBetween(now, dueDate);
    if (days >= 0 && days <= 3 && (loan.remainingBalance || 0) > 0) {
      badges.loans = true;
      reminders.push({
        id: `emi-${loan.id}-${loan.nextDueDate}`,
        title: "EMI Reminder",
        body: `${loan.name} EMI due on ${loan.nextDueDate}`
      });
    }
  });

  (jobs || []).forEach((job) => {
    if (job.status === "Applied") {
      const daysSinceApply = daysBetween(job.dateApplied, now);
      if (daysSinceApply >= 7) {
        badges.jobs = true;
        reminders.push({
          id: `job-${job.id}`,
          title: "Application Follow-up",
          body: `Follow up with ${job.company} for ${job.role}`
        });
      }
    }
  });

  return { reminders, badges };
}

export async function notifyReminders(reminders) {
  if (!("Notification" in window) || reminders.length === 0) return;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  if (Notification.permission !== "granted") return;

  const registration = await navigator.serviceWorker?.getRegistration();

  await Promise.all(
    reminders.map(async (item) => {
      if (registration) {
        await registration.showNotification(item.title, { body: item.body });
        return;
      }
      const notification = new Notification(item.title, { body: item.body });
      setTimeout(() => notification.close(), 5000);
    })
  );
}
