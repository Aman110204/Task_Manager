import { decryptJSON, encryptJSON } from "../../utils/encryption";
import { calculateBudgetSummary } from "../../utils/calculations";
import { getRecord, monthKey, setRecord, todayKey } from "../../utils/indexedDB";

function budgetKey(userId) {
  return `budget:${userId}:v1`;
}

// Storage schema: encrypted payload containing profile, profileHistory, expenses, and reminder metadata.
const DEFAULT_BUDGET = {
  profile: {
    monthlyIncome: 0,
    monthlyLimit: 0,
    dailyReminderTime: "20:00"
  },
  profileHistory: [],
  expenses: [],
  meta: {
    lastExpenseLogDate: ""
  }
};

export async function loadBudget(userId) {
  const encrypted = await getRecord(budgetKey(userId), null);
  return decryptJSON(userId, encrypted, DEFAULT_BUDGET);
}

export async function saveBudget(userId, budget) {
  const encrypted = await encryptJSON(userId, budget);
  await setRecord(budgetKey(userId), encrypted);
  return budget;
}

// Data flow: profile updates are persisted immediately and snapshotted per month for history.
export async function updateBudgetProfile(userId, patch) {
  const current = await loadBudget(userId);
  const monthlyIncome =
    patch.monthlyIncome !== undefined
      ? Number(patch.monthlyIncome)
      : Number(current.profile.monthlyIncome || 0);
  const monthlyLimit =
    patch.monthlyLimit !== undefined
      ? Number(patch.monthlyLimit)
      : Number(current.profile.monthlyLimit || 0);

  const month = monthKey();
  const nextHistory = [...(current.profileHistory || [])];
  const existingIndex = nextHistory.findIndex((item) => item.month === month);
  const snapshot = {
    month,
    monthlyIncome,
    monthlyLimit,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    nextHistory[existingIndex] = snapshot;
  } else {
    nextHistory.unshift(snapshot);
  }

  const next = {
    ...current,
    profile: {
      ...current.profile,
      ...patch,
      monthlyIncome,
      monthlyLimit
    },
    profileHistory: nextHistory
  };

  return saveBudget(userId, next);
}

// Autosave is immediate after every expense mutation.
export async function addExpense(userId, input) {
  const current = await loadBudget(userId);
  const entry = {
    id: crypto.randomUUID(),
    date: input.date || todayKey(),
    amount: Number(input.amount || 0),
    category: input.category || "General",
    note: String(input.note || "").slice(0, 180)
  };

  const next = {
    ...current,
    expenses: [entry, ...current.expenses],
    meta: {
      ...current.meta,
      lastExpenseLogDate: todayKey()
    }
  };
  return saveBudget(userId, next);
}

export async function deleteExpense(userId, expenseId) {
  const current = await loadBudget(userId);
  const next = {
    ...current,
    expenses: current.expenses.filter((item) => item.id !== expenseId)
  };
  return saveBudget(userId, next);
}

// Monthly analytics calculation is delegated to reusable utils/calculations.js.
export function getBudgetSummary(budget, targetMonth = monthKey()) {
  const raw = calculateBudgetSummary(budget, targetMonth);
  return {
    totalSpent: raw.totalSpent,
    remaining: raw.remainingBudget,
    percentage: raw.usagePercent,
    savings: raw.savings,
    categories: raw.categoryBreakdown,
    monthExpenses: raw.monthExpenses
  };
}
