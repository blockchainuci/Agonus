import asyncio
from uuid import UUID
from dotenv import load_dotenv
load_dotenv()

from app.db.database import AsyncSessionLocal
from app.agents.tools.research_tool import ResearchTool, research_result_to_dict, derive_opinion
from app.agents.tools.database_tool import DatabaseTool

async def test_research_flow():
    # Testing Perplexity API
    print("1. Testing ResearchTool...")
    research_tool = ResearchTool()
    result = research_tool.research_token("ETH", "7d")
    print(f"   Got summary: {result.summary_markdown[:100]}...")
    print(f"   Citations: {len(result.citations)}")

    # Converting to Dict
    result_dict = research_result_to_dict(result)
    print(f"2. Converted to dict: {list(result_dict.keys())}")

    # Derive opinion
    opinion = derive_opinion(result.summary_markdown)
    print(f"   Derived opinion: {opinion}")

    # Testing the DB upsert
    print("3. Testing DB upsert...")
    agent_uuid = UUID("22693db3-f7ec-4d5d-a6f2-e9c48a2ac3dc")

    async with AsyncSessionLocal() as session:
        db_tool = DatabaseTool(session)

        await db_tool.upsert_research_result(
            crypto_token="ETH",
            query="Research ETH",
            summary_markdown=result_dict["summary_markdown"],
            citations=result_dict["citations"],
            recency="7d",
            provider=result_dict.get("provider", "perplexity"),
            raw_results=result_dict.get("raw_results"),
            related_tokens=["ETH"],
            agent_opinion=opinion,
            last_researched_by=agent_uuid,
        )
        print("   Upserted to DB!")

    # Testing the cache fetch
    print("4. Fetching from cache...")
    async with AsyncSessionLocal() as session:
        db_tool = DatabaseTool(session)
        cached = await db_tool.get_fresh_research("ETH", "7d")
        if cached:
            print(f"   Cache HIT: {cached['summary_markdown'][:80]}...")
            print(f"   Opinion: {cached['agent_opinion']}")
        else:
            print("   Cache MISS (unexpected)")

if __name__ == "__main__":
    asyncio.run(test_research_flow())
