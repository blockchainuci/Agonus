from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Literal, Tuple
from app.agents.dataclasses import Trade, MarketData, Portfolio, TweetPost


class BaseAgent:
    '''
    The BaseAgent class is the base interface every agent uses to get set up.

    It defines the core surface area an agent should expose to:
    - perceive market context,
    - analyze conditions,
    - inspect portfolio/tournament state,
    - recall memory (short/long-term; semantic),
    - size/validate/execute trades,
    - narrate decisions,
    - evaluate performance.

    Notes
    -----
    This class provides method stubs only; concrete agents should implement
    behavior by overriding these methods or by delegating to injected tools.
    '''

    def __init__(self, agent_id: int, personality: str, risk_score: float, short_term_memory: List[Trade]) -> None:
        """
        Initialize a BaseAgent with identity, behavior knobs, and short-term memory.

        Parameters
        ----------
        agent_id : int
            Unique identifier for this agent.
        personality : str
            Human-readable description of the agent's persona (e.g., "cautious", "aggressive").
        risk_score : float
            Coarse risk appetite in [0.0, 1.0]; used by sizing/validation logic.
        short_term_memory : List[Trade]
            Recent trades for the current tournament. (May be replaced by a memory facade.)

        Returns
        -------
        None
        """
        self.agent_id = agent_id
        self.personality = personality
        self.risk_score = risk_score
        self.short_term_memory = None    # change to a function call later


    def get_market_data(self) -> Dict[str, MarketData]:
        """
        Fetch the latest market snapshot the agent needs for decision-making.

        Returns
        -------
        Dict[str, MarketData] | Any
            A mapping of symbol -> MarketData or a provider-specific structure
            containing prices, volumes, indicators, and timestamps.
        """
        pass

    def get_market_analysis(self) -> Dict[str, Any]:
        """
        Produce a coarse market regime analysis from the current market data.

        Returns
        -------
        Dict[str, Any]
            A summary such as {"trend": str, "volatility": float, "breadth": float}
            or any structure your strategy expects.
        """
        pass

    def get_portfolio_status(self) -> Dict[str, Any]:
        """
        Retrieve the agent's current portfolio snapshot.

        Returns
        -------
        Portfolio | Dict[str, Any]
            Portfolio object or a dict containing cash, holdings value, total value,
            realized/unrealized PnL, and any other relevant metrics.
        """
        pass

    def get_tournament_info(self) -> Dict[str, Any]:
        """
        Retrieve tournament context relevant to the agent's strategy.

        Returns
        -------
        Dict[str, Any]
            Information such as {"current_round": int, "rounds_left": int, "current_rank": int}.
        """
        pass

    def get_short_term_memory(self) -> List[Trade]:
        """
        Return recent trades/actions from short-term memory.

        Returns
        -------
        List[Trade]
            The list of recent Trade objects for the current tournament.
        """
        pass

    def get_long_term_memory(self) -> List[Trade]:
        """
        Query historical trades from long-term storage across tournaments.

        Returns
        -------
        List[Trade]
            A list of Trade objects retrieved from the persistent store.
        """
        pass

    def update_memory(self) -> None:
        """
        Update all memory layers after an event (e.g., a new trade).
        """
        pass

    def reset_tournament_memory(self) -> None:
        """
        Clear short-term memory at the start or end of a tournament.
        """
        pass

    def find_similar_market_context(self, description: str) -> List[Dict[str, Any]]:
        """
        Retrieve semantically similar past situations using vector memory.

        Parameters
        ----------
        description : str
            Natural-language summary of the current setup (e.g., sentiment/indicators).

        Returns
        -------
        List[Dict[str, Any]]
            Ranked vector-search results with similarity scores and metadata.
        """
        pass

    def create_vector_embedding(self, description: str) -> List[float]:
        """
        Convert a natural-language description into an embedding vector.

        Parameters
        ----------
        description : str
            The text to embed (market summary, rationale, etc.).

        Returns
        -------
        List[float]
            Dense embedding suitable for similarity search in a vector DB.
        """
        pass

    def query_vector_db(self) -> List[Dict[str, Any]]:
        """
        Run a similarity search against the configured vector database.

        Returns
        -------
        List[Dict[str, Any]]
            Vector hits (ids/scores/metadata), shape depends on your vector backend.
        """
        pass

    def calculate_position_size(self) -> float:
        """
        Compute how much of an asset to buy/sell given price, confidence, and equity.

        Returns
        -------
        float
            Position size (quantity) to trade. Should be non-negative.
        """
        pass

    def validate_trade(self) -> Tuple[bool, str]:
        """
        Validate a proposed trade immediately before execution.

        Returns
        -------
        Tuple[bool, str]
            (ok, reason). If ok is False, reason explains why the trade is rejected.
        """
        pass

    def execute_trade(self) -> Trade:
        """
        Execute a trade via the configured execution layer (sim/broker).

        Returns
        -------
        Trade
            The executed trade object (including fill price and timestamp).
        """
        pass

    def get_personality_response(self) -> str:
        """
        Generate a natural-language explanation of the agent's action,
        conditioned by the agent's personality and current context.

        Returns
        -------
        str
            Human-readable narrative suitable for logs/UI/social posting.
        """
        pass

    def make_decision(self) -> Dict[str, Any]:
        """
        Produce a decision (e.g., proposed trades) from the current context.

        Returns
        -------
        Dict[str, Any]
            Structured response, such as {"proposals": [...], "notes": "..."}.
        """
        pass

    def evaluate_performance(self) -> Dict[str, Any]:
        """
        Compute performance metrics for the current tournament or timeframe.

        Returns
        -------
        Dict[str, Any]
            Metrics such as equity, cash, holdings value, realized/unrealized PnL,
            ROI, number of trades, and win rate.
        """
        pass
        