import React, { useState, useEffect } from 'react';

function CommandHistory({ onSelectCommand }) {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [filterText, setFilterText] = useState('');
  
  // Load command history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('mcp_command_history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
      } catch (error) {
        console.error('Error parsing command history:', error);
        setHistory([]);
      }
    }
  }, []);
  
  // Filter history based on filterText
  const filteredHistory = history.filter(cmd => 
    cmd.toLowerCase().includes(filterText.toLowerCase())
  );
  
  // Clear command history
  const clearHistory = () => {
    localStorage.removeItem('mcp_command_history');
    setHistory([]);
  };
  
  // Handle command selection
  const handleSelectCommand = (cmd) => {
    onSelectCommand(cmd);
    setShowHistory(false);
  };
  
  return (
    <div className="command-history">
      <button 
        className="command-history-toggle" 
        onClick={() => setShowHistory(!showHistory)}
      >
        {showHistory ? 'Hide command history' : 'Show command history'}
      </button>
      
      {showHistory && (
        <div className="command-history-dropdown">
          <div className="command-history-header">
            <input
              type="text"
              className="command-history-filter"
              placeholder="Filter commands..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              autoFocus
            />
            <button 
              className="command-history-clear"
              onClick={clearHistory}
              title="Clear command history"
            >
              Clear
            </button>
          </div>
          
          <div className="command-history-list">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((cmd, index) => (
                <div 
                  key={index} 
                  className="command-history-item"
                  onClick={() => handleSelectCommand(cmd)}
                  title={cmd}
                >
                  {cmd}
                </div>
              ))
            ) : (
              <div className="command-history-empty">
                {history.length === 0 
                  ? 'No command history' 
                  : 'No matching commands found'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CommandHistory;
