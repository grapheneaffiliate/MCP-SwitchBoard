from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend import crud
from backend.database import SessionLocal

# Disable OAuth2 for now
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(db: Session = Depends(get_db)):
    # Simplified authentication for development
    # In a real application, this would verify the token and retrieve the user from the database
    user = crud.get_user(db, user_id=1) # Placeholder user
    if not user:
        # Create a default user if it doesn't exist
        from backend.utils import get_password_hash
        hashed_password = get_password_hash("default_password")
        db_user = crud.create_user(db, {"username": "default_user", "password": "default_password"})
        return db_user
    return user
