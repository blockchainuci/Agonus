import { mockBets } from '../data/mockBet';

export default function BettingOverview() {
  return (
    <div className="border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Your Bets</h3>

      {mockBets.length === 0 ? (
        <p className="text-gray-400">You haven&apos;t placed any bets yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {mockBets.map((b, idx) => (
            <div key={idx} className="border border-white/5 rounded-lg p-3">
              <p className="font-medium text-white">Agent: {b.agent}</p>
              <p className="text-gray-400 text-sm">
                Amount: {b.amount_eth} ETH
              </p>
              <p className="text-gray-400 text-sm">
                Tournament: {b.tournament_id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
