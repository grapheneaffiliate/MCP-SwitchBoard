import React, { useState, useEffect } from 'react';
import BatchCommandExecutor from './BatchCommandExecutor';

function TasksPage({ servers, selectedServer }) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ name: '', command: '', server_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tasks when component mounts or selectedServer changes
  useEffect(() => {
    fetchTasks();
  }, [selectedServer]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/tasks');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };

  const handleServerChange = (e) => {
    setNewTask({ ...newTask, server_id: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.name || !newTask.command || !newTask.server_id) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reset form and fetch updated tasks
      setNewTask({ name: '', command: '', server_id: '' });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Fetch updated tasks
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunTask = async (taskId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/tasks/${taskId}/run`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Fetch updated tasks to show new status
      fetchTasks();
    } catch (error) {
      console.error('Error running task:', error);
      setError('Failed to run task. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-badge completed';
      case 'failed':
        return 'status-badge failed';
      case 'running':
        return 'status-badge running';
      case 'pending':
        return 'status-badge pending';
      default:
        return 'status-badge';
    }
  };

  // Handle batch command execution
  const handleBatchExecute = async (serverIds, commandList, executionMode) => {
    setLoading(true);
    setError(null);
    
    try {
      // For sequential execution
      if (executionMode === 'sequential') {
        for (const command of commandList) {
          for (const serverId of serverIds) {
            const response = await fetch(`http://localhost:8000/execute/${serverId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: `command=${encodeURIComponent(command)}`
            });
            
            if (!response.ok) {
              throw new Error(`Failed to execute command on server ${serverId}: ${response.statusText}`);
            }
          }
        }
      } 
      // For parallel execution
      else {
        const promises = [];
        
        for (const command of commandList) {
          for (const serverId of serverIds) {
            const promise = fetch(`http://localhost:8000/execute/${serverId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: `command=${encodeURIComponent(command)}`
            });
            
            promises.push(promise);
          }
        }
        
        const results = await Promise.allSettled(promises);
        const failures = results.filter(r => r.status === 'rejected');
        
        if (failures.length > 0) {
          throw new Error(`${failures.length} command(s) failed to execute`);
        }
      }
      
      // Show success message
      alert('Batch command execution completed successfully!');
    } catch (error) {
      console.error('Error executing batch commands:', error);
      setError(`Batch execution error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tasks-page">
      <h2>Task Management</h2>
      
      <div className="tasks-tabs">
        <button 
          className={activeTab === 'tasks' ? 'active' : ''} 
          onClick={() => setActiveTab('tasks')}
        >
          Scheduled Tasks
        </button>
        <button 
          className={activeTab === 'batch' ? 'active' : ''} 
          onClick={() => setActiveTab('batch')}
        >
          Batch Command Execution
        </button>
      </div>
      
      {activeTab === 'tasks' ? (
        <>
          {/* Create Task Form */}
          <section className="section">
            <h3>Create New Task</h3>
            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label htmlFor="name">Task Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newTask.name}
                  onChange={handleInputChange}
                  placeholder="Enter task name"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="command">Command</label>
                <input
                  type="text"
                  id="command"
                  name="command"
                  value={newTask.command}
                  onChange={handleInputChange}
                  placeholder="Enter command to execute"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="server_id">Server</label>
                <select
                  id="server_id"
                  name="server_id"
                  value={newTask.server_id}
                  onChange={handleServerChange}
                  className="form-control"
                >
                  <option value="">Select a server</option>
                  {servers.map(server => (
                    <option key={server.id} value={server.id}>
                      {server.name} {!server.status ? '(Disconnected)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </form>
            
            {error && <div className="error-message">{error}</div>}
          </section>
          
          {/* Task List */}
          <section className="section">
            <h3>Tasks</h3>
            {loading && tasks.length === 0 ? (
              <p>Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p>No tasks found. Create a new task to get started.</p>
            ) : (
              <div className="task-list">
                <table className="task-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Command</th>
                      <th>Server</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Last Run</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => {
                      const taskServer = servers.find(s => s.id === task.server_id);
                      return (
                        <tr key={task.id}>
                          <td>{task.name}</td>
                          <td className="command-cell">{task.command}</td>
                          <td>{taskServer ? taskServer.name : 'Unknown'}</td>
                          <td>
                            <span className={getStatusBadgeClass(task.status)}>
                              {task.status}
                            </span>
                          </td>
                          <td>{formatDate(task.created_at)}</td>
                          <td>{task.last_run ? formatDate(task.last_run) : 'Never'}</td>
                          <td className="actions-cell">
                            <button 
                              onClick={() => handleRunTask(task.id)}
                              disabled={task.status === 'running' || !taskServer?.status}
                              className="btn btn-sm btn-primary"
                            >
                              Run
                            </button>
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="btn btn-sm btn-danger"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          
          {/* Task History */}
          <section className="section">
            <h3>Task History</h3>
            <p>Recent task executions will be displayed here.</p>
            {/* Task history implementation would go here */}
            <div className="task-history-placeholder">
              <p>Task history feature coming soon!</p>
            </div>
          </section>
        </>
      ) : (
        <section className="section">
          <BatchCommandExecutor 
            servers={servers} 
            onExecute={handleBatchExecute} 
          />
        </section>
      )}
    </div>
  );
}

export default TasksPage;
