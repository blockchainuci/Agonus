from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta
from eth_account.messages import encode_defunct
from web3 import Web3
import os

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"

raw_addresses = os.getenv("ADMIN_ADDRESSES", "")
ADMIN_ADDRESSES = set(addr.strip().lower() for addr in raw_addresses.split(",") if addr.strip())

class WalletSignIn(BaseModel):
    address: str
    signature: str

@router.post("/wallet")  # Changed from /wallet-signin
def wallet_auth(data: WalletSignIn) -> dict:
    """Sign in with wallet and return JWT"""
    
    # Verify signature
    message = "Sign in to Agonus"
    try:
        w3 = Web3()
        encoded_message = encode_defunct(text=message)
        recovered_address = w3.eth.account.recover_message(encoded_message, signature=data.signature)
        
        if recovered_address.lower() != data.address.lower():
            raise HTTPException(401, "Invalid signature")
    except Exception as e:
        raise HTTPException(401, f"Signature verification failed: {str(e)}")
    
    # Check role and issue JWT
    role = "admin" if data.address.lower() in ADMIN_ADDRESSES else "user"
    
    expire = datetime.utcnow() + timedelta(hours=24)
    token = jwt.encode(
        {"sub": data.address.lower(), "role": role, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    return {"access_token": token, "token_type": "bearer"}
