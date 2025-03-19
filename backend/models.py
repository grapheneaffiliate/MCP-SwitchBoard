from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class MCPServer(Base):
    __tablename__ = "mcpservers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    ip_address = Column(String)
    port = Column(Integer)
    status = Column(Boolean, default=False)
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
