import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [command, setCommand] = useState('');
  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [diskUsage, setDiskUsage] = useState(0);
  const [networkActivity, setNetworkActivity] = useState({ bytes_sent: 0, bytes_recv: 0 });

  useEffect(() => {
    const websocket = new WebSocket("ws://localhost:8000/ws/1");

    websocket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    websocket.onmessage = (event) => {
      console.log("Message from server: ", event.data);
      setMessages(prevMessages => [...prevMessages, event.data]);
    };

    websocket.onclose = () => {
      console.log("Disconnected from WebSocket");
    };

    return () => {
      websocket.close();
    };
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("http://localhost:8000/metrics", {
          headers: {
            'Authorization': 'Bearer fake_token'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCpuUsage(data.cpu_usage);
          setRamUsage(data.ram_usage);
          setDiskUsage(data.disk_usage);
          setNetworkActivity(data.network_activity);
        } else {
          console.error("Failed to fetch metrics");
        }
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    };

    fetchMetrics();
    const intervalId = setInterval(fetchMetrics, 5000); // Fetch metrics every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Command submitted:", command);

    try {
      const response = await fetch(`http://localhost:8000/execute/1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Bearer fake_token'
        },
        body: `command=${command}`
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Command executed successfully:", data);
        setMessages(prevMessages => [...prevMessages, data.message]);
      } else {
        console.error("Command execution failed:", response.status);
      }
    } catch (error) {
      console.error("Error executing command:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>MCP Switchboard</h1>
      </header>
      <div className="dashboard">
        <div className="server-block">
          <h3>Server 1</h3>
          <p>IP Address: 127.0.0.1</p>
          <p>Status: Active</p>
        </div>
        <div className="server-block">
          <h3>Server 2</h3>
          <p>IP Address: 127.0.0.2</p>
          <p>Status: Inactive</p>
        </div>
        <div className="server-block">
          <h3>Server 3</h3>
          <p>IP Address: 127.0.0.3</p>
          <p>Status: Active</p>
        </div>
      </div>
      <div>
        <h2>Messages from server:</h2>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Task Execution</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Command:
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            />
          </label>
          <button type="submit">Execute</button>
        </form>
      </div>
      <div>
        <h2>Server Metrics</h2>
        <p>CPU Usage: {cpuUsage}%</p>
        <p>RAM Usage: {ramUsage}%</p>
        <p>Disk Usage: {diskUsage}%</p>
        <p>Network Activity: Sent: {networkActivity.bytes_sent}, Received: {networkActivity.bytes_recv}</p>
      </div>
    </div>
  );
}

export default App;
