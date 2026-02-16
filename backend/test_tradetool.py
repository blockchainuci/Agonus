"""
Test TradeTool with Tenderly Virtual TestNet.

This tests the full TradeTool class (BUY and SELL operations).
"""

import os
os.environ['RPC_URL'] = "https://virtual.base.us-west.rpc.tenderly.co/5dab82d9-f35a-4d60-bced-0f6ba5293675"
os.environ['TEST_WALLET_ADDRESS'] = "0xF8C43b4C988E4E6a74DA80AFa8fBc5A40d4D77FD"
os.environ['TEST_WALLET_PRIVATE_KEY'] = "bb50c98e776cce4628a7977fca1f9e0fab8e15ca2ca696c70baa64c6a448616f"

from app.agents.tools.trade_tool import TradeTool


def test_buy():
    """Test BUY operation."""
    print("=" * 60)
    print("TEST 1: BUY 100 USDC worth of WETH")
    print("=" * 60)

    tool = TradeTool(agent_id="test_wallet")

    try:
        trade = tool.execute_trade(
            action="BUY",
            token="WETH",
            qty=100,  # 100 USDC
            price=0,  # Price not used for on-chain trades
            confidence=0.8,
            summary="Test buy WETH"
        )

        print("\n✅ BUY SUCCESS!")
        print(f"   TX Hash: {trade.tx_hash}")
        print(f"   Token: {trade.token}")
        print(f"   Quantity: {trade.qty}")
        print(f"   Price: {trade.price}")
        return True

    except Exception as e:
        print(f"\n❌ BUY FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_sell():
    """Test SELL operation."""
    print("\n" + "=" * 60)
    print("TEST 2: SELL 0.01 WETH for USDC")
    print("=" * 60)

    tool = TradeTool(agent_id="test_wallet")

    try:
        trade = tool.execute_trade(
            action="SELL",
            token="WETH",
            qty=0.01,  # 0.01 WETH
            price=0,
            confidence=0.8,
            summary="Test sell WETH"
        )

        print("\n✅ SELL SUCCESS!")
        print(f"   TX Hash: {trade.tx_hash}")
        print(f"   Token: {trade.token}")
        print(f"   Quantity: {trade.qty}")
        print(f"   Price: {trade.price}")
        return True

    except Exception as e:
        print(f"\n❌ SELL FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("\nTesting TradeTool with Tenderly Virtual TestNet\n")

    buy_works = test_buy()
    sell_works = test_sell()

    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"BUY:  {'✅ WORKS' if buy_works else '❌ FAILED'}")
    print(f"SELL: {'✅ WORKS' if sell_works else '❌ FAILED'}")

    if buy_works and sell_works:
        print("\n🎉 TradeTool is fully working with Tenderly!")
        print("\nView transactions on Tenderly:")
        print("https://dashboard.tenderly.co/rounak-rao/project/vnets")
    else:
        print("\n⚠️  Some tests failed - see errors above")


if __name__ == "__main__":
    main()
