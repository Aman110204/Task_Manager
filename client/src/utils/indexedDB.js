import { readJSON, writeJSON } from "../storage/resilientStore";

// IndexedDB schema (via resilientStore):
// DB: task_manager_local_db
// Store: kv
// Keys (namespaced):
// - budget:<userId>:v1 (encrypted JSON)
// - loans:<userId>:v1 (encrypted JSON)
// - jobs:<userId>:v1
// - reminders:<userId>:v1
export async function getRecord(key, fallback) {
  return readJSON(key, fallback);
}

export async function setRecord(key, value) {
  return writeJSON(key, value);
}

export function monthKey(dateInput = new Date()) {
  const d = new Date(dateInput);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}`;
}

export function todayKey(dateInput = new Date()) {
  const d = new Date(dateInput);
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
