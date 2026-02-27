import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  clearSession,
  getCurrentUser,
  loginUser,
  registerUser
} from "./auth/authService";
import {
  addTask,
  deleteTask,
  getTasks,
  importTasks,
  reorderTasks,
  updateTask
} from "./tasks/taskService";

const THEME_KEY = "task_manager_theme";

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [authError, setAuthError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState({
    title: "",
    dueDate: "",
    priority: "Medium",
    notes: ""
  });
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  const [theme, setTheme] = useState(localStorage.getItem(THEME_KEY) || "light");

  // Load local authenticated session from browser storage.
  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  // Load current user's tasks whenever the active user changes.
  useEffect(() => {
    if (!user) return;
    getTasks(user.id)
      .then((nextTasks) => setTasks(nextTasks.sort((a, b) => a.order - b.order)))
      .catch(() => setTasks([]));
  }, [user]);

  // Persist and apply visual theme preference.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    return {
      total,
      completed,
      pending: total - completed
    };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchText.toLowerCase()) ||
        task.notes.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Completed" && task.completed) ||
        (statusFilter === "Pending" && !task.completed);

      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchText, statusFilter, priorityFilter]);

  // Handle local-only login and registration.
  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    try {
      const payload = {
        name: authForm.name,
        email: authForm.email,
        password: authForm.password
      };
      const loggedInUser =
        authMode === "register"
          ? await registerUser(payload)
          : await loginUser(payload);
      setUser(loggedInUser);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setAuthError(error.message || "Authentication failed.");
    }
  }

  // Create or update a task and persist immediately.
  async function handleTaskSubmit(event) {
    event.preventDefault();
    if (!user || !taskForm.title.trim()) return;

    try {
      if (editingTaskId) {
        const next = await updateTask(user.id, editingTaskId, {
          title: taskForm.title,
          dueDate: taskForm.dueDate,
          priority: taskForm.priority,
          notes: taskForm.notes
        });
        setTasks(next.sort((a, b) => a.order - b.order));
        setEditingTaskId(null);
      } else {
        const created = await addTask(user.id, taskForm);
        setTasks((prev) => [...prev, created].sort((a, b) => a.order - b.order));
      }

      setTaskForm({ title: "", dueDate: "", priority: "Medium", notes: "" });
    } catch (error) {
      alert(error.message || "Unable to save task.");
    }
  }

  function startEditTask(task) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      dueDate: task.dueDate,
      priority: task.priority,
      notes: task.notes
    });
  }

  async function handleToggleComplete(task) {
    if (!user) return;
    try {
      const next = await updateTask(user.id, task.id, {
        completed: !task.completed
      });
      setTasks(next.sort((a, b) => a.order - b.order));
    } catch (error) {
      alert("Unable to update task status.");
    }
  }

  async function handleDeleteTask(taskId) {
    if (!user) return;
    try {
      const next = await deleteTask(user.id, taskId);
      setTasks(next.sort((a, b) => a.order - b.order));
    } catch (error) {
      alert("Unable to delete task.");
    }
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setTasks([]);
    setEditingTaskId(null);
  }

  // Persist task order after drag-and-drop.
  async function handleDropTask(targetId) {
    if (!user || !draggingTaskId || draggingTaskId === targetId) return;
    const ids = [...tasks].map((t) => t.id);
    const from = ids.indexOf(draggingTaskId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, draggingTaskId);
    try {
      const next = await reorderTasks(user.id, ids);
      setTasks(next);
      setDraggingTaskId(null);
    } catch (error) {
      alert("Unable to reorder tasks.");
    }
  }

  // Export user's tasks as JSON backup.
  function handleExport() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tasks-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // Import tasks from JSON backup and persist locally.
  function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result || "[]"));
        const next = await importTasks(user.id, Array.isArray(parsed) ? parsed : []);
        setTasks(next.sort((a, b) => a.order - b.order));
      } catch (error) {
        alert("Invalid JSON file. Please import a valid task backup.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  if (!user) {
    return (
      <main className="page auth-page">
        <section className="auth-card">
          <h1>Local Task Manager</h1>
          <p>Offline-first task manager with browser-only authentication.</p>

          <form onSubmit={handleAuthSubmit} className="stack">
            {authMode === "register" && (
              <input
                type="text"
                placeholder="Full name"
                value={authForm.name}
                onChange={(e) =>
                  setAuthForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm((prev) => ({ ...prev, password: e.target.value }))
              }
              required
              minLength={6}
            />
            {authError && <p className="error-text">{authError}</p>}
            <button type="submit">
              {authMode === "register" ? "Register" : "Login"}
            </button>
          </form>

          <button
            className="ghost-btn"
            onClick={() =>
              setAuthMode((prev) => (prev === "login" ? "register" : "login"))
            }
          >
            {authMode === "login"
              ? "Need an account? Register"
              : "Already registered? Login"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1>Task Dashboard</h1>
          <p>Welcome, {user.name}</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
          <button className="ghost-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <h3>Total</h3>
          <p>{stats.total}</p>
        </article>
        <article className="stat-card">
          <h3>Completed</h3>
          <p>{stats.completed}</p>
        </article>
        <article className="stat-card">
          <h3>Pending</h3>
          <p>{stats.pending}</p>
        </article>
      </section>

      <section className="panel">
        <h2>{editingTaskId ? "Edit Task" : "Add Task"}</h2>
        <form onSubmit={handleTaskSubmit} className="task-form">
          <input
            type="text"
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) =>
              setTaskForm((prev) => ({ ...prev, title: e.target.value }))
            }
            required
          />
          <input
            type="date"
            value={taskForm.dueDate}
            onChange={(e) =>
              setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))
            }
          />
          <select
            value={taskForm.priority}
            onChange={(e) =>
              setTaskForm((prev) => ({ ...prev, priority: e.target.value }))
            }
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={taskForm.notes}
            onChange={(e) =>
              setTaskForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
          <button type="submit">{editingTaskId ? "Update" : "Add"}</button>
          {editingTaskId && (
            <button
              className="ghost-btn"
              type="button"
              onClick={() => {
                setEditingTaskId(null);
                setTaskForm({
                  title: "",
                  dueDate: "",
                  priority: "Medium",
                  notes: ""
                });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </section>

      <section className="panel">
        <div className="toolbar">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Completed</option>
            <option>Pending</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <button onClick={handleExport}>Export JSON</button>
          <label className="import-label">
            Import JSON
            <input type="file" accept="application/json" onChange={handleImport} />
          </label>
        </div>

        <div className="task-grid">
          {visibleTasks.length === 0 && <p>No tasks match current filters.</p>}
          {visibleTasks.map((task) => (
            <article
              key={task.id}
              className={`task-card ${task.completed ? "task-done" : ""}`}
              draggable
              onDragStart={() => setDraggingTaskId(task.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDropTask(task.id)}
            >
              <div className="task-head">
                <h3>{task.title}</h3>
                <span className={`priority ${task.priority.toLowerCase()}`}>
                  {task.priority}
                </span>
              </div>
              <p className="meta-row">
                Due: {task.dueDate || "Not set"} |{" "}
                <span className={task.completed ? "done" : "pending"}>
                  {task.completed ? "Completed" : "Pending"}
                </span>
              </p>
              {task.notes && <p>{task.notes}</p>}
              <div className="task-actions">
                <button onClick={() => handleToggleComplete(task)}>
                  {task.completed ? "Mark Pending" : "Mark Complete"}
                </button>
                <button className="ghost-btn" onClick={() => startEditTask(task)}>
                  Edit
                </button>
                <button className="danger-btn" onClick={() => handleDeleteTask(task.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
