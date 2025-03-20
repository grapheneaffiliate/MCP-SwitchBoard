import React, { useState, useEffect } from 'react';

function ServerMetricsChart({ serverId, metricType }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetricsHistory = async () => {
      if (!serverId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would fetch historical data
        // For now, we'll generate mock data
        const mockData = generateMockData(metricType);
        setChartData(mockData);
      } catch (err) {
        console.error('Error fetching metrics history:', err);
        setError('Failed to load metrics history');
      } finally {
        setLoading(false);
      }
    };

    fetchMetricsHistory();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchMetricsHistory, 30000);
    
    return () => clearInterval(intervalId);
  }, [serverId, metricType]);

  const generateMockData = (type) => {
    // Generate realistic looking data based on metric type
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() - (23 - i) * 15 * 60000);
      let value;
      
      switch(type) {
        case 'cpu':
          // CPU usage between 10% and 80%
          value = 10 + Math.random() * 70;
          break;
        case 'memory':
          // Memory usage between 20% and 70%
          value = 20 + Math.random() * 50;
          break;
        case 'disk':
          // Disk usage between 30% and 90%
          value = 30 + Math.random() * 60;
          break;
        case 'network':
          // Network usage between 0 and 100 MB/s
          value = Math.random() * 100;
          break;
        default:
          value = Math.random() * 100;
      }
      
      data.push({
        time: time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        value: parseFloat(value.toFixed(1))
      });
    }
    
    return data;
  };

  const getChartColor = () => {
    switch(metricType) {
      case 'cpu': return '#5499C7'; // primary-color
      case 'memory': return '#f39c12'; // warning-color
      case 'disk': return '#58D68D'; // secondary-color
      case 'network': return '#e74c3c'; // danger-color
      default: return '#5499C7';
    }
  };

  const getMetricLabel = () => {
    switch(metricType) {
      case 'cpu': return 'CPU Usage (%)';
      case 'memory': return 'Memory Usage (%)';
      case 'disk': return 'Disk Usage (%)';
      case 'network': return 'Network (MB/s)';
      default: return 'Value';
    }
  };

  if (loading) {
    return <div className="chart-loading">Loading chart data...</div>;
  }

  if (error) {
    return <div className="chart-error">{error}</div>;
  }

  // Calculate chart dimensions and scales
  const chartWidth = 600;
  const chartHeight = 200;
  const paddingX = 40;
  const paddingY = 20;
  const graphWidth = chartWidth - (paddingX * 2);
  const graphHeight = chartHeight - (paddingY * 2);
  
  // Find min and max values for scaling
  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));
  const valueRange = maxValue - minValue;
  
  // Create points for the line
  const points = chartData.map((d, i) => {
    const x = paddingX + (i * (graphWidth / (chartData.length - 1)));
    const y = paddingY + graphHeight - ((d.value - minValue) / valueRange) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="metrics-chart">
      <h4>{getMetricLabel()} - Last 6 Hours</h4>
      <svg width={chartWidth} height={chartHeight}>
        {/* Y-axis */}
        <line 
          x1={paddingX} 
          y1={paddingY} 
          x2={paddingX} 
          y2={paddingY + graphHeight} 
          stroke="#ccc" 
          strokeWidth="1" 
        />
        
        {/* X-axis */}
        <line 
          x1={paddingX} 
          y1={paddingY + graphHeight} 
          x2={paddingX + graphWidth} 
          y2={paddingY + graphHeight} 
          stroke="#ccc" 
          strokeWidth="1" 
        />
        
        {/* Y-axis labels */}
        <text x={paddingX - 5} y={paddingY} textAnchor="end" fontSize="10" fill="#666">
          {Math.ceil(maxValue)}
        </text>
        <text x={paddingX - 5} y={paddingY + graphHeight} textAnchor="end" fontSize="10" fill="#666">
          {Math.floor(minValue)}
        </text>
        <text x={paddingX - 5} y={paddingY + graphHeight/2} textAnchor="end" fontSize="10" fill="#666">
          {Math.floor(minValue + valueRange/2)}
        </text>
        
        {/* X-axis labels (show only a few for clarity) */}
        {[0, 8, 16, 23].map(i => (
          <text 
            key={i}
            x={paddingX + (i * (graphWidth / (chartData.length - 1)))} 
            y={paddingY + graphHeight + 15} 
            textAnchor="middle" 
            fontSize="10" 
            fill="#666"
          >
            {chartData[i].time}
          </text>
        ))}
        
        {/* The line chart */}
        <polyline
          fill="none"
          stroke={getChartColor()}
          strokeWidth="2"
          points={points}
        />
        
        {/* Data points */}
        {chartData.map((d, i) => {
          const x = paddingX + (i * (graphWidth / (chartData.length - 1)));
          const y = paddingY + graphHeight - ((d.value - minValue) / valueRange) * graphHeight;
          return (
            <circle 
              key={i}
              cx={x} 
              cy={y} 
              r="3" 
              fill={getChartColor()} 
            />
          );
        })}
      </svg>
      <div className="chart-legend">
        <div className="current-value">
          Current: <strong>{chartData[chartData.length - 1].value}{metricType !== 'network' ? '%' : ' MB/s'}</strong>
        </div>
        <div className="average-value">
          Average: <strong>{(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1)}{metricType !== 'network' ? '%' : ' MB/s'}</strong>
        </div>
      </div>
    </div>
  );
}

export default ServerMetricsChart;
