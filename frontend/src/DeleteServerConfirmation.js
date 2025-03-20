import React from 'react';
import './App.css';

function DeleteServerConfirmation({ server, onConfirm, onCancel }) {
  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:8000/servers/${server.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('Server deleted successfully');
        onConfirm(); // Notify the parent component to refresh the server list
      } else {
        const errorData = await response.json();
        console.error('Failed to delete server:', errorData.detail);
        alert(`Failed to delete server: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error deleting server: ${error.message}`);
    }
  };

  return (
    <div className="server-block" style={{ padding: '20px', marginBottom: '20px' }}>
      <h3>Delete MCP Server</h3>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px' }}>
          Are you sure you want to delete the server <strong>{server.name}</strong>?
        </p>
        <p style={{ marginBottom: '10px', color: 'var(--danger-color)' }}>
          This action cannot be undone.
        </p>
        {server.status && (
          <p style={{ marginBottom: '10px', color: 'var(--danger-color)', fontWeight: 'bold' }}>
            You must disconnect the server before deleting it.
          </p>
        )}
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
          type="button"
          onClick={handleDelete}
          disabled={server.status}
          style={{
            backgroundColor: 'var(--danger-color)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: server.status ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            opacity: server.status ? 0.7 : 1
          }}
        >
          Delete Server
        </button>
      </div>
    </div>
  );
}

export default DeleteServerConfirmation;
