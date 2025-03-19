from fastapi import FastAPI, Depends, HTTPException, WebSocket
from sqlalchemy.orm import Session
from typing import List
from . import models, database, schemas, crud, utils, monitoring, cache, queue
from .websocket import websocket_endpoint
from .auth import get_current_user
import time

app = FastAPI()

database.create_db()

# Create a default user
@app.on_event("startup")
async def startup_event():
    db = database.SessionLocal()
    try:
        user = crud.get_user(db, user_id=1)
        if not user:
            hashed_password = utils.get_password_hash("default_password")
            db_user = models.User(username="default_user", hashed_password=hashed_password)
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
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

@app.post("/execute/{mcpserver_id}")
async def execute_command(mcpserver_id: int, command: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_mcpserver = crud.get_mcpserver(db, mcpserver_id=mcpserver_id)
    if db_mcpserver is None:
        raise HTTPException(status_code=404, detail="MCPServer not found")
    queue.send_task("execute_command", {"mcpserver_id": mcpserver_id, "command": command})
    monitoring.log_event(f"Command '{command}' submitted for execution on server {mcpserver_id}")
    return {"message": f"Command '{command}' submitted for execution on server {mcpserver_id}"}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await websocket_endpoint(websocket, client_id)
