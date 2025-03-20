import React, { useState } from 'react';

function BatchCommandExecutor({ servers, onExecute }) {
  const [commands, setCommands] = useState('');
  const [selectedServers, setSelectedServers] = useState([]);
  const [executionMode, setExecutionMode] = useState('sequential');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleServerToggle = (serverId) => {
    if (selectedServers.includes(serverId)) {
      setSelectedServers(selectedServers.filter(id => id !== serverId));
    } else {
      setSelectedServers([...selectedServers, serverId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedServers.length === servers.filter(s => s.status).length) {
      // If all are selected, deselect all
      setSelectedServers([]);
    } else {
      // Otherwise, select all connected servers
      setSelectedServers(servers.filter(s => s.status).map(s => s.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedServers.length === 0) {
      setError('Please select at least one server');
      return;
    }
    
    if (!commands.trim()) {
      setError('Please enter at least one command');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Split commands by newline
      const commandList = commands.split('\n').filter(cmd => cmd.trim());
      
      if (onExecute) {
        await onExecute(selectedServers, commandList, executionMode);
      }
      
      // Clear form after successful submission
      setCommands('');
      setSelectedServers([]);
    } catch (err) {
      setError(`Error executing commands: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="batch-executor">
      <h3>Batch Command Execution</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="commands">Commands (one per line)</label>
          <textarea
            id="commands"
            className="form-control"
            value={commands}
            onChange={(e) => setCommands(e.target.value)}
            placeholder="Enter commands, one per line..."
            rows={5}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label>Execution Mode</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="executionMode"
                value="sequential"
                checked={executionMode === 'sequential'}
                onChange={() => setExecutionMode('sequential')}
                disabled={isSubmitting}
              />
              Sequential (execute commands in order)
            </label>
            <label>
              <input
                type="radio"
                name="executionMode"
                value="parallel"
                checked={executionMode === 'parallel'}
                onChange={() => setExecutionMode('parallel')}
                disabled={isSubmitting}
              />
              Parallel (execute commands simultaneously)
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label>Select Servers</label>
          <div className="select-all">
            <button 
              type="button" 
              onClick={handleSelectAll}
              disabled={isSubmitting}
              className="btn-link"
            >
              {selectedServers.length === servers.filter(s => s.status).length ? 'Deselect All' : 'Select All Connected'}
            </button>
          </div>
          <div className="server-checkboxes">
            {servers.map(server => (
              <div key={server.id} className="server-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedServers.includes(server.id)}
                    onChange={() => handleServerToggle(server.id)}
                    disabled={!server.status || isSubmitting}
                  />
                  {server.name}
                  {!server.status && <span className="server-offline"> (Offline)</span>}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Executing...' : 'Execute Commands'}
          </button>
        </div>
      </form>
      
      <div className="batch-help">
        <h4>Tips:</h4>
        <ul>
          <li>Enter multiple commands, one per line</li>
          <li>Use <code>&&</code> to chain commands (e.g., <code>cd /tmp && ls -la</code>)</li>
          <li>Sequential mode executes commands in order, waiting for each to complete</li>
          <li>Parallel mode executes all commands simultaneously</li>
        </ul>
      </div>
    </div>
  );
}

export default BatchCommandExecutor;
