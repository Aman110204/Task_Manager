import React from "react";

export default function ReportsModule({
  onExportFinanceJson,
  onExportFinanceCsv,
  onExportJobsJson,
  onExportJobsCsv,
  onExportFullBackup
}) {
  return (
    <section className="stack-lg">
      <section className="panel">
        <h2>Reports</h2>
        <div className="report-grid">
          <button onClick={onExportFinanceJson}>Export Monthly Finance JSON</button>
          <button onClick={onExportFinanceCsv}>Export Monthly Finance CSV</button>
          <button onClick={onExportJobsJson}>Export Job Report JSON</button>
          <button onClick={onExportJobsCsv}>Export Job Report CSV</button>
          <button onClick={onExportFullBackup}>Export Full Backup JSON</button>
        </div>
      </section>
    </section>
  );
}
