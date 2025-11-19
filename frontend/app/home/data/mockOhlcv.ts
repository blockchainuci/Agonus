// mock data for candelstick chart
//simulate realistic trading data over 7 days

const baseTime = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60; // 7 days ago
const interval = 5 * 60; // 5 minutes

export const mockOhlcv = Array.from({ length: 200 }, (_, i) => {
  const time = baseTime + i * interval;
  const basePrice = 2400 + Math.sin(i / 20) * 100; // Trending pattern
  const volatility = 20;

  const open = basePrice + (Math.random() - 0.5) * volatility;
  const close = open + (Math.random() - 0.5) * volatility;
  const high = Math.max(open, close) + Math.random() * volatility * 0.5;
  const low = Math.min(open, close) - Math.random() * volatility * 0.5;

  return {
    time,
    ohlc: {
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    },
  };
});
