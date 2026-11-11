import { ArrowRight, Check, GitBranch, Layers3, Navigation, Route } from 'lucide-react';
import { Modal, Eyebrow } from './UI.jsx';

const concepts = [
  {
    number: '01', icon: GitBranch, title: 'Every place is connected.',
    description: 'Buildings and junctions are points in a graph. An adjacency list records the walkways from each point, along with their lengths.',
    example: 'Library → Arts Centre · 125 m', detail: 'Adjacency list · O(V + E) space',
  },
  {
    number: '02', icon: Navigation, title: 'Find the shortest walk.',
    description: 'Dijkstra’s algorithm compares total walking distance. A priority queue checks the nearest remaining point first, until the shortest open route is found.',
    example: 'Shortest distance = fewest total metres', detail: 'Binary min-heap · O((V + E) log E) time',
  },
  {
    number: '03', icon: Layers3, title: 'Or keep the route simple.',
    description: 'Breadth-first search explores the campus one connection at a time. It finds a route with the fewest walkway segments, which may cover more metres.',
    example: 'Fewest segments = fewest connections', detail: 'Breadth-first search · O(V + E) time',
  },
  {
    number: '04', icon: Route, title: 'A closed path? Reroute.',
    description: 'Mark a walkway closed and both algorithms skip it immediately. Your recent routes stay in this browser, ready to pick up again.',
    example: 'Close a path → find the next open route', detail: 'Closures for this visit · history on this device',
  },
];

export default function GuideModal({ onClose }) {
  return <Modal title="A campus is a graph." onClose={onClose} className="guide-modal">
    <div className="px-6 pb-7 md:px-8 md:pb-8">
      <Eyebrow className="mb-4">A little science. A better walk.</Eyebrow>
      <p className="max-w-xl text-sm leading-relaxed text-slate-300">Behind every highlighted route is a simple idea: connect the places, compare the paths, and make the next step clear.</p>
      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {concepts.map(({ number, icon: Icon, title, description, example, detail }) => <article key={number} className="flex flex-col border border-white/10 bg-white/[0.025] p-5">
          <div className="mb-5 flex items-center justify-between"><span className="text-[10px] font-semibold tracking-[0.2em] text-[#d4af37]">{number} / THE IDEA</span><Icon aria-hidden="true" size={19} className="text-[#d4af37]" strokeWidth={1.5} /></div>
          <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
          <p className="mt-3 flex-1 text-[13px] leading-relaxed text-slate-300">{description}</p>
          <p className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs leading-relaxed text-[#e5cd7d]"><ArrowRight aria-hidden="true" size={13} className="shrink-0" />{example}</p>
          <p className="mt-3 text-[10px] leading-relaxed text-slate-400">{detail}</p>
        </article>)}
      </div>
      <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
        <p className="max-w-sm text-xs leading-relaxed text-slate-400">V means places; E means walkways. Try closing a path on the map to see the algorithms in action.</p>
        <button onClick={onClose} className="group inline-flex min-h-11 shrink-0 items-center gap-3 border border-[#d4af37] bg-[#d4af37] px-5 text-xs font-semibold text-[#0b0e14] transition-colors hover:bg-[#e8c961] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4af37]">Back to the map<Check aria-hidden="true" size={15} /></button>
      </div>
    </div>
  </Modal>;
}
