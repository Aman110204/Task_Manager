import { todayKey } from "./indexedDB";

function daysBetween(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diff = to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0);
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

// Reminder engine:
// 1) Build due reminders from local data
// 2) Respect disabled reminder types
// 3) Respect snooze window
export function collectReminders({ budget, loans, jobs, settings }) {
  const now = Date.now();
  const snoozeUntil = Number(settings?.snoozeUntil || 0);
  if (snoozeUntil > now) {
    return { reminders: [], badges: { budget: false, loans: false, jobs: false } };
  }

  const disabled = settings?.disabled || {};
  const today = todayKey();
  const current = new Date();

  const reminders = [];
  const badges = { budget: false, loans: false, jobs: false };

  if (!disabled.budget && budget?.profile?.dailyReminderTime) {
    const [hour, minute] = budget.profile.dailyReminderTime.split(":").map(Number);
    const lastDate = budget.meta?.lastExpenseLogDate || "";
    if (
      current.getHours() > hour ||
      (current.getHours() === hour && current.getMinutes() >= minute)
    ) {
      if (lastDate !== today) {
        reminders.push({
          id: `expense-${today}`,
          type: "budget",
          title: "Daily Expense Reminder",
          body: "Update today's expenses"
        });
        badges.budget = true;
      }
    }
  }

  if (!disabled.loans) {
    (loans || []).forEach((loan) => {
      const dueDate = new Date(loan.nextDueDate);
      const days = daysBetween(current, dueDate);
      if (days >= 0 && days <= 3 && Number(loan.remainingBalance || 0) > 0) {
        reminders.push({
          id: `emi-upcoming-${loan.id}-${loan.nextDueDate}`,
          type: "loans",
          title: "EMI Reminder",
          body: `${loan.name} EMI due on ${loan.nextDueDate}`
        });
        badges.loans = true;
      }
      if (days < 0 && Number(loan.remainingBalance || 0) > 0) {
        reminders.push({
          id: `emi-overdue-${loan.id}-${loan.nextDueDate}`,
          type: "loans",
          title: "Overdue EMI",
          body: `${loan.name} EMI is overdue since ${loan.nextDueDate}`
        });
        badges.loans = true;
      }
    });
  }

  if (!disabled.jobs) {
    (jobs || []).forEach((job) => {
      if (job.status === "Applied") {
        const daysSince = daysBetween(job.dateApplied, current);
        if (daysSince >= 7) {
          reminders.push({
            id: `job-follow-up-${job.id}`,
            type: "jobs",
            title: "Application Follow-up",
            body: `Follow up with ${job.company} for ${job.role}`
          });
          badges.jobs = true;
        }
      }
    });
  }

  return { reminders, badges };
}
