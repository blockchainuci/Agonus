import json

import pytest

from backend.app.agents.executor import TradingAgent


def _stub_price_history(count: int = 200):
    prices = [100.0 + i for i in range(count)]
    return [{"timestamp": float(i), "price": price} for i, price in enumerate(prices)]


def test_get_technical_indicator_wrapper_sma(monkeypatch):
    # Avoid building the LangChain executor/LLM in unit tests
    monkeypatch.setattr(TradingAgent, "_build_agent_executor", lambda self: None)

    agent = TradingAgent(
        agent_id="test_agent",
        personality="test",
        risk_score=0.5,
        database_tool=None,
        recover_from_crash=False,
    )

    # Stub out market data to avoid network calls
    price_history = _stub_price_history()
    monkeypatch.setattr(
        agent.market_tool, "get_price_history", lambda token, hours=24: price_history
    )

    result = agent._get_technical_indicator_wrapper(
        '{"token":"BTC","indicator":"sma","period":10}'
    )

    expected = sum(p["price"] for p in price_history[-10:]) / 10
    assert float(result) == pytest.approx(expected)


def test_get_technical_indicator_wrapper_macd(monkeypatch):
    # Avoid building the LangChain executor/LLM in unit tests
    monkeypatch.setattr(TradingAgent, "_build_agent_executor", lambda self: None)

    agent = TradingAgent(
        agent_id="test_agent",
        personality="test",
        risk_score=0.5,
        database_tool=None,
        recover_from_crash=False,
    )

    price_history = _stub_price_history()
    monkeypatch.setattr(
        agent.market_tool, "get_price_history", lambda token, hours=24: price_history
    )

    result = agent._get_technical_indicator_wrapper(
        '{"token":"BTC","indicator":"macd"}'
    )
    payload = json.loads(result)
    assert set(payload.keys()) == {"macd", "signal", "histogram"}
    assert all(isinstance(value, float) for value in payload.values())
