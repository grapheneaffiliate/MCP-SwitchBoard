from fastapi import WebSocket, Depends, WebSocketDisconnect
from sqlalchemy.orm import Session
import json
import asyncio
from typing import Dict, List, Any

# Import backend modules with correct paths
from backend import database, crud
from backend.mcp_manager import mcp_manager
from backend.auth import get_db

# Store active connections
active_connections: Dict[int, WebSocket] = {}

async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await websocket.accept()
    active_connections[client_id] = websocket
    
    # Create a database session
    db = database.SessionLocal()
    
    try:
        # Send initial server list
        await asyncio.sleep(1) # Add a 1-second delay before sending initial server list
        servers = crud.get_mcpservers(db)
        await websocket.send_json({
            "type": "server_list",
            "servers": [
                {
                    "id": server.id,
                    "name": server.name,
                    "host": server.host,
                    "port": server.port,
                    "type": server.type,
                    "status": server.status
                } for server in servers
            ]
        })
        
        # Start metrics update task
        metrics_task = asyncio.create_task(send_metrics_updates(websocket, db))
        
        # Listen for messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "connect_server":
                server_id = message["server_id"]
                result = mcp_manager.connect_server(db, server_id)
                await websocket.send_json({
                    "type": "server_status_update",
                    "server_id": server_id,
                    "status": result["success"],
                    "message": result["message"]
                })
                
            elif message["type"] == "disconnect_server":
                server_id = message["server_id"]
                result = mcp_manager.disconnect_server(db, server_id)
                await websocket.send_json({
                    "type": "server_status_update",
                    "server_id": server_id,
                    "status": not result["success"],  # Invert because success means disconnected
                    "message": result["message"]
                })
                
            elif message["type"] == "execute_command":
                server_id = message["server_id"]
                command = message["command"]
                result = mcp_manager.execute_command(db, server_id, command)
                await websocket.send_json({
                    "type": "command_result",
                    "server_id": server_id,
                    "success": result["success"],
                    "message": result["message"],
                    "output": result.get("output", "")
                })
            
            elif message["type"] == "get_server_list":
                print("WebSocket received: get_server_list") # Log message received
                print("WebSocket: Fetching server list from database...") # Log before fetching
                servers = crud.get_mcpservers(db)
                print(f"WebSocket: Fetched {len(servers)} servers from database") # Log server count
                print("WebSocket: Sending 'server_list' message to client...") # Log before sending
                server_list_payload = {
                    "type": "server_list",
                    "servers": [
                        {
                            "id": server.id,
                            "name": server.name,
                            "host": server.host,
                            "port": server.port,
                            "type": server.type,
                            "status": server.status
                        } for server in servers
                    ]
                }
                print("WebSocket: Server list payload:", server_list_payload) # Log server list payload
                await websocket.send_json(server_list_payload)
                print("WebSocket: Sent 'server_list' message to client") # Log after sending
    
    except WebSocketDisconnect:
        if client_id in active_connections:
            del active_connections[client_id]
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Cancel metrics task
        metrics_task.cancel()
        try:
            await metrics_task
        except asyncio.CancelledError:
            pass
        
        # Close database session
        db.close()
        
        # Remove connection
        if client_id in active_connections:
            del active_connections[client_id]
        
        await websocket.close()

async def send_metrics_updates(websocket: WebSocket, db: Session):
    """Send periodic metrics updates to the client"""
    try:
        while True:
            servers = crud.get_mcpservers(db)
            
            for server in servers:
                if server.status:
                    # Get metrics for connected servers
                    result = mcp_manager.get_server_metrics(db, server.id)
                    if result["success"]:
                        await websocket.send_json({
                            "type": "server_metrics",
                            "server_id": server.id,
                            "metrics": result["metrics"]
                        })
            
            # Wait before next update
            await asyncio.sleep(5)
    except asyncio.CancelledError:
        # Task was cancelled, exit gracefully
        pass
