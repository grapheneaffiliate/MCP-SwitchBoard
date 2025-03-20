from fastapi import FastAPI, Depends, HTTPException, WebSocket, Form, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import time
import json

# Import backend modules with correct paths
from backend import models, database, schemas, crud, utils, monitoring, cache, queue
from backend.websocket import websocket_endpoint
from backend.auth import get_current_user, get_db
from backend.mcp_manager import mcp_manager

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

database.create_db()

# Create a default user and sync config
@app.on_event("startup")
async def startup_event():
    db = database.SessionLocal()
    try:
        # Create default user if not exists
        user = crud.get_user(db, user_id=1)
        if not user:
            hashed_password = utils.get_password_hash("default_password")
            db_user = models.User(username="default_user", hashed_password=hashed_password)
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        
        # Sync config.json with database
        mcp_manager.sync_config_with_db(db)
    finally:
        db.close()

@app.get("/")
async def root(current_user: models.User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.username}"}

@app.get("/metrics")
async def get_metrics(current_user: models.User = Depends(get_current_user)):
    cached_metrics = cache.get_cached_data("metrics")
    if cached_metrics:
        return cached_metrics
    
    cpu_usage = monitoring.get_cpu_usage()
    ram_usage = monitoring.get_ram_usage()
    disk_usage = monitoring.get_disk_usage()
    network_activity = monitoring.get_network_activity()
    metrics = {
        "cpu_usage": cpu_usage,
        "ram_usage": ram_usage,
        "disk_usage": disk_usage,
        "network_activity": network_activity
    }
    cache.set_cached_data("metrics", metrics)
    return metrics

@app.get("/servers", response_model=List[schemas.MCPServer])
async def get_servers(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all MCP servers"""
    servers = crud.get_mcpservers(db, skip=skip, limit=limit)
    return servers

@app.get("/servers/{server_id}", response_model=schemas.MCPServer)
async def get_server(
    server_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific MCP server by ID"""
    db_server = crud.get_mcpserver(db, mcpserver_id=server_id)
    if db_server is None:
        raise HTTPException(status_code=404, detail="Server not found")
    return db_server

@app.post("/create_server_test/", response_model=schemas.MCPServer)
async def create_server(
    server: schemas.MCPServerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new MCP server"""
    db_server = crud.create_mcpserver(db=db, mcpserver=server)
    mcp_manager.load_config()
    return db_server

@app.put("/servers/{server_id}", response_model=schemas.MCPServer)
async def update_server(
    server_id: int,
    mcpserver: schemas.MCPServerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an existing MCP server"""
    db_server = crud.get_mcpserver(db, mcpserver_id=server_id)
    if db_server is None:
        raise HTTPException(status_code=404, detail="Server not found")
    
    updated_server = crud.update_mcpserver(db=db, mcpserver_id=server_id, mcpserver=mcpserver)
    mcp_manager.load_config()
    return updated_server

@app.delete("/servers/{server_id}")
async def delete_server(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete an MCP server"""
    db_server = crud.get_mcpserver(db, mcpserver_id=server_id)
    if db_server is None:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Check if server is connected
    if db_server.status:
        raise HTTPException(status_code=400, detail="Cannot delete a connected server. Please disconnect first.")
    
    crud.delete_mcpserver(db=db, mcpserver_id=server_id)
    mcp_manager.load_config()
    return {"message": f"Server {server_id} deleted successfully"}

@app.post("/servers/connect/{server_id}")
async def connect_server(
    server_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Connect to an MCP server"""
    result = mcp_manager.connect_server(db, server_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    monitoring.log_event(f"Connected to server {server_id}")
    return result

@app.post("/servers/disconnect/{server_id}")
async def disconnect_server(
    server_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Disconnect from an MCP server"""
    result = mcp_manager.disconnect_server(db, server_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    monitoring.log_event(f"Disconnected from server {server_id}")
    return result

@app.post("/execute/{server_id}")
async def execute_command(
    server_id: int, 
    command: str = Form(...), 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Execute a command on an MCP server"""
    result = mcp_manager.execute_command(db, server_id, command)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    monitoring.log_event(f"Command '{command}' executed on server {server_id}")
    return result

@app.get("/servers/{server_id}/logs")
async def get_server_logs(
    server_id: int,
    current_user: models.User = Depends(get_current_user)
):
    """Get logs for a specific MCP server"""
    result = mcp_manager.get_server_logs(server_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result['logs']

@app.get("/servers/{server_id}/metrics")
async def get_server_metrics(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get metrics for a specific MCP server"""
    result = mcp_manager.get_server_metrics(db, server_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.websocket("/ws/{client_id}")
async def websocket_handler(websocket: WebSocket, client_id: int):
    await websocket_endpoint(websocket, client_id)

@app.post("/test_post/", response_model=schemas.MCPServer)
async def test_post():
    return {"message": "Test POST endpoint", "status": "ok"}

# Task API endpoints
@app.get("/tasks", response_model=List[schemas.Task])
async def get_tasks(
    skip: int = 0, 
    limit: int = 100, 
    server_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all tasks, optionally filtered by server_id"""
    tasks = crud.get_tasks(db, skip=skip, limit=limit, server_id=server_id)
    return tasks

@app.get("/tasks/{task_id}", response_model=schemas.Task)
async def get_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific task by ID"""
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@app.post("/tasks", response_model=schemas.Task)
async def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new task"""
    # Check if server exists
    db_server = crud.get_mcpserver(db, mcpserver_id=task.server_id)
    if db_server is None:
        raise HTTPException(status_code=404, detail="Server not found")
    
    db_task = crud.create_task(db=db, task=task)
    return db_task

@app.put("/tasks/{task_id}", response_model=schemas.Task)
async def update_task(
    task_id: int,
    task: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an existing task"""
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # If server_id is being updated, check if server exists
    if task.server_id is not None:
        db_server = crud.get_mcpserver(db, mcpserver_id=task.server_id)
        if db_server is None:
            raise HTTPException(status_code=404, detail="Server not found")
    
    updated_task = crud.update_task(db=db, task_id=task_id, task=task)
    return updated_task

@app.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a task"""
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    crud.delete_task(db=db, task_id=task_id)
    return {"message": f"Task {task_id} deleted successfully"}

@app.post("/tasks/{task_id}/run", response_model=schemas.Task)
async def run_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Run a task"""
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if server exists and is connected
    db_server = crud.get_mcpserver(db, mcpserver_id=db_task.server_id)
    if db_server is None:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if not db_server.status:
        raise HTTPException(status_code=400, detail="Server is not connected")
    
    # Run the task
    db_task = crud.run_task(db=db, task_id=task_id)
    
    # Execute the command asynchronously
    task_queue.add_task(db_task.id, db_task.server_id, db_task.command)
    
    return db_task
