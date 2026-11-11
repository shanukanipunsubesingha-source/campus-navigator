import { useState } from 'react';
import { MotionConfig } from 'framer-motion';
import HeaderHero from './components/HeaderHero';
import RoutePlanner from './components/RoutePlanner';
import GuideModal from './components/GuideModal';
import { Destinations, HowItWorks, Footer } from './components/CampusSections';
import { useNavigator } from './hooks/useNavigator';

export default function App() {
  const navigator = useNavigator();
  const [guide, setGuide] = useState(false);
  function choosePlace(id) {
    navigator.setDestination(id);
    document.getElementById('planner')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  return <MotionConfig reducedMotion="user"><a className="skip-link" href="#planner">Skip to route planner</a><HeaderHero onGuide={() => setGuide(true)} /><main><RoutePlanner navigator={navigator} onGuide={() => setGuide(true)} /><Destinations onChoose={choosePlace} /><HowItWorks onGuide={() => setGuide(true)} /></main><Footer onGuide={() => setGuide(true)} />{guide && <GuideModal onClose={() => setGuide(false)} />}</MotionConfig>;
}
