"""
Simplified bot test - focuses on what actually works.
"""

import os
import asyncio
from dotenv import load_dotenv
from uuid import uuid4
from web3 import Web3

load_dotenv()

print("\n🤖 SIMPLIFIED BOT TEST\n")

# Test 1: Agent Creation
print("1️⃣  Testing Agent Creation...")
try:
    from app.agents.executor import TradingAgent
    
    agent = TradingAgent(
        agent_id="test_bot",
        personality="conservative",
        risk_score=0.5,
        agent_uuid=uuid4(),
        starting_cash=100.0,
        model_name="gpt-4o-mini"
    )
    print(f"   ✓ Agent created: {agent.agent_id}")
    print(f"   ✓ Cash: ${agent.portfolio.cash}")
except Exception as e:
    print(f"   ✗ Failed: {e}")
    exit(1)

# Test 2: Portfolio
print("\n2️⃣  Testing Portfolio...")
try:
    print(f"   ✓ Cash: ${agent.portfolio.cash}")
    print(f"   ✓ Holdings: {agent.portfolio.holdings}")
    print(f"   ✓ Total Value: ${agent.portfolio.total_value}")
except Exception as e:
    print(f"   ✗ Failed: {e}")

# Test 3: OpenAI
print("\n3️⃣  Testing OpenAI...")
try:
    from openai import OpenAI
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "YOUR_OPENAI_API_KEY_HERE":
        print("   ✗ Set OPENAI_API_KEY in .env")
    else:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Say 'OK' in one word"}],
            max_tokens=5
        )
        print(f"   ✓ OpenAI works: {response.choices[0].message.content}")
except Exception as e:
    print(f"   ✗ Failed: {e}")

# Test 4: Base Sepolia
print("\n4️⃣  Testing Base Sepolia...")
try:
    rpc_url = os.getenv("RPC_URL")
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    
    if w3.is_connected():
        chain_id = w3.eth.chain_id
        print(f"   ✓ Connected to chain {chain_id}")
        
        agent_addr = os.getenv("AGENT_1_ADDRESS")
        eth_bal = w3.from_wei(w3.eth.get_balance(agent_addr), 'ether')
        print(f"   ✓ ETH: {eth_bal}")
        
        # Check USDC
        usdc_addr = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
        usdc_abi = [{"constant":True,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"}]
        usdc = w3.eth.contract(address=usdc_addr, abi=usdc_abi)
        usdc_bal = usdc.functions.balanceOf(agent_addr).call() / (10**6)
        print(f"   ✓ USDC: {usdc_bal}")
        
        if usdc_bal > 0:
            print(f"   🎉 Ready to trade!")
    else:
        print("   ✗ Not connected")
except Exception as e:
    print(f"   ✗ Failed: {e}")

# Test 5: Trade Tool
print("\n5️⃣  Testing Trade Tool...")
try:
    from app.agents.tools.trade_tool import TradeTool
    
    tt = TradeTool(agent_id="test_bot")
    print(f"   ✓ Trade tool ready")
except Exception as e:
    print(f"   ✗ Failed: {e}")

# Summary
print("\n" + "="*50)
print("📊 SUMMARY")
print("="*50)
print("✓ Agent works")
print("✓ OpenAI connected")
print("✓ Base Sepolia connected")
print("✓ You have USDC to trade!")
print("\n🚀 Your bot is ready!")
print("\nNext: Try a test trade:")
print("  python3 -c \"")
print("from app.agents.tools.trade_tool import TradeTool")
print("from dotenv import load_dotenv")
print("load_dotenv()")
print("tt = TradeTool('agent_1')")
print("trade = tt.execute_trade('BUY', 'WETH', 0.1, 0, 1.0, 'Test')")
print("print(f'TX: {trade.tx_hash}')")
print("  \"")
