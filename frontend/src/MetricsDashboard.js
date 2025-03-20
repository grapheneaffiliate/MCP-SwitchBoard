import React, { useState, useEffect } from 'react';
import ServerMetricsChart from './ServerMetricsChart';

function MetricsDashboard({ servers, selectedServer }) {
  const [serverMetrics, setServerMetrics] = useState({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    network_in: 0,
    network_out: 0
  });
  const [activeTab, setActiveTab] = useState('current');
  const selectedServerData = servers.find(server => server.id === selectedServer);

  useEffect(() => {
    const fetchServerMetrics = async () => {
      if (selectedServer) {
        try {
          const response = await fetch(`http://localhost:8000/servers/${selectedServer}/metrics`);
          if (response.ok) {
            const data = await response.json();
            setServerMetrics(data);
          } else {
            console.error('Failed to fetch server metrics');
            setServerMetrics({
              cpu_usage: 0,
              memory_usage: 0,
              disk_usage: 0,
              network_in: 0,
              network_out: 0
            });
          }
        } catch (error) {
          console.error('Error fetching server metrics:', error);
          setServerMetrics({
            cpu_usage: 0,
            memory_usage: 0,
            disk_usage: 0,
            network_in: 0,
            network_out: 0
          });
        }
      } else {
        setServerMetrics({
          cpu_usage: 0,
          memory_usage: 0,
          disk_usage: 0,
          network_in: 0,
          network_out: 0
        });
      }
    };

    fetchServerMetrics();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchServerMetrics, 10000);
    
    return () => clearInterval(intervalId);
  }, [selectedServer]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="metrics-dashboard">
      <h2>Metrics Dashboard</h2>
      
      {selectedServerData ? (
        <div>
          <div className="server-header">
            <h3>{selectedServerData.name} Metrics</h3>
            <div className="server-status">
              Status: 
              <span className={selectedServerData.status ? "status-badge online" : "status-badge offline"}>
                {selectedServerData.status ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          
          <div className="metrics-tabs">
            <button 
              className={activeTab === 'current' ? 'active' : ''} 
              onClick={() => setActiveTab('current')}
            >
              Current Metrics
            </button>
            <button 
              className={activeTab === 'history' ? 'active' : ''} 
              onClick={() => setActiveTab('history')}
            >
              Historical Data
            </button>
          </div>
          
          {activeTab === 'current' ? (
            // Current metrics view
            <div className="metrics-container">
              <div className="metrics-block">
                <h3>CPU Usage</h3>
                <div className="metric-value">{serverMetrics.cpu_usage?.toFixed(1)}%</div>
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${serverMetrics.cpu_usage}%`, 
                      backgroundColor: (serverMetrics.cpu_usage || 0) > 80 ? 'var(--danger-color)' : 'var(--primary-color)' 
                    }}
                  ></div>
                </div>
              </div>

              <div className="metrics-block">
                <h3>Memory Usage</h3>
                <div className="metric-value">{serverMetrics.memory_usage?.toFixed(1)}%</div>
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${serverMetrics.memory_usage}%`, 
                      backgroundColor: (serverMetrics.memory_usage || 0) > 80 ? 'var(--danger-color)' : 'var(--warning-color)' 
                    }}
                  ></div>
                </div>
              </div>

              <div className="metrics-block">
                <h3>Disk Usage</h3>
                <div className="metric-value">{serverMetrics.disk_usage?.toFixed(1)}%</div>
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${serverMetrics.disk_usage}%`, 
                      backgroundColor: (serverMetrics.disk_usage || 0) > 90 ? 'var(--danger-color)' : 'var(--secondary-color)' 
                    }}
                  ></div>
                </div>
              </div>

              <div className="metrics-block">
                <h3>Network Activity</h3>
                <div className="metric-value">
                  <div>↑ {formatBytes(serverMetrics.network_in)}</div>
                  <div>↓ {formatBytes(serverMetrics.network_out)}</div>
                </div>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: '60%', backgroundColor: 'var(--danger-color)' }}></div>
                </div>
              </div>
            </div>
          ) : (
            // Historical data view with charts
            <div className="charts-container">
              <div className="chart-row">
                <ServerMetricsChart serverId={selectedServer} metricType="cpu" />
                <ServerMetricsChart serverId={selectedServer} metricType="memory" />
              </div>
              <div className="chart-row">
                <ServerMetricsChart serverId={selectedServer} metricType="disk" />
                <ServerMetricsChart serverId={selectedServer} metricType="network" />
              </div>
            </div>
          )}
          
          <div className="metrics-actions">
            <button className="btn btn-primary">
              <i className="fa fa-download"></i> Export Metrics
            </button>
            <button className="btn btn-secondary">
              <i className="fa fa-bell"></i> Configure Alerts
            </button>
          </div>
        </div>
      ) : (
        <div className="no-server-selected">
          <p>No server selected or available.</p>
          <p>Please select a server from the sidebar to view its metrics.</p>
        </div>
      )}
    </div>
  );
}

export default MetricsDashboard;
