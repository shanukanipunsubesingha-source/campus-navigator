import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, BookOpen, Building2, Compass, Menu, Pause, Play, Route, X } from 'lucide-react';
import { Brand, Eyebrow, Modal, Reveal } from './UI';

export default function HeaderHero({ onGuide }) {
  const [menu, setMenu] = useState(false);
  const [film, setFilm] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [wideScreen, setWideScreen] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 701px)').matches);
  const [desktopVideoFailed, setDesktopVideoFailed] = useState(false);
  const video = useRef(null);
  // Keep the existing mobile film. On tablet/desktop, use the sharper,
  // optimized 1080p replacement once it has been uploaded to public/.
  // If it has not been uploaded yet, automatically play the original.
  const backgroundVideo = wideScreen && !desktopVideoFailed ? './hero-desktop.mp4' : './hero.mp4';
  useEffect(() => {
    const media = window.matchMedia('(min-width: 701px)');
    const update = () => setWideScreen(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  function handleVideoError() {
    if (wideScreen && !desktopVideoFailed) {
      setDesktopVideoFailed(true);
      return;
    }
    setVideoFailed(true);
  }
  const reduce = useReducedMotion();
  const links = [{ label: 'Campus map', href: '#planner' }, { label: 'Discover places', href: '#places' }, { label: 'How it works', href: '#how-it-works' }];
  function toggleVideo() {
    if (playing) video.current?.pause();
    else {
      if (!video.current.src) video.current.src = backgroundVideo;
      video.current.play().catch(() => setVideoFailed(true));
    }
  }
  return <>
    <section id="home" className="hero" aria-labelledby="hero-heading">
      <video ref={video} className="hero-video" src={reduce ? undefined : backgroundVideo} poster="./hero-poster.jpg" autoPlay={!reduce} loop muted playsInline preload="metadata" onPlaying={() => { setPlaying(true); setVideoFailed(false); }} onPause={() => setPlaying(false)} onError={handleVideoError} aria-hidden="true" />
      <div className="hero-shade" />
      <motion.header className="site-header" initial={reduce ? false : { opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <div className="shell nav-inner"><Brand /><nav aria-label="Main navigation" className="desktop-nav">{links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}</nav><a className="outline-button nav-cta" href="#planner">Plan your route <ArrowUpRightIcon /></a><button className="mobile-menu-button icon-button" aria-label={menu ? 'Close navigation menu' : 'Open navigation menu'} aria-controls="mobile-navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></div>
        <AnimatePresence>{menu && <motion.nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav" initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onKeyDown={(event) => { if (event.key === 'Escape') { setMenu(false); document.querySelector('.mobile-menu-button')?.focus(); } }}><div className="shell">{links.map((link) => <a key={link.href} href={link.href} onClick={() => setMenu(false)}>{link.label}<ArrowRight size={17} /></a>)}<button onClick={() => { setMenu(false); onGuide(); }}>Behind the map <BookOpen size={17} /></button></div></motion.nav>}</AnimatePresence>
      </motion.header>
      <div className="shell hero-content"><motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.12 }}>
        <Eyebrow>YOUR CAMPUS. BETTER CONNECTED.</Eyebrow>
        <h1 id="hero-heading">Every path.<br /><span>A new possibility.</span></h1>
        <p>From your first lecture to your favourite corner.<br className="hidden sm:block" /> Find a little direction for everything ahead.</p>
        <div className="hero-actions"><a href="#planner" className="gold-button group">Explore the campus <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></a><button className="film-button" onClick={() => setFilm(true)}><span><Play size={14} fill="currentColor" /></span>Watch the opening film</button></div>
      </motion.div></div>
      <div className="shell hero-bottom"><a href="#planner" className="scroll-cue"><span><ArrowDown size={16} /></span> A CLEARER WAY FORWARD</a><button className="video-control" aria-label={playing ? 'Pause background video' : 'Play background video'} onClick={toggleVideo}>{playing ? <Pause size={14} /> : <Play size={14} />} {videoFailed ? 'Play film' : playing ? 'Pause film' : 'Play film'}</button></div>
    </section>
    <section className="feature-section" aria-label="Wayfinder features"><div className="shell"><Reveal className="feature-grid">
      {[{ icon: Compass, title: 'Find your place', text: 'Search the places that shape your day.' }, { icon: Route, title: 'Take a smarter path', text: 'Choose distance or fewer walkway segments.' }, { icon: Building2, title: 'See the bigger picture', text: 'Explore a connected, interactive campus.' }, { icon: BookOpen, title: 'Discover the thinking', text: 'A simple map. Powerful algorithms.' }].map(({ icon: Icon, title, text }) => <div className="feature-item group" key={title}><Icon size={25} strokeWidth={1.5} className="transition-transform group-hover:scale-110" /><h2>{title}</h2><p>{text}</p></div>)}
    </Reveal></div></section>
    {film && <Modal title="The opening film" onClose={() => setFilm(false)} className="film-modal"><video controls autoPlay playsInline preload="metadata" src={backgroundVideo} onError={handleVideoError} poster="./hero-poster.jpg" className="film-player"><track kind="captions" src="./hero-captions.vtt" srcLang="en" label="Visual description" default /></video><p className="px-6 py-5 text-sm text-gray-400">Your opening video. Select play or pause to explore at your own pace.</p></Modal>}
  </>;
}

function ArrowUpRightIcon() { return <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none"><path d="M4 16 16 4M4 4h12v12" stroke="currentColor" strokeWidth="1.5" /></svg>; }
