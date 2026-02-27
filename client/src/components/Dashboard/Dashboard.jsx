import React from "react";

export default function Dashboard({
  pendingTasks,
  todaysExpense,
  budgetUsage,
  savings,
  upcomingEmis,
  jobStats,
  reminders,
  onSnooze,
  onToggleReminderType
}) {
  return (
    <section className="stack-lg">
      <section className="panel dashboard-grid">
        <article className="dash-card">
          <h3>Today's Tasks</h3>
          <p>{pendingTasks} pending</p>
        </article>
        <article className="dash-card">
          <h3>Today's Expense</h3>
          <p>{todaysExpense.toFixed(2)}</p>
        </article>
        <article className="dash-card">
          <h3>Budget Usage</h3>
          <p>{budgetUsage.toFixed(1)}%</p>
        </article>
        <article className="dash-card">
          <h3>Savings</h3>
          <p>{savings.toFixed(2)}</p>
        </article>
        <article className="dash-card">
          <h3>Upcoming EMI</h3>
          <p>{upcomingEmis}</p>
        </article>
        <article className="dash-card">
          <h3>Job Stats</h3>
          <p>{jobStats}</p>
        </article>
      </section>

      <section className="panel">
        <div className="task-head">
          <h2>Notification Panel</h2>
          <button className="ghost-btn" onClick={() => onSnooze(4)}>Snooze 4h</button>
        </div>
        {reminders.length === 0 && <p className="meta-row">No active reminders.</p>}
        <div className="list-stack">
          {reminders.map((item) => (
            <article className="list-card" key={item.id}>
              <div>
                <h3>{item.title}</h3>
                <p className="meta-row">{item.body}</p>
              </div>
              <button className="ghost-btn" onClick={() => onToggleReminderType(item.type)}>
                Disable {item.type}
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
