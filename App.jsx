import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, ArrowRight, BookOpen, Check, ChevronDown, Clock3, Compass, Construction, History, Info, Layers3, LocateFixed, MapPin, Navigation, Search, ShieldCheck, Sparkles, Trees, X } from 'lucide-react';
import { nodeById, nodes } from './campusGraph.js';
import { breadthFirstSearch, dijkstra, edgeIdsForPath } from './routing.js';
import CampusMap from './Map.jsx';

const historyKey = 'campus-wayfinder-history';
const readHistory = () => { try { return JSON.parse(localStorage.getItem(historyKey) || '[]'); } catch { return []; } };

export default function App() {
  const [start, setStart] = useState('gate');
  const [destination, setDestination] = useState('library');
  const [mode, setMode] = useState('fastest');
  const [blocked, setBlocked] = useState(new Set());
  const [maintenance, setMaintenance] = useState(false);
  const [history, setHistory] = useState(readHistory);
  const [showGuide, setShowGuide] = useState(false);
  const route = useMemo(() => (mode === 'fastest' ? dijkstra : breadthFirstSearch)(start, destination, blocked), [start, destination, mode, blocked]);
  const routeEdges = useMemo(() => new Set(edgeIdsForPath(route.path)), [route.path]);

  useEffect(() => {
    if (!route.path || start === destination) return;
    const item = { from: start, to: destination, mode, timestamp: Date.now() };
    setHistory((old) => {
      const next = [item, ...old.filter((x) => !(x.from === item.from && x.to === item.to && x.mode === item.mode))].slice(0, 5);
      localStorage.setItem(historyKey, JSON.stringify(next));
      return next;
    });
  }, [start, destination, mode, blocked, route.path]);

  const toggleBlocked = (id) => setBlocked((old) => { const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const restore = (item) => { setStart(item.from); setDestination(item.to); setMode(item.mode); };

  return <div className="app-shell min-h-screen bg-[#f5f7f3] text-[#1f302a]">
    <header className="topbar flex items-center justify-between">
      <div className="brand-lockup flex items-center gap-3"><div className="brand-mark"><Compass size={21} /></div><div><div className="brand-name">wayfinder<span>.</span></div><div className="brand-caption">NORTHSTAR UNIVERSITY</div></div></div>
      <div className="header-right flex items-center gap-3"><div className="campus-status"><span className="status-dot" /> Campus map online</div><button className="help-button" onClick={() => setShowGuide(true)}><BookOpen size={16} /> DSA guide</button><div className="avatar">NU</div></div>
    </header>
    <main className="page-wrap">
      <section className="page-intro flex items-end justify-between"><div><div className="eyebrow"><Sparkles size={14} /> YOUR DAY, BETTER ROUTED</div><h1>Find your way around.</h1><p>Choose a destination. We’ll find the best path across campus.</p></div><div className="map-updated"><span className="live-pulse" /> LIVE CAMPUS MAP <i>·</i> NORTH QUAD</div></section>
      <section className="workspace-grid">
        <aside className="route-panel">
          <div className="panel-heading"><div><div className="panel-kicker">ROUTE PLANNER</div><h2>Where to?</h2></div><div className="planner-icon"><Navigation size={19} /></div></div>
          <div className="planner-form">
            <PlacePicker label="STARTING POINT" value={start} onChange={setStart} exclude={destination} icon="start" />
            <button className="swap-button" onClick={() => { setStart(destination); setDestination(start); }} title="Swap start and destination" aria-label="Swap start and destination"><ArrowDownUp size={15} /></button>
            <PlacePicker label="DESTINATION" value={destination} onChange={setDestination} exclude={start} icon="end" />
          </div>
          <div className="route-mode-label">ROUTE PREFERENCE</div>
          <div className="mode-toggle" role="tablist" aria-label="Route preference">
            <button className={mode === 'fastest' ? 'mode-option active' : 'mode-option'} onClick={() => setMode('fastest')} role="tab" aria-selected={mode === 'fastest'}><Navigation size={15} /> Shortest distance</button>
            <button className={mode === 'fewest' ? 'mode-option active' : 'mode-option'} onClick={() => setMode('fewest')} role="tab" aria-selected={mode === 'fewest'}><Layers3 size={15} /> Fewest segments</button>
          </div>
          <div className="mode-note"><Info size={13} /> {mode === 'fastest' ? 'Dijkstra compares walking distance.' : 'BFS minimizes path segments, then totals the metres.'}</div>
          <div className="route-divider" />
          {route.path ? <div className="route-result">
            <div className="result-topline"><span className="route-found"><Check size={13} /> ROUTE READY</span><span className="safe-label"><ShieldCheck size={13} /> Open paths</span></div>
            <div className="trip-metrics"><div className="distance-metric"><strong>{formatDistance(route.distance)}</strong><span>WALKING DISTANCE</span></div><div className="metric-rule" /><div className="time-metric"><strong>{Math.max(1, Math.ceil(route.distance / 75))}<small> min</small></strong><span>ESTIMATED TIME</span></div></div>
            <div className="route-summary"><span className="route-point start-point" /><div className="route-summary-copy"><strong>{nodeById[start]?.name}</strong><span>{route.path.length - 1} path segments · {mode === 'fastest' ? 'shortest distance' : 'fewest segments'}</span></div><ArrowRight size={15} className="summary-arrow" /><div className="route-summary-copy destination-copy"><strong>{nodeById[destination]?.name}</strong><span>Campus destination</span></div><span className="route-point end-point" /></div>
            <div className="step-list-title"><span>YOUR WALK</span><span>{route.path.length - 1} STEPS</span></div>
            <ol className="step-list">{route.path.slice(1).map((id, i) => <li key={`${id}-${i}`}><span className="step-number">{String(i + 1).padStart(2, '0')}</span><span>Continue to <strong>{nodeById[id].name}</strong></span>{i === route.path.length - 2 && <MapPin size={14} className="step-pin" />}</li>)}</ol>
          </div> : <div className="no-route"><Construction size={20} /><strong>No open route found</strong><span>Try another destination or reopen a blocked path.</span></div>}
          <div className="panel-footnote"><LocateFixed size={14} /> Distances are estimates for this sample campus.</div>
        </aside>
        <section className="map-column">
          <div className="map-toolbar"><div className="map-title-block"><div className="map-title">Campus map <span className="map-badge">INTERACTIVE</span></div><div className="map-subtitle">Northstar University · Main campus</div></div><div className="map-controls">{blocked.size > 0 && <button className="reset-button" onClick={() => setBlocked(new Set())}>Reopen all</button>}<button className={maintenance ? 'maintenance-button active' : 'maintenance-button'} onClick={() => setMaintenance((v) => !v)}><Construction size={15} /> {maintenance ? 'Tap a path to block it' : 'Mark a path blocked'}</button></div></div>
          <div className="map-frame"><CampusMap start={start} destination={destination} routeEdges={routeEdges} blocked={blocked} maintenanceMode={maintenance} onToggleBlocked={toggleBlocked} onChooseDestination={setDestination} /><div className="map-floating-label"><span>N</span><b>↗</b></div><div className="map-scale"><i /> 100 m</div>{maintenance && <div className="map-hint"><Construction size={15} /> Select any walkway to mark it closed</div>}</div>
          <div className="map-legend"><div className="legend-items"><span><i className="legend-route" /> Your route</span><span><i className="legend-path" /> Walkway</span><span><i className="legend-closed" /> Closed path</span></div><button className="legend-link" onClick={() => setShowGuide(true)}>How routing works <ArrowRight size={14} /></button></div>
        </section>
      </section>
      <section className="below-grid">
        <div className="history-card"><div className="below-heading"><div className="below-icon history-icon"><History size={17} /></div><div><h3>Recent routes</h3><p>Pick up where you left off</p></div></div>{history.length ? <div className="history-list">{history.map((item, i) => <button className="history-item" key={`${item.from}-${item.to}-${i}`} onClick={() => restore(item)}><span className="history-route"><span>{nodeById[item.from]?.name}</span><ArrowRight size={13} /><strong>{nodeById[item.to]?.name}</strong></span><span className="history-distance">{item.mode === 'fewest' ? 'Fewest segments' : 'Shortest'} <ArrowRight size={13} /></span></button>)}</div> : <div className="history-empty"><Clock3 size={15} /> Routes you plan will appear here.</div>}</div>
        <div className="graph-card"><div className="below-heading"><div className="below-icon graph-icon"><Trees size={17} /></div><div><h3>A smarter way across campus</h3><p>Every building is a point. Every path is a connection.</p></div></div><button className="graph-card-link" onClick={() => setShowGuide(true)}>Explore the DSA behind this map <ArrowRight size={15} /></button></div>
      </section>
      <footer className="footer"><span>WAYFINDER <b>●</b> A DSA MINI PROJECT</span><span>Built for curious minds, and campus days.</span></footer>
    </main>
    {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
  </div>;
}

function PlacePicker({ label, value, onChange, exclude, icon }) {
  const [query, setQuery] = useState(''); const [open, setOpen] = useState(false);
  const selected = nodeById[value];
  const matches = nodes.filter((node) => node.type !== 'path' && node.id !== exclude && node.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="place-picker"><label>{label}</label><button className="place-select" onClick={() => { setOpen((v) => !v); setQuery(''); }} aria-expanded={open}><span className={`picker-pin ${icon}`}>{icon === 'start' ? <LocateFixed size={15} /> : <MapPin size={15} />}</span><span className="selected-place">{selected?.name || 'Choose a place'}</span><ChevronDown size={15} className={open ? 'chevron rotated' : 'chevron'} /></button>{open && <div className="picker-menu"><div className="picker-search"><Search size={14} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search buildings…" /></div><div className="picker-options">{matches.length ? matches.map((node) => <button key={node.id} onClick={() => { onChange(node.id); setOpen(false); setQuery(''); }}><span className="option-icon"><MapPin size={14} /></span><span>{node.name}<small>{categoryName(node.type)}</small></span>{value === node.id && <Check size={15} className="option-check" />}</button>) : <div className="no-matches">No campus places match “{query}”</div>}</div></div>}</div>;
}

function GuideModal({ onClose }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title">
    <div className="guide-top"><div className="guide-icon"><BookOpen size={19} /></div><button className="close-button" onClick={onClose} aria-label="Close guide"><X size={18} /></button></div>
    <div className="guide-kicker">THE DATA STRUCTURES BEHIND THE MAP</div><h2 id="guide-title">A campus is a graph.</h2><p className="guide-intro">Wayfinder turns walkways into a network that algorithms can search. You can trace every part of the idea in the source code.</p>
    <div className="guide-cards">
      <GuideCard number="01" title="Adjacency list" body="Each junction or building entrance is a vertex. Its list stores neighboring vertices, path length, and edge ID." code={`quad → library (105 m)\n     → plaza   (155 m)\n     → dorms   (145 m)`} foot="src/data/campusGraph.js · O(V + E) space" />
      <GuideCard number="02" title="Dijkstra’s algorithm" body="Shortest distance adds metres along candidate paths and keeps the smallest known distance to each vertex. A min-heap picks the next place; predecessors rebuild the winning route." code={`start = 0 m\npop closest from min-heap\nrelax each open edge`} foot="src/algorithms/routing.js · O((V + E) log E)" />
      <GuideCard number="03" title="Breadth-first search" body="Fewest segments explores a queue level by level. It minimizes the number of edges; metres are totaled afterward for the time estimate." code={`queue = [start]\nvisit each neighbor once\nfollow predecessors to destination`} foot="src/algorithms/routing.js · O(V + E)" />
      <GuideCard number="04" title="Blocked paths & history" body="Closing a walkway skips that edge during search. The route recomputes immediately. Recent places are saved in browser storage." code={`if blockedEdges.has(edge.id)\n  skip this neighbor`} foot="Live rerouting · saved on this device" />
    </div>
    <div className="guide-note"><Info size={15} /><span>Dijkstra’s heap is implemented with an array: each node’s children sit at indices 2i + 1 and 2i + 2. This makes it easy to see how a priority queue works without an extra library.</span></div>
    <div className="guide-footer"><span>TRY IT: close a walkway and watch the route change.</span><button onClick={onClose}>Got it <Check size={14} /></button></div>
  </section></div>;
}

function GuideCard({ number, title, body, code, foot }) { return <article className="guide-card"><div className="guide-card-head"><span className="guide-number">{number}</span><h3>{title}</h3></div><p>{body}</p><pre>{code}</pre><small>{foot}</small></article>; }
function formatDistance(distance) { return !Number.isFinite(distance) ? '—' : distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance} m`; }
function categoryName(type) { return ({ entrance: 'Entrance', building: 'Building', plaza: 'Campus landmark', transport: 'Transport' })[type] || 'Walkway'; }
