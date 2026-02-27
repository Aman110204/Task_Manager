import { key as namespacedKey } from "./localStore";

const DB_NAME = "task_manager_local_db";
const DB_VERSION = 1;
const STORE_NAME = "kv";

let dbPromise = null;
let idbDisabled = false;

function openDB() {
  if (idbDisabled || typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
  });

  return dbPromise;
}

function idbGetItem(storageKey) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(storageKey);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error || new Error("IndexedDB read failed"));
      })
  );
}

function idbSetItem(storageKey, value) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(value, storageKey);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error || new Error("IndexedDB write failed"));
      })
  );
}

function idbRemoveItem(storageKey) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(storageKey);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error || new Error("IndexedDB delete failed"));
      })
  );
}

/**
 * Reads JSON with IndexedDB-first strategy and localStorage fallback.
 * Invalid/corrupted payloads are cleared automatically.
 */
export async function readJSON(name, fallback, validate) {
  const storageKey = namespacedKey(name);
  let raw = null;

  try {
    raw = await idbGetItem(storageKey);
  } catch (error) {
    idbDisabled = true;
    raw = localStorage.getItem(storageKey);
  }

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (typeof validate === "function" && !validate(parsed)) {
      await remove(name);
      return fallback;
    }
    return parsed;
  } catch (error) {
    await remove(name);
    return fallback;
  }
}

/**
 * Writes JSON to IndexedDB and mirrors to localStorage as backup.
 */
export async function writeJSON(name, value) {
  const storageKey = namespacedKey(name);
  const raw = JSON.stringify(value);

  localStorage.setItem(storageKey, raw);

  try {
    await idbSetItem(storageKey, raw);
    return true;
  } catch (error) {
    idbDisabled = true;
    return true;
  }
}

/**
 * Removes stored value from both IndexedDB and localStorage.
 */
export async function remove(name) {
  const storageKey = namespacedKey(name);
  localStorage.removeItem(storageKey);

  try {
    await idbRemoveItem(storageKey);
  } catch (error) {
    idbDisabled = true;
  }
}
