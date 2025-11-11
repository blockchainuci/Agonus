import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import FeaturedAgents from './components/FeaturedAgents';
import Tournaments from './components/Tournaments';

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <HowItWorks />
      <FeaturedAgents />
      <Tournaments />
    </main>
  );
}
