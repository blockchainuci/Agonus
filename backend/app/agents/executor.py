"""
TradingAgent executor using LangChain ReAct pattern.

This module implements a complete trading agent that extends BaseAgent and uses
LangChain's AgentExecutor with tools for market data, portfolio management, and
simulated trading.
"""

import json
import logging
import asyncio
from typing import Any, Dict, List, Tuple, Optional
from datetime import datetime, timezone
from uuid import UUID

from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from langchain.prompts import PromptTemplate

from .base import BaseAgent
from .data_classes import Trade, Portfolio, MarketData
from .tools.market_data_tool import MarketDataTool
from .tools.make_trade_tool import MakeTradeTool
from .tools.database_tool import DatabaseTool
from .tools.plan_tool import PlanTool
from .tools.research_tool import ResearchTool
from .memory import AgentMemory

logger = logging.getLogger(__name__)


class TradingAgent(BaseAgent):
    """
    Complete trading agent implementation using LangChain ReAct pattern.

    This agent can:
    - Fetch and analyze market data
    - Manage a portfolio with cash and crypto holdings
    - Execute simulated trades via MakeTradeTool
    - Make decisions based on market conditions and personality
    - Persist all state to database (no local memory)
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

        # Initialize market data tool
        self.market_tool = MarketDataTool()

        # Intilialize research tool
        self.research_tool = ResearchTool()

        # Initialize simulated trade tool
        self.make_trade_tool = MakeTradeTool(
            agent_id=agent_id,
            portfolio=self.portfolio,
            market_tool=self.market_tool,
            database_tool=database_tool,
            agent_uuid=agent_uuid,
            tournament_uuid=tournament_uuid,
        )

        # Initialize database-backed memory
        self.agent_memory = AgentMemory(
            agent_id=agent_id,
            agent_uuid=agent_uuid,
            tournament_uuid=tournament_uuid,
            database_tool=database_tool,
        )

        # Initialize plan tool
        self.plan_tool = PlanTool(
            agent_id=agent_id,
            agent_uuid=agent_uuid,
            tournament_uuid=tournament_uuid,
            database_tool=database_tool,
        )

        # Track if we need to recover state
        if recover_from_crash and database_tool and agent_uuid and tournament_uuid:
            logger.info(f"Attempting crash recovery for agent={agent_id}")
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
                description="Get current price for a crypto token. Input: token symbol (ETH, BTC, WETH, CBBTC)",
            ),
            Tool(
                name="get_market_sentiment",
                func=lambda _: self.market_tool.get_market_sentiment(),
                description="Get overall market sentiment (bullish/bearish/neutral). Input: empty string",
            ),
            Tool(
                name="get_portfolio_status",
                func=lambda _: self.make_trade_tool.get_portfolio_status(),
                description="Get current portfolio status including cash, holdings, and performance. Input: empty string",
            ),
            Tool(
                name="execute_trade",
                func=self._execute_trade_wrapper,
                description=(
                    "Execute a simulated trade. Format: 'ACTION TOKEN AMOUNT CONFIDENCE SUMMARY' "
                    "Example: 'BUY ETH 50 0.8 Bullish momentum detected'. "
                    "ACTION must be BUY or SELL. TOKEN must be ETH, BTC, SOL, AVAX, DOGE, XRP, TRX, SUI, LINK"
                    "AMOUNT is USDC for BUY, token quantity for SELL. "
                    "CONFIDENCE is 0.0-1.0. SUMMARY is brief explanation."
                ),
            ),
            Tool(
                name="create_plan_step",
                func=self._create_plan_step_wrapper,
                description=(
                    "Schedule a future action. Format: 'ACTION_TYPE EXECUTE_AT PAYLOAD_JSON'. "
                    "ACTION_TYPE: RESEARCH, OPEN_POSITION, or CLOSE_POSITION. "
                    "EXECUTE_AT: ISO-8601 datetime (e.g. 2025-06-15T15:00:00Z). "
                    "PAYLOAD_JSON: JSON object with action details. "
                    "Example: 'OPEN_POSITION 2025-06-15T15:00:00Z {\"token\": \"ETH\", \"amount\": 100, \"reason\": \"bullish breakout\"}'"
                ),
            ),
            Tool(
                name="list_plan_steps",
                func=self._list_plan_steps_wrapper,
                description="List all scheduled plan steps for this agent. Input: empty string",
            ),
            Tool(
                name="cancel_plan_step",
                func=self._cancel_plan_step_wrapper,
                description=(
                    "Cancel a scheduled plan step. Format: 'PLAN_ITEM_ID [REASON]'. "
                    "PLAN_ITEM_ID is the UUID of the plan step. REASON is optional."
                ),
            ),
            Tool(
                name="reschedule_plan_step",
                func=self._reschedule_plan_step_wrapper,
                description=(
                    "Reschedule a plan step to a new time. Format: 'PLAN_ITEM_ID NEW_EXECUTE_AT_ISO'. "
                    "Example: 'abc123-uuid 2025-06-16T10:00:00Z'"
                ),
            ),
            Tool(
                name="research_token",
                func=self._execute_research_token_wrapper,
                description=(
                    "Research a token for news and any market sentiments, "
                    "Input: token symbol and recency (e.g., 'ETH 7d' for last 7 days)"
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

Pending Scheduled Plans:
{pending_plans}

Your goal is to maximize returns while respecting your risk tolerance.

PLANNING (required every decision cycle):
1. Review your pending plans above.
2. If you have fewer than 4 plans, create new ones so you always maintain at least 4 scheduled steps covering short-term (hours), medium-term (days), and long-term (weeks) actions.
3. If you act on a plan NOW (e.g., execute a trade it describes), cancel that plan step immediately so it does not remain as stale/duplicate.
4. Revise or cancel any plans that are outdated or no longer relevant.
5. After updating your plans, decide whether to execute any trades NOW based on current conditions.

Guidelines:
- For BUY trades: amount is USDC to spend (e.g., BUY ETH 50 means spend $50 USDC to buy ETH)
- For SELL trades: amount is quantity of token to sell
- Only trade with these tokens: (use token symbols: ETH, BTC, SOL, AVAX, DOGE, XRP, TRX, SUI, LINK)
- Check portfolio before trading
- Conservative agents should trade less frequently
- Aggressive agents can take larger positions
- Always provide reasoning in your summary
- This is a simulation - trades are not executed on-chain
- Do not create duplicate plans — cancel outdated ones first
- Before making significant trades, research tokens using the research_token tool to check recent news and sentiment
- If recent research already exists, you may reuse it instead of researching again

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
            max_iterations=25,
            max_execution_time=60,
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
            trade_input = trade_input.strip().strip("'\"")
            parts = trade_input.split(maxsplit=4)
            if len(parts) < 5:
                return f"Error: Invalid trade format. Expected 'ACTION TOKEN AMOUNT CONFIDENCE SUMMARY', got: {trade_input}"

            action = parts[0].upper()
            token = parts[1].upper()
            amount = float(parts[2])
            confidence = float(parts[3])
            summary = parts[4]

            # Execute trade - handle async properly
            trade = self._run_async(
                self.make_trade_tool.execute_trade(
                    action=action,
                    token=token,
                    amount=amount,
                    confidence=confidence,
                    summary=summary,
                    risk_score=self.risk_score,
                )
            )

            logger.info(f"Trade executed successfully: {trade}")

            return (
                f"Trade executed successfully! "
                f"{action} {trade.qty:.6f} {token} at ${trade.price:.2f}. "
                f"New cash: ${self.portfolio.cash:.2f}, "
                f"Total value: ${self.portfolio.total_value:.2f}"
            )

        except Exception as e:
            error_msg = f"Trade execution error: {str(e)}"
            logger.error(error_msg)
            return error_msg
        
    def _execute_research_token_wrapper(self, input_str: str) -> str:
        """
        Wrapper for executing research token from LangChain tool.

        Args:
            input_str: "ETH" or "ETH 7d"

        Returns:
            Research summary string
        """
        from .tools.research_tool import research_result_to_dict

        try:
            parts = input_str.split()
            if len(parts) < 1:
                return "Error: Invalid format. Expected 'TOKEN' or 'TOKEN RECENCY'"

            token = parts[0].upper()
            recency = parts[1] if len(parts) > 1 else "7d"

            # Call sync research method
            research_result = self.research_tool.research_token(
                token_symbol=token,
                recency=recency,
            )

            # Persist result to DB (convert dataclass to dict)
            if self.database_tool and self.agent_uuid:
                result_dict = research_result_to_dict(research_result)
                self._run_async(
                    self.database_tool.save_research_result(
                        agent_uuid=self.agent_uuid,
                        query=f"Research {token}",
                        result=result_dict,
                        recency=recency,
                        related_tokens=[token],
                    )
                )

            return research_result.summary_markdown

        except Exception as e:
            logger.error(f"Research tool error: {e}")
            return f"Research tool error: {str(e)}"


    def _create_plan_step_wrapper(self, input_str: str) -> str:
        """Parse: 'ACTION_TYPE EXECUTE_AT_ISO PAYLOAD_JSON'"""
        try:
            input_str = input_str.strip().strip("'\"")
            parts = input_str.split(maxsplit=2)
            if len(parts) < 3:
                return "Error: Expected 'ACTION_TYPE EXECUTE_AT_ISO PAYLOAD_JSON'"
            action_type = parts[0].upper()
            execute_at = parts[1]
            payload_str = parts[2].replace('\\"', '"')
            payload = json.loads(payload_str)
            result = self._run_async(
                self.plan_tool.create_plan_step(
                    action_type=action_type,
                    execute_at=execute_at,
                    payload=payload,
                )
            )
            return json.dumps(result)
        except Exception as e:
            error_msg = f"Error creating plan step: {e}"
            logger.error(error_msg)
            return error_msg

    def _list_plan_steps_wrapper(self, _input: str) -> str:
        """List all plan steps for this agent."""
        try:
            result = self._run_async(self.plan_tool.list_plan_steps())
            return json.dumps(result, indent=2) if result else "No plan steps found."
        except Exception as e:
            error_msg = f"Error listing plan steps: {e}"
            logger.error(error_msg)
            return error_msg

    def _cancel_plan_step_wrapper(self, input_str: str) -> str:
        """Parse: 'PLAN_ITEM_ID [REASON]'"""
        try:
            parts = input_str.strip().strip("'\"").split(maxsplit=1)
            plan_item_id = UUID(parts[0])
            reason = parts[1] if len(parts) > 1 else None
            result = self._run_async(
                self.plan_tool.cancel_plan_step(
                    plan_item_id=plan_item_id,
                    reason=reason,
                )
            )
            return f"Plan step cancelled: {result}"
        except Exception as e:
            error_msg = f"Error cancelling plan step: {e}"
            logger.error(error_msg)
            return error_msg

    def _reschedule_plan_step_wrapper(self, input_str: str) -> str:
        """Parse: 'PLAN_ITEM_ID NEW_EXECUTE_AT_ISO'"""
        try:
            parts = input_str.strip().strip("'\"").split(maxsplit=1)
            if len(parts) < 2:
                return "Error: Expected 'PLAN_ITEM_ID NEW_EXECUTE_AT_ISO'"
            plan_item_id = UUID(parts[0])
            new_execute_at = parts[1]
            result = self._run_async(
                self.plan_tool.reschedule_plan_step(
                    plan_item_id=plan_item_id,
                    new_execute_at=new_execute_at,
                )
            )
            return json.dumps(result)
        except Exception as e:
            error_msg = f"Error rescheduling plan step: {e}"
            logger.error(error_msg)
            return error_msg

    def _run_async(self, coro):
        """Run an async coroutine from sync code, handling event loop properly."""
        try:
            # Try to get existing loop
            loop = asyncio.get_running_loop()
        except RuntimeError:
            # No running loop - create new one
            loop = None

        if loop is not None:
            # Already in async context - use nest_asyncio
            import nest_asyncio
            nest_asyncio.apply()
            return loop.run_until_complete(coro)
        else:
            # No loop - use asyncio.run()
            return asyncio.run(coro)

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
        return self.make_trade_tool.validate_trade(
            action, token, amount, self.risk_score
        )

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
        return self.make_trade_tool.get_portfolio_status()

    def get_tournament_info(self) -> Dict[str, Any]:
        """Get tournament context."""
        return {"tournament_id": self.tournament_id, "agent_id": self.agent_id}

    def get_short_term_memory(self, n: int = 10) -> List[Trade]:
        """Get recent trades from database."""
        return self._run_async(self.agent_memory.get_recent_trades(n))

    def get_long_term_memory(self, limit: int = 100) -> List[Trade]:
        """Get historical trades from database."""
        return self._run_async(self.agent_memory.get_trade_history(limit))

    def update_memory(self, trade: Trade) -> None:
        """Save trade to database (no-op since MakeTradeTool handles this)."""
        pass  # MakeTradeTool saves trades directly to database

    def reset_tournament_memory(self) -> None:
        """Reset for new tournament (no-op for database-backed memory)."""
        pass  # Database memory persists across sessions

    def find_similar_market_context(self, description: str) -> List[Dict[str, Any]]:
        """Find similar past market situations (placeholder)."""
        return []

    def create_vector_embedding(self, description: str) -> List[float]:
        """Create embedding from description (placeholder)."""
        return []

    def query_vector_db(self) -> List[Dict[str, Any]]:
        """Query vector database (placeholder)."""
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

    async def execute_trade(
        self,
        action: str,
        token: str,
        qty: float,
        price: float,
        confidence: float,
        summary: str,
    ) -> Trade:
        """Execute a simulated trade and update portfolio."""
        return await self.make_trade_tool.execute_trade(
            action=action,
            token=token,
            amount=qty,
            confidence=confidence,
            summary=summary,
            risk_score=self.risk_score,
        )

    def get_personality_response(self, trade: Trade) -> str:
        """Generate personality-driven response for a trade."""
        if self.personality.lower() == "aggressive":
            return f"Just executed a {trade.action} on {trade.token}! Going big or going home!"
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
                "1. Analyze current market conditions and your portfolio state. "
                "2. Check your pending scheduled plans. If any are due or relevant, decide whether to act on, revise, or cancel them. "
                "If you have no plans, create a strategy with scheduled steps for now and the future using create_plan_step. "
                "3. Based on your personality and risk tolerance, decide whether to execute any trades now. "
                "If you trade, execute it. If not, explain your reasoning."
                "Before making any trade decisions, research any tokens you are considering  "
                "using the research_token tool to check recent news and market sentiment "
                "if you do not already have recent research. "
                "Then decide if any trades should be executed based on your personality and risk tolerance. "
                "If you decide to trade, execute it. If not, explain why."
            )

        # Update portfolio values before making decision
        self.make_trade_tool.recalculate_holdings_value()

        # Get market context
        sentiment = self.market_tool.get_market_sentiment()
        market_context = f"Market sentiment: {sentiment}"

        # Fetch pending plans for context
        if self.plan_tool.db_configured:
            pending_plans = self._run_async(
                self.plan_tool.list_plan_steps(statuses=["planned"])
            )
        else:
            pending_plans = []
        pending_plans_text = json.dumps(pending_plans, indent=2) if pending_plans else "None"

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
                    "pending_plans": pending_plans_text,
                }
            )

            return result

        except Exception as e:
            error_msg = f"Decision-making error: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}

    def evaluate_performance(self) -> Dict[str, Any]:
        """Compute performance metrics."""
        # Update portfolio values
        self.make_trade_tool.recalculate_holdings_value()
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

        Args:
            last_decision: Last decision made by agent
        """
        await self.agent_memory.save_state(
            portfolio=self.portfolio,
            rank=0,  # Rank will be calculated by scheduler
            last_decision=last_decision,
        )

    async def recover_state(self) -> bool:
        """
        Recover agent state from database after a crash.

        Returns:
            True if recovery successful, False otherwise
        """
        state = await self.agent_memory.load_state()

        if not state:
            logger.info("No previous state found in database")
            return False

        try:
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

            # Recreate make_trade_tool with restored portfolio
            self.make_trade_tool = MakeTradeTool(
                agent_id=self.agent_id,
                portfolio=self.portfolio,
                market_tool=self.market_tool,
                database_tool=self.database_tool,
                agent_uuid=self.agent_uuid,
                tournament_uuid=self.tournament_uuid,
            )

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
        await self.agent_memory.save_trade(trade)
