import React from "react";

const CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Health", "Other"];

export default function BudgetModule({
  budget,
  budgetSummary,
  budgetForm,
  setBudgetForm,
  expenseForm,
  setExpenseForm,
  onSaveBudget,
  onAddExpense,
  onDeleteExpense,
  budgetReminderDue
}) {
  return (
    <section className="stack-lg">
      <section className="panel">
        <h2>Monthly Budget Setup</h2>
        <form
          className="task-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSaveBudget();
          }}
        >
          <input
            type="number"
            min="0"
            placeholder="Monthly income"
            value={budgetForm.monthlyIncome}
            onChange={(e) => setBudgetForm((prev) => ({ ...prev, monthlyIncome: e.target.value }))}
          />
          <input
            type="number"
            min="0"
            placeholder="Monthly budget limit"
            value={budgetForm.monthlyLimit}
            onChange={(e) => setBudgetForm((prev) => ({ ...prev, monthlyLimit: e.target.value }))}
          />
          <input
            type="time"
            value={budgetForm.dailyReminderTime}
            onChange={(e) =>
              setBudgetForm((prev) => ({ ...prev, dailyReminderTime: e.target.value }))
            }
          />
          <button type="submit">Save Budget</button>
        </form>
        {budgetReminderDue && <p className="badge-text">Reminder: update today's expenses.</p>}
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <h3>Spent</h3>
          <p>{budgetSummary.totalSpent.toFixed(2)}</p>
        </article>
        <article className="stat-card">
          <h3>Remaining</h3>
          <p>{budgetSummary.remaining.toFixed(2)}</p>
        </article>
        <article className="stat-card">
          <h3>Used</h3>
          <p>{budgetSummary.percentage.toFixed(1)}%</p>
        </article>
      </section>

      <section className="panel">
        <h2>Add Daily Expense</h2>
        <form
          className="task-form"
          onSubmit={(e) => {
            e.preventDefault();
            onAddExpense();
          }}
        >
          <input
            type="date"
            value={expenseForm.date}
            onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
            required
          />
          <select
            value={expenseForm.category}
            onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
          >
            {CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Note"
            value={expenseForm.note}
            onChange={(e) => setExpenseForm((prev) => ({ ...prev, note: e.target.value }))}
          />
          <button type="submit">Add Expense</button>
        </form>
      </section>

      <section className="panel">
        <h2>Monthly Analysis</h2>
        <p>Savings: {budgetSummary.savings.toFixed(2)}</p>
        <div className="chart-stack">
          {budgetSummary.categories.length === 0 && <p>No category data yet.</p>}
          {budgetSummary.categories.map((item) => {
            const width =
              budgetSummary.totalSpent > 0
                ? (item.amount / budgetSummary.totalSpent) * 100
                : 0;
            return (
              <div key={item.category} className="chart-row">
                <span>{item.category}</span>
                <div className="chart-track">
                  <div className="chart-bar" style={{ width: `${width}%` }} />
                </div>
                <strong>{item.amount.toFixed(2)}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Budget History</h2>
        <div className="list-stack">
          {(budget.profileHistory || []).length === 0 && <p>No monthly snapshots yet.</p>}
          {(budget.profileHistory || []).map((item) => (
            <article key={item.month} className="list-card">
              <h3>{item.month}</h3>
              <p className="meta-row">
                Income: {Number(item.monthlyIncome || 0).toFixed(2)} | Limit: {Number(
                  item.monthlyLimit || 0
                ).toFixed(2)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Expenses</h2>
        <div className="list-stack">
          {budget.expenses.length === 0 && <p>No expenses added.</p>}
          {budget.expenses.map((item) => (
            <article key={item.id} className="list-card">
              <div>
                <h3>
                  {item.category} - {item.amount}
                </h3>
                <p className="meta-row">
                  {item.date} | {item.note || "No note"}
                </p>
              </div>
              <button className="danger-btn" onClick={() => onDeleteExpense(item.id)}>
                Delete
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
