from fastapi import APIRouter
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta
import os

router = APIRouter()

#SECRET_KEY = "your-secret-key"  # Load from .env
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
#ADMIN_ADDRESSES = {"0x123..."}  # Load from config

#assumes that addresses are addresses separated by commas in config
raw_addresses = os.getenv("ADMIN_ADDRESSES", "")

address_list = raw_addresses.split(",")

normalized_addresses = []
for addr in address_list:
    addr = addr.strip().lower()
    if addr != "":
        normalized_addresses.append(addr)

ADMIN_ADDRESSES = set(normalized_addresses)


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