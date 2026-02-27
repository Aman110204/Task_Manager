import { isValidISODate, sanitizeText } from "../security/sanitize";
import { readJSON, writeJSON } from "../storage/resilientStore";

function tasksKey(userId) {
  return `tasks:${userId}`;
}

/**
 * Returns tasks belonging only to the provided user ID.
 */
export function getTasks(userId) {
  return readJSON(tasksKey(userId), [], (data) => {
    return (
      Array.isArray(data) &&
      data.every(
        (task) =>
          task &&
          typeof task.id === "string" &&
          typeof task.title === "string" &&
          typeof task.priority === "string" &&
          typeof task.completed === "boolean"
      )
    );
  });
}

function saveTasks(userId, tasks) {
  writeJSON(tasksKey(userId), tasks);
}

/**
 * Creates and persists a task for a user.
 */
export function addTask(userId, input) {
  const title = sanitizeText(input.title, { maxLen: 140 });
  if (!title) {
    throw new Error("Task title is required.");
  }
  const dueDate = sanitizeText(input.dueDate, { maxLen: 10 });
  if (!isValidISODate(dueDate)) {
    throw new Error("Due date must be in YYYY-MM-DD format.");
  }

  const now = new Date().toISOString();
  const task = {
    id: crypto.randomUUID(),
    title,
    priority: input.priority || "Medium",
    dueDate,
    notes: sanitizeText(input.notes, { maxLen: 500, allowNewLines: true }),
    completed: false,
    order: Date.now(),
    createdAt: now,
    updatedAt: now
  };
  return getTasks(userId).then((existing) => {
    const next = [...existing, task];
    saveTasks(userId, next);
    return task;
  });
}

/**
 * Updates a task by ID and persists the result.
 */
export function updateTask(userId, taskId, patch) {
  const sanitizedPatch = { ...patch };
  if (Object.prototype.hasOwnProperty.call(sanitizedPatch, "title")) {
    sanitizedPatch.title = sanitizeText(sanitizedPatch.title, { maxLen: 140 });
  }
  if (Object.prototype.hasOwnProperty.call(sanitizedPatch, "notes")) {
    sanitizedPatch.notes = sanitizeText(sanitizedPatch.notes, {
      maxLen: 500,
      allowNewLines: true
    });
  }
  if (Object.prototype.hasOwnProperty.call(sanitizedPatch, "dueDate")) {
    sanitizedPatch.dueDate = sanitizeText(sanitizedPatch.dueDate, { maxLen: 10 });
    if (!isValidISODate(sanitizedPatch.dueDate)) {
      throw new Error("Due date must be in YYYY-MM-DD format.");
    }
  }

  return getTasks(userId).then((existing) => {
    const next = existing.map((task) =>
      task.id === taskId
        ? { ...task, ...sanitizedPatch, updatedAt: new Date().toISOString() }
        : task
    );
    saveTasks(userId, next);
    return next;
  });
}

/**
 * Deletes a single task by ID.
 */
export function deleteTask(userId, taskId) {
  return getTasks(userId).then((existing) => {
    const next = existing.filter((task) => task.id !== taskId);
    saveTasks(userId, next);
    return next;
  });
}

/**
 * Replaces full task ordering using an array of task IDs.
 */
export function reorderTasks(userId, orderedIds) {
  return getTasks(userId).then((existing) => {
    const map = new Map(existing.map((t) => [t.id, t]));
    const reordered = orderedIds
      .map((id, index) => {
        const task = map.get(id);
        if (!task) return null;
        return { ...task, order: index, updatedAt: new Date().toISOString() };
      })
      .filter(Boolean);
    saveTasks(userId, reordered);
    return reordered;
  });
}

/**
 * Replaces all user tasks from imported backup data.
 */
export function importTasks(userId, tasks) {
  const safeTasks = tasks
    .filter((t) => t && t.title)
    .map((t, index) => ({
      id: t.id || crypto.randomUUID(),
      title: sanitizeText(t.title, { maxLen: 140 }),
      priority: ["Low", "Medium", "High"].includes(t.priority)
        ? t.priority
        : "Medium",
      dueDate: isValidISODate(t.dueDate) ? t.dueDate : "",
      notes: sanitizeText(t.notes, { maxLen: 500, allowNewLines: true }),
      completed: Boolean(t.completed),
      order: Number.isFinite(t.order) ? t.order : index,
      createdAt: t.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  saveTasks(userId, safeTasks);
  return Promise.resolve(safeTasks);
}
