import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './TaskManager.css';

function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.getTasks();
      setTasks(response.tasks);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.users);
    } catch (err) {
      setError(err.message);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    setIsLoading(true);
    setError('');

    try {
      const assignedUser = users.find(user => 
        user.username.toLowerCase() === newUsername.toLowerCase()
      );

      if (newUsername && !assignedUser) {
        setError('User not found');
        return;
      }

      await api.createTask({
        text: newTask,
        assigned_to: assignedUser?.id
      });

      setNewTask('');
      setNewUsername('');
      fetchTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (taskId) => {
    try {
      await api.updateTask(taskId, {
        completed: !tasks.find(t => t.id === taskId).completed
      });
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        await api.deleteTask(taskId);
        setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
        setError(err.message);
    }
  };

  return (
    <div className="task-manager">
      <div className="card">
        <div className="card-header">
          <h2>Task Manager</h2>
        </div>
        <div className="card-content">
          {error && <div className="error-message">{error}</div>}
          
          <div className="task-input">
            <input
              type="text"
              placeholder="Enter a new task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="task-text-input"
            />
            <input
              type="text"
              placeholder="Assign to username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="username-input"
              list="users-list"
            />
            <datalist id="users-list">
              {users.map(user => (
                <option key={user.id} value={user.username} />
              ))}
            </datalist>
            <button 
              onClick={addTask} 
              disabled={isLoading}
              className="add-task-button"
            >
              {isLoading ? "Adding..." : "Add Task"}
            </button>
          </div>

          <table className="tasks-table">
            <thead>
              <tr>
                <th className="w-[50px]">Done</th>
                <th>Task</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>
                    <input
                      type="checkbox"
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="task-checkbox"
                    />
                  </td>
                  <td>
                    <label
                      htmlFor={`task-${task.id}`}
                      className={task.completed ? 'completed-task' : ''}
                    >
                      {task.text}
                    </label>
                  </td>
                  <td>{task.username || 'Unassigned'}</td>
                  <td>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="delete-button"
                      title="Delete task"
                    >
                      <span className="button-icon">🗑️</span>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TaskManager; 