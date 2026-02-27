const APP_PREFIX = "task_manager_v1";

/**
 * Builds a namespaced storage key to avoid collisions with other apps.
 */
export function key(name) {
  return `${APP_PREFIX}:${name}`;
}

/**
 * Reads JSON data from localStorage and returns a fallback when missing/invalid.
 */
export function readJSON(name, fallback) {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

/**
 * Persists JSON-serializable data into localStorage.
 */
export function writeJSON(name, value) {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Removes a namespaced key from localStorage.
 */
export function remove(name) {
  localStorage.removeItem(key(name));
}
