import Hero from './components/hero/Hero';
import HowItWorks from './components/HowItWorks';
import FeaturedAgents from './components/FeaturedAgents';
import Tournaments from './components/Tournaments';
import SectionBackground from './components/background/SectionBackground';

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <SectionBackground id="home" variant="base">
        <Hero />
      </SectionBackground>
      <SectionBackground
        variant="grid"
        baseClass="bg-deep-performance"
        gridClass="bg-grid-gold-bright grid-flicker"
        className="py-10"
        parallax
      >
        <div className="max-w-6xl mx-auto px-6">
          <div id="how-it-works">
            <HowItWorks />
          </div>
          <div id="agents">
            <FeaturedAgents />
          </div>
        </div>
      </SectionBackground>
      <SectionBackground id="tournaments" variant="inverse">
        <Tournaments />
      </SectionBackground>
    </div>
  );
}
