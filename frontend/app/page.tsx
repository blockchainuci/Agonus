import FeaturedAgents from './components/FeaturedAgents';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';

export default function Home() {
  return (
    <main>
      <section className="p-8 text-center">
        <h1 className="text-8xl font-bold animate-pulse text-white">Agonus</h1>
        <p className="text-gray-300">Developed by Blockchain UCI</p>
        <Hero />
        <HowItWorks />
        <FeaturedAgents />
      </section>
    </main>
  );
}
