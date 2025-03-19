# MCP SwitchBoard 🎛️

A GUI MCP Switchboard for managing multiple Model Context Protocol (MCP) servers and their associated tools.

## Overview 🌟

MCP SwitchBoard is a user-friendly interface that allows you to control and monitor different MCP servers, configure services, and execute tasks seamlessly. It provides a central hub for managing your MCP ecosystem, making it easier to interact with various tools and data sources.

![Image Alt](https://github.com/grapheneaffiliate/MCP-SwitchBoard/blob/185ed2298fccb8dca524465a3543eab8d21ad211/Screenshot%202025-03-19%20154949.png)

## Features ✨

*   **Intuitive GUI:** A graphical user interface for managing MCP servers.
*   **Server Management:** Add, remove, connect, and disconnect MCP servers.
*   **Task Execution:** Execute commands and scripts on selected MCP servers.
*   **Real-time Monitoring:** Monitor server performance metrics (CPU, RAM, Disk, Network).
*   **Authentication & Security:** Secure access with user authentication.
*   **Scalability Features:** Placeholder for Redis caching and RabbitMQ/Kafka integration.

## Getting Started 🚀

### Prerequisites

*   Python 3.7+
*   Node.js 12+
*   uvicorn
*   pip
*   create-react-app

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/grapheneaffiliate/MCP-SwitchBoard.git
    cd MCP-SwitchBoard
    ```

2.  Set up the backend:

    ```bash
    cd backend
    py -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    ```

3.  Set up the frontend:

    ```bash
    cd ../frontend
    npm install
    ```

### Running the Application

1.  Start the backend:

    ```bash
    cd backend
    .\venv\Scripts\activate
    uvicorn main:app --reload
    ```

2.  Start the frontend:

    ```bash
    cd frontend
    npm start
    ```

Open your browser and navigate to `http://localhost:3000` to access the MCP SwitchBoard.

## Functionality ⚙️

### Adding a Server

1.  Click on the "Add Server" button.
2.  Enter the server details (Name, IP Address, Port).
3.  Click "Save" to add the server to the dashboard.

### Connecting to a Server

1.  Locate the server block on the dashboard.
2.  Click the "Connect" button to establish a connection.

### Executing a Task

1.  Select a server from the dashboard.
2.  Enter the command in the "Task Execution" panel.
3.  Click "Execute" to run the command on the selected server.

### Monitoring Server Metrics

1.  View the "Server Metrics" section to see real-time performance data.
    *   CPU Usage
    *   RAM Usage
    *   Disk Usage
    *   Network Activity

## Future Plans 🔮

*   Implement full OAuth 2.0 and RBAC for enhanced security.
*   Integrate Redis caching for improved performance.
*   Incorporate RabbitMQ/Kafka for asynchronous task execution.
*   Add support for more MCP server types.
*   Develop a plugin system for extending functionality.
*   Create a mobile app for remote monitoring and control.

## Contributing 🤝

We welcome contributions from the community! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for details on how to get involved.

## License 📜

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact 📧

For questions or feedback, please contact [grapheneaffiliates@gmail.com](mailto:grapheneaffiliates@gmail.com).

## Show Your Support ❤️

If you find this project helpful, please consider starring the repository! ⭐


