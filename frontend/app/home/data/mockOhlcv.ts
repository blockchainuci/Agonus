import { UTCTimestamp } from "lightweight-charts";

// Tournament 5 - LIVE (higher prices, trending up)
export const mockOhlcv5 = [
  { time: 1707696000 as UTCTimestamp, open: 2400.50, high: 2420.30, low: 2395.00, close: 2415.20 },
  { time: 1707696300 as UTCTimestamp, open: 2415.20, high: 2425.10, low: 2410.00, close: 2418.50 },
  { time: 1707696600 as UTCTimestamp, open: 2418.50, high: 2430.00, low: 2415.00, close: 2425.80 },
  { time: 1707696900 as UTCTimestamp, open: 2425.80, high: 2435.50, low: 2420.00, close: 2428.30 },
  { time: 1707697200 as UTCTimestamp, open: 2428.30, high: 2440.00, low: 2425.00, close: 2435.60 },
  { time: 1707697500 as UTCTimestamp, open: 2435.60, high: 2445.20, low: 2430.00, close: 2438.90 },
  { time: 1707697800 as UTCTimestamp, open: 2438.90, high: 2450.00, low: 2435.00, close: 2442.10 },
  { time: 1707698100 as UTCTimestamp, open: 2442.10, high: 2455.30, low: 2440.00, close: 2448.50 },
  { time: 1707698400 as UTCTimestamp, open: 2448.50, high: 2460.00, low: 2445.00, close: 2452.80 },
  { time: 1707698700 as UTCTimestamp, open: 2452.80, high: 2465.50, low: 2450.00, close: 2458.30 },
  { time: 1707699000 as UTCTimestamp, open: 2458.30, high: 2470.00, low: 2455.00, close: 2462.40 },
  { time: 1707699300 as UTCTimestamp, open: 2462.40, high: 2475.20, low: 2460.00, close: 2468.50 },
  { time: 1707699600 as UTCTimestamp, open: 2468.50, high: 2480.30, low: 2465.00, close: 2472.80 },
  { time: 1707699900 as UTCTimestamp, open: 2472.80, high: 2485.00, low: 2470.00, close: 2478.60 },
  { time: 1707700200 as UTCTimestamp, open: 2478.60, high: 2490.50, low: 2475.00, close: 2482.30 },
  { time: 1707700500 as UTCTimestamp, open: 2482.30, high: 2495.00, low: 2480.00, close: 2488.90 },
  { time: 1707700800 as UTCTimestamp, open: 2488.90, high: 2500.20, low: 2485.00, close: 2492.40 },
  { time: 1707701100 as UTCTimestamp, open: 2492.40, high: 2505.50, low: 2490.00, close: 2498.60 },
  { time: 1707701400 as UTCTimestamp, open: 2498.60, high: 2510.00, low: 2495.00, close: 2502.80 },
  { time: 1707701700 as UTCTimestamp, open: 2502.80, high: 2515.30, low: 2500.00, close: 2508.50 },
];

// Tournament 4 - ENDED (lower prices, more volatile)
export const mockOhlcv4 = [
  { time: 1707696000 as UTCTimestamp, open: 2200.50, high: 2210.30, low: 2190.00, close: 2205.20 },
  { time: 1707696300 as UTCTimestamp, open: 2205.20, high: 2220.10, low: 2200.00, close: 2215.50 },
  { time: 1707696600 as UTCTimestamp, open: 2215.50, high: 2225.00, low: 2210.00, close: 2220.80 },
  { time: 1707696900 as UTCTimestamp, open: 2220.80, high: 2235.50, low: 2215.00, close: 2230.30 },
  { time: 1707697200 as UTCTimestamp, open: 2230.30, high: 2240.00, low: 2220.00, close: 2225.60 },
  { time: 1707697500 as UTCTimestamp, open: 2225.60, high: 2235.20, low: 2220.00, close: 2228.90 },
  { time: 1707697800 as UTCTimestamp, open: 2228.90, high: 2240.00, low: 2225.00, close: 2235.10 },
  { time: 1707698100 as UTCTimestamp, open: 2235.10, high: 2245.30, low: 2230.00, close: 2238.50 },
  { time: 1707698400 as UTCTimestamp, open: 2238.50, high: 2250.00, low: 2235.00, close: 2245.80 },
  { time: 1707698700 as UTCTimestamp, open: 2245.80, high: 2255.50, low: 2240.00, close: 2248.30 },
  { time: 1707699000 as UTCTimestamp, open: 2248.30, high: 2260.00, low: 2245.00, close: 2255.40 },
  { time: 1707699300 as UTCTimestamp, open: 2255.40, high: 2265.20, low: 2250.00, close: 2258.50 },
  { time: 1707699600 as UTCTimestamp, open: 2258.50, high: 2270.30, low: 2255.00, close: 2265.80 },
  { time: 1707699900 as UTCTimestamp, open: 2265.80, high: 2275.00, low: 2260.00, close: 2268.60 },
  { time: 1707700200 as UTCTimestamp, open: 2268.60, high: 2280.50, low: 2265.00, close: 2275.30 },
  { time: 1707700500 as UTCTimestamp, open: 2275.30, high: 2285.00, low: 2270.00, close: 2278.90 },
  { time: 1707700800 as UTCTimestamp, open: 2278.90, high: 2290.20, low: 2275.00, close: 2285.40 },
  { time: 1707701100 as UTCTimestamp, open: 2285.40, high: 2295.50, low: 2280.00, close: 2288.60 },
  { time: 1707701400 as UTCTimestamp, open: 2288.60, high: 2300.00, low: 2285.00, close: 2295.80 },
  { time: 1707701700 as UTCTimestamp, open: 2295.80, high: 2305.30, low: 2290.00, close: 2298.50 },
];

