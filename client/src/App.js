import React, { useEffect, useMemo, useRef, useState } from "react";
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
import TasksModule from "./components/Tasks/TasksModule";
import BudgetModule from "./components/Budget/BudgetModule";
import {
  addExpense,
  deleteExpense,
  getBudgetSummary,
  loadBudget,
  updateBudgetProfile
} from "./modules/budget/budgetService";
import LoansModule from "./components/Loans/LoansModule";
import {
  addLoan,
  deleteLoan,
  loadLoans,
  recordLoanPayment,
  withLoanProgress
} from "./modules/loans/loanService";
import JobsModule from "./components/Jobs/JobsModule";
import {
  addJob,
  deleteJob,
  getJobAnalytics,
  loadJobs,
  updateJob
} from "./modules/jobs/jobService";
import ReportsModule from "./components/Reports/ReportsModule";
import {
  buildFinanceReport,
  buildJobsReport,
  exportCSV,
  exportJSON
} from "./modules/reports/reportService";
import { monthKey, todayKey } from "./utils/indexedDB";
import { collectReminders } from "./utils/reminders";
import {
  loadReminderSettings,
  saveReminderSettings
} from "./services/storageService";
import { pushLocalNotifications } from "./services/notificationService";
import Dashboard from "./components/Dashboard/Dashboard";

const THEME_KEY = "task_manager_theme";
const TABS = ["Tasks", "Budget", "Loans", "Jobs", "Reports"];

const defaultTaskForm = {
  title: "",
  dueDate: "",
  priority: "Medium",
  notes: ""
};

