import UserProfileCard from './components/UserInfo';
import TournamentContainer from './components/TournamentStatusBar';
import CandleChart from './components/CandleChart';
import RecentTrades from './components/RecentTrades';

export default function HomePage() {
  return (
    <div className="pt-24 max-w-7xl mx-auto flex flex-col gap-16 p-6">
      {/* User Profile and Tournament Section - Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* User Profile Card - Wider */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <UserProfileCard />
        </div>

        {/* Tournament Container - Takes Remaining Space */}
        <div className="w-full flex-grow">
          <TournamentContainer />
        </div>
      </div>

      <CandleChart />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8"></div>

      <RecentTrades />
    </div>
  );
}
