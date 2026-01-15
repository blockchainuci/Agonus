#!/bin/bash

# Test script for API endpoints with fake data

echo "======================================================================"
echo "TESTING API ENDPOINTS"
echo "======================================================================"
echo ""

# Get the live tournament ID from the seed output
TOURNAMENT_ID="441fdb26-574b-4b3c-a555-04b0d37256ad"

# Test 1: List all tournaments
echo "1️⃣  Testing GET /tournaments"
echo "----------------------------------------------------------------------"
curl -s http://localhost:8000/tournaments | jq '.'
echo ""
echo ""

# Test 2: Get leaderboard for live tournament
echo "2️⃣  Testing GET /tournaments/{id}/leaderboard"
echo "----------------------------------------------------------------------"
curl -s "http://localhost:8000/tournaments/${TOURNAMENT_ID}/leaderboard" | jq '.'
echo ""
echo ""

# Test 3: Get all agents in tournament
echo "3️⃣  Testing GET /tournaments/{id}/agents"
echo "----------------------------------------------------------------------"
curl -s "http://localhost:8000/tournaments/${TOURNAMENT_ID}/agents" | jq '.'
echo ""
echo ""

# Test 4: Get recent trades
echo "4️⃣  Testing GET /trades/recent?limit=10"
echo "----------------------------------------------------------------------"
curl -s "http://localhost:8000/trades/recent?limit=10" | jq '.'
echo ""
echo ""

# Test 5: Get market prices
echo "5️⃣  Testing GET /market-data/prices"
echo "----------------------------------------------------------------------"
curl -s "http://localhost:8000/market-data/prices?tokens=ethereum,bitcoin" | jq '.'
echo ""
echo ""

# Test 6: Get single token price
echo "6️⃣  Testing GET /market-data/price/ethereum"
echo "----------------------------------------------------------------------"
curl -s "http://localhost:8000/market-data/price/ethereum" | jq '.'
echo ""
echo ""

echo "======================================================================"
echo "✅ API ENDPOINT TESTING COMPLETE"
echo "======================================================================"
