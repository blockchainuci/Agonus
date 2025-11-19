'use client';

import { mockTournament } from '../data/mockTournament';

export default function TournamentStatusBar() {
  const t = mockTournament;

  return (
    <div className="border border-white/10 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-2 bg-black/20 backdrop-blur">
      <div className="text-white font-semibold text-lg">Tournament #{t.id}</div>

      <div className="text-gray-400 text-sm flex flex-wrap gap-4">
        <span>
          Status: <span className="text-white">{t.status}</span>
        </span>
        <span>
          Prize Pool: <span className="text-white">${t.prize_pool_usd}</span>
        </span>
        <span>
          Ends: <span className="text-white">{t.end_time}</span>
        </span>
      </div>
    </div>
  );
}
