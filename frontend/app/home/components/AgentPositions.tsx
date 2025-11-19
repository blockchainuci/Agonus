import { mockPositions } from '../data/mockPositions';

export default function AgentPositions() {
  return (
    <div className="border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Agent Positions</h3>

      <div className="flex flex-col gap-3">
        {mockPositions.map((pos, idx) => (
          <div key={idx} className="border border-white/5 rounded-lg p-3">
            <p className="font-medium text-white">{pos.token}</p>
            <p className="text-gray-400 text-sm">Amount: {pos.amount}</p>
            <p className="text-gray-400 text-sm">
              Value: ${pos.current_value_usd}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
