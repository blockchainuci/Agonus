// generateOhlcv.js
// Run with: node generateOhlcv.js
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");

function generateOhlcv(count = 500) {
  let price = 115 + Math.random() * 5; // start in mid-range

  const data = [];
  const now = Date.now();
  const candleMs = 60_000; // 1m candles

  for (let i = count - 1; i >= 0; i--) {
    const ts = Math.floor((now - i * candleMs) / 1000);

    // Base random walk
    const drift = (Math.random() - 0.5) * 1.5;
    const volatility = (Math.random() - 0.5) * 2.0;
    price += drift + volatility;

    // Clamp between 100–130
    price = Math.min(130, Math.max(100, price));

    const open = price + (Math.random() - 0.5) * 1.2;
    const close = price + (Math.random() - 0.5) * 1.2;

    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;

    const volume = Math.floor(120 + Math.random() * 300);

    data.push({
      time: ts,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });
  }

  return data;
}

const candles = generateOhlcv(500);

// 🔥 WRITE DIRECTLY INTO NEXT.JS DATA FOLDER
fs.writeFileSync(
  "./frontend/app/home/data/mockOhlcv.ts",
  "export const mockOhlcv = " + JSON.stringify(candles, null, 2) + ";\n"
);

console.log("Generated frontend/app/home/data/mockOhlcv.ts with 500 candles!");
