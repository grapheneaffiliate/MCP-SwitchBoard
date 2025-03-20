import React, { useState } from 'react';
import './App.css';

function AddServerForm({ onAdd, websocketRef }) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('');
  const [type, setType] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // State for error message

  const handleSubmit = async (event) => {
    console.log("handleSubmit in AddServerForm.js called");
    event.preventDefault();
    setErrorMessage(''); // Clear previous error messages

    const newServer = {
      name,
      host,
      port: parseInt(port),
      type,
      apiKey,
    };

    try {
      const response = await fetch('http://localhost:8000/create_server_test/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newServer),
      });
      console.log("POST request to /servers sent (before sending):", newServer); // Log newServer object
      console.log("POST request to /servers sent:", JSON.stringify(newServer)); // Log JSON stringified newServer

      if (response.ok) {
        console.log('Server added successfully, response ok');
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          console.log("Sending get_server_list message via WebSocket");
          websocketRef.current.send(JSON.stringify({ type: "get_server_list" }));
        } else {
          console.log("WebSocket not open, cannot send get_server_list message");
        }
        onAdd(); // Notify the parent component to refresh the system metrics (might not be needed anymore)
        // Clear the form
        setName('');
        setHost('localhost');
        setPort('');
        setType('');
        setApiKey('');
        setIsFormVisible(false);
      } else {
        console.error('Failed to add server');
        setErrorMessage('Failed to add server. Please check the server details.'); // Set error message
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error adding server. Please try again.'); // Set error message for network or other errors
    }
  };

  return (
    <div className="add-server-container">
      {!isFormVisible ? (
        <button 
          className="add-server-button"
          onClick={() => setIsFormVisible(true)}
          style={{
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--border-radius)',
            cursor: 'pointer',
            marginBottom: '20px',
            fontWeight: '500'
          }}
        >
          + Add New MCP Server
        </button>
      ) : (
        <div className="server-block" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3>Add New MCP Server</h3>
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
                onClick={() => setIsFormVisible(false)}
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
                Add Server
              </button>
            </div>
          </form>
          {errorMessage && ( // Display error message if it exists
            <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AddServerForm;
