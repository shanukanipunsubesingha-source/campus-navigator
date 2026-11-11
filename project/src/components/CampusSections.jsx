import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, BookOpen, MapPin, Route, SlidersHorizontal } from 'lucide-react';
import { Eyebrow, Reveal } from './UI.jsx';

const destinations = [
  {
    id: 'library',
    number: '01',
    title: 'The Library',
    category: 'LEARN & DISCOVER',
    description: 'A little focus. A new perspective. Find your way to the heart of campus learning.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
    alt: 'Sunlit contemporary interior with open seating and floor-to-ceiling windows',
  },
  {
    id: 'engineering',
    number: '02',
    title: 'Engineering',
    category: 'CREATE & INNOVATE',
    description: 'Follow your curiosity to the spaces where ideas become something extraordinary.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
    alt: 'Modern glass architecture viewed from below against a clear sky',
  },
  {
    id: 'student',
    number: '03',
    title: 'Student Centre',
    category: 'CONNECT & BELONG',
    description: 'Between lectures and everything after. Make your next connection along the way.',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop',
    alt: 'Welcoming shared interior with natural light, plants, and communal seating',
  },
];

export function Destinations({ onChoose }) {
  const reduceMotion = useReducedMotion();

  return (
    <section id="places" aria-labelledby="places-heading" className="bg-white py-20 text-gray-900 md:py-28">
      <div className="shell">
        <Reveal className="mb-12 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Eyebrow>DISCOVER NORTHSTAR</Eyebrow>
            <h2 id="places-heading" className="section-heading mt-5 max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
              A place for every ambition.
            </h2>
          </div>
          <p className="max-w-[330px] text-sm leading-relaxed text-gray-600 md:pb-1">
            Familiar places. New possibilities. Explore a few destinations on our sample campus, then make the journey your own.
          </p>
        </Reveal>

        <div className="grid gap-7 md:grid-cols-3">
          {destinations.map((place, index) => (
            <Reveal key={place.id} delay={index * 0.1} className="h-full">
              <motion.article
                whileHover={reduceMotion ? undefined : { y: -6 }}
                transition={{ duration: 0.25 }}
                className="group flex h-full flex-col border border-gray-200 bg-[#f9fafb] transition-colors duration-300 hover:border-[#d4af37]"
              >
                <div className="relative h-64 overflow-hidden lg:h-72">
                  <img
                    src={place.image}
                    alt={place.alt}
                    loading="lazy"
                    decoding="async"
                    width="1200"
                    height="900"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0E14]/45 via-transparent to-transparent" />
                  <span className="absolute left-5 top-5 border border-white/40 bg-[#0B0E14]/45 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-white backdrop-blur-sm">
                    NORTHSTAR / {place.number}
                  </span>
                  <span aria-hidden="true" className="absolute bottom-5 right-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 text-white transition-colors group-hover:border-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-[#0B0E14]">
                    <ArrowUpRight size={19} strokeWidth={1.6} />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-[#8a6c16]">{place.category}</p>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight">{place.title}</h3>
                  <p className="mb-7 mt-3 text-sm leading-relaxed text-gray-600">{place.description}</p>
                  <button
                    type="button"
                    onClick={() => onChoose(place.id)}
                    aria-label={`Plan a route to ${place.title}`}
                    className="mt-auto flex w-full items-center justify-between border-t border-gray-200 pt-5 text-xs font-semibold tracking-wide text-gray-900 transition-colors hover:text-[#8a6c16]"
                  >
                    Plan a route
                    <ArrowRight aria-hidden="true" size={17} className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" />
                  </button>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-7 flex items-start gap-2 text-xs leading-relaxed text-gray-500">
          <MapPin aria-hidden="true" size={14} className="mt-0.5 shrink-0 text-[#8a6c16]" />
          <p>Northstar is an illustrative campus. Photography is for atmosphere; the interactive map shows the sample locations.</p>
        </Reveal>
      </div>
    </section>
  );
}

const steps = [
  {
    number: '01',
    icon: MapPin,
    title: 'Choose your destination.',
    description: 'Search for a building or select it directly on the campus map. Set your starting point, and you are ready to go.',
  },
  {
    number: '02',
    icon: Route,
    title: 'Find your kind of route.',
    description: 'Choose the shortest walking distance with Dijkstra, or use breadth-first search for the fewest walkway segments.',
  },
  {
    number: '03',
    icon: SlidersHorizontal,
    title: 'Make the journey yours.',
    description: 'Mark a walkway closed to see a new route instantly. Your recent routes stay on this device, ready for your next visit.',
  },
];

export function HowItWorks({ onGuide }) {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="relative overflow-hidden bg-[#0B0E14] py-20 text-white md:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-0 h-[420px] w-[420px] rounded-full border border-[#d4af37]/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 top-16 h-[290px] w-[290px] rounded-full border border-[#d4af37]/10" />
      <div className="shell relative">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow>A LITTLE DIRECTION. A LOT OF POSSIBILITY.</Eyebrow>
            <h2 id="how-it-works-heading" className="section-heading mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
              A better way from A to B.
            </h2>
          </div>
          <p className="max-w-[330px] text-sm leading-relaxed text-gray-400">
            Thoughtful design on the surface. A connected network of places and paths underneath.
          </p>
        </Reveal>

        <div className="mt-14 grid border-t border-white/15 md:mt-16 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.1} className="relative border-b border-white/15 py-9 md:border-b-0 md:py-10 md:pr-8 md:not-first:border-l md:not-first:pl-8">
              <div className="mb-9 flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-[0.25em] text-[#d4af37]">{step.number} /</span>
                <step.icon aria-hidden="true" size={27} strokeWidth={1.35} className="text-[#d4af37]" />
              </div>
              <h3 className="max-w-[250px] text-xl font-semibold leading-snug tracking-tight lg:text-2xl">{step.title}</h3>
              <p className="mt-4 max-w-[340px] text-sm leading-relaxed text-gray-400">{step.description}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 flex flex-col items-start justify-between gap-6 border-t border-white/15 pt-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <BookOpen aria-hidden="true" size={19} strokeWidth={1.5} className="text-[#d4af37]" />
            <span>Curious about what happens behind the map?</span>
          </div>
          <button type="button" onClick={onGuide} className="group flex items-center gap-3 text-sm font-semibold text-[#d4af37] transition-colors hover:text-white">
            Explore the algorithms
            <ArrowRight aria-hidden="true" size={17} className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
          </button>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer({ onGuide }) {
  return (
    <footer className="border-t border-white/10 bg-[#0B0E14] text-gray-400">
      <div className="shell">
        <div className="grid gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr] md:gap-16 md:py-16">
          <div>
            <a href="#planner" aria-label="Wayfinder campus route planner" className="inline-flex items-center gap-3 text-white">
              <span aria-hidden="true" className="flex h-9 items-end gap-1.5 pb-1">
                <span className="h-4 w-1.5 bg-[#d4af37]" />
                <span className="h-7 w-1.5 bg-[#d4af37]" />
                <span className="h-9 w-1.5 bg-[#d4af37]" />
              </span>
              <span>
                <span className="block text-xl font-bold tracking-[0.12em]">WAYFINDER</span>
                <span className="mt-1 block text-[8px] font-medium tracking-[0.32em] text-gray-400">NORTHSTAR UNIVERSITY</span>
              </span>
            </a>
            <p className="mt-5 max-w-[350px] text-sm leading-relaxed">Find your place. Discover your path. A thoughtful guide to the spaces that make a campus feel like yours.</p>
          </div>
          <nav aria-label="Explore campus">
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#d4af37]">EXPLORE</h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li><a href="#planner" className="transition-colors hover:text-white">Plan your route</a></li>
              <li><a href="#places" className="transition-colors hover:text-white">Campus destinations</a></li>
              <li><a href="#how-it-works" className="transition-colors hover:text-white">How it works</a></li>
            </ul>
          </nav>
          <div>
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-[#d4af37]">BEHIND THE JOURNEY</h2>
            <p className="mt-5 text-sm leading-relaxed">A data structures and algorithms mini project, built around an illustrative campus.</p>
            <button type="button" onClick={onGuide} className="group mt-4 inline-flex items-center gap-2 text-sm text-white transition-colors hover:text-[#d4af37]">
              Open the DSA guide
              <ArrowUpRight aria-hidden="true" size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
            </button>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-white/10 py-6 text-[11px] leading-relaxed sm:flex-row">
          <p>© {new Date().getFullYear()} Wayfinder. A Northstar campus demonstration.</p>
          <p>Sample map · Estimated walking distances · History stored on this device</p>
        </div>
      </div>
    </footer>
  );
}
