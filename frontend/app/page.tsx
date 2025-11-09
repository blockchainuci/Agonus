import FeaturedAgents from './components/FeaturedAgents';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <HowItWorks />
      <FeaturedAgents />
      <footer className="py-12 px-6 text-center border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400 text-sm">
            Developed by <span className="text-[#FFD700] font-semibold">Blockchain UCI</span>
          </p>
          <p className="text-gray-500 text-xs mt-2">
            © 2025 Agonus. .
          </p>
        </div>
      </footer>
    </main>
  );
}
