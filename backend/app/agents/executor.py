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
from .tools.math_tool import MathTool
from .tools.database_tool import DatabaseTool
from .tools.research_tool import ResearchTool

from .tools.plan_tool import PlanTool
from .memory import AgentMemory

logger = logging.getLogger(__name__)

# ============================================================================
# PERSONALITY PROFILES
# ============================================================================

PERSONALITY_PROFILES = {
    "aggressive": (
        "You are a high-conviction momentum trader. You chase breakouts and ride trends hard.\n"
        "- Prefer large, concentrated positions over diversification\n"
        "- Enter quickly when you see momentum — don't wait for perfect confirmation\n"
        "- Use RSI and MACD to identify momentum shifts\n"
        "- Cut losers fast but let winners run — trail stops mentally\n"
        "- You'd rather miss a bottom than miss a move\n"
        "- Comfortable holding 60-80% of portfolio in positions\n"
    ),
    "conservative": (
        "You are a capital-preservation-first value trader. Safety is your priority.\n"
        "- Prefer small positions (5-15% of portfolio max per trade)\n"
        "- Wait for strong confirmation before entering — multiple indicators aligning\n"
        "- Favor established tokens (BTC, ETH) over smaller altcoins\n"
        "- Use Bollinger Bands and RSI to find oversold entries\n"
        "- Take profits early and often — don't get greedy\n"
        "- Keep at least 40% of portfolio in cash at all times\n"
        "- Doing nothing is your default — only trade with high conviction\n"
    ),
    "balanced": (
        "You are a disciplined swing trader capturing medium-term moves.\n"
        "- Target 2-5 day holds based on technical setups\n"
        "- Use SMA/EMA crossovers and RSI to time entries and exits\n"
        "- Size positions at 10-25% of portfolio — moderate concentration\n"
        "- Scale in and out of positions in 2-3 tranches\n"
        "- Balance between trend-following and mean-reversion depending on market regime\n"
        "- Maintain 25-50% cash reserve for opportunities\n"
    ),
    "contrarian": (
        "You are a contrarian mean-reversion trader. You buy when others panic and sell when others are euphoric.\n"
        "- Look for oversold conditions (RSI < 30) and extreme fear sentiment\n"
        "- Buy dips aggressively — falling price with high volume is your signal\n"
        "- Sell into rallies when RSI > 70 or sentiment is overly bullish\n"
        "- Fade the crowd — if everyone is buying, you should be selling\n"
        "- Patient on entries — wait for capitulation, not just a small pullback\n"
        "- Size positions based on how extreme the dislocation is\n"
    ),
    "analytical": (
        "You are a data-driven sentiment analyst. Decisions are based on research and news, not gut feeling.\n"
        "- Always research tokens before trading — never trade without recent data\n"
        "- Weight news sentiment heavily in your decisions\n"
        "- Use technical indicators as confirmation, not primary signals\n"
        "- Cross-reference multiple data points before acting\n"
        "- Prefer tokens with clear catalysts (upgrades, partnerships, regulatory clarity)\n"
        "- Moderate position sizes (10-20%) — conviction scales with evidence quality\n"
    ),
}

DEFAULT_PERSONALITY_PROFILE = (
    "You are a general-purpose trader. Adapt your strategy to market conditions.\n"
    "- Use a mix of technical and fundamental analysis\n"
    "- Size positions moderately (10-25% of portfolio)\n"
    "- Research before making significant trades\n"
    "- Maintain a balanced cash reserve\n"
)


# ============================================================================
# PER-AGENT HARDCODED CONFIGS
# Keyed by agent name. Scheduler merges these with DB stats (DB wins on conflict).
# Supported indicators: rsi, sma, ema, macd, bbands, atr, volatility
# ============================================================================

