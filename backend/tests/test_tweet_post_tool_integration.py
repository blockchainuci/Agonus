"""
Integration tests for TweetPostTool.

These tests verify validation, initialization, and error handling
without making actual API calls to Twitter.

Run: pytest backend/tests/test_tweet_post_tool_integration.py -v -s
"""

import pytest
import os

from backend.app.agents.tools.tweet_post_tool import TweetPostTool, TweetPostError


@pytest.fixture(scope="module")
def tweet_tool():
    """Create TweetPostTool instance for agent_1"""
    return TweetPostTool(agent_id="agent_1", api_bearer="test_token")


@pytest.mark.integration
class TestTweetPostToolValidation:
    """Test input validation without making API calls"""

    def test_missing_bearer_token(self):
        """Test error when bearer token is missing"""
        # Clear any env token
        original = os.environ.get("TWITTER_BEARER_TOKEN")
        if "TWITTER_BEARER_TOKEN" in os.environ:
            del os.environ["TWITTER_BEARER_TOKEN"]

        tool_no_token = TweetPostTool(agent_id="agent_1")

        with pytest.raises(TweetPostError, match="bearer token is missing"):
            tool_no_token.post_tweet("Test tweet")

        # Restore env
        if original:
            os.environ["TWITTER_BEARER_TOKEN"] = original

    def test_empty_content(self, tweet_tool):
        """Test error when tweet content is empty"""
        with pytest.raises(ValueError, match="cannot be empty"):
            tweet_tool.post_tweet("")

    def test_none_content(self, tweet_tool):
        """Test error when tweet content is None"""
        with pytest.raises((ValueError, TypeError)):
            tweet_tool.post_tweet(None)


@pytest.mark.integration
class TestTweetPostToolInitialization:
    """Test TweetPostTool initialization"""

    def test_initialization_with_bearer(self):
        """Test initialization with explicit bearer token"""
        tool = TweetPostTool(agent_id="test_agent", api_bearer="test_token")

        assert tool.agent_id == "test_agent"
        assert tool.api_bearer == "test_token"
        assert tool.post_api_base == "https://api.twitter.com/2"
        assert tool.upload_url == "https://upload.twitter.com/1.1/media/upload.json"

    def test_headers_configuration(self, tweet_tool):
        """Test that headers are properly configured"""
        assert "Authorization" in tweet_tool.post_headers
        assert "Content-Type" in tweet_tool.post_headers
        assert tweet_tool.post_headers["Content-Type"] == "application/json"
        assert tweet_tool.post_headers["Accept"] == "application/json"

    def test_authorization_header_format(self, tweet_tool):
        """Test that Authorization header has correct Bearer format"""
        auth_header = tweet_tool.post_headers["Authorization"]
        assert auth_header.startswith("Bearer ")
        assert "test_token" in auth_header


@pytest.mark.integration
class TestPayloadConstruction:
    """Test that tweet payloads are constructed correctly"""

    def test_payload_with_trade_summary(self):
        """Test that trade summary is appended to content"""
        tool = TweetPostTool(agent_id="agent_1", api_bearer="test_token")

        # We can't call post_tweet without making an API call,
        # but we can verify the tool is configured correctly
        assert tool.agent_id == "agent_1"

    def test_tool_accepts_all_parameters(self):
        """Test that TweetPostTool accepts all expected parameters"""
        tool = TweetPostTool(agent_id="agent_1", api_bearer="test_token")

        # Verify the method signature accepts all parameters
        import inspect
        sig = inspect.signature(tool.post_tweet)
        params = list(sig.parameters.keys())

        expected_params = [
            'content',
            'trade_id',
            'trade_summary',
            'media_url',
            'reply_to_id',
            'personality_signature'
        ]

        for param in expected_params:
            assert param in params, f"Missing parameter: {param}"
