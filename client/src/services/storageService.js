import { getRecord, setRecord } from "../utils/indexedDB";

// Central storage service keeps all local keys in one place.
function keyFor(prefix, userId) {
  return `${prefix}:${userId}:v1`;
}

export function loadReminderSettings(userId) {
  return getRecord(keyFor("reminders", userId), {
    snoozeUntil: 0,
    disabled: { budget: false, loans: false, jobs: false }
  });
}

export function saveReminderSettings(userId, settings) {
  return setRecord(keyFor("reminders", userId), settings);
}
