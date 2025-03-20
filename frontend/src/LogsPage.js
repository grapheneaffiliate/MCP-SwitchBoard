import React, { useState, useEffect } from 'react';

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [selectedServer, setSelectedServer] = useState('');
  const [servers, setServers] = useState([]); // Assume you'll fetch server list

  useEffect(() => {
    // Fetch servers for dropdown - replace with your actual API call
    const fetchServers = async () => {
      try {
        const response = await fetch('http://localhost:8000/servers');
        if (response.ok) {
          const data = await response.json();
          setServers(data);
        } else {
          console.error('Failed to fetch servers');
        }
      } catch (error) {
        console.error('Error fetching servers:', error);
      }
    };

    fetchServers();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      if (selectedServer) {
        try {
          const response = await fetch(`http://localhost:8000/servers/${selectedServer}/logs`);
          if (response.ok) {
            const data = await response.json();
            setLogs(data);
          } else {
            console.error('Failed to fetch logs');
            setLogs([]); // Clear logs on error
          }
        } catch (error) {
          console.error('Error fetching logs:', error);
          setLogs([]); // Clear logs on error
        }
      } else {
        setLogs([]); // Clear logs if no server selected
      }
    };

    fetchLogs();
  }, [selectedServer]);

  return (
    <div>
      <h2>Server Logs</h2>
      
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="server-select" style={{ marginRight: '10px' }}>Select Server:</label>
        <select
          id="server-select"
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
        >
          <option value="">-- Select Server --</option>
          {servers.map(server => (
            <option key={server.id} value={server.id}>
              {server.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} style={{ fontFamily: 'monospace', fontSize: '12px', borderBottom: '1px dotted #eee', padding: '5px 0' }}>
              <span style={{ color: '#999', marginRight: '10px' }}>{log.timestamp}</span>
              <span style={{ fontWeight: 'bold' }}>Command:</span> {log.command}<br />
              <span style={{ fontWeight: 'bold' }}>Output:</span> 
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{log.output}</div>
              {log.success ? (
                <span style={{ color: 'green', marginLeft: '10px' }}>Success</span>
              ) : (
                <span style={{ color: 'red', marginLeft: '10px' }}>Failed</span>
              )}
            </div>
          ))
        ) : (
          selectedServer ? (
            <div>No logs available for the selected server.</div>
          ) : (
            <div>Select a server to view logs.</div>
          )
        )}
      </div>
    </div>
  );
}

export default LogsPage;
