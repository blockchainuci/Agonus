import { useQuery } from "@tanstack/react-query";
import { API_URL } from "./api";

// Fetch current price for a single token
export function useTokenPrice(token: string) {
  return useQuery({
    queryKey: ["market", "price", token],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/market-data/price/${token}`);
      if (!res.ok) throw new Error("Failed to fetch price");
      return res.json();
    },
    refetchInterval: 10000, // Refresh price every 10s
    enabled: !!token,
  });
}

// Fetch prices for multiple tokens (e.g. for a ticker or list)
export function useMarketPrices(
  tokens: string[] = ["bitcoin", "ethereum", "solana"],
) {
  const tokenString = tokens.join(",");
  return useQuery({
    queryKey: ["market", "prices", tokenString],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/market-data/prices?tokens=${tokenString}`,
      );
      if (!res.ok) throw new Error("Failed to fetch market prices");
      return res.json();
    },
    refetchInterval: 30000,
  });
}