// Tournament 6 - UPCOMING (flat/low activity)
export const mockOhlcv6 = [
  { time: 1707696000 as UTCTimestamp, open: 2300.00, high: 2305.00, low: 2295.00, close: 2302.00 },
  { time: 1707696300 as UTCTimestamp, open: 2302.00, high: 2307.00, low: 2298.00, close: 2305.00 },
  { time: 1707696600 as UTCTimestamp, open: 2305.00, high: 2310.00, low: 2302.00, close: 2307.00 },
  { time: 1707696900 as UTCTimestamp, open: 2307.00, high: 2312.00, low: 2304.00, close: 2309.00 },
  { time: 1707697200 as UTCTimestamp, open: 2309.00, high: 2314.00, low: 2306.00, close: 2311.00 },
  { time: 1707697500 as UTCTimestamp, open: 2311.00, high: 2316.00, low: 2308.00, close: 2313.00 },
  { time: 1707697800 as UTCTimestamp, open: 2313.00, high: 2318.00, low: 2310.00, close: 2315.00 },
  { time: 1707698100 as UTCTimestamp, open: 2315.00, high: 2320.00, low: 2312.00, close: 2317.00 },
  { time: 1707698400 as UTCTimestamp, open: 2317.00, high: 2322.00, low: 2314.00, close: 2319.00 },
  { time: 1707698700 as UTCTimestamp, open: 2319.00, high: 2324.00, low: 2316.00, close: 2321.00 },
  { time: 1707699000 as UTCTimestamp, open: 2321.00, high: 2326.00, low: 2318.00, close: 2323.00 },
  { time: 1707699300 as UTCTimestamp, open: 2323.00, high: 2328.00, low: 2320.00, close: 2325.00 },
  { time: 1707699600 as UTCTimestamp, open: 2325.00, high: 2330.00, low: 2322.00, close: 2327.00 },
  { time: 1707699900 as UTCTimestamp, open: 2327.00, high: 2332.00, low: 2324.00, close: 2329.00 },
  { time: 1707700200 as UTCTimestamp, open: 2329.00, high: 2334.00, low: 2326.00, close: 2331.00 },
  { time: 1707700500 as UTCTimestamp, open: 2331.00, high: 2336.00, low: 2328.00, close: 2333.00 },
  { time: 1707700800 as UTCTimestamp, open: 2333.00, high: 2338.00, low: 2330.00, close: 2335.00 },
  { time: 1707701100 as UTCTimestamp, open: 2335.00, high: 2340.00, low: 2332.00, close: 2337.00 },
  { time: 1707701400 as UTCTimestamp, open: 2337.00, high: 2342.00, low: 2334.00, close: 2339.00 },
  { time: 1707701700 as UTCTimestamp, open: 2339.00, high: 2344.00, low: 2336.00, close: 2341.00 },
];

// Helper to get OHLCV data by tournament ID
export function getOhlcvByTournament(tournamentId: number) {
  switch (tournamentId) {
    case 5:
      return mockOhlcv5;
    case 4:
      return mockOhlcv4;
    case 6:
      return mockOhlcv6;
    default:
      return mockOhlcv5;
  }
}

// Default export for backwards compatibility
export const mockOhlcv = mockOhlcv5;
