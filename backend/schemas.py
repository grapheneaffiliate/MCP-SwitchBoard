from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime

# Shared properties
class MCPServerBase(BaseModel):
    name: str
    host: str
    port: int
    type: str
    api_key: Optional[str] = None

# Properties to receive on item creation
class MCPServerCreate(MCPServerBase):
    pass

# Properties to receive on item update
class MCPServerUpdate(MCPServerBase):
    pass

# Properties shared by models stored in database
class MCPServerInDBBase(MCPServerBase):
    id: int
    status: bool = False
    connection_id: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    connection_errors: Optional[int] = 0
    command_errors: Optional[int] = 0
    last_connected: Optional[int] = None
    last_error: Optional[str] = None
    
    class Config:
        orm_mode = True

# Properties to return to client
class MCPServer(MCPServerInDBBase):
    pass

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    username: str

    class Config:
        orm_mode = True

# Task schemas
class TaskBase(BaseModel):
    name: str
    command: str
    server_id: int

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    command: Optional[str] = None
    server_id: Optional[int] = None
    status: Optional[str] = None

class Task(TaskBase):
    id: int
    status: str
    created_at: datetime
    last_run: Optional[datetime] = None
    result: Optional[str] = None

    class Config:
        orm_mode = True
