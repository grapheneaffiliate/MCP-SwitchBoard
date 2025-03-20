import React, { useState, useEffect } from 'react';
import './App.css';

function EditServerForm({ server, onUpdate, onCancel }) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [type, setType] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Initialize form with server data when component mounts or server changes
  useEffect(() => {
    if (server) {
      setName(server.name || '');
      setHost(server.host || '');
      setPort(server.port ? server.port.toString() : '');
      setType(server.type || '');
      setApiKey(server.api_key || '');
    }
  }, [server]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const updatedServer = {
      name,
      host,
      port: parseInt(port),
      type,
      apiKey,
    };

    try {
      const response = await fetch(`http://localhost:8000/servers/${server.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedServer),
      });

      if (response.ok) {
        console.log('Server updated successfully');
        onUpdate(); // Notify the parent component to refresh the server list
      } else {
        console.error('Failed to update server');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="server-block" style={{ padding: '20px', marginBottom: '20px' }}>
      <h3>Edit MCP Server</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="server-name" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Server Name:
          </label>
          <input
            id="server-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="server-host" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Host:
          </label>
          <input
            id="server-host"
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="server-port" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Port:
          </label>
          <input
            id="server-port"
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="server-type" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Type:
          </label>
          <select
            id="server-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          >
            <option value="">Select Server Type</option>
            <option value="github">GitHub</option>
            <option value="playwright">Playwright</option>
            <option value="api">API</option>
            <option value="gitlab">GitLab</option>
            <option value="postgres">PostgreSQL</option>
            <option value="redis">Redis</option>
            <option value="sqlite">SQLite</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="server-apikey" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            API Key:
          </label>
          <input
            id="server-apikey"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div className="server-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Update Server
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditServerForm;
