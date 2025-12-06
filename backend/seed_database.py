"""
Seed the database with fake tournament data for testing.
Creates tournaments, agents, agent states, and trades.
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4
import random

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from app.db.database import AsyncSessionLocal, init_db
from app.db.models import Tournament, Agent, AgentState, Trade, StatusEnum, ActionEnum


# Agent personalities
AGENT_PERSONALITIES = [
    {
        "name": "Warren Buffett Bot",
        "personality": "Conservative value investor who focuses on long-term holdings and fundamental analysis. Rarely trades.",
        "strategy_type": "value_investing",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=warren",
    },
    {
        "name": "Day Trader Dan",
        "personality": "Aggressive day trader who seeks quick profits and isn't afraid of volatility. Makes frequent trades.",
        "strategy_type": "day_trading",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=dan",
    },
    {
        "name": "Balanced Betty",
        "personality": "Balanced investor who maintains a diversified portfolio and rebalances periodically.",
        "strategy_type": "balanced",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=betty",
    },
    {
        "name": "Momentum Mike",
        "personality": "Momentum trader who follows trends and buys assets showing strong upward movement.",
        "strategy_type": "momentum",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    },
    {
        "name": "Contrarian Carl",
        "personality": "Contrarian investor who buys when others are fearful and sells when others are greedy.",
        "strategy_type": "contrarian",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=carl",
    },
]


async def seed_database():
    """Seed the database with fake data"""

    print("\n" + "="*60)
    print("SEEDING DATABASE WITH FAKE DATA")
    print("="*60 + "\n")

    # Initialize database tables
    print("📊 Initializing database tables...")
    await init_db()
    print("✅ Database tables initialized\n")

    async with AsyncSessionLocal() as session:
        # Create agents
        print("🤖 Creating agents...")
        agents = []
        for agent_data in AGENT_PERSONALITIES:
            agent = Agent(
                id=uuid4(),
                name=agent_data["name"],
                personality=agent_data["personality"],
                strategy_type=agent_data["strategy_type"],
                avatar_url=agent_data["avatar_url"],
                stats={
                    "total_trades": 0,
                    "win_rate": 0.0,
                    "avg_return": 0.0,
                },
                memory={},
                created_at=datetime.utcnow(),
            )
            agents.append(agent)
            session.add(agent)
            print(f"  ✓ {agent.name} ({agent.strategy_type})")

        await session.commit()
        print(f"✅ Created {len(agents)} agents\n")

        # Create tournaments
        print("🏆 Creating tournaments...")
        tournaments = []

        # Tournament 1: Completed
        tournament1 = Tournament(
            id=uuid4(),
            name="Crypto Trading Championship - November",
            status=StatusEnum.completed,
            start_date=datetime.utcnow() - timedelta(days=30),
            end_date=datetime.utcnow() - timedelta(days=1),
            prize_pool=Decimal("10000.00"),
            created_at=datetime.utcnow() - timedelta(days=35),
            winner_agent_id=agents[1].id,  # Day Trader Dan won
            contract_tournament_id=1,
            agent_contract_mapping={str(agents[i].id): i+1 for i in range(3)},
        )
        tournaments.append(tournament1)

        # Tournament 2: Live
        tournament2 = Tournament(
            id=uuid4(),
            name="Winter Trading Battle 2025",
            status=StatusEnum.live,
            start_date=datetime.utcnow() - timedelta(days=7),
            end_date=datetime.utcnow() + timedelta(days=23),
            prize_pool=Decimal("15000.00"),
            created_at=datetime.utcnow() - timedelta(days=10),
            contract_tournament_id=2,
            agent_contract_mapping={str(agents[i].id): i+1 for i in range(5)},
        )
        tournaments.append(tournament2)

        # Tournament 3: Upcoming
        tournament3 = Tournament(
            id=uuid4(),
            name="Spring Showdown 2025",
            status=StatusEnum.upcoming,
            start_date=datetime.utcnow() + timedelta(days=7),
            end_date=datetime.utcnow() + timedelta(days=37),
            prize_pool=Decimal("20000.00"),
            created_at=datetime.utcnow() - timedelta(days=2),
            contract_tournament_id=3,
            agent_contract_mapping={str(agents[i].id): i+1 for i in range(4)},
        )
        tournaments.append(tournament3)

        for tournament in tournaments:
            session.add(tournament)
            print(f"  ✓ {tournament.name} ({tournament.status.value})")

        await session.commit()
        print(f"✅ Created {len(tournaments)} tournaments\n")

        # Create agent states for live tournament
        print("📈 Creating agent states for live tournament...")
        agent_states = []

        live_tournament = tournament2
        starting_value = 10000.0

        for i, agent in enumerate(agents):
            # Simulate different performance
            performance_multiplier = random.uniform(0.85, 1.25)
            current_value = starting_value * performance_multiplier

            eth_holdings = random.uniform(0.0, 2.0)
            btc_holdings = random.uniform(0.0, 0.05)

            # Calculate realistic cash based on holdings
            eth_price = 2989.0
            btc_price = 90632.0
            holdings_value = (eth_holdings * eth_price) + (btc_holdings * btc_price)
            cash = current_value - holdings_value

            portfolio = {
                "cash": round(cash, 2),
                "holdings": {
                    "ETH": round(eth_holdings, 6),
                    "BTC": round(btc_holdings, 6),
                }
            }

            agent_state = AgentState(
                agent_id=agent.id,
                tournament_id=live_tournament.id,
                portfolio=portfolio,
                portfolio_value_usd=Decimal(str(round(current_value, 2))),
                rank=i + 1,  # Will be recalculated
                trades_count=random.randint(5, 25),
                last_decision=random.choice([
                    "Bought 0.5 ETH - Bullish momentum",
                    "Sold 0.2 BTC - Taking profits",
                    "Holding - Waiting for better entry",
                    "Bought 0.3 ETH - Dip buying opportunity",
                    "Rebalancing portfolio allocation",
                ]),
                updated_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 120)),
            )
            agent_states.append(agent_state)
            session.add(agent_state)
            print(f"  ✓ {agent.name}: ${current_value:,.2f} (Rank {i+1})")

        await session.commit()

        # Update ranks based on actual portfolio values
        agent_states.sort(key=lambda x: x.portfolio_value_usd, reverse=True)
        for rank, agent_state in enumerate(agent_states, 1):
            agent_state.rank = rank

        await session.commit()
        print(f"✅ Created {len(agent_states)} agent states\n")

        # Create trades for live tournament
        print("💱 Creating trades for live tournament...")
        trades = []

        for agent_state in agent_states:
            # Generate 5-15 trades per agent
            num_trades = random.randint(5, 15)

            for _ in range(num_trades):
                action = random.choice([ActionEnum.buy, ActionEnum.sell, ActionEnum.hold])
                asset = random.choice(["ETH", "BTC"])

                if action == ActionEnum.buy:
                    amount = Decimal(str(round(random.uniform(0.1, 2.0), 6)))
                    price = Decimal(str(round(2989.0 if asset == "ETH" else 90632.0, 2)))
                elif action == ActionEnum.sell:
                    amount = Decimal(str(round(random.uniform(0.05, 1.0), 6)))
                    price = Decimal(str(round(2989.0 if asset == "ETH" else 90632.0, 2)))
                else:
                    continue  # Skip holds

                trade = Trade(
                    id=uuid4(),
                    agent_id=agent_state.agent_id,
                    tournament_id=live_tournament.id,
                    action=action,
                    asset=asset,
                    amount=amount,
                    price=price,
                    timestamp=datetime.utcnow() - timedelta(
                        minutes=random.randint(10, 10000)
                    ),
                )
                trades.append(trade)
                session.add(trade)

        await session.commit()
        print(f"✅ Created {len(trades)} trades\n")

        # Print summary
        print("\n" + "="*60)
        print("DATABASE SEEDING COMPLETE!")
        print("="*60)
        print(f"\n📊 Summary:")
        print(f"  • Agents: {len(agents)}")
        print(f"  • Tournaments: {len(tournaments)}")
        print(f"  • Agent States: {len(agent_states)}")
        print(f"  • Trades: {len(trades)}")
        print("\n🎯 You can now test the API endpoints:")
        print(f"  • GET /tournaments - List all tournaments")
        print(f"  • GET /tournaments/{live_tournament.id}/leaderboard - Live rankings")
        print(f"  • GET /trades/recent - Recent trade activity")
        print(f"  • GET /market-data/prices - Live market prices")
        print("\n" + "="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(seed_database())
