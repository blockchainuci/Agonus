import TournamentStatusBar from "./components/TournamentStatusBar";
import CandleChart from "./components/CandleChart";
import AgentPositions from "./components/AgentPositions";
import RecentTrades from "./components/RecentTrades";
import BettingOverview from "./components/BettingOverview";

export default function HomePage() {
  return (
    <div className="pt-24 max-w-6xl mx-auto flex flex-col gap-16 p-6">
      <TournamentStatusBar />

      <CandleChart />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AgentPositions />
        <BettingOverview />
      </div>

      <RecentTrades />
    </div>
  );
}
