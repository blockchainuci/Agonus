from pydantic_settings import BaseSettings
from pathlib import Path
import json


class Settings(BaseSettings):
    """Central app settings, values come from env"""

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./agonus.db"

    # Blockchain and contract settings
    CONTRACT_ADDRESS: str = "0x0000000000000000000000000000000000000001" # Base Sepolia address (from .env)
    ADMIN_PRIVATE_KEY: str = "0x0000000000000000000000000000000000000000000000000000000000000001" # Admin wallet key (from .env)
    RPC_URL: str = "https://sepolia.base.org"  # Base Sepolia RPC
    CONTRACT_ABI_PATH: str = "backend/app/contracts/AgonusBetting.json"
    CHAIN_ID: int = 84532

    @property
    def CONTRACT_ABI(self):
        """Load contract ABI from json file"""

        # Resolve path relative to this file so it works in CI and locally
        path = Path(__file__).resolve().parent.parent / "contracts" / "AgonusBetting.json"

        if not path.exists():
            raise FileNotFoundError(f"Contract ABI file not found at {path}")

        data = json.loads(path.read_text())

        if isinstance(data, dict) and "abi" in data:
            return data["abi"]

        return data

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()