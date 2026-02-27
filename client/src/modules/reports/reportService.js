function downloadTextFile(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportJSON(filename, payload) {
  downloadTextFile(filename, JSON.stringify(payload, null, 2), "application/json");
}

export function exportCSV(filename, rows) {
  if (!rows.length) {
    downloadTextFile(filename, "", "text/csv");
    return;
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  rows.forEach((row) => {
    const line = headers
      .map((key) => {
        const raw = String(row[key] ?? "");
        return `"${raw.replaceAll('"', '""')}"`;
      })
      .join(",");
    lines.push(line);
  });

  downloadTextFile(filename, lines.join("\n"), "text/csv");
}

export function buildFinanceReport(budgetSummary, loans) {
  return {
    generatedAt: new Date().toISOString(),
    budgetSummary,
    loans
  };
}

export function buildJobsReport(jobs, analytics) {
  return {
    generatedAt: new Date().toISOString(),
    analytics,
    jobs
  };
}
