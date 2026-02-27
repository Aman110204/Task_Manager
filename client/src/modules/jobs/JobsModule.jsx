import React from "react";

const STATUSES = ["Applied", "Interview", "Rejected", "Offer"];

export default function JobsModule({
  jobs,
  analytics,
  jobForm,
  setJobForm,
  statusFilter,
  setStatusFilter,
  onAddJob,
  onUpdateStatus,
  onDeleteJob,
  jobReminderDue
}) {
  const visible =
    statusFilter === "All" ? jobs : jobs.filter((item) => item.status === statusFilter);

  return (
    <section className="stack-lg">
      <section className="stats-grid">
        <article className="stat-card">
          <h3>Total Applied</h3>
          <p>{analytics.total}</p>
        </article>
        <article className="stat-card">
          <h3>Interview Rate</h3>
          <p>{analytics.interviewRate.toFixed(1)}%</p>
        </article>
        <article className="stat-card">
          <h3>Offer Rate</h3>
          <p>{analytics.offerRate.toFixed(1)}%</p>
        </article>
      </section>

      <section className="panel">
        <h2>Add Job Application</h2>
        <form
          className="task-form"
          onSubmit={(e) => {
            e.preventDefault();
            onAddJob();
          }}
        >
          <input
            type="text"
            placeholder="Company"
            value={jobForm.company}
            onChange={(e) => setJobForm((prev) => ({ ...prev, company: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Role"
            value={jobForm.role}
            onChange={(e) => setJobForm((prev) => ({ ...prev, role: e.target.value }))}
            required
          />
          <input
            type="date"
            value={jobForm.dateApplied}
            onChange={(e) => setJobForm((prev) => ({ ...prev, dateApplied: e.target.value }))}
            required
          />
          <select
            value={jobForm.status}
            onChange={(e) => setJobForm((prev) => ({ ...prev, status: e.target.value }))}
          >
            {STATUSES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Notes"
            value={jobForm.notes}
            onChange={(e) => setJobForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
          <button type="submit">Add</button>
        </form>
        <div className="toolbar one-line">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            {STATUSES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        {jobReminderDue && <p className="badge-text">Reminder: follow up pending applications.</p>}
      </section>

      <section className="panel">
        <h2>Applications</h2>
        <div className="list-stack">
          {visible.length === 0 && <p>No applications found.</p>}
          {visible.map((job) => (
            <article key={job.id} className="list-card block-card">
              <div>
                <h3>
                  {job.company} - {job.role}
                </h3>
                <p className="meta-row">
                  Applied: {job.dateApplied} | Status: {job.status}
                </p>
                {job.notes && <p>{job.notes}</p>}
              </div>
              <div className="inline-actions">
                <select
                  value={job.status}
                  onChange={(e) => onUpdateStatus(job.id, e.target.value)}
                >
                  {STATUSES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <button className="danger-btn" onClick={() => onDeleteJob(job.id)}>
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
