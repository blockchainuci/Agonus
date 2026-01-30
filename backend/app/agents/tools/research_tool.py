import requests
import os
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Literal
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv() # i tried following same structure as market_data_tool.py
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

logger = logging.getLogger(__name__)


class ResearchError(Exception):
    pass


@dataclass
class Citation:
    """citation from research results """
    title: str
    url: str
    date: Optional[str] = None


@dataclass
class ResearchResult:
    """Result from a research query"""
    summary_markdown: str
    citations: List[Citation]
    raw_results: Dict
    provider: str
    created_at: str


class ResearchTool:
    """ fetching and summarizing external research via Perplexity API.
    
    get info ab tokens, protocols,
    market narratives, and crypto news with citations.
    """

    def __init__(self, api_key: str = None):
        self.api_key = api_key or PERPLEXITY_API_KEY
        if not self.api_key:
            raise ResearchError("PERPLEXITY_API_KEY not found in environment")
        
        self.api_base_url = "https://api.perplexity.ai"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        logger.info("ResearchTool initialized")

    def _map_recency_filter(self, recency: str) -> Optional[str]:
        """Map our recency format to Perplexity's search_recency_filter."""
        mapping = {
            "1d": "day",
            "7d": "week",
            "30d": "month",
            "365d": "year"
        }
        return mapping.get(recency)

    def research(
        self,
        query: str,
        recency: Optional[Literal["1d", "7d", "30d", "365d"]] = None,
        sources: Optional[List[Literal["web", "news", "docs"]]] = None, 
        max_results: Optional[int] = None
    ) -> ResearchResult:

        logger.info(f"Research query: {query}")
        
        # request payload
        payload = {
            "model": "sonar",  # mayb switch to "sonar-pro" for more better results
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a crypto research assistant. Provide concise, factual summaries "
                        "about tokens, protocols, market conditions, and crypto news. "
                        "Focus on key facts, recent developments, risks, and catalysts. "
                        "Always cite your sources."
                    )
                },
                {
                    "role": "user",
                    "content": query
                }
            ],
            "max_tokens": 1024,
            "temperature": 0.2,  # less creative n more factual responses
            "return_citations": True,
            "return_related_questions": False
        }

        # Add recency filter if needed
        if recency:
            perplexity_recency = self._map_recency_filter(recency)
            if perplexity_recency:
                payload["search_recency_filter"] = perplexity_recency
                logger.debug(f"Applied recency filter: {perplexity_recency}")

        # API request
        url = f"{self.api_base_url}/chat/completions"
        
        try:
            logger.debug(f"Sending request to Perplexity API")
            response = requests.post(
                url,
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Perplexity API error: {response.status_code} {response.text}")
                raise ResearchError(f"API request failed: {response.status_code} {response.text}")
            
            data = response.json()
            logger.debug("Perplexity API response received")
            
        except requests.Timeout:
            logger.error("Perplexity API request timed out")
            raise ResearchError("Research request timed out")
        except requests.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise ResearchError(f"Request failed: {e}")

        # Parse the response
        summary = ""
        if data.get("choices") and len(data["choices"]) > 0:
            summary = data["choices"][0].get("message", {}).get("content", "")
        
        #Parse citations from perplexity search_results
        raw_search_citations = data.get("search_results", [])
        citations: List[Citation] = []
        for result in raw_search_citations:
            url = result.get("url")
            if not url:
                continue

            citations.append(
                Citation(
                    title=result.get("title", "Unknown Source"),
                    url=result.get("url", ""),
                    date=result.get("date", None)
                )
            )
        if not citations:
            logger.error("Research returned no citations")
            raise ResearchError(
                "Research returned no citations; Unable to verify the information."
            )
        
        result = ResearchResult(
            summary_markdown=summary,
            citations=citations,
            raw_results=data,
            provider="perplexity",
            created_at=datetime.now(timezone.utc).isoformat()
        )
        
        logger.info(f"Research completed with {len(citations)} citations")
        return result

    def research_token(self, token_symbol: str, recency: str = "7d") -> ResearchResult:
        """
         method for researching a specific token.
        
        """
        query = (
            f"What are the latest news, developments, and market sentiment for {token_symbol} "
            f"cryptocurrency? Include any recent catalysts, risks, protocol updates, "
            f"and narrative shifts."
        )
        return self.research(query, recency=recency)


# Helper function to convert ResearchResult to dict (for JSON serialization)
def research_result_to_dict(result: ResearchResult) -> Dict:
    """Convert a ResearchResult to a dictionary for storage/serialization."""
    return {
        "summary_markdown": result.summary_markdown,
        "citations": [
            {"title": c.title, "url": c.url, "date": c.date}
            for c in result.citations
        ],
        "raw_results": result.raw_results,
        "provider": result.provider,
        "created_at": result.created_at
    }
