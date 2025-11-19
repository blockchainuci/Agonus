from fastapi import Depends, HTTPException, Header
from jose import JWTError, jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"

def get_current_user(authorization: str = Header(...)) -> dict:
    """Verify JWT token"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization header")
    
    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_address: str = payload.get("sub")
        role: str = payload.get("role")
        
        if user_address is None:
            raise HTTPException(401, "Invalid token")
            
        return {"address": user_address, "role": role}
    except JWTError:
        raise HTTPException(401, "Invalid token")

def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user