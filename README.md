# MCP Switchboard

**A dashboard for managing and monitoring Model Context Protocol (MCP) servers.**

This application provides a user interface to connect, manage, and monitor MCP servers. It allows users to execute tools provided by MCP servers and monitor their metrics in real-time.

## Features

- **Server Management**: Connect to and disconnect from MCP servers.
- **Task Execution**: Execute tools provided by connected MCP servers.
- **Metrics Monitoring**: View system and server metrics in real-time.

## Running the Application

### Backend

1. Install dependencies:
   ```
   cd mcp-switchboard
   pip install -r backend/requirements.txt
   ```

2. Start the backend server:
   ```
   cd mcp-switchboard
   py run_backend.py
   ```
   
   If the above doesn't work, try:
   ```
   python3 run_backend.py
   ```
   
   Or directly with uvicorn:
   ```
   cd mcp-switchboard
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend

1. Install dependencies:
   ```
   cd mcp-switchboard/frontend
   npm install
   ```

2. Start the frontend development server:
   ```
   cd mcp-switchboard/frontend
   npm start
   ```

3. Access the UI at http://localhost:9877

## Architecture

- Backend: FastAPI with SQLAlchemy for database operations
- Frontend: React with WebSocket for real-time communication
- Communication: WebSocket for real-time updates and REST API for direct operations

## Configuration

The application's configuration is managed through `config.json` file located in the root directory. This file includes settings for database connections, MCP server configurations, and other application-wide parameters.

Example `config.json`:
```json
{
  "database_url": "sqlite:///./mcp.db",
  "mcp_servers": {
    "example-server": {
      "command": "node",
      "args": ["/path/to/example-mcp-server/index.js"],
      "env": {
        "SERVER_API_KEY": "your_api_key"
      }
    }
  }
}
```

- **database_url**: Specifies the URL for the SQLite database.
- **mcp_servers**: Defines the configuration for each MCP server that the Switchboard can manage. Each server configuration includes:
    - **command**: The command to execute to start the MCP server.
    - **args**: An array of command-line arguments for the server.
    - **env**: Environment variables to be set when starting the server.

Ensure to configure this file according to your environment and the MCP servers you intend to manage.

## Implementation Details

The MCP Switchboard consists of several key components:

1. **Server Management**:
   - Configuration stored in config.json
   - Database models for MCP servers
   - Connection/disconnection functionality

2. **Task Execution**:
   - Command execution via WebSocket
   - Real-time console output display

3. **Metrics Monitoring**:
   - System metrics collection
   - Server-specific metrics collection
   - Real-time updates via WebSocket

## Getting Started

To run the MCP Switchboard application, follow these steps:

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install backend dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the backend server:
   ```
   py main.py
   ```
   or
   ```
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm start
   ```

4. Access the UI at http://localhost:9877

## Development

The application is designed to be easily extensible. The backend uses a modular architecture with separate modules for different functionality, and the frontend is built with React components that can be reused and extended.

## Contributing

Contributions are welcome! Please feel free to submit pull requests to improve the MCP Switchboard. For major changes, please open an issue first to discuss what you would like to change.
