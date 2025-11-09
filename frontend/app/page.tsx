import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import FeaturedAgents from './components/FeaturedAgents';
import IntroOverlay from './components/IntroOverlay'; //3d animated

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <HowItWorks />
      <FeaturedAgents />
      <IntroOverlay />
    </main>
  );
}
