import React from "react";

export default function LoansModule({
  loans,
  loanForm,
  setLoanForm,
  onAddLoan,
  onRecordPayment,
  onDeleteLoan,
  loanReminderDue
}) {
  return (
    <section className="stack-lg">
      <section className="panel">
        <h2>Add Loan</h2>
        <form
          className="task-form"
          onSubmit={(e) => {
            e.preventDefault();
            onAddLoan();
          }}
        >
          <input
            type="text"
            placeholder="Loan name"
            value={loanForm.name}
            onChange={(e) => setLoanForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Total amount"
            value={loanForm.totalAmount}
            onChange={(e) => setLoanForm((prev) => ({ ...prev, totalAmount: e.target.value }))}
            required
          />
          <input
            type="number"
            min="0"
            placeholder="EMI"
            value={loanForm.emi}
            onChange={(e) => setLoanForm((prev) => ({ ...prev, emi: e.target.value }))}
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Interest rate"
            value={loanForm.interestRate}
            onChange={(e) => setLoanForm((prev) => ({ ...prev, interestRate: e.target.value }))}
          />
          <input
            type="date"
            value={loanForm.nextDueDate}
            onChange={(e) => setLoanForm((prev) => ({ ...prev, nextDueDate: e.target.value }))}
            required
          />
          <button type="submit">Add Loan</button>
        </form>
        {loanReminderDue && <p className="badge-text">Reminder: EMI due soon.</p>}
      </section>

      <section className="panel">
        <h2>Loan Tracker</h2>
        <div className="list-stack">
          {loans.length === 0 && <p>No loans added.</p>}
          {loans.map((loan) => (
            <article key={loan.id} className="list-card block-card">
              <div>
                <h3>{loan.name}</h3>
                <p className="meta-row">
                  Due: {loan.nextDueDate} | EMI: {loan.emi} | Remaining: {loan.remainingBalance.toFixed(2)}
                </p>
                <div className="chart-track">
                  <div className="chart-bar" style={{ width: `${loan.progressPercent}%` }} />
                </div>
              </div>
              <div className="inline-actions">
                <button onClick={() => onRecordPayment(loan.id, loan.emi)}>Pay EMI</button>
                <button className="danger-btn" onClick={() => onDeleteLoan(loan.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
