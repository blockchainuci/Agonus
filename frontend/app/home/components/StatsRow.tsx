export default function StatsRow() {
  const stats = [
    { label: 'Total Bets', value: 12 },
    { label: 'Total Winnings', value: '0.52 ETH' },
    { label: 'Active Tournaments', value: 1 },
    { label: 'Win Rate', value: '66%' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="border border-white/10 rounded-xl p-4 text-center"
        >
          <p className="text-gray-400 text-sm">{s.label}</p>
          <p className="text-xl font-semibold text-white">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
