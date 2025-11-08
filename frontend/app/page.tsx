import FeaturedAgents from './components/FeaturedAgents';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <HowItWorks />
      <FeaturedAgents />
    </main>
  );
}
