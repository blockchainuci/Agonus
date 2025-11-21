from pydantic import BaseSettings
from pathlib import Path
import json

class Settings(BaseSettings):
    '''Central app settings, values come from env'''
    
    # Blockchain and contract settings
    CONTRACT_ADDRESS: str = "0x..."  # Base Sepolia address
    ADMIN_PRIVATE_KEY: str = "..."  # Admin wallet key (from env)
    RPC_URL: str = "https://sepolia.base.org"  # Base Sepolia RPC
    CONTRACT_ABI: str = "backend/app/contracts/AgonusBetting.json"  # Load from file or embed
    CHAIN_ID: int = 84532  #check with sumanth

    @property
    def CONTRACT_ABI(self):
        '''Load contract abi from json file'''
        
        path = Path(self.CONTRACT_ABI)
        if not path.exists():
            #temp return
            return []

        data = json.loads(path.read_text())
        
        
        if isinstance(data, dict) and "abi" in data:
            return data["abi"]

        return data
    
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        
        
settings = Settings()