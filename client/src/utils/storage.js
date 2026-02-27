import { readJSON, writeJSON } from "../storage/resilientStore";

const APP_VERSION = 1;

export async function loadRecord(key, fallback) {
  return readJSON(`${key}:v${APP_VERSION}`, fallback);
}

export async function saveRecord(key, value) {
  return writeJSON(`${key}:v${APP_VERSION}`, value);
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
