import json
import os
import time
import uuid
import random
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from mcp.client.session import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client
from mcp.shared.exceptions import McpError
from mcp.types import INVALID_REQUEST, INVALID_PARAMS, METHOD_NOT_FOUND, PARSE_ERROR, INTERNAL_ERROR

# Import backend modules with correct paths
from backend import models, schemas, crud

class MCPManager:
    def __init__(self):
        self.connections = {}
        self.command_logs = {}  # Dictionary to store command logs, server_id -> list of logs
        self.config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.json")

    def load_config(self) -> List[Dict[str, Any]]:
        """Load server configurations from config.json"""
        if os.path.exists(self.config_path):
            with open(self.config_path, "r") as f:
                config = json.load(f)
                return config.get("servers", [])
        return []
    
    def save_config(self, servers: List[Dict[str, Any]]) -> None:
        """Save server configurations to config.json"""
        with open(self.config_path, "w") as f:
            json.dump({"servers": servers}, f, indent=2)
    
    def sync_config_with_db(self, db: Session) -> None:
        """Synchronize config.json with database"""
        config_servers = self.load_config()
        
        # Update or create servers from config
        for server_config in config_servers:
            db_server = crud.get_mcpserver(db, server_config["id"])
            
            if db_server:
                # Update existing server
                server_update = schemas.MCPServerUpdate(
                    name=server_config["name"],
                    host=server_config["host"],
                    port=server_config["port"],
                    type=server_config["type"],
                    api_key=server_config.get("apiKey")
                )
                crud.update_mcpserver(db, db_server.id, server_update)
            else:
                # Create new server
                server_create = schemas.MCPServerCreate(
                    name=server_config["name"],
                    host=server_config["host"],
                    port=server_config["port"],
                    type=server_config["type"],
                    api_key=server_config.get("apiKey")
                )
                crud.create_mcpserver(db, server_create)
                
        db.commit()
    
    def connect_server(self, db: Session, server_id: int, retry_count: int = 3) -> Dict[str, Any]:
        """Connect to an MCP server with retry logic (mock implementation)"""
        db_server = crud.get_mcpserver(db, server_id)
        if not db_server:
            return {"success": False, "message": "Server not found"}
        
        # Check if server is already connected
        if db_server.status:
            return {"success": True, "message": f"Already connected to {db_server.name}", "connection_id": db_server.connection_id}
        
        # For mock implementation, we'll simulate a successful connection
        try:
            # Generate a mock connection ID
            connection_id = str(uuid.uuid4())
            
            # Update server status in database
            db_server.status = True
            db_server.connection_id = connection_id
            db_server.connection_errors = 0  # Reset error count
            db_server.last_connected = int(time.time())  # Set last connected timestamp
            db_server.last_error = None  # Clear last error
            db.commit()
            
            # Store mock connection in memory
            self.connections[server_id] = {
                "id": connection_id,
                "server": db_server,
                "client": {"mock": True},  # Mock client
                "last_error": None,
                "retry_count": 0
            }
            
            # Add a log entry
            if server_id not in self.command_logs:
                self.command_logs[server_id] = []
            
            self.command_logs[server_id].append({
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "command": "connect",
                "output": f"Connected to {db_server.name} (mock connection)",
                "success": True
            })
            
            return {
                "success": True,
                "message": f"Connected to {db_server.name} (mock connection)",
                "connection_id": connection_id
            }
        except Exception as e:
            error_message = str(e)
            
            # Update error information in database
            db_server.connection_errors = (db_server.connection_errors or 0) + 1
            db_server.last_error = error_message
            db.commit()
            
            return {"success": False, "message": f"Connection failed: {error_message}"}
    
    def disconnect_server(self, db: Session, server_id: int, force: bool = False) -> Dict[str, Any]:
        """Disconnect from an MCP server (mock implementation)"""
        db_server = crud.get_mcpserver(db, server_id)
        if not db_server:
            return {"success": False, "message": "Server not found"}
        
        # Check if server is already disconnected
        if not db_server.status and not force:
            return {"success": True, "message": f"Already disconnected from {db_server.name}"}
        
        try:
            # Update server status in database
            db_server.status = False
            db_server.connection_id = None
            db.commit()
            
            # Remove connection from memory
            if server_id in self.connections:
                del self.connections[server_id]
            
            # Add a log entry
            if server_id not in self.command_logs:
                self.command_logs[server_id] = []
            
            self.command_logs[server_id].append({
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "command": "disconnect",
                "output": f"Disconnected from {db_server.name} (mock connection)",
                "success": True
            })
            
            return {
                "success": True,
                "message": f"Disconnected from {db_server.name} (mock connection)"
            }
        except Exception as e:
            error_message = str(e)
            
            # If force disconnect is requested, update the database anyway
            if force:
                db_server.status = False
                db_server.connection_id = None
                db.commit()
                
                if server_id in self.connections:
                    del self.connections[server_id]
                
                return {
                    "success": True,
                    "message": f"Force disconnected from {db_server.name} (with errors: {error_message})"
                }
            
            return {"success": False, "message": f"Disconnection failed: {error_message}"}
    
    def execute_command(self, db: Session, server_id: int, command: str, auto_reconnect: bool = True) -> Dict[str, Any]:
        """Execute a command on an MCP server (mock implementation)"""
        db_server = crud.get_mcpserver(db, server_id)
        if not db_server:
            return {"success": False, "message": "Server not found"}
        
        # Check if server is connected
        if not db_server.status:
            # Try to reconnect if auto_reconnect is enabled
            if auto_reconnect:
                connect_result = self.connect_server(db, server_id)
                if not connect_result["success"]:
                    return {"success": False, "message": f"Server is not connected and auto-reconnect failed: {connect_result['message']}"}
            else:
                return {"success": False, "message": "Server is not connected"}
        
        try:
            # Generate mock command output based on the command
            if command.lower().startswith("ls") or command.lower().startswith("dir"):
                result = """
file1.txt
file2.txt
directory1/
directory2/
config.json
README.md
"""
            elif command.lower().startswith("cat") or command.lower().startswith("type"):
                file_name = command.split(" ", 1)[1] if len(command.split(" ", 1)) > 1 else "unknown"
                result = f"Contents of {file_name}:\nThis is a mock file content for demonstration purposes.\nLine 2 of the file.\nLine 3 of the file."
            elif command.lower().startswith("ps") or command.lower().startswith("tasklist"):
                result = """
PID   COMMAND
1     system
100   mcp_server
200   database
300   web_server
"""
            elif command.lower().startswith("ping"):
                host = command.split(" ", 1)[1] if len(command.split(" ", 1)) > 1 else "localhost"
                result = f"""
Pinging {host} with 32 bytes of data:
Reply from {host}: bytes=32 time=10ms TTL=64
Reply from {host}: bytes=32 time=12ms TTL=64
Reply from {host}: bytes=32 time=9ms TTL=64
Reply from {host}: bytes=32 time=11ms TTL=64

Ping statistics for {host}:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 9ms, Maximum = 12ms, Average = 10.5ms
"""
            else:
                result = f"Executed command '{command}' on {db_server.name} (mock execution)"

            # Reset error count on successful command execution
            if "command_errors" in db_server.__dict__:
                db_server.command_errors = 0
                db.commit()
            
            # Add to command logs
            log_entry = {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "command": command,
                "output": result,
                "success": True
            }
            if server_id not in self.command_logs:
                self.command_logs[server_id] = []
            self.command_logs[server_id].append(log_entry)

            return {
                "success": True,
                "message": f"Command executed on {db_server.name}",
                "output": result
            }
        except Exception as e:
            error_message = str(e)
            log_entry = {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "command": command,
                "output": error_message,
                "success": False
            }
            if server_id not in self.command_logs:
                self.command_logs[server_id] = []
            self.command_logs[server_id].append(log_entry)
            
            # Increment command error count and update last_error
            if "command_errors" in db_server.__dict__:
                db_server.command_errors = (db_server.command_errors or 0) + 1
                db_server.last_error = error_message
                db.commit()
            
            # Try to reconnect and retry once if connection might be stale
            if auto_reconnect:
                try:
                    # Force disconnect and reconnect
                    self.disconnect_server(db, server_id, force=True)
                    connect_result = self.connect_server(db, server_id)
                    
                    if connect_result["success"]:
                        # Retry the command with a different mock output
                        if command.lower().startswith("ls") or command.lower().startswith("dir"):
                            result = """
file1.txt
file2.txt
directory1/
directory2/
config.json
README.md
logs/
"""
                        elif command.lower().startswith("cat") or command.lower().startswith("type"):
                            file_name = command.split(" ", 1)[1] if len(command.split(" ", 1)) > 1 else "unknown"
                            result = f"Contents of {file_name} (after reconnection):\nThis is a mock file content for demonstration purposes.\nLine 2 of the file.\nLine 3 of the file."
                        elif command.lower().startswith("ps") or command.lower().startswith("tasklist"):
                            result = """
PID   COMMAND
1     system
100   mcp_server
200   database
300   web_server
400   background_task
"""
                        elif command.lower().startswith("ping"):
                            host = command.split(" ", 1)[1] if len(command.split(" ", 1)) > 1 else "localhost"
                            result = f"""
Pinging {host} with 32 bytes of data (after reconnection):
Reply from {host}: bytes=32 time=8ms TTL=64
Reply from {host}: bytes=32 time=9ms TTL=64
Reply from {host}: bytes=32 time=7ms TTL=64
Reply from {host}: bytes=32 time=10ms TTL=64

Ping statistics for {host}:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 7ms, Maximum = 10ms, Average = 8.5ms
"""
                        else:
                            result = f"Executed command '{command}' on {db_server.name} (after reconnection)"
                        
                        # Add to command logs
                        log_entry = {
                            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                            "command": command,
                            "output": result,
                            "success": True,
                            "reconnected": True
                        }
                        if server_id not in self.command_logs:
                            self.command_logs[server_id] = []
                        self.command_logs[server_id].append(log_entry)
                        
                        return {
                            "success": True,
                            "message": f"Command executed on {db_server.name} (after reconnection)",
                            "output": result,
                            "reconnected": True
                        }
                    else:
                        return {"success": False, "message": f"Command execution failed and reconnection failed: {connect_result['message']}"}
                except Exception as reconnect_error:
                    return {"success": False, "message": f"Command execution failed and reconnection failed: {str(reconnect_error)}"}
            
            return {"success": False, "message": f"Command execution failed: {error_message}"}
    
    def get_server_logs(self, server_id: int) -> Dict[str, Any]:
        """Get command execution logs for a specific server"""
        if server_id not in self.command_logs:
            return {"success": False, "message": "Server ID not found in logs"}
        return {"success": True, "logs": self.command_logs[server_id]}

    def get_server_metrics(self, db: Session, server_id: int, auto_reconnect: bool = True) -> Dict[str, Any]:
        """Get metrics for an MCP server (mock implementation)"""
        db_server = crud.get_mcpserver(db, server_id)
        if not db_server:
            return {"success": False, "message": "Server not found"}
        
        # Check if server is connected
        if not db_server.status:
            # Try to reconnect if auto_reconnect is enabled
            if auto_reconnect:
                connect_result = self.connect_server(db, server_id)
                if not connect_result["success"]:
                    return {"success": False, "message": f"Server is not connected and auto-reconnect failed: {connect_result['message']}"}
            else:
                return {"success": False, "message": "Server is not connected"}
        
        try:
            # Generate mock metrics with some randomization
            server_type = db_server.type.lower()
            
            # Base metrics with some randomization based on server type
            if "database" in server_type:
                # Database servers have higher memory usage
                cpu_usage = 35.5 + random.uniform(-8, 8)
                memory_usage = 1024.3 + random.uniform(-100, 100)
                disk_usage = 2048.7 + random.uniform(-200, 200)
                network_in = 128.2 + random.uniform(-20, 20)
                network_out = 64.9 + random.uniform(-10, 10)
            elif "web" in server_type:
                # Web servers have higher network activity
                cpu_usage = 25.5 + random.uniform(-5, 5)
                memory_usage = 512.3 + random.uniform(-50, 50)
                disk_usage = 1024.7 + random.uniform(-100, 100)
                network_in = 512.2 + random.uniform(-50, 50)
                network_out = 256.9 + random.uniform(-25, 25)
            else:
                # Default metrics
                cpu_usage = 25.5 + random.uniform(-5, 5)
                memory_usage = 512.3 + random.uniform(-50, 50)
                disk_usage = 1024.7 + random.uniform(-100, 100)
                network_in = 256.2 + random.uniform(-25, 25)
                network_out = 128.9 + random.uniform(-12, 12)
            
            metrics = {
                "cpu_usage": max(0, min(100, cpu_usage)),  # Ensure between 0-100%
                "memory_usage": max(0, memory_usage),
                "disk_usage": max(0, disk_usage),
                "network_in": max(0, network_in),
                "network_out": max(0, network_out),
                "timestamp": int(time.time()),
                "uptime": int(time.time()) - (db_server.last_connected or int(time.time())),
                "connections": random.randint(5, 50),
                "processes": random.randint(3, 15)
            }
            
            # Update metrics in database
            db_server.metrics = metrics
            db.commit()
            
            return {
                "success": True,
                "metrics": metrics
            }
        except Exception as e:
            error_message = str(e)
            db_server.last_error = error_message
            db.commit()
            
            # Try to reconnect and retry once if connection might be stale
            if auto_reconnect:
                try:
                    # Force disconnect and reconnect
                    self.disconnect_server(db, server_id, force=True)
                    connect_result = self.connect_server(db, server_id)
                    
                    if connect_result["success"]:
                        # Retry getting metrics with slightly different values
                        server_type = db_server.type.lower()
                        
                        if "database" in server_type:
                            cpu_usage = 32.5 + random.uniform(-7, 7)
                            memory_usage = 950.3 + random.uniform(-90, 90)
                            disk_usage = 1950.7 + random.uniform(-180, 180)
                            network_in = 120.2 + random.uniform(-18, 18)
                            network_out = 60.9 + random.uniform(-9, 9)
                        elif "web" in server_type:
                            cpu_usage = 22.5 + random.uniform(-4, 4)
                            memory_usage = 480.3 + random.uniform(-45, 45)
                            disk_usage = 980.7 + random.uniform(-90, 90)
                            network_in = 480.2 + random.uniform(-45, 45)
                            network_out = 240.9 + random.uniform(-22, 22)
                        else:
                            cpu_usage = 22.5 + random.uniform(-4, 4)
                            memory_usage = 480.3 + random.uniform(-45, 45)
                            disk_usage = 980.7 + random.uniform(-90, 90)
                            network_in = 240.2 + random.uniform(-22, 22)
                            network_out = 120.9 + random.uniform(-11, 11)
                        
                        metrics = {
                            "cpu_usage": max(0, min(100, cpu_usage)),
                            "memory_usage": max(0, memory_usage),
                            "disk_usage": max(0, disk_usage),
                            "network_in": max(0, network_in),
                            "network_out": max(0, network_out),
                            "timestamp": int(time.time()),
                            "uptime": int(time.time()) - (db_server.last_connected or int(time.time())),
                            "connections": random.randint(5, 50),
                            "processes": random.randint(3, 15),
                            "reconnected": True
                        }
                        
                        # Update metrics in database
                        db_server.metrics = metrics
                        db.commit()
                        
                        return {
                            "success": True,
                            "metrics": metrics,
                            "reconnected": True
                        }
                    else:
                        return {"success": False, "message": f"Failed to get metrics and reconnection failed: {connect_result['message']}"}
                except Exception as reconnect_error:
                    return {"success": False, "message": f"Failed to get metrics and reconnection failed: {str(reconnect_error)}"}
            
            return {"success": False, "message": f"Failed to get metrics: {error_message}"}

# Create a singleton instance
mcp_manager = MCPManager()
