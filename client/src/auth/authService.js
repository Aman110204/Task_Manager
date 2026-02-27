import { sanitizeEmail, sanitizeText } from "../security/sanitize";
import { readJSON, remove, writeJSON } from "../storage/resilientStore";

const USERS_KEY = "users";
const SESSION_KEY = "session";

/**
 * Hashes a plain password with SHA-256 using Web Crypto.
 */
async function hashPassword(password) {
  const input = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getUsers() {
  return readJSON(USERS_KEY, [], (data) => {
    return (
      Array.isArray(data) &&
      data.every(
        (u) =>
          u &&
          typeof u.id === "string" &&
          typeof u.email === "string" &&
          typeof u.passwordHash === "string"
      )
    );
  });
}

function saveUsers(users) {
  return writeJSON(USERS_KEY, users);
}

export function getSession() {
  return readJSON(SESSION_KEY, null, (data) => {
    return (
      data &&
      typeof data === "object" &&
      typeof data.userId === "string" &&
      Number.isFinite(data.loggedInAt)
    );
  });
}

export function clearSession() {
  remove(SESSION_KEY);
}

/**
 * Registers a new user in local storage with a hashed password.
 */
export async function registerUser({ name, email, password }) {
  const users = await getUsers();
  const normalizedEmail = sanitizeEmail(email);
  const sanitizedName = sanitizeText(name, { maxLen: 80 });

  if (users.some((u) => u.email === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }
  if (!sanitizedName) {
    throw new Error("Name is required.");
  }
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Please provide a valid email address.");
  }
  if (String(password || "").trim().length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const user = {
    id: crypto.randomUUID(),
    name: sanitizedName,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString()
  };

  saveUsers([...users, user]);
  writeJSON(SESSION_KEY, { userId: user.id, loggedInAt: Date.now() });
  return { id: user.id, name: user.name, email: user.email };
}

/**
 * Validates local credentials and opens a local session.
 */
export async function loginUser({ email, password }) {
  const users = await getUsers();
  const normalizedEmail = sanitizeEmail(email);
  const passwordHash = await hashPassword(password);

  const match = users.find(
    (u) => u.email === normalizedEmail && u.passwordHash === passwordHash
  );

  if (!match) {
    throw new Error("Invalid email or password.");
  }

  writeJSON(SESSION_KEY, { userId: match.id, loggedInAt: Date.now() });
  return { id: match.id, name: match.name, email: match.email };
}

/**
 * Resolves the currently logged in user from local session.
 */
export function getCurrentUser() {
  return getSession().then((session) => {
    if (!session) return null;
    return getUsers().then((users) => {
      const user = users.find((u) => u.id === session.userId);
      if (!user) return null;
      return { id: user.id, name: user.name, email: user.email };
    });
  });
}
