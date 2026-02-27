// Monthly analytics calculation for budget and savings.
export function calculateBudgetSummary(budget, targetMonth) {
  const expenses = (budget.expenses || []).filter((item) =>
    String(item.date || "").startsWith(targetMonth)
  );

  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const monthlyLimit = Number(budget.profile?.monthlyLimit || 0);
  const monthlyIncome = Number(budget.profile?.monthlyIncome || 0);

  const remainingBudget = Math.max(monthlyLimit - totalSpent, 0);
  const savings = monthlyIncome - totalSpent;
  const usagePercent = monthlyLimit > 0 ? Math.min((totalSpent / monthlyLimit) * 100, 100) : 0;

  const byCategory = expenses.reduce((acc, expense) => {
    const key = expense.category || "General";
    acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  const categoryBreakdown = Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalSpent,
    remainingBudget,
    savings,
    usagePercent,
    monthExpenses: expenses,
    categoryBreakdown
  };
}

// Loan analytics used by dashboard and reports.
export function calculateLoanSummary(loans) {
  return (loans || []).map((loan) => {
    const paid = Number(loan.paidAmount || 0);
    const total = Number(loan.totalAmount || 0);
    const remainingBalance = Math.max(total - paid, 0);
    const progressPercent = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
    return { ...loan, remainingBalance, progressPercent };
  });
}

export function calculateJobAnalytics(jobs) {
  const total = jobs.length;
  const interviews = jobs.filter((job) => job.status === "Interview").length;
  const offers = jobs.filter((job) => job.status === "Offer").length;

  return {
    total,
    interviews,
    offers,
    interviewRate: total ? (interviews / total) * 100 : 0,
    offerRate: total ? (offers / total) * 100 : 0
  };
}
