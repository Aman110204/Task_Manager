import React, { useEffect, useState } from 'react';

const API_URL = 'https://task-manager-wscv.onrender.com/api/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch all tasks from backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setTasks(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  // Create a new task
  const createTask = async () => {
    if (!title.trim()) return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      const newTask = await res.json();
      setTasks([...tasks, newTask]);
      setTitle('');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(task => task._id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Update a task (toggle completed)
  const toggleTask = async (task) => {
    try {
      const res = await fetch(`${API_URL}/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !task.completed }),
      });

      const updatedTask = await res.json();
      setTasks(tasks.map(t => (t._id === updatedTask._id ? updatedTask : t)));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '1rem' }}>
      <h1>📝 Task Manager</h1>

      <div style={{ display: 'flex', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button onClick={createTask} style={{ marginLeft: '0.5rem' }}>Add</button>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <li key={task._id} style={{ marginBottom: '0.5rem' }}>
              <span
                onClick={() => toggleTask(task)}
                style={{
                  textDecoration: task.completed ? 'line-through' : 'none',
                  cursor: 'pointer',
                  marginRight: '1rem',
                }}
              >
                {task.title}
              </span>
              <button onClick={() => deleteTask(task._id)}>❌</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