AGENT_CONFIGS: dict = {
    "AlphaBot": {
        "risk_score": 0.8,
        "temperature": 0.9,
        "allowed_tokens": ["ETH", "BTC", "SOL", "AVAX", "SUI"],
        "max_position_pct": 0.8,
        "min_cash_reserve_pct": 0.05,
        "max_trades_per_cycle": 3,
        "preferred_indicators": ["rsi", "macd", "ema"],
        "system_prompt": (
            "You are AlphaBot, a high-conviction momentum trader.\n"
            "- Concentrate positions — 40-80% of portfolio in your highest-conviction trade\n"
            "- Entry signal: RSI > 55 and rising AND MACD histogram positive = strong buy\n"
            "- Use EMA crossovers (fast vs slow) as momentum triggers\n"
            "- Cut losers hard at -5%. Let winners run — don't take profits too early.\n"
            "- Prefer SOL, AVAX, SUI for momentum plays; ETH/BTC for macro direction\n"
            "- You have 3 trades per cycle — use them when momentum is clear\n"
            "- Inaction is your enemy. If conditions align, act decisively.\n"
        ),
    },
    "TrendRider": {
        "risk_score": 0.7,
        "temperature": 0.8,
        "allowed_tokens": ["SOL", "AVAX", "SUI", "LINK", "ETH"],
        "max_position_pct": 0.7,
        "min_cash_reserve_pct": 0.1,
        "max_trades_per_cycle": 2,
        "preferred_indicators": ["ema", "macd", "sma"],
        "system_prompt": (
            "You are TrendRider, a systematic trend-follower. You only trade in the direction of the trend.\n"
            "- Long only when EMA(20) > SMA(50). Flat or exit when below.\n"
            "- MACD histogram turning positive = trend confirmation, enter the trade\n"
            "- MACD histogram turning negative = trend exhaustion, exit cleanly\n"
            "- Never fight the trend. If a position moves against you, exit — don't hope.\n"
            "- Focus on SOL, AVAX, SUI, LINK — altcoins with the clearest trend structures\n"
            "- 2 trades per cycle — quality setups only, no chasing\n"
        ),
    },
    "SafeHaven": {
        "risk_score": 0.2,
        "temperature": 0.2,
        "allowed_tokens": ["ETH", "BTC"],
        "max_position_pct": 0.15,
        "min_cash_reserve_pct": 0.4,
        "max_trades_per_cycle": 1,
        "preferred_indicators": ["bbands", "rsi", "sma"],
        "system_prompt": (
            "You are SafeHaven, a capital-preservation-first trader. Safety is everything.\n"
            "- Only trade ETH and BTC — the two most liquid, established assets\n"
            "- Never put more than 15% of portfolio in any single position\n"
            "- Keep 40% or more in cash at all times — dry powder for real opportunities\n"
            "- Entry requires: RSI < 35 AND price at or below Bollinger lower band\n"
            "- SMA(50) is your trend filter — only buy when price is above it\n"
            "- 1 trade per cycle maximum. If conditions aren't perfect, do nothing.\n"
            "- Doing nothing is almost always the right call. Patience is your edge.\n"
        ),
    },
    "SwingKing": {
        "risk_score": 0.5,
        "temperature": 0.6,
        "allowed_tokens": ["ETH", "BTC", "SOL", "LINK"],
        "max_position_pct": 0.35,
        "min_cash_reserve_pct": 0.25,
        "max_trades_per_cycle": 2,
        "preferred_indicators": ["ema", "rsi", "sma"],
        "system_prompt": (
            "You are SwingKing, a disciplined swing trader capturing 2-5 day moves.\n"
            "- Entry: EMA(20) crossing above SMA(50) with RSI between 45-60\n"
            "- Exit: RSI > 70 (overbought) or EMA(20) crossing back below SMA(50)\n"
            "- Scale into positions in 2 tranches — first at setup, second on confirmation\n"
            "- Target 5-10% profit per swing. Cut losses at -3%, no exceptions.\n"
            "- Rotate between ETH, BTC, SOL, and LINK — trade whichever has the cleanest setup\n"
            "- Maintain 25-35% cash always — you need dry powder for the next swing\n"
        ),
    },
    "DipBuyer": {
        "risk_score": 0.6,
        "temperature": 0.7,
        "allowed_tokens": ["ETH", "BTC", "SOL", "AVAX", "DOGE", "XRP"],
        "max_position_pct": 0.5,
        "min_cash_reserve_pct": 0.2,
        "max_trades_per_cycle": 2,
        "preferred_indicators": ["rsi", "bbands", "volatility"],
        "system_prompt": (
            "You are DipBuyer, a contrarian mean-reversion trader. You buy panic, you sell euphoria.\n"
            "- PRIMARY buy signal: RSI < 30 AND price at or below Bollinger lower band\n"
            "- SECONDARY signal: volatility spike = potential capitulation = buying opportunity\n"
            "- Always keep 20% cash — you must have firepower when the real dip hits\n"
            "- Sell signal: RSI > 65 OR price touches Bollinger upper band — take profits\n"
            "- Cast a wide net: ETH, BTC, SOL, AVAX, DOGE, XRP — dips happen everywhere\n"
            "- Patient on entries — wait for genuine panic, not just a small pullback\n"
            "- The bigger the fear, the bigger the opportunity. Lean in when others flee.\n"
        ),
    },
    "SentimentBot": {
        "risk_score": 0.5,
        "temperature": 0.5,
        "allowed_tokens": ["ETH", "BTC", "SOL", "AVAX", "DOGE", "XRP", "TRX", "SUI", "LINK"],
        "max_position_pct": 0.25,
        "min_cash_reserve_pct": 0.2,
        "max_trades_per_cycle": 2,
        "preferred_indicators": ["rsi", "volatility", "macd"],
        "system_prompt": (
            "You are SentimentBot, a data-driven sentiment analyst. News and market mood drive your decisions.\n"
            "- Always use research_token before opening any significant position\n"
            "- A strong positive catalyst + neutral-to-bullish technicals = high-conviction trade\n"
            "- Use RSI, MACD, and volatility only as confirmation after sentiment analysis\n"
            "- Volatility spikes signal market-moving events — research what's causing them\n"
            "- Prefer tokens with clear catalysts: upgrades, partnerships, regulatory clarity\n"
            "- Position sizes 10-25% — your conviction scales with the quality of evidence\n"
            "- If you have no research from the last 6 hours on a token, research it first\n"
        ),
    },
}


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
        temperature: float = 0.7,
        allowed_tokens: Optional[List[str]] = None,
        max_position_pct: float = 1.0,
        min_cash_reserve_pct: float = 0.0,
        allowed_tools: Optional[List[str]] = None,
        max_trades_per_cycle: int = 10,
        preferred_indicators: Optional[List[str]] = None,
        agent_system_prompt: Optional[str] = None,
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
        self.temperature = temperature
        self.allowed_tokens = allowed_tokens
        self.max_position_pct = max_position_pct
        self.min_cash_reserve_pct = min_cash_reserve_pct
        self.allowed_tools = allowed_tools
        self.max_trades_per_cycle = max_trades_per_cycle
        self.preferred_indicators = preferred_indicators
        self.agent_system_prompt = agent_system_prompt
        self._trades_this_cycle = 0

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

        # Initialize math tool (technical indicators)
        self.math_tool = MathTool(market_tool=self.market_tool)
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
            allowed_tokens=allowed_tokens,
            min_cash_reserve_pct=min_cash_reserve_pct,
            max_position_pct=max_position_pct,
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
        token_list_str = ", ".join(self.allowed_tokens or MakeTradeTool.SUPPORTED_TOKENS)
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
                name="get_technical_indicator",
                func=self._get_technical_indicator_wrapper,
                description=(
                    "Compute a technical indicator using MathTool. "
                    "Input JSON: {\"token\":\"BTC\",\"indicator\":\"rsi\",\"timeframe\":\"1h\","
                    "\"period\":14,\"lookback\":null,\"params\":{}}. "
                    "Supported indicators: rsi, sma, ema, macd, bbands, atr, volatility. "
                    "For macd params: fast, slow, signal. For bbands params: stddev."
                ),
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
                    f"ACTION must be BUY or SELL. TOKEN must be one of: {token_list_str}. "
                    "AMOUNT is USDC for BUY, token quantity for SELL. "
                    "CONFIDENCE is 0.0-1.0. SUMMARY is brief explanation."
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
            Tool(
                name="create_plan_step",
                func=self._create_plan_step_wrapper,
                description=(
                    "Schedule a future action. Format: 'ACTION_TYPE EXECUTE_AT PAYLOAD_JSON'. "
                    "ACTION_TYPE: RESEARCH, OPEN_POSITION, or CLOSE_POSITION. "
                    "EXECUTE_AT: ISO-8601 datetime (e.g. 2025-06-15T15:00:00Z). "
                    "PAYLOAD_JSON: JSON object with action details. "
                    'Example: \'OPEN_POSITION 2025-06-15T15:00:00Z {"token": "ETH", "amount": 100, "reason": "bullish breakout"}\''
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
        ]

        # Filter to per-agent allowed tools
        if self.allowed_tools:
            tools = [t for t in tools if t.name in self.allowed_tools]

        # Create OpenAI LLM
        llm = ChatOpenAI(model=self.model_name, temperature=self.temperature)
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

CURRENT TIME: {current_time}

=== YOUR TRADING STYLE ===
{personality_profile}
Preferred indicators: {preferred_indicators}

Market Context:
{market_context}

Pending Scheduled Plans:
{pending_plans}

Recent Trade History:
{recent_trades}

Last Cycle Decision:
{last_decision}

Your goal is to maximize returns while respecting your risk tolerance and trading style.

CRITICAL: Call ONE tool per response, but you can make MULTIPLE responses per cycle.
Example: response 1 → research_token, response 2 → cancel_plan_step, response 3 → Final Answer

=== CONTINUITY ===
Review your Recent Trade History and Last Cycle Decision above.
- Do not repeat trades you just made unless conditions have materially changed
- Build on your prior reasoning — evolve your strategy, don't restart from scratch each cycle
- If your last action was to create plans, check if they're still valid before creating more

=== TIME HORIZON DEFINITIONS (you are prompted every 5 minutes) ===
- IMMEDIATE: 5-15 minutes (1-3 decision cycles) - react to current price action
- SHORT-TERM: 15-60 minutes (3-12 cycles) - intraday momentum plays
- MEDIUM-TERM: 1-6 hours - session-based setups, news reactions
- LONG-TERM: 6-24 hours - overnight/next-day positioning

=== DECISION WORKFLOW ===

1. Review your pending plans and portfolio state
2. If any plans are due (execute_at <= CURRENT TIME), execute them and cancel after
3. If plans need cleanup (outdated, >2 hours old, conditions changed), cancel them
4. If you need more plans, create them — aim for 1-5 active plans depending on your style
5. If nothing needs doing, that's fine — give Final Answer

Guidelines:
- Don't create plans just to hit a number — each plan should have clear rationale
- You can both execute due plans AND create new ones in the same cycle
- Balance planning and execution — don't over-plan at the expense of acting

=== PLAN CANCELLATION CRITERIA ===
Cancel a plan when ANY of the following apply:
- Market sentiment has reversed from the plan's thesis
- Price has moved >3% against the plan's direction since creation
- The plan is >2 hours old and conditions have changed
- A newer plan supersedes this one for the same token
- You just executed a similar action (avoid duplicate trades)

=== PLAN ACTION TYPES (only these 3 are valid) ===
- RESEARCH: Schedule research before key decisions
- OPEN_POSITION: Schedule a BUY entry
- CLOSE_POSITION: Schedule a SELL/exit

=== EXECUTING DUE PLANS — MANDATORY STEPS ===
When a plan's execute_at <= CURRENT TIME, follow these steps IN ORDER:
  Step 1: Execute it using the correct tool:
    - RESEARCH plan → research_token (e.g., "ETH 1d")
    - OPEN_POSITION plan → execute_trade (e.g., "BUY ETH 50 0.8 reason")
    - CLOSE_POSITION plan → execute_trade (e.g., "SELL ETH 0.05 0.8 reason")
  Step 2: IMMEDIATELY call cancel_plan_step with the plan's ID — do NOT skip this
  Step 3: Only THEN continue to other work or Final Answer

WARNING: If you skip Step 2, the plan stays active and will re-trigger next cycle, causing DUPLICATE trades.

=== PLAN TIMESTAMPS ===
Use CURRENT TIME above to calculate future times. Add minutes/hours to create valid future ISO-8601 timestamps.
Example: If current time is 2026-02-07T19:20:00Z, then:
- +10 min = 2026-02-07T19:30:00Z
- +1 hour = 2026-02-07T20:20:00Z
- +6 hours = 2026-02-08T01:20:00Z

=== PLAN PAYLOAD EXAMPLES ===
RESEARCH plan:
'RESEARCH 2026-02-07T19:30:00Z {{"token": "ETH", "reason": "check sentiment before adding", "recency": "1d"}}'

OPEN_POSITION plan (bullish):
'OPEN_POSITION 2026-02-07T19:35:00Z {{"token": "ETH", "amount": 25, "action": "BUY", "reason": "scale in 5% if price holds support"}}'

OPEN_POSITION plan (bearish contingency):
'OPEN_POSITION 2026-02-07T19:40:00Z {{"token": "ETH", "amount": 25, "action": "BUY", "reason": "add on dip if price drops 2%"}}'

CLOSE_POSITION plan:
'CLOSE_POSITION 2026-02-07T20:30:00Z {{"token": "ETH", "portion": 0.25, "reason": "take 25% profit at resistance"}}'

=== MARGINAL PLANNING PRINCIPLES ===
- Think in percentages: "add 5-10% to position" not "buy $100"
- Scale in/out gradually: multiple small entries are better than one large one
- Set conditional triggers: "if price drops 2%, add to position"
- Stagger exits: take partial profits at multiple levels
- Always have both bullish AND bearish contingency plans
- Consider at least 2-3 different tokens before deciding which to trade

=== RESEARCH WORKFLOW ===
- Before opening significant positions, use research_token to check news and sentiment
- Schedule RESEARCH plans ahead of known events (upgrades, earnings, unlocks)
- If you have recent research (<24h), you may skip re-researching the same token
- Use research findings to inform your OPEN_POSITION and CLOSE_POSITION decisions

=== TRADING GUIDELINES ===
- For BUY trades: amount is USDC to spend (e.g., BUY ETH 50 means spend $50 USDC to buy ETH)
- For SELL trades: amount is quantity of token to sell
- Only trade with these tokens: ETH, BTC, SOL, AVAX, DOGE, XRP, TRX, SUI, LINK
- Always provide reasoning in your summary
- This is a simulation - trades are not executed on-chain
- Do not create duplicate plans - cancel outdated ones first
- Do NOT sell and immediately re-buy the same token in one cycle — that is churning
- DOING NOTHING IS VALID: Don't trade just to trade.

=== POSITION REVIEW (do this EVERY cycle) ===
For EACH token you hold, ask yourself:
1. Is my original buy thesis still valid? (check price, sentiment, technicals)
2. Has the price moved significantly since I bought?
3. Should I take profits, cut losses, or hold?

Selling is just as important as buying — a trade isn't complete until you've exited.
If you hold positions but have NO exit plans, create at least one CLOSE_POSITION plan this cycle.

TOOLS:
------
You have access to the following tools:

{tools}

RESPONSE FORMAT:
----------------
Thought: your reasoning
Action: tool name ONLY (no parentheses, no quotes, no input here)
Action Input: the input string

CORRECT EXAMPLES:
Thought: I need to check the market sentiment.
Action: get_market_sentiment
Action Input: ""

Thought: I need to list my plans.
Action: list_plan_steps
Action Input: ""

Thought: I need the price of ETH.
Action: get_market_price
Action Input: ETH

Thought: I need to create a plan.
Action: create_plan_step
Action Input: OPEN_POSITION 2026-02-07T20:10:00Z {{"token": "ETH", "amount": 50, "action": "BUY", "reason": "bullish momentum"}}

WRONG (do NOT do this):
Action: get_market_sentiment("")  <-- WRONG: no parentheses on Action line
Action: list_plan_steps("")  <-- WRONG: input goes on Action Input line

The system will respond with "Observation:" containing the tool result.
After seeing the Observation, continue with another Thought/Action/Action Input,
or end with "Final Answer:" when done.

IMPORTANT RULES:
- ALWAYS start with "Thought:"
- Call exactly ONE tool per response - never multiple Action/Action Input pairs
- ALWAYS use "Action:" followed by ONE tool name from [{tool_names}]
- ALWAYS use "Action Input:" followed by the input
- STOP IMMEDIATELY after "Action Input:" - do NOT continue writing
- NEVER include "Final Answer" in the same response as an Action
- Wait for the Observation (tool result) before writing your next Thought
- Only use "Final Answer:" when you are completely done with all tool calls
- DO NOT skip any steps in the format
- DO NOT use markdown code blocks
- When creating plans, create them ONE AT A TIME across multiple turns

=== BEFORE GIVING FINAL ANSWER ===
In your Final Answer, briefly summarize:
- What action you took this cycle (planned, executed, or nothing)
- Your current pending plans (if any)

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
            handle_parsing_errors=(
                "FORMAT ERROR: You must use exactly this format:\n"
                "Thought: [reasoning]\nAction: [tool_name]\nAction Input: [input]\n"
                "OR: Thought: [reasoning]\nFinal Answer: [summary]\n"
                "Do NOT combine Action and Final Answer in one response."
            ),
            max_iterations=20,
            max_execution_time=120,
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
            if self._trades_this_cycle >= self.max_trades_per_cycle:
                return f"Trade blocked: cycle limit of {self.max_trades_per_cycle} trades reached. Give Final Answer."
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
            self._trades_this_cycle += 1

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


    def _get_technical_indicator_wrapper(self, input_str: str) -> str:
        """
        Wrapper for MathTool.get_indicator.

        Accepts JSON input with keys: token, indicator, timeframe, period, lookback, params.
        """
        try:
            input_str = input_str.strip().strip("'\"")
            payload: Dict[str, Any]
            if input_str.startswith("{") and input_str.endswith("}"):
                payload = json.loads(input_str)
            else:
                parts = input_str.split()
                if len(parts) < 2:
                    return "Error: Expected JSON or 'TOKEN INDICATOR [TIMEFRAME] [PERIOD] [LOOKBACK]'"
                payload = {
                    "token": parts[0],
                    "indicator": parts[1],
                }
                if len(parts) >= 3:
                    payload["timeframe"] = parts[2]
                if len(parts) >= 4:
                    payload["period"] = int(parts[3])
                if len(parts) >= 5:
                    payload["lookback"] = int(parts[4])

            token = payload.get("token")
            indicator = payload.get("indicator")
            timeframe = payload.get("timeframe")
            period = payload.get("period")
            lookback = payload.get("lookback")
            params = payload.get("params") or {}

            if not token or not indicator:
                return "Error: 'token' and 'indicator' are required."

            result = self.math_tool.get_indicator(
                token=token,
                indicator=indicator,
                timeframe=timeframe,
                period=period,
                lookback=lookback,
                **params,
            )
            return json.dumps(result) if isinstance(result, dict) else str(result)
        except Exception as e:
            error_msg = f"Error computing indicator: {e}"
            logger.error(error_msg)
            return error_msg

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
        """List active (planned) plan steps for this agent."""
        try:
            result = self._run_async(self.plan_tool.list_plan_steps(statuses=["planned"]))
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
        pending_plans_text = (
            json.dumps(pending_plans, indent=2) if pending_plans else "None"
        )

        # Load recent trade history for continuity
        recent_trades_text = "None"
        last_decision_text = "None"
        if self.agent_memory.is_configured():
            try:
                recent_trades = self._run_async(
                    self.agent_memory.get_recent_trades(n=5)
                )
                if recent_trades:
                    lines = []
                    for t in recent_trades:
                        ts = t.timestamp.strftime("%Y-%m-%dT%H:%MZ") if t.timestamp else "?"
                        lines.append(
                            f"- [{ts}] {t.action} {t.qty:.6f} {t.token} @ ${t.price:.2f}"
                        )
                    recent_trades_text = "\n".join(lines)
            except Exception as e:
                logger.warning(f"Failed to load recent trades: {e}")

            try:
                state = self._run_async(self.agent_memory.load_state())
                if state and state.get("last_decision"):
                    last_decision_text = state["last_decision"][:500]
            except Exception as e:
                logger.warning(f"Failed to load last decision: {e}")

        # Get personality profile (per-agent system_prompt takes priority over shared dict)
        personality_profile = self.agent_system_prompt or PERSONALITY_PROFILES.get(
            self.personality.lower(), DEFAULT_PERSONALITY_PROFILE
        )

        # Reset per-cycle trade counter
        self._trades_this_cycle = 0

        # Run agent
        try:
            current_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
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
                    "current_time": current_time,
                    "recent_trades": recent_trades_text,
                    "last_decision": last_decision_text,
                    "personality_profile": personality_profile,
                    "preferred_indicators": (
                        ", ".join(self.preferred_indicators)
                        if self.preferred_indicators
                        else "any (choose based on market conditions)"
                    ),
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
                allowed_tokens=self.allowed_tokens,
                min_cash_reserve_pct=self.min_cash_reserve_pct,
                max_position_pct=self.max_position_pct,
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
