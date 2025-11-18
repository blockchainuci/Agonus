import { mockBets } from "../data/mockBet";

export default function ActiveBets() {
  const active = mockBets.filter((b) => b.status === "active");

  return (
    <div className="border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Active Bets</h3>

      {active.length === 0 ? (
        <p className="text-gray-500 text-sm">No active bets</p>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map((bet) => (
            <div
              key={bet.id}
              className="border border-white/5 rounded-lg p-3"
            >
              <p className="font-medium text-white">{bet.agent}</p>
              <p className="text-gray-400 text-sm">{bet.amount} ETH</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
