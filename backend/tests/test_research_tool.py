import asyncio
from uuid import UUID
from dotenv import load_dotenv
load_dotenv()

from app.db.database import AsyncSessionLocal
from app.agents.tools.research_tool import ResearchTool, research_result_to_dict
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

    # Testing the DB save
    print("3. Testing DB save...")
    async with AsyncSessionLocal() as session:
        db_tool = DatabaseTool(session)

        agent_uuid = UUID("22693db3-f7ec-4d5d-a6f2-e9c48a2ac3dc")

        await db_tool.save_research_result(
            agent_uuid=agent_uuid,
            query="Research ETH",
            result=result_dict,
            recency="7d",
            related_tokens=["ETH"],
        )
        print("   Saved to DB!")

    # Testing the DB fetch
    print("4. Fetching from DB...")
    async with AsyncSessionLocal() as session:
        db_tool = DatabaseTool(session)
        results = await db_tool.get_recent_research_results(agent_uuid)
        print(f"   Found {len(results)} research results")

if __name__ == "__main__":
    asyncio.run(test_research_flow())
