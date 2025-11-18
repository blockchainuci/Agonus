"""
Simple test script to verify Uniswap integration is working correctly.
Run this BEFORE integrating into TradeTool to catch issues early.

Usage:
    cd /Users/Rounak/Agonus/backend
    python -m app.agents.onchain.test_uniswap_connection
"""

import sys
from web3 import Web3

def test_1_config():
    """Stage 1: Verify environment variables are loaded"""
    print("\n" + "="*60)
    print("TEST 1: Config Validation")
    print("="*60)

    try:
        from app.agents.onchain.uniswap_client import (
            UNISWAP_V3_ROUTER,
            UNISWAP_V3_QUOTER_V2,
            TOKEN_ADDRESSES
        )

        # Check Uniswap addresses
        assert UNISWAP_V3_ROUTER, "UNISWAP_V3_ROUTER is empty"
        assert UNISWAP_V3_QUOTER_V2, "UNISWAP_V3_QUOTER_V2 is empty"

        print(f"Uniswap Router: {UNISWAP_V3_ROUTER}")
        print(f"Uniswap Quoter: {UNISWAP_V3_QUOTER_V2}")

        # Check token addresses
        for token, address in TOKEN_ADDRESSES.items():
            assert address, f"{token}_ADDRESS is empty"
            assert address.startswith('0x'), f"{token}_ADDRESS doesn't start with 0x"
            assert len(address) == 42, f"{token}_ADDRESS wrong length (should be 42 chars)"
            print(f"✅ {token}: {address}")

        print("\n✅ CONFIG TEST PASSED")
        return True

    except Exception as e:
        print(f"\n❌ CONFIG TEST FAILED: {e}")
        return False


def test_2_web3_connection():
    """Stage 2: Verify web3 is connected to Base"""
    print("\n" + "="*60)
    print("TEST 2: Web3 Connection")
    print("="*60)

    try:
        from app.agents.onchain.web3_client import w3

        # Check connection
        assert w3.is_connected(), "Web3 not connected"
        print(f"✅ Connected: {w3.is_connected()}")

        # Check chain ID (Base = 8453)
        chain_id = w3.eth.chain_id
        assert chain_id == 8453, f"Wrong chain! Expected Base (8453), got {chain_id}"
        print(f"✅ Chain ID: {chain_id} (Base Mainnet)")

        # Check latest block
        block_number = w3.eth.block_number
        assert block_number > 0, "Block number is 0"
        print(f"✅ Latest Block: {block_number:,}")

        print("\n✅ WEB3 CONNECTION TEST PASSED")
        return True

    except Exception as e:
        print(f"\n❌ WEB3 CONNECTION TEST FAILED: {e}")
        return False


def test_3_contract_existence():
    """Stage 3: Verify Uniswap contracts exist at the addresses"""
    print("\n" + "="*60)
    print("TEST 3: Contract Existence")
    print("="*60)

    try:
        from app.agents.onchain.web3_client import w3
        from app.agents.onchain.uniswap_client import (
            UNISWAP_V3_ROUTER,
            UNISWAP_V3_QUOTER_V2,
            TOKEN_ADDRESSES
        )

        # Check if contracts have code (not just empty addresses)
        router_code = w3.eth.get_code(UNISWAP_V3_ROUTER)
        assert len(router_code) > 0, "Router has no code (wrong address?)"
        print(f"✅ Router contract exists ({len(router_code)} bytes)")

        quoter_code = w3.eth.get_code(UNISWAP_V3_QUOTER_V2)
        assert len(quoter_code) > 0, "Quoter has no code (wrong address?)"
        print(f"✅ Quoter contract exists ({len(quoter_code)} bytes)")

        # Check token contracts
        for token, address in TOKEN_ADDRESSES.items():
            code = w3.eth.get_code(address)
            assert len(code) > 0, f"{token} has no code (wrong address?)"
            print(f"✅ {token} contract exists ({len(code)} bytes)")

        print("\n✅ CONTRACT EXISTENCE TEST PASSED")
        return True

    except Exception as e:
        print(f"\n❌ CONTRACT EXISTENCE TEST FAILED: {e}")
        return False


