from fastapi import APIRouter
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter()

SECRET_KEY = "your-secret-key"  # Load from .env
ALGORITHM = "HS256"
ADMIN_ADDRESSES = {"0x123..."}  # Load from config

class WalletSignIn(BaseModel):
    address: str

@router.post("/wallet-signin")
def wallet_signin(data: WalletSignIn) -> dict:
    """Sign in with wallet and return JWT"""
    role = "admin" if data.address in ADMIN_ADDRESSES else "user"
    
    expire = datetime.utcnow() + timedelta(hours=24)
    token = jwt.encode(
        {"sub": data.address, "role": role, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    return {"access_token": token, "token_type": "bearer"}