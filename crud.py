from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from backend import models, schemas

def get_mcpserver(db: Session, mcpserver_id: int):
    return db.query(models.MCPServer).filter(models.MCPServer.id == mcpserver_id).first()

def get_mcpserver_by_name(db: Session, name: str):
    return db.query(models.MCPServer).filter(models.MCPServer.name == name).first()

def get_mcpservers(db: Session, skip: int = 0):
    print("Fetching MCP servers from database...") # Log function call
    servers = db.query(models.MCPServer).offset(skip).all()
    print(f"Fetched {len(servers)} MCP servers from database") # Log server count
    return servers

def create_mcpserver(db: Session, mcpserver: schemas.MCPServerCreate):
    db_mcpserver = models.MCPServer(**mcpserver.dict())
    db.add(db_mcpserver)
    db.commit()
    db.refresh(db_mcpserver)
    return db_mcpserver

def update_mcpserver(db: Session, mcpserver_id: int, mcpserver: schemas.MCPServerUpdate):
    db_mcpserver = get_mcpserver(db, mcpserver_id=mcpserver_id)
    for key, value in mcpserver.dict(exclude_unset=True).items():
        setattr(db_mcpserver, key, value)
    db.add(db_mcpserver)
    db.commit()
    db.refresh(db_mcpserver)
    return db_mcpserver

def delete_mcpserver(db: Session, mcpserver_id: int):
    db_mcpserver = get_mcpserver(db, mcpserver_id=mcpserver_id)
    db.delete(db_mcpserver)
    db.commit()
    return db_mcpserver

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = models.User(username=user.username, hashed_password=fake_hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Task CRUD operations
def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()

def get_tasks(db: Session, skip: int = 0, limit: int = 100, server_id: Optional[int] = None):
    query = db.query(models.Task)
    if server_id:
        query = query.filter(models.Task.server_id == server_id)
    return query.offset(skip).limit(limit).all()

def create_task(db: Session, task: schemas.TaskCreate):
    db_task = models.Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task: schemas.TaskUpdate):
    db_task = get_task(db, task_id=task_id)
    if not db_task:
        return None
    
    update_data = task.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int):
    db_task = get_task(db, task_id=task_id)
    if not db_task:
        return None
    
    db.delete(db_task)
    db.commit()
    return db_task

def run_task(db: Session, task_id: int, result: str = None):
    db_task = get_task(db, task_id=task_id)
    if not db_task:
        return None
    
    db_task.status = "running"
    db_task.last_run = datetime.utcnow()
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task_status(db: Session, task_id: int, status: str, result: str = None):
    db_task = get_task(db, task_id=task_id)
    if not db_task:
        return None
    
    db_task.status = status
    if result:
        db_task.result = result
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task
