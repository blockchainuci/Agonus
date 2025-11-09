//imports needed to build up this page
import Hero from "./components/Hero";//hero banner (main tagline + buttons)
import HowItWorks from "./components/HowItWorks"; //section (instructions)
import FeaturedAgents from "./components/FeaturedAgents"; 
import IntroOverlay from "./components/IntroOverlay";//3d animated 

//components arrive in order
//nice lil 3d intro -> hero start -> instructions -> example agents

export default function Landing() {
  return (
    <>
      <IntroOverlay /> 
      <Hero />
      <HowItWorks />
      <FeaturedAgents />
    </>
  );
}