const defaultBudget = {
  profile: {
    monthlyIncome: 0,
    monthlyLimit: 0,
    dailyReminderTime: "20:00"
  },
  profileHistory: [],
  expenses: [],
  meta: {
    lastExpenseLogDate: ""
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState(defaultTaskForm);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  const [budget, setBudget] = useState(defaultBudget);
  const [budgetForm, setBudgetForm] = useState({
    monthlyIncome: "",
    monthlyLimit: "",
    dailyReminderTime: "20:00"
  });
  const [expenseForm, setExpenseForm] = useState({
    date: todayKey(),
    amount: "",
    category: "Food",
    note: ""
  });

  const [loans, setLoans] = useState([]);
  const [loanForm, setLoanForm] = useState({
    name: "",
    totalAmount: "",
    emi: "",
    interestRate: "",
    nextDueDate: todayKey()
  });

  const [jobs, setJobs] = useState([]);
  const [jobForm, setJobForm] = useState({
    company: "",
    role: "",
    dateApplied: todayKey(),
    status: "Applied",
    notes: ""
  });
  const [jobStatusFilter, setJobStatusFilter] = useState("All");

  const [activeTab, setActiveTab] = useState("Tasks");
  const [theme, setTheme] = useState(localStorage.getItem(THEME_KEY) || "light");
  const [badges, setBadges] = useState({ budget: false, loans: false, jobs: false });
  const [activeReminders, setActiveReminders] = useState([]);
  const [reminderSettings, setReminderSettings] = useState({
    snoozeUntil: 0,
    disabled: { budget: false, loans: false, jobs: false }
  });

  const notifiedRef = useRef(new Set());

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  // Load all local-only data stores for the signed-in user.
  useEffect(() => {
    if (!user) return;

    getTasks(user.id)
      .then((nextTasks) => setTasks(nextTasks.sort((a, b) => a.order - b.order)))
      .catch(() => setTasks([]));

    loadBudget(user.id).then((nextBudget) => {
      setBudget(nextBudget);
      setBudgetForm({
        monthlyIncome: String(nextBudget.profile.monthlyIncome || ""),
        monthlyLimit: String(nextBudget.profile.monthlyLimit || ""),
        dailyReminderTime: nextBudget.profile.dailyReminderTime || "20:00"
      });
    });

    loadLoans(user.id).then((nextLoans) => setLoans(withLoanProgress(nextLoans)));
    loadJobs(user.id).then(setJobs);
    loadReminderSettings(user.id).then(setReminderSettings);
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Reminder flow: compute due reminders every minute and notify once per reminder ID.
  useEffect(() => {
    if (!user) return;

    const runReminderCheck = async () => {
      const collected = collectReminders({
        budget,
        loans,
        jobs,
        settings: reminderSettings
      });

      setBadges(collected.badges);
      setActiveReminders(collected.reminders);

      const fresh = collected.reminders.filter((item) => !notifiedRef.current.has(item.id));
      if (fresh.length) {
        await pushLocalNotifications(fresh);
        fresh.forEach((item) => notifiedRef.current.add(item.id));
      }
    };

    runReminderCheck();
    const id = setInterval(runReminderCheck, 60 * 1000);
    return () => clearInterval(id);
  }, [user, budget, loans, jobs, reminderSettings]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    return { total, completed, pending: total - completed };
  }, [tasks]);

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(searchText.toLowerCase()) ||
          task.notes.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus =
          statusFilter === "All" ||
          (statusFilter === "Completed" && task.completed) ||
          (statusFilter === "Pending" && !task.completed);
        const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      }),
    [tasks, searchText, statusFilter, priorityFilter]
  );

  const budgetSummary = useMemo(() => getBudgetSummary(budget, monthKey()), [budget]);
  const jobAnalytics = useMemo(() => getJobAnalytics(jobs), [jobs]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    try {
      const payload = { ...authForm };
      const loggedInUser =
        authMode === "register" ? await registerUser(payload) : await loginUser(payload);
      setUser(loggedInUser);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setAuthError(error.message || "Authentication failed.");
    }
  }

  async function handleTaskSubmit(event) {
    event.preventDefault();
    if (!user || !taskForm.title.trim()) return;

    try {
      if (editingTaskId) {
        const next = await updateTask(user.id, editingTaskId, taskForm);
        setTasks(next.sort((a, b) => a.order - b.order));
        setEditingTaskId(null);
      } else {
        const created = await addTask(user.id, taskForm);
        setTasks((prev) => [...prev, created].sort((a, b) => a.order - b.order));
      }
      setTaskForm(defaultTaskForm);
    } catch (error) {
      alert(error.message || "Unable to save task.");
    }
  }

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

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  // Persist reminder controls locally so they survive refresh/offline mode.
  async function handleSnoozeReminder(hours) {
    if (!user) return;
    const next = {
      ...reminderSettings,
      snoozeUntil: Date.now() + hours * 60 * 60 * 1000
    };
    setReminderSettings(next);
    await saveReminderSettings(user.id, next);
  }

  async function handleToggleReminderType(type) {
    if (!user) return;
    const next = {
      ...reminderSettings,
      disabled: {
        ...reminderSettings.disabled,
        [type]: !reminderSettings.disabled?.[type]
      }
    };
    setReminderSettings(next);
    await saveReminderSettings(user.id, next);
  }

  function handleExportTasks() {
    exportJSON("tasks-backup.json", tasks);
  }

  function handleImportTasks(event) {
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

  async function handleSaveBudgetProfile() {
    if (!user) return;
    const next = await updateBudgetProfile(user.id, {
      monthlyIncome: Number(budgetForm.monthlyIncome || 0),
      monthlyLimit: Number(budgetForm.monthlyLimit || 0),
      dailyReminderTime: budgetForm.dailyReminderTime || "20:00"
    });
    setBudget(next);
  }

  async function handleAddExpense() {
    if (!user || !expenseForm.amount) return;
    const next = await addExpense(user.id, expenseForm);
    setBudget(next);
    setExpenseForm((prev) => ({ ...prev, amount: "", note: "" }));
  }

  async function handleAddLoan() {
    if (!user) return;
    const next = await addLoan(user.id, loanForm);
    setLoans(withLoanProgress(next));
    setLoanForm({ name: "", totalAmount: "", emi: "", interestRate: "", nextDueDate: todayKey() });
  }

  async function handleRecordLoanPayment(loanId, amount) {
    if (!user) return;
    const next = await recordLoanPayment(user.id, loanId, amount);
    setLoans(withLoanProgress(next));
  }

  async function handleAddJob() {
    if (!user) return;
    const next = await addJob(user.id, jobForm);
    setJobs(next);
    setJobForm({ company: "", role: "", dateApplied: todayKey(), status: "Applied", notes: "" });
  }

  function exportFinanceJson() {
    exportJSON(`finance-report-${monthKey()}.json`, buildFinanceReport(budgetSummary, loans));
  }

  function exportFinanceCsv() {
    exportCSV(
      `finance-report-${monthKey()}.csv`,
      budgetSummary.monthExpenses.map((item) => ({
        date: item.date,
        category: item.category,
        amount: item.amount,
        note: item.note
      }))
    );
  }

  function exportJobsJson() {
    exportJSON(`jobs-report-${monthKey()}.json`, buildJobsReport(jobs, jobAnalytics));
  }

  function exportJobsCsv() {
    exportCSV(
      `jobs-report-${monthKey()}.csv`,
      jobs.map((job) => ({
        company: job.company,
        role: job.role,
        dateApplied: job.dateApplied,
        status: job.status,
        notes: job.notes
      }))
    );
  }

  function exportFullBackup() {
    exportJSON("full-productivity-backup.json", {
      generatedAt: new Date().toISOString(),
      tasks,
      budget,
      loans,
      jobs,
      reminderSettings
    });
  }

  if (!user) {
    return (
      <main className="page auth-page">
        <section className="auth-card">
          <h1>Productivity Mini App</h1>
          <p>Offline-first personal productivity + finance tracker.</p>
          <form onSubmit={handleAuthSubmit} className="stack">
            {authMode === "register" && (
              <input
                type="text"
                placeholder="Full name"
                value={authForm.name}
                onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
            />
            {authError && <p className="error-text">{authError}</p>}
            <button type="submit">{authMode === "register" ? "Register" : "Login"}</button>
          </form>
          <button
            className="ghost-btn"
            onClick={() => setAuthMode((prev) => (prev === "login" ? "register" : "login"))}
          >
            {authMode === "login" ? "Need an account? Register" : "Already registered? Login"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page app-page">
      <header className="header">
        <div>
          <h1>Welcome, {user.name}</h1>
          <p>Personal Productivity + Finance Dashboard</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
          <button className="ghost-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <Dashboard
        pendingTasks={tasks.filter((task) => !task.completed).length}
        todaysExpense={budget.expenses
          .filter((item) => item.date === todayKey())
          .reduce((acc, item) => acc + Number(item.amount || 0), 0)}
        budgetUsage={budgetSummary.percentage}
        savings={budgetSummary.savings}
        upcomingEmis={loans.filter((loan) => Number(loan.remainingBalance || 0) > 0).length}
        jobStats={`${jobAnalytics.total} apps | ${jobAnalytics.interviewRate.toFixed(1)}% interview rate`}
        reminders={activeReminders}
        onSnooze={handleSnoozeReminder}
        onToggleReminderType={handleToggleReminderType}
      />

      <section className="content-area">
        {activeTab === "Tasks" && (
          <TasksModule
            stats={stats}
            taskForm={taskForm}
            setTaskForm={setTaskForm}
            editingTaskId={editingTaskId}
            onTaskSubmit={handleTaskSubmit}
            onCancelEdit={() => {
              setEditingTaskId(null);
              setTaskForm(defaultTaskForm);
            }}
            searchText={searchText}
            setSearchText={setSearchText}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            visibleTasks={visibleTasks}
            setDraggingTaskId={setDraggingTaskId}
            onDropTask={handleDropTask}
            onToggleComplete={async (task) => {
              const next = await updateTask(user.id, task.id, { completed: !task.completed });
              setTasks(next.sort((a, b) => a.order - b.order));
            }}
            onStartEdit={(task) => {
              setEditingTaskId(task.id);
              setTaskForm({
                title: task.title,
                dueDate: task.dueDate,
                priority: task.priority,
                notes: task.notes
              });
            }}
            onDeleteTask={async (taskId) => {
              const next = await deleteTask(user.id, taskId);
              setTasks(next.sort((a, b) => a.order - b.order));
            }}
            onExport={handleExportTasks}
            onImport={handleImportTasks}
          />
        )}

        {activeTab === "Budget" && (
          <BudgetModule
            budget={budget}
            budgetSummary={budgetSummary}
            budgetForm={budgetForm}
            setBudgetForm={setBudgetForm}
            expenseForm={expenseForm}
            setExpenseForm={setExpenseForm}
            onSaveBudget={handleSaveBudgetProfile}
            onAddExpense={handleAddExpense}
            onDeleteExpense={async (expenseId) => {
              const next = await deleteExpense(user.id, expenseId);
              setBudget(next);
            }}
            budgetReminderDue={badges.budget}
          />
        )}

        {activeTab === "Loans" && (
          <LoansModule
            loans={loans}
            loanForm={loanForm}
            setLoanForm={setLoanForm}
            onAddLoan={handleAddLoan}
            onRecordPayment={handleRecordLoanPayment}
            onDeleteLoan={async (loanId) => {
              const next = await deleteLoan(user.id, loanId);
              setLoans(withLoanProgress(next));
            }}
            loanReminderDue={badges.loans}
          />
        )}

        {activeTab === "Jobs" && (
          <JobsModule
            jobs={jobs}
            analytics={jobAnalytics}
            jobForm={jobForm}
            setJobForm={setJobForm}
            statusFilter={jobStatusFilter}
            setStatusFilter={setJobStatusFilter}
            onAddJob={handleAddJob}
            onUpdateStatus={async (jobId, status) => {
              const next = await updateJob(user.id, jobId, { status });
              setJobs(next);
            }}
            onDeleteJob={async (jobId) => {
              const next = await deleteJob(user.id, jobId);
              setJobs(next);
            }}
            jobReminderDue={badges.jobs}
          />
        )}

        {activeTab === "Reports" && (
          <ReportsModule
            onExportFinanceJson={exportFinanceJson}
            onExportFinanceCsv={exportFinanceCsv}
            onExportJobsJson={exportJobsJson}
            onExportJobsCsv={exportJobsCsv}
            onExportFullBackup={exportFullBackup}
          />
        )}
      </section>

      <nav className="bottom-nav">
        {TABS.map((tab) => {
          const showBadge =
            (tab === "Budget" && badges.budget) ||
            (tab === "Loans" && badges.loans) ||
            (tab === "Jobs" && badges.jobs);

          return (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {showBadge && <span className="tab-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>
    </main>
  );
}

export default App;
