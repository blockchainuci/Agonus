from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta
from eth_account.messages import encode_defunct
from web3 import Web3
import os

# Add prefix + tags for consistency
router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"

# Load admin addresses from env
raw_addresses = os.getenv("ADMIN_ADDRESSES", "")
ADMIN_ADDRESSES = {
    addr.strip().lower() for addr in raw_addresses.split(",") if addr.strip()
}


class WalletSignIn(BaseModel):
    address: str
    signature: str


@router.post("/wallet")
def wallet_auth(data: WalletSignIn) -> dict:
    """
    Verify wallet signature and return JWT.
    Used for login on the frontend.
    """

    # Verify signature
    message = "Sign in to Agonus"

    try:
        w3 = Web3()
        encoded_message = encode_defunct(text=message)

        recovered_address = w3.eth.account.recover_message(
            encoded_message, signature=data.signature
        )

        if recovered_address.lower() != data.address.lower():
            raise HTTPException(status_code=401, detail="Invalid signature")

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Signature verification failed: {str(e)}")

    # Determine role
    role = "admin" if data.address.lower() in ADMIN_ADDRESSES else "user"
    print(f"[AUTH] Wallet: {data.address.lower()}, ADMIN_ADDRESSES: {ADMIN_ADDRESSES}, Role: {role}")

    # Generate JWT
    expire = datetime.utcnow() + timedelta(hours=24)
    token = jwt.encode(
        {
            "sub": data.address.lower(),
            "role": role,
            "exp": expire,
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {"access_token": token, "token_type": "bearer"}
