import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import AddServerForm from './AddServerForm';
import EditServerForm from './EditServerForm';
import DeleteServerConfirmation from './DeleteServerConfirmation';
import sidebarMenuItems from './sidebarMenuItems';
import MetricsDashboard from './MetricsDashboard';
import TasksPage from './TasksPage';
import LogsPage from './LogsPage';
import CommandHistory from './CommandHistory';

function App() {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [command, setCommand] = useState('');
  const [commandOutput, setCommandOutput] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 0,
    ramUsage: 0,
    diskUsage: 0,
    networkActivity: { bytes_sent: 0, bytes_recv: 0 }
  });
  const [activeMenuItem, setActiveMenuItem] = useState('Dashboard');
  const [editingServer, setEditingServer] = useState(null);
  const [deletingServer, setDeletingServer] = useState(null);
  
  const websocketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, commandOutput]);

  useEffect(() => {
    // Connect to WebSocket
    const websocket = new WebSocket("ws://localhost:8000/ws/1");
    websocketRef.current = websocket;

    websocket.onopen = () => {
      console.log("Connected to WebSocket");
      setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Connected to MCP Switchboard`]);
      websocket.send(JSON.stringify({ type: "get_server_list" }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Message from server:", data);
      
      if (data.type === "server_list") {
        console.log("WebSocket message received: server_list", data.servers); // Log received server list
        setServers([...data.servers]);
        console.log("Servers state updated:", servers); // This will still show the old state due to closure
        
        // If there are servers and no server is selected, select the first one
        if (data.servers.length > 0 && !selectedServer) {
          setSelectedServer(data.servers[0].id);
        }
      }
      else if (data.type === "server_status_update") {
        setServers(prev => prev.map(server => 
          server.id === data.server_id 
            ? { ...server, status: data.status } 
            : server
        ));
        setMessages(prev => [...prev, data.message]);
      } 
      else if (data.type === "command_result") {
        setCommandOutput(prev => [...prev, {
          server: data.server_id,
          success: data.success,
          output: data.output
        }]);
        setMessages(prev => [...prev, data.message]);
      } 
      else {
        setMessages(prev => [...prev, JSON.stringify(data)]);
      }
    };

    websocket.onclose = () => {
      console.log("Disconnected from WebSocket");
      setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Disconnected from MCP Switchboard`]);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket connection error:", error);
      setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] WebSocket connection error: ${error.message}`]);
    };

    return () => {
      websocket.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch("http://localhost:8000/metrics", {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics({
          cpuUsage: data.cpu_usage,
          ramUsage: data.ram_usage,
          diskUsage: data.disk_usage,
          networkActivity: data.network_activity
        });
      } else {
        console.error("Failed to fetch system metrics, status:", response.status);
        setMessages(prev => [...prev, `Failed to fetch system metrics: HTTP status ${response.status}`]); // More specific error message with HTTP status
      }
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      setMessages(prev => [...prev, `Error fetching system metrics: ${error.message}`]); // Keep detailed error message with error.message
    }
  };

  // Fetch system metrics
  useEffect(() => {
    fetchSystemMetrics();
    const intervalId = setInterval(fetchSystemMetrics, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Connect to a server
  const handleConnectServer = (serverId, e) => {
    e.stopPropagation();
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: "connect_server",
        server_id: serverId
      }));
    }
  };

  // Disconnect from a server
  const handleDisconnectServer = (serverId, e) => {
    e.stopPropagation();
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: "disconnect_server",
        server_id: serverId
      }));
    }
  };

  // Save command to history
  const saveCommandToHistory = (cmd) => {
    // Get existing history from localStorage
    const savedHistory = localStorage.getItem('mcp_command_history');
    let history = [];
    
    if (savedHistory) {
      try {
        history = JSON.parse(savedHistory);
      } catch (error) {
        console.error('Error parsing command history:', error);
        history = [];
      }
    }
    
    // Only add if command is not already in history
    if (!history.includes(cmd)) {
      // Add new command to the beginning of the array
      history.unshift(cmd);
      
      // Limit history to 50 items
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      // Save back to localStorage
      localStorage.setItem('mcp_command_history', JSON.stringify(history));
    }
  };

  // Execute a command
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!selectedServer) {
      setMessages(prev => [...prev, "No server selected"]);
      return;
    }
    
    if (!command.trim()) {
      setMessages(prev => [...prev, "Command cannot be empty"]);
      return;
    }
    
    // Save command to history
    saveCommandToHistory(command);
    
    // Send command via WebSocket
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: "execute_command",
        server_id: selectedServer,
        command: command
      }));
      setCommand("");
    } else {
      // Fallback to REST API if WebSocket is not available
      try {
        const response = await fetch(`http://localhost:8000/execute/${selectedServer}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `command=${command}`
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Command executed successfully:", data);
          setMessages(prev => [...prev, data.message]);
          setCommandOutput(prev => [...prev, {
            server: selectedServer,
            success: true,
            output: data.output || data.message
          }]);
          setCommand("");
        } else {
          console.error("Command execution failed:", response.status);
          setMessages(prev => [...prev, `Command execution failed: ${response.status}`]);
        }
      } catch (error) {
        console.error("Error executing command:", error);
        setMessages(prev => [...prev, `Error executing command: ${error.message}`]);
      }
    }
  };

  // Format metrics for display
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle editing a server
  const handleEditServer = (server, e) => {
    e.stopPropagation();
    setEditingServer(server);
  };

  // Handle canceling server edit
  const handleCancelEdit = () => {
    setEditingServer(null);
  };

  // Handle server update
  const handleServerUpdate = () => {
    fetchSystemMetrics();
    setEditingServer(null);
  };

  // Handle deleting a server
  const handleDeleteServer = (server, e) => {
    e.stopPropagation();
    setDeletingServer(server);
  };

  // Handle canceling server deletion
  const handleCancelDelete = () => {
    setDeletingServer(null);
  };

  // Handle server deletion
  const handleServerDelete = () => {
    fetchSystemMetrics();
    setDeletingServer(null);
  };

  return (
    <div className="App">
      {/* Fixed Buttons */}
      <div>
        {/* Quick Add Server Button */}
        <div 
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 1000,
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => document.querySelector('.add-server-button')?.click()}
        >
          <span style={{ fontSize: '16px' }}>➕ Add New Server</span>
        </div>
      </div>
      {/* Header */}
      <header className="App-header">
        <div className="logo">
          <span className="logo-icon">🎛️</span>
          <h1>MCP SwitchBoard</h1>
        </div>
        <div className="user-menu">
          <button>Notifications</button>
          <button>Settings</button>
          <button>Admin</button>
        </div>
      </header>
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <h3>Main Menu</h3>
          <ul className="sidebar-menu">
            {sidebarMenuItems.filter(item => 
              ['Dashboard', 'Metrics Dashboard', 'Tasks', 'Logs'].includes(item.name)
            ).map((item, index) => (
              <li 
                key={index}
                className={activeMenuItem === item.name ? 'active' : ''}
                onClick={() => {
                  setActiveMenuItem(item.name);
                  console.log(`Navigating to: ${item.path}`);
                }}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="sidebar-section">
          <h3>MCP Servers</h3>
          <div className="server-search">
            <input 
              type="text" 
              placeholder="Search servers..." 
              className="server-search-input"
            />
          </div>
          <ul className="sidebar-menu servers-menu">
            {servers.map(server => (
              <li 
                key={server.id} 
                onClick={() => setSelectedServer(server.id)} 
                className={selectedServer === server.id ? 'selected' : ''}
              >
                <div className="server-item">
                  <div className="server-info">
                    <span className="server-name">{server.name}</span>
                    <span className="server-host">{server.host}:{server.port}</span>
                  </div>
                  <span className={`server-status-indicator ${server.status ? 'online' : 'offline'}`} 
                    title={server.status ? 'Online' : 'Offline'}>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="sidebar-section">
          <h3>Settings</h3>
          <ul className="sidebar-menu">
            {sidebarMenuItems.filter(item => 
              ['User Profile', 'Preferences', 'API Keys', 'Help'].includes(item.name)
            ).map((item, index) => (
              <li key={index}>
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="main-content">
        <h2 className="page-title">{activeMenuItem}</h2>

        {/* Main Content Display */}
        {activeMenuItem === 'Dashboard' && (
          <>
            {/* Server Management Section */}
            <section className="section">
              <h2>Servers</h2>
              <AddServerForm onAdd={fetchSystemMetrics} websocketRef={websocketRef} />
              {editingServer ? (
                <EditServerForm 
                  server={editingServer} 
                  onUpdate={handleServerUpdate} 
                  onCancel={handleCancelEdit} 
                />
              ) : null}
              {deletingServer ? (
                <DeleteServerConfirmation 
                  server={deletingServer} 
                  onConfirm={handleServerDelete} 
                  onCancel={handleCancelDelete} 
                />
              ) : null}
              <div className="server-grid">
                {servers.map(server => (
                  <div
                    key={server.id}
                    className={`server-block ${selectedServer === server.id ? 'selected' : ''}`}
                    onClick={() => setSelectedServer(server.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>{server.name}</h3>
                        <span style={{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: server.status ? 'green' : 'red'
                        }}></span>
                      </div>
                    <div className="server-info">
                      <p>Status: <span>{server.status ? 'Active' : 'Inactive'}</span></p>
                      <p>Host: <span>{server.host}</span></p>
                      <p>Port: <span>{server.port}</span></p>
                      <p>Type: <span>{server.type}</span></p>
                    </div>
                    <div className="server-actions">
                      {!server.status ? (
                        <button onClick={(e) => handleConnectServer(server.id, e)}>Connect</button>
                      ) : (
                        <button onClick={(e) => handleDisconnectServer(server.id, e)}>Disconnect</button>
                      )}
                      <button onClick={(e) => handleEditServer(server, e)}>Edit</button>
                      <button onClick={(e) => handleDeleteServer(server, e)} style={{ backgroundColor: 'var(--danger-color)' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Metrics Section */}
            <h2 className="page-title">Server Metrics</h2>
            <section className="section">
              <div className="metrics-container">
                <div className="metrics-block">
                  <h3>CPU Usage</h3>
                  <div className="metric-value">{systemMetrics.cpuUsage.toFixed(1)}%</div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${systemMetrics.cpuUsage}%`, backgroundColor: 'var(--primary-color)' }}></div>
                  </div>
                </div>
                
                <div className="metrics-block">
                  <h3>RAM Usage</h3>
                  <div className="metric-value">{systemMetrics.ramUsage.toFixed(1)}%</div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${systemMetrics.ramUsage}%`, backgroundColor: 'var(--warning-color)' }}></div>
                  </div>
                </div>
                
                <div className="metrics-block">
                  <h3>Disk Usage</h3>
                  <div className="metric-value">{systemMetrics.diskUsage.toFixed(1)}%</div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${systemMetrics.diskUsage}%`, backgroundColor: 'var(--secondary-color)' }}></div>
                  </div>
                </div>
                
                <div className="metrics-block">
                  <h3>Network Activity</h3>
                  <div className="metric-value">
                    ↑ {formatBytes(systemMetrics.networkActivity.bytes_sent)} | 
                    ↓ {formatBytes(systemMetrics.networkActivity.bytes_recv)}
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: '60%', backgroundColor: 'var(--danger-color)' }}></div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Task Execution Section */}
            <h2 className="page-title">Task Execution</h2>
            <section className="section">
              <div className="task-execution">
                <div className="task-card">
                  <h3>Execute Command</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="server-select">Select Server</label>
                      <select 
                        id="server-select"
                        className="form-control"
                        value={selectedServer || ''} 
                        onChange={(e) => setSelectedServer(Number(e.target.value))}
                      >
                        <option value="">Select Server</option>
                        {servers.map(server => (
                          <option key={server.id} value={server.id} disabled={!server.status}>
                            {server.name} {!server.status ? '(Disconnected)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="command-input">Command</label>
                      <input
                        id="command-input"
                        type="text"
                        className="form-control"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="Enter command..."
                        disabled={!selectedServer || !servers.find(s => s.id === selectedServer)?.status}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={!selectedServer || !servers.find(s => s.id === selectedServer)?.status}
                    >
                      Execute
                    </button>
                  </form>
                </div>
                
                <div className="task-card">
                  <div className="console-toolbar">
                    <h3>Console Output</h3>
                    <div className="console-toolbar-actions">
                      <button 
                        className="console-toolbar-btn" 
                        title="Clear console"
                        onClick={() => setCommandOutput([])}
                      >
                        🗑️
                      </button>
                      <button 
                        className="console-toolbar-btn" 
                        title="Copy to clipboard"
                        onClick={() => {
                          const text = commandOutput
                            .map(output => `[Server ${output.server}] ${output.output}`)
                            .join('\n');
                          navigator.clipboard.writeText(text)
                            .then(() => {
                              // Show temporary success message
                              const tempOutput = {
                                server: 'system',
                                success: true,
                                output: 'Console output copied to clipboard!'
                              };
                              setCommandOutput(prev => [...prev, tempOutput]);
                              // Remove message after 3 seconds
                              setTimeout(() => {
                                setCommandOutput(prev => prev.filter(o => o !== tempOutput));
                              }, 3000);
                            })
                            .catch(err => {
                              console.error('Failed to copy: ', err);
                              setCommandOutput(prev => [...prev, {
                                server: 'system',
                                success: false,
                                output: 'Failed to copy to clipboard: ' + err.message
                              }]);
                            });
                        }}
                      >
                        📋
                      </button>
                      <button 
                        className="console-toolbar-btn" 
                        title="Download logs"
                        onClick={() => {
                          const text = commandOutput
                            .map(output => `[${new Date().toISOString()}] [Server ${output.server}] ${output.output}`)
                            .join('\n');
                          const blob = new Blob([text], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `mcp-console-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          
                          // Show temporary success message
                          const tempOutput = {
                            server: 'system',
                            success: true,
                            output: 'Console output downloaded as log file!'
                          };
                          setCommandOutput(prev => [...prev, tempOutput]);
                          // Remove message after 3 seconds
                          setTimeout(() => {
                            setCommandOutput(prev => prev.filter(o => o !== tempOutput));
                          }, 3000);
                        }}
                      >
                        💾
                      </button>
                    </div>
                  </div>
                  <div className="console-output">
                    {commandOutput.length === 0 ? (
                      <div className="console-line">
                        <span className="console-timestamp">[{new Date().toLocaleTimeString()}]</span>
                        <span>Console ready. Select a server and execute a command to see output.</span>
                      </div>
                    ) : (
                      commandOutput.map((output, index) => (
                        <div key={index} className={`console-line ${output.success ? 'success' : 'error'}`}>
                          <span className="console-timestamp">[{new Date().toLocaleTimeString()}]</span>
                          <span className="server-tag">Server {output.server}</span>
                          {output.output}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <CommandHistory 
                    onSelectCommand={(cmd) => setCommand(cmd)} 
                  />
                </div>
              </div>
            </section>
            
            {/* System Messages */}
            <h2 className="page-title">System Messages</h2>
            <section className="section">
              <div className="messages-container">
                {messages.map((message, index) => (
                  <div key={index} className="message">{message}</div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </section>
          </>
        )}

        {activeMenuItem === 'Metrics Dashboard' && (
          <MetricsDashboard servers={servers} selectedServer={selectedServer} />
        )}

        {activeMenuItem === 'Tasks' && (
          <TasksPage servers={servers} selectedServer={selectedServer} />
        )}

        {activeMenuItem === 'Logs' && ( // Add LogsPage rendering
          <LogsPage />
        )}
      </main>
    </div>
  );
}

export default App;
