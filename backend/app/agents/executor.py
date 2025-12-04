"""
TradingAgent executor using LangChain ReAct pattern.

This module implements a complete trading agent that extends BaseAgent and uses
LangChain's AgentExecutor with tools for market data, portfolio management, and trading.
"""

import logging
from typing import Any, Dict, List, Tuple, Optional
from datetime import datetime, timezone
from uuid import UUID

import os
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from langchain.prompts import PromptTemplate

from .base import BaseAgent
from .data_classes import Trade, Portfolio, MarketData
from .tools.market_data_tool import MarketDataTool
from .tools.portfolio_tool import PortfolioTool
from .tools.trade_tool import TradeTool
from .tools.database_tool import DatabaseTool
from .memory import AgentMemory

logger = logging.getLogger(__name__)


class TradingAgent(BaseAgent):
    """
    Complete trading agent implementation using LangChain ReAct pattern.

    This agent can:
    - Fetch and analyze market data
    - Manage a portfolio with cash and crypto holdings
    - Execute on-chain trades via TradeTool
    - Make decisions based on market conditions and personality
    - Track performance and memory
    """

    def __init__(
        self,
        agent_id: str,
        personality: str,
        risk_score: float,
        agent_uuid: Optional[UUID] = None,
        tournament_id: Optional[int] = None,
        tournament_uuid: Optional[UUID] = None,
        database_tool: Optional[DatabaseTool] = None,
        starting_cash: float = 500.0,
        model_name: str = "gpt-4o-mini",
        recover_from_crash: bool = False,
    ):
        """
        Initialize TradingAgent.

        Args:
            agent_id: Unique agent identifier (e.g., "agent_1")
            personality: Agent personality description (e.g., "aggressive", "conservative")
            risk_score: Risk tolerance [0.0, 1.0]
            agent_uuid: Agent UUID from database (for persistence)
            tournament_id: Optional tournament ID (int)
            tournament_uuid: Tournament UUID from database (for persistence)
            database_tool: DatabaseTool instance for persistence
            starting_cash: Starting portfolio cash (USDC)
            model_name: OpenAI model name for decision-making
            recover_from_crash: If True, attempt to recover state from database
        """
        super().__init__(agent_id, personality, risk_score)

        self.agent_uuid = agent_uuid
        self.tournament_id = tournament_id
        self.tournament_uuid = tournament_uuid
        self.database_tool = database_tool
        self.model_name = model_name

        # Initialize portfolio
        self.portfolio = Portfolio(
            agent_id=agent_id,
            cash=starting_cash,
            holdings={},
            starting_val=starting_cash,
            total_value=starting_cash,
        )

        # Initialize tools
        self.market_tool = MarketDataTool()
        self.portfolio_tool = PortfolioTool(self.portfolio)
        self.trade_tool = TradeTool(agent_id=agent_id)
        self.agent_memory = AgentMemory(
            agent_id=agent_id,
            agent_uuid=agent_uuid,
            tournament_uuid=tournament_uuid,
            database_tool=database_tool,
        )

        # Attempt crash recovery if requested
        if recover_from_crash and database_tool and agent_uuid and tournament_uuid:
            logger.info(f"Attempting crash recovery for agent={agent_id}")
            # Note: This will be implemented as an async method
            self._needs_recovery = True
        else:
            self._needs_recovery = False

        # Initialize LangChain agent executor
        self.executor = self._build_agent_executor()

        logger.info(
            f"TradingAgent initialized: agent_id={agent_id}, "
            f"personality={personality}, risk={risk_score}, cash=${starting_cash}, "
            f"db_enabled={database_tool is not None}"
        )

    def _build_agent_executor(self) -> AgentExecutor:
        """Build LangChain ReAct agent with trading tools."""

        # Define tools for the agent
        tools = [
            Tool(
                name="get_market_price",
                func=lambda token: self.market_tool.get_price(token),
                description="Get current price for a crypto token. Input: token symbol (ETH, BTC, SOL, etc.)",
            ),
            Tool(
                name="get_market_sentiment",
                func=lambda _: self.market_tool.get_market_sentiment(),
                description="Get overall market sentiment (bullish/bearish/neutral). Input: empty string",
            ),
            Tool(
                name="get_portfolio_status",
                func=lambda _: {
                    "cash": self.portfolio.cash,
                    "holdings": self.portfolio.holdings,
                    "total_value": self.portfolio.total_value,
                    "roi": self.portfolio.roi,
                    "num_trades": self.portfolio.num_trades,
                },
                description="Get current portfolio status including cash, holdings, and performance. Input: empty string",
            ),
            Tool(
                name="execute_trade",
                func=self._execute_trade_wrapper,
                description=(
                    "Execute a trade. Format: 'ACTION TOKEN AMOUNT CONFIDENCE SUMMARY' "
                    "Example: 'BUY ETH 10 0.8 Bullish momentum detected'. "
                    "ACTION must be BUY or SELL. TOKEN must be ETH or BTC. "
                    "AMOUNT is USDC for BUY, token quantity for SELL. "
                    "CONFIDENCE is 0.0-1.0. SUMMARY is brief explanation."
                ),
            ),
        ]

        # Create OpenAI LLM
        llm = ChatOpenAI(model=self.model_name, temperature=0.7)
        logger.info(f"Using OpenAI model: {self.model_name}")

        # Define ReAct prompt with proper format
        prompt = PromptTemplate.from_template(
            """You are an AI trading agent with the following characteristics:

Agent ID: {agent_id}
Personality: {personality}
Risk Score: {risk_score} (0.0 = very conservative, 1.0 = very aggressive)
Current Cash: ${cash}
Current Holdings: {holdings}
Total Portfolio Value: ${total_value}

Market Context:
{market_context}

Your goal is to maximize returns while respecting your risk tolerance.

Guidelines:
- For BUY trades: amount is USDC to spend
- For SELL trades: amount is quantity of token to sell
- Only trade ETH and BTC (use token symbols: ETH, BTC)
- Check portfolio before trading
- Conservative agents should trade less frequently
- Aggressive agents can take larger positions
- Always provide reasoning in your summary

TOOLS:
------
You have access to the following tools:

{tools}

RESPONSE FORMAT:
----------------
Use the following format EXACTLY:

Thought: Think about what you need to do
Action: the tool name, must be one of [{tool_names}]
Action Input: the input to the tool
Observation: the result of the tool
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now have enough information to provide a final answer
Final Answer: your final response summarizing the decision made

IMPORTANT RULES:
- ALWAYS start with "Thought:"
- ALWAYS use "Action:" followed by ONE tool name from the list
- ALWAYS use "Action Input:" followed by the input
- DO NOT skip any steps in the format
- DO NOT use markdown code blocks
- DO NOT add extra text between format elements

Begin!

Question: {input}

Thought:{agent_scratchpad}"""
        )

        # Create ReAct agent
        agent = create_react_agent(llm, tools, prompt)

        # Create executor
        return AgentExecutor.from_agent_and_tools(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=15,  # Allow more iterations for complex decisions
            max_execution_time=60,  # 60 second timeout
        )

    def _execute_trade_wrapper(self, trade_input: str) -> str:
        """
        Wrapper for executing trades from LangChain tool.

        Args:
            trade_input: String format "ACTION TOKEN AMOUNT CONFIDENCE SUMMARY"

        Returns:
            Result message
        """
        try:
            parts = trade_input.split(maxsplit=4)
            if len(parts) < 5:
                return f"Error: Invalid trade format. Expected 'ACTION TOKEN AMOUNT CONFIDENCE SUMMARY', got: {trade_input}"

            action = parts[0].upper()
            token = parts[1].upper()
            amount = float(parts[2])
            confidence = float(parts[3])
            summary = parts[4]

            # Get current market price for the trade
            price = self.market_tool.get_price(token)
            if not price or price == 0:
                return f"Error: Could not fetch price for {token}"

            # Validate trade
            is_valid, reason = self.validate_trade(action, token, amount, price)
            if not is_valid:
                return f"Trade validation failed: {reason}"

            # Execute trade
            trade = self.trade_tool.execute_trade(
                action=action,
                token=token,
                qty=amount,
                price=price,
                confidence=confidence,
                summary=summary,
            )

            # Update portfolio
            self.portfolio_tool.update_after_trade(trade)

            # Update memory
            self.agent_memory.add_trade(trade)

            logger.info(f"Trade executed successfully: {trade}")

            return (
                f"Trade executed successfully! "
                f"{action} {trade.qty:.6f} {token} at ${trade.price:.2f}. "
                f"TX: {trade.tx_hash}. "
                f"New cash: ${self.portfolio.cash:.2f}, "
                f"Total value: ${self.portfolio.total_value:.2f}"
            )

        except Exception as e:
            error_msg = f"Trade execution error: {str(e)}"
            logger.error(error_msg)
            return error_msg

    def validate_trade(
        self, action: str, token: str, amount: float, price: float
    ) -> Tuple[bool, str]:
        """
        Validate a proposed trade before execution.

        Args:
            action: BUY or SELL
            token: Token symbol
            amount: Trade amount
            price: Current price

        Returns:
            (is_valid, reason)
        """
        if action not in ["BUY", "SELL"]:
            return False, f"Invalid action: {action}"

        if token not in ["WETH", "CBBTC"]:
            return False, f"Unsupported token: {token}. Only WETH and CBBTC allowed"

        if amount <= 0:
            return False, f"Invalid amount: {amount}. Must be positive"

        if action == "BUY":
            # For BUY, amount is USDC to spend
            if amount > self.portfolio.cash:
                return (
                    False,
                    f"Insufficient cash: have ${self.portfolio.cash:.2f}, need ${amount:.2f}",
                )

            # Risk check: don't spend more than risk_score % of portfolio in one trade
            max_trade_size = self.portfolio.total_value * self.risk_score
            if amount > max_trade_size:
                return (
                    False,
                    f"Trade size ${amount:.2f} exceeds risk limit ${max_trade_size:.2f}",
                )

        elif action == "SELL":
            # For SELL, amount is quantity of token
            current_holdings = self.portfolio.holdings.get(token, 0.0)
            if amount > current_holdings:
                return (
                    False,
                    f"Insufficient {token}: have {current_holdings:.6f}, trying to sell {amount:.6f}",
                )

        return True, "Trade validated"

    # Implement BaseAgent abstract methods

    def get_market_data(self) -> Dict[str, MarketData]:
        """Fetch latest market snapshot."""
        return self.market_tool.get_market_snapshot()

    def get_market_analysis(self) -> Dict[str, Any]:
        """Get market regime analysis."""
        sentiment = self.market_tool.get_market_sentiment()
        return {"sentiment": sentiment, "timestamp": datetime.now(timezone.utc)}

    def get_portfolio_status(self) -> Dict[str, Any]:
        """Get current portfolio snapshot."""
        return self.portfolio_tool.get_portfolio_snapshot().to_dict()

    def get_tournament_info(self) -> Dict[str, Any]:
        """Get tournament context."""
        return {"tournament_id": self.tournament_id, "agent_id": self.agent_id}

    def get_short_term_memory(self, n: int = 10) -> List[Trade]:
        """Get recent trades from short-term memory."""
        return self.agent_memory.get_short_term_memory(n)

    def get_long_term_memory(self, limit: int = 100) -> List[Trade]:
        """Get historical trades from long-term memory."""
        return self.agent_memory.load_long_term_history(limit)

    def update_memory(self, trade: Trade) -> None:
        """Update memory after a trade."""
        self.agent_memory.add_trade(trade)

    def reset_tournament_memory(self) -> None:
        """Reset short-term memory for new tournament."""
        self.agent_memory.reset_short_term_memory()

    def find_similar_market_context(self, description: str) -> List[Dict[str, Any]]:
        """Find similar past market situations (placeholder)."""
        # TODO: Implement vector search
        return []

    def create_vector_embedding(self, description: str) -> List[float]:
        """Create embedding from description (placeholder)."""
        # TODO: Implement embedding
        return []

    def query_vector_db(self) -> List[Dict[str, Any]]:
        """Query vector database (placeholder)."""
        # TODO: Implement vector query
        return []

    def calculate_position_size(
        self, token: str, price: float, confidence: float
    ) -> float:
        """
        Calculate position size based on Kelly Criterion-like approach.

        Args:
            token: Token symbol
            price: Current price
            confidence: Trade confidence [0.0, 1.0]

        Returns:
            Position size in USDC
        """
        # Use fraction of portfolio based on risk score and confidence
        total_value = self.portfolio.total_value
        allocation_pct = self.risk_score * confidence

        # Cap at 50% of portfolio
        allocation_pct = min(allocation_pct, 0.5)

        position_size = total_value * allocation_pct

        logger.debug(
            f"Position sizing: value=${total_value:.2f}, "
            f"risk={self.risk_score}, confidence={confidence}, "
            f"allocation={allocation_pct:.2%}, size=${position_size:.2f}"
        )

        return position_size

    def execute_trade(
        self,
        action: str,
        token: str,
        qty: float,
        price: float,
        confidence: float,
        summary: str,
    ) -> Trade:
        """Execute a trade and update portfolio."""
        # Validate
        is_valid, reason = self.validate_trade(action, token, qty, price)
        if not is_valid:
            raise ValueError(f"Trade validation failed: {reason}")

        # Execute via trade tool
        trade = self.trade_tool.execute_trade(
            action=action,
            token=token,
            qty=qty,
            price=price,
            confidence=confidence,
            summary=summary,
        )

        # Update portfolio
        self.portfolio_tool.update_after_trade(trade)

        # Update memory
        self.update_memory(trade)

        return trade

    def get_personality_response(self, trade: Trade) -> str:
        """Generate personality-driven response for a trade."""
        if self.personality.lower() == "aggressive":
            return f"🚀 Just executed a {trade.action} on {trade.token}! Going big or going home!"
        elif self.personality.lower() == "conservative":
            return f"Carefully executed a {trade.action} on {trade.token}. Slow and steady wins the race."
        else:
            return f"Executed {trade.action} on {trade.token} based on market analysis."

    def make_decision(self, task: Optional[str] = None) -> Dict[str, Any]:
        """
        Make a trading decision using LangChain agent.

        Args:
            task: Optional task description. If None, uses default task.

        Returns:
            Decision result from agent executor
        """
        if task is None:
            task = (
                "Analyze current market conditions and portfolio state. "
                "Decide if any trades should be executed based on your personality and risk tolerance. "
                "If you decide to trade, execute it. If not, explain why."
            )

        # Get market context
        sentiment = self.market_tool.get_market_sentiment()
        market_context = f"Market sentiment: {sentiment}"

        # Run agent
        try:
            result = self.executor.invoke(
                {
                    "input": task,
                    "agent_id": self.agent_id,
                    "personality": self.personality,
                    "risk_score": self.risk_score,
                    "cash": self.portfolio.cash,
                    "holdings": self.portfolio.holdings,
                    "total_value": self.portfolio.total_value,
                    "market_context": market_context,
                }
            )

            return result

        except Exception as e:
            error_msg = f"Decision-making error: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}

    def evaluate_performance(self) -> Dict[str, Any]:
        """Compute performance metrics."""
        portfolio = self.portfolio

        return {
            "agent_id": self.agent_id,
            "tournament_id": self.tournament_id,
            "cash": portfolio.cash,
            "holdings_value": portfolio.holdings_val,
            "total_value": portfolio.total_value,
            "starting_value": portfolio.starting_val,
            "realized_pnl": portfolio.realized_pnl,
            "unrealized_pnl": portfolio.unrealized_pnl,
            "roi": portfolio.roi,
            "roi_percent": portfolio.roi * 100,
            "num_trades": portfolio.num_trades,
            "num_winning_trades": portfolio.num_winning_trades,
            "num_losing_trades": portfolio.num_losing_trades,
            "win_rate": portfolio.win_rate,
            "win_rate_percent": portfolio.win_rate * 100,
        }

    # ============================================================================
    # DATABASE PERSISTENCE & CRASH RECOVERY
    # ============================================================================

    async def save_state(self, last_decision: str = "") -> None:
        """
        Save current agent state to database.

        This enables crash recovery and real-time data streaming to frontend.

        Args:
            last_decision: Last decision made by agent
        """
        if not self.database_tool or not self.agent_uuid or not self.tournament_uuid:
            logger.debug("Database not configured, skipping state save")
            return

        try:
            await self.database_tool.save_agent_state(
                agent_uuid=self.agent_uuid,
                tournament_uuid=self.tournament_uuid,
                portfolio=self.portfolio,
                rank=0,  # Rank will be calculated by scheduler
                last_decision=last_decision,
            )
            logger.info(f"Agent state saved to database: {self.agent_id}")

        except Exception as e:
            logger.error(f"Failed to save agent state: {e}")
            # Don't crash - just log the error

    async def recover_state(self) -> bool:
        """
        Recover agent state from database after a crash.

        Returns:
            True if recovery successful, False otherwise
        """
        if not self.database_tool or not self.agent_uuid or not self.tournament_uuid:
            logger.warning("Database not configured, cannot recover state")
            return False

        try:
            # Load agent state
            state = await self.database_tool.load_agent_state(
                agent_uuid=self.agent_uuid, tournament_uuid=self.tournament_uuid
            )

            if not state:
                logger.info("No previous state found in database")
                return False

            # Restore portfolio
            portfolio_data = state["portfolio"]
            self.portfolio.cash = portfolio_data["cash"]
            self.portfolio.holdings = portfolio_data["holdings"]
            self.portfolio.holdings_val = portfolio_data["holdings_val"]
            self.portfolio.total_value = portfolio_data["total_value"]
            self.portfolio.realized_pnl = portfolio_data["realized_pnl"]
            self.portfolio.unrealized_pnl = portfolio_data["unrealized_pnl"]
            self.portfolio.roi = portfolio_data["roi"]
            self.portfolio.num_trades = portfolio_data["num_trades"]
            self.portfolio.num_winning_trades = portfolio_data["num_winning_trades"]
            self.portfolio.num_losing_trades = portfolio_data["num_losing_trades"]
            self.portfolio.win_rate = portfolio_data["win_rate"]

            # Update portfolio tool
            self.portfolio_tool = PortfolioTool(self.portfolio)

            # Load trade history into short-term memory
            trades = await self.agent_memory.load_long_term_history(limit=100)
            self.agent_memory.short_term = trades

            logger.info(
                f"State recovered successfully: "
                f"cash=${self.portfolio.cash:.2f}, "
                f"total_value=${self.portfolio.total_value:.2f}, "
                f"trades={self.portfolio.num_trades}, "
                f"last_decision='{state['last_decision']}'"
            )

            return True

        except Exception as e:
            logger.error(f"Failed to recover state: {e}")
            return False

    async def save_trade_to_db(self, trade: Trade) -> None:
        """
        Save a trade to the database.

        Args:
            trade: Trade object to save
        """
        if not self.database_tool or not self.agent_uuid or not self.tournament_uuid:
            logger.debug("Database not configured, skipping trade save")
            return

        try:
            await self.agent_memory.save_to_long_term(trade)
            logger.info(f"Trade saved to database: {trade.action} {trade.token}")

        except Exception as e:
            logger.error(f"Failed to save trade to database: {e}")
            # Don't crash - just log the error
