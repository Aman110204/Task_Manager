import { loadRecord, saveRecord } from "../../utils/storage";

function jobsKey(userId) {
  return `jobs:${userId}`;
}

export async function loadJobs(userId) {
  return loadRecord(jobsKey(userId), []);
}

async function saveJobs(userId, jobs) {
  await saveRecord(jobsKey(userId), jobs);
  return jobs;
}

export async function addJob(userId, input) {
  const current = await loadJobs(userId);
  const job = {
    id: crypto.randomUUID(),
    company: input.company,
    role: input.role,
    dateApplied: input.dateApplied,
    status: input.status || "Applied",
    notes: String(input.notes || "").slice(0, 240),
    updatedAt: new Date().toISOString()
  };
  return saveJobs(userId, [job, ...current]);
}

export async function updateJob(userId, jobId, patch) {
  const current = await loadJobs(userId);
  const next = current.map((job) =>
    job.id === jobId ? { ...job, ...patch, updatedAt: new Date().toISOString() } : job
  );
  return saveJobs(userId, next);
}

export async function deleteJob(userId, jobId) {
  const current = await loadJobs(userId);
  return saveJobs(
    userId,
    current.filter((job) => job.id !== jobId)
  );
}

export function getJobAnalytics(jobs) {
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
