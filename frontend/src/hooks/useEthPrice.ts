import { useState, useEffect } from 'react';

interface UseEthPriceReturn {
  ethPriceUsd: number | null;
  isLoading: boolean;
}

export function useEthPrice(): UseEthPriceReturn {
  const [ethPriceUsd, setEthPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrice() {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setEthPriceUsd(data?.ethereum?.usd ?? null);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPrice();
    const interval = setInterval(fetchPrice, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { ethPriceUsd, isLoading };
}
