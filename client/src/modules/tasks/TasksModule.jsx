import React from "react";

export default function TasksModule({
  stats,
  taskForm,
  setTaskForm,
  editingTaskId,
  onTaskSubmit,
  onCancelEdit,
  searchText,
  setSearchText,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  visibleTasks,
  setDraggingTaskId,
  onDropTask,
  onToggleComplete,
  onStartEdit,
  onDeleteTask,
  onExport,
  onImport
}) {
  return (
    <section className="stack-lg">
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
        <form onSubmit={onTaskSubmit} className="task-form">
          <input
            type="text"
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <input
            type="date"
            value={taskForm.dueDate}
            onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
          />
          <select
            value={taskForm.priority}
            onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <input
            type="text"
            placeholder="Notes"
            value={taskForm.notes}
            onChange={(e) => setTaskForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
          <button type="submit">{editingTaskId ? "Update" : "Add"}</button>
          {editingTaskId && (
            <button className="ghost-btn" type="button" onClick={onCancelEdit}>
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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            <option>Completed</option>
            <option>Pending</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <button onClick={onExport}>Export JSON</button>
          <label className="import-label">
            Import JSON
            <input type="file" accept="application/json" onChange={onImport} />
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
              onDrop={() => onDropTask(task.id)}
            >
              <div className="task-head">
                <h3>{task.title}</h3>
                <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
              </div>
              <p className="meta-row">
                Due: {task.dueDate || "Not set"} |{" "}
                <span className={task.completed ? "done" : "pending"}>
                  {task.completed ? "Completed" : "Pending"}
                </span>
              </p>
              {task.notes && <p>{task.notes}</p>}
              <div className="task-actions">
                <button onClick={() => onToggleComplete(task)}>
                  {task.completed ? "Mark Pending" : "Mark Complete"}
                </button>
                <button className="ghost-btn" onClick={() => onStartEdit(task)}>
                  Edit
                </button>
                <button className="danger-btn" onClick={() => onDeleteTask(task.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
