import { mockBets } from '../data/mockBet';

export default function PastBets() {
  const past = mockBets.filter((b) => b.status !== 'active');

  return (
    <div className="border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Past Bets</h3>

      {past.length === 0 ? (
        <p className="text-gray-500 text-sm">No past bets</p>
      ) : (
        <div className="flex flex-col gap-3">
          {past.map((bet) => (
            <div key={bet.id} className="border border-white/5 rounded-lg p-3">
              <p className="font-medium text-white">{bet.agent}</p>
              <p
                className={`text-xs font-semibold ${
                  bet.status === 'won' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {bet.status.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