def test_4_token_decimals():
    """Stage 4: Verify we can read token decimals"""
    print("\n" + "="*60)
    print("TEST 4: Token Contract Calls")
    print("="*60)

    try:
        from app.agents.onchain.uniswap_client import (
            TOKEN_ADDRESSES,
            get_token_decimals
        )

        expected_decimals = {
            "USDC": 6,
            "WETH": 18,
            "cbBTC": 8
        }

        for token, address in TOKEN_ADDRESSES.items():
            decimals = get_token_decimals(address)
            expected = expected_decimals.get(token)

            if expected:
                assert decimals == expected, f"{token} has {decimals} decimals, expected {expected}"

            print(f"✅ {token} decimals: {decimals}")

        print("\n✅ TOKEN CONTRACT CALLS TEST PASSED")
        return True

    except Exception as e:
        print(f"\n❌ TOKEN CONTRACT CALLS TEST FAILED: {e}")
        return False


def test_5_agent_balances():
    """Stage 5: Check agent wallet balances"""
    print("\n" + "="*60)
    print("TEST 5: Agent Wallet Balances")
    print("="*60)

    try:
        from app.agents.onchain.uniswap_client import (
            get_account,
            get_token_balance,
            TOKEN_ADDRESSES
        )

        agent = get_account("agent_1")
        print(f"Agent 1 Address: {agent.address}\n")

        for token, address in TOKEN_ADDRESSES.items():
            balance = get_token_balance(address, agent.address)
            print(f"  {token}: {balance:,.6f}")

            if balance == 0:
                print(f"    ⚠️  Warning: Agent has 0 {token}")

        print("\n✅ AGENT BALANCES TEST PASSED")
        return True

    except Exception as e:
        print(f"\n❌ AGENT BALANCES TEST FAILED: {e}")
        return False


def test_6_get_quote():
    """Stage 6: Get a real price quote from Uniswap"""
    print("\n" + "="*60)
    print("TEST 6: Uniswap Quote (Read-Only)")
    print("="*60)

    try:
        from app.agents.onchain.uniswap_client import get_quote

        # Try to get a quote for swapping 10 USDC -> WETH
        print("Getting quote: 10 USDC → WETH")
        amount_out, metadata = get_quote("USDC", "WETH", 10.0)

        assert amount_out > 0, "Quote returned 0 output"
        assert metadata['gas_estimate'] > 0, "No gas estimate"

        print(f"✅ Expected output: {amount_out:.8f} WETH")
        print(f"✅ Effective price: {metadata['effective_price']:.8f} WETH per USDC")
        print(f"✅ Gas estimate: {metadata['gas_estimate']:,}")

        # Try reverse quote: WETH -> USDC
        print("\nGetting quote: 0.001 WETH → USDC")
        amount_out2, metadata2 = get_quote("WETH", "USDC", 0.001)

        assert amount_out2 > 0, "Reverse quote returned 0 output"

        print(f"✅ Expected output: {amount_out2:.6f} USDC")
        print(f"✅ Effective price: {metadata2['effective_price']:.6f} USDC per WETH")

        print("\n✅ UNISWAP QUOTE TEST PASSED")
        return True

    except Exception as e:
        print(f"\n❌ UNISWAP QUOTE TEST FAILED: {e}")
        print(f"\nPossible reasons:")
        print(f"  - No liquidity pool exists for this token pair")
        print(f"  - Wrong token addresses")
        print(f"  - Uniswap contract addresses incorrect")
        return False


def main():
    """Run all tests in sequence"""
    print("\n" + "🦄"*30)
    print("UNISWAP INTEGRATION TEST SUITE")
    print("🦄"*30)

    tests = [
        ("Config Validation", test_1_config),
        ("Web3 Connection", test_2_web3_connection),
        ("Contract Existence", test_3_contract_existence),
        ("Token Contracts", test_4_token_decimals),
        ("Agent Balances", test_5_agent_balances),
        ("Uniswap Quotes", test_6_get_quote),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))

            if not passed:
                print(f"\n⚠️  Stopping tests - {test_name} failed")
                break

        except Exception as e:
            print(f"\n❌ UNEXPECTED ERROR in {test_name}: {e}")
            results.append((test_name, False))
            break

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {test_name}")

    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)

    print(f"\nResults: {passed_count}/{total_count} tests passed")

    if passed_count == total_count:
        print("\n🎉 ALL TESTS PASSED! Your Uniswap integration is ready.")
        print("\nNext steps:")
        print("  1. Ensure your agent wallets have USDC balance")
        print("  2. Integrate swap_exact_input() into TradeTool.execute_trade()")
        print("  3. Test with a small swap (1-10 USDC)")
        return 0
    else:
        print("\n⚠️  SOME TESTS FAILED - Fix issues before proceeding")
        return 1


if __name__ == "__main__":
    sys.exit(main())
