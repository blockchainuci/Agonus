from fastapi import APIRouter, HTTPException, Query
import requests
from typing import Optional

router = APIRouter()


@router.get("/prices")
async def get_market_prices(
    tokens: str = Query(
        "ethereum,bitcoin,usd-coin",
        description="Comma-separated list of token IDs (CoinGecko format)",
    ),
    vs_currency: str = Query("usd", description="Currency to get prices in"),
):
    """GET route for live cryptocurrency prices from CoinGecko API"""
    try:
        # Clean up token list
        token_list = [t.strip() for t in tokens.split(",") if t.strip()]

        if not token_list:
            raise HTTPException(status_code=400, detail="No tokens specified")

        # Call CoinGecko API
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": ",".join(token_list),
            "vs_currencies": vs_currency,
            "include_24hr_change": "true",
            "include_24hr_vol": "true",
            "include_last_updated_at": "true",
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()

        # Transform response to be more frontend-friendly
        result = {}
        for token_id in token_list:
            if token_id in data:
                token_data = data[token_id]
                result[token_id] = {
                    "price": token_data.get(vs_currency),
                    "change_24h": token_data.get(f"{vs_currency}_24h_change"),
                    "volume_24h": token_data.get(f"{vs_currency}_24h_vol"),
                    "last_updated": token_data.get("last_updated_at"),
                }
            else:
                result[token_id] = None

        return {
            "success": True,
            "data": result,
            "vs_currency": vs_currency,
        }

    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=503, detail=f"Failed to fetch market data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}"
        )


@router.get("/price/{token}")
async def get_single_price(
    token: str,
    vs_currency: str = Query("usd", description="Currency to get price in"),
):
    """GET route for a single token's current price"""
    try:
        # Call CoinGecko API
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": token.lower(),
            "vs_currencies": vs_currency,
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()
        token_key = token.lower()

        if token_key not in data or vs_currency not in data[token_key]:
            raise HTTPException(
                status_code=404,
                detail=f"Price data not found for token: {token}",
            )

        return {
            "success": True,
            "token": token,
            "price": data[token_key][vs_currency],
            "vs_currency": vs_currency,
        }

    except HTTPException:
        raise
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=503, detail=f"Failed to fetch market data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}"
        )
