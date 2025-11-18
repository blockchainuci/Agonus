import { mockTrades } from "../data/mockTrades";

export default function RecentTrades() {
  return (
    <div className="border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>

      <div className="flex flex-col gap-3">
        {mockTrades.map((trade, i) => (
          <div key={i} className="border border-white/5 rounded-lg p-3">
            <p className="font-medium text-white">
              {trade.action.toUpperCase()} {trade.token}
            </p>
            <p className="text-gray-400 text-sm">
              Amount: ${trade.amount_usd}
            </p>
            <p className="text-gray-400 text-sm">
              Price: ${trade.price_usd}
            </p>
            <p className="text-gray-500 text-xs">{trade.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
