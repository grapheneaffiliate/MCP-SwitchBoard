from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship
from backend.database import Base

class MCPServer(Base):
    __tablename__ = "mcpservers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    host = Column(String)
    port = Column(Integer)
    type = Column(String)
    api_key = Column(String)
    status = Column(Boolean, default=False)
    connection_id = Column(String, nullable=True)
    metrics = Column(JSON, nullable=True)
    connection_errors = Column(Integer, default=0)
    command_errors = Column(Integer, default=0)
    last_connected = Column(Integer, nullable=True)  # Unix timestamp
    last_error = Column(String, nullable=True)
    credentials = relationship("Credential", back_populates="mcpserver")

class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    password = Column(String)
    mcpserver_id = Column(Integer, ForeignKey("mcpservers.id"))
    mcpserver = relationship("MCPServer", back_populates="credentials")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    command = Column(String)
    server_id = Column(Integer, ForeignKey("mcpservers.id"))
    status = Column(String, default="pending")  # pending, running, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    last_run = Column(DateTime, nullable=True)
    result = Column(String, nullable=True)
