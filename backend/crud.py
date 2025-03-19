from sqlalchemy.orm import Session

from . import models, schemas

def get_mcpserver(db: Session, mcpserver_id: int):
    return db.query(models.MCPServer).filter(models.MCPServer.id == mcpserver_id).first()

def get_mcpserver_by_name(db: Session, name: str):
    return db.query(models.MCPServer).filter(models.MCPServer.name == name).first()

def get_mcpservers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.MCPServer).offset(skip).limit(limit).all()

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
