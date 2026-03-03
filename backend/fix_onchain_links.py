#!/usr/bin/env python3
"""
Fix on-chain tournament links.

The add_contract_columns migration set fake/mock contract_tournament_id values
that don't correspond to real on-chain tournaments, causing placeBet to revert
with "Tournament does not exist".

This script:
  1. Finds every tournament whose contract_tournament_id is a mock (i.e. wasn't
     created via the real on-chain flow)
  2. Creates a real on-chain tournament for each one
  3. Updates contract_tournament_id and agent_contract_mapping in the DB

Usage:
    cd backend
    python fix_onchain_links.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.db.models import Tournament, AgentState, StatusEnum
from app.onchain.agonus_betting import get_agonus_client


async def fix_links():
    client = get_agonus_client()
    print(f"Connected to contract at {client.contract.address}")
    print(f"Wallet: {client.account.address}")
    print(f"Chain ID: {client.chain_id}\n")

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Tournament))
        tournaments = result.scalars().all()

        fixed = 0
        skipped = 0

        for t in tournaments:
            # Only fix LIVE tournaments — completed ones don't need betting
            if t.status != StatusEnum.live:
                print(f"  SKIP  {t.name!r} (status={t.status.value})")
                skipped += 1
                continue

            if not t.agent_contract_mapping:
                print(f"  SKIP  {t.name!r} — no agent_contract_mapping, use admin panel first")
                skipped += 1
                continue

            agent_count = len(t.agent_contract_mapping)

            print(f"  Processing {t.name!r} (id={t.id})")
            print(f"    Current contract_tournament_id: {t.contract_tournament_id}")
            print(f"    Agents in mapping: {agent_count}")

            # Verify whether the current on-chain tournament actually exists and is active
            current_valid = False
            if t.contract_tournament_id is not None:
                try:
                    on_chain = client.contract.functions.tournaments(
                        t.contract_tournament_id
                    ).call()
                    # on_chain = (isActive, isSettled, totalPool, winningAgentId, agentCount)
                    on_chain_active = on_chain[0]
                    on_chain_agent_count = on_chain[4]
                    current_valid = on_chain_active and on_chain_agent_count == agent_count
                    if current_valid:
                        print(f"    On-chain tournament {t.contract_tournament_id} is valid and active — skipping")
                    else:
                        print(f"    On-chain tournament {t.contract_tournament_id} invalid "
                              f"(active={on_chain_active}, agentCount={on_chain_agent_count}) — will recreate")
                except Exception as e:
                    print(f"    Could not verify on-chain state: {e} — will recreate")

            if current_valid:
                skipped += 1
                continue

            # Create a fresh on-chain tournament
            print(f"    Creating on-chain tournament with {agent_count} agents...")
            try:
                tx_result = client.create_tournament(agent_count=agent_count)
                new_contract_id = tx_result.contract_tournament_id
                print(f"    Created: contract_tournament_id={new_contract_id} (tx={tx_result.tx_hash})")
            except Exception as e:
                print(f"    ERROR creating on-chain tournament: {e}")
                continue

            # Rebuild mapping preserving existing UUID->slot order but using new on-chain ID
            sorted_ids = sorted(t.agent_contract_mapping.keys())
            new_mapping = {agent_id: idx + 1 for idx, agent_id in enumerate(sorted_ids)}

            t.contract_tournament_id = new_contract_id
            t.agent_contract_mapping = new_mapping
            session.add(t)
            await session.commit()
            await session.refresh(t)

            print(f"    Updated DB: contract_tournament_id={new_contract_id}")
            print(f"    New mapping: {new_mapping}")
            fixed += 1

    print(f"\nDone. Fixed={fixed}, Skipped={skipped}")


if __name__ == "__main__":
    asyncio.run(fix_links())
