import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import IntroOverlay from './components/IntroOverlay'; //3d animated

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <HowItWorks />
      <IntroOverlay />
    </main>
  );
}
