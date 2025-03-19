from typing import Optional

from pydantic import BaseModel

# Shared properties
class MCPServerBase(BaseModel):
    name: str
    ip_address: str
    port: int

# Properties to receive on item creation
class MCPServerCreate(MCPServerBase):
    pass

# Properties to receive on item update
class MCPServerUpdate(MCPServerBase):
    pass

# Properties shared by models stored in database
class MCPServerInDBBase(MCPServerBase):
    id: int
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
