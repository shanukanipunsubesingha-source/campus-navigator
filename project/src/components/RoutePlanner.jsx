import { ArrowDownUp, ArrowRight, Check, Clock3, Code2, Construction, History, Info, Layers3, LocateFixed, Minus, Navigation, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import CampusMap from './CampusMap';
import AlgorithmVisualizer from './AlgorithmVisualizer';
import PlacePicker from './PlacePicker';
import { Eyebrow, Reveal } from './UI';
import { edges, nodeById, nodes } from '../data/campusGraph';

export default function RoutePlanner({ navigator: nav, onGuide }) {
  const [zoom, setZoom] = useState(1);
  const [watching, setWatching] = useState(false);
  const { start, destination, mode, route, blocked, maintenance } = nav;
  const arrived = start === destination;
  const minutes = Math.ceil(route.distance / 75);
  return <section id="planner" className="planner-section" aria-labelledby="planner-heading"><div className="shell">
    <Reveal className="planner-intro"><div><Eyebrow>YOUR NEXT DESTINATION STARTS HERE</Eyebrow><h2 id="planner-heading">A whole campus.<br /><span>One clear direction.</span></h2></div><p>Pick a place. Find your path. Make the most of every step across our sample campus.</p></Reveal>
    <Reveal className="planner-workspace">
      <aside className="route-panel" aria-label="Walking route planner">
        <div className="planner-heading"><div><span className="field-label">THE ROUTE PLANNER</span><h3>Where to next?</h3></div><Navigation size={24} strokeWidth={1.5} /></div>
        <div className="planner-fields"><PlacePicker label="Starting point" value={start} onChange={nav.setStart} exclude={destination} starting /><button onClick={nav.swap} className="swap-button" aria-label="Swap starting point and destination"><ArrowDownUp size={16} /></button><PlacePicker label="Destination" value={destination} onChange={nav.setDestination} exclude={start} /></div>
        <span className="field-label mt-7 block">YOUR ROUTE PREFERENCE</span>
        <div className="mode-switch" role="group" aria-label="Route preference"><button aria-pressed={mode === 'fastest'} onClick={() => nav.setMode('fastest')}><Navigation size={14} />Shortest distance</button><button aria-pressed={mode === 'fewest'} onClick={() => nav.setMode('fewest')}><Layers3 size={14} />Fewest segments</button></div>
        <p className="mode-note"><Info size={12} />{mode === 'fastest' ? 'Dijkstra finds the shortest walk in metres.' : 'BFS finds the fewest walkway segments.'}</p>
        <button className="trace-launch" onClick={() => setWatching(true)} aria-label="Watch the C++ DSA algorithm step by step"><Code2 size={16} /> Watch DSA in Action</button>
        <div className="route-result">
          <p className="sr-only" aria-live="polite" aria-atomic="true">{!route.path ? 'No open route found. Reopen a walkway or choose another place.' : arrived ? `You are already at ${nodeById[destination].name}.` : `Route ready from ${nodeById[start].name} to ${nodeById[destination].name}. ${route.distance} metres, about ${minutes} minutes.`}</p>
          {route.path ? <><div className="route-ready"><span><Check size={13} />{arrived ? 'YOU’RE ALREADY HERE' : 'YOUR ROUTE IS READY'}</span><span>{route.path.length - 1} segments</span></div><div className="trip-metrics"><div><strong>{formatDistance(route.distance)}</strong><span>WALKING DISTANCE</span></div><div><strong>{minutes}<small> min</small></strong><span>ESTIMATED WALK</span></div></div><div className="route-summary"><span>{nodeById[start].name}</span><ArrowRight size={15} /><strong>{nodeById[destination].name}</strong></div><div className="steps-label"><span>YOUR WALK</span><span>{route.path.length - 1} STEPS</span></div>{arrived ? <p className="arrived-note">Choose a different destination to explore the campus.</p> : <ol className="route-steps">{route.path.slice(1).map((id, index) => <li key={id}><span>{String(index + 1).padStart(2, '0')}</span><p>Continue to <strong>{nodeById[id].name}</strong></p></li>)}</ol>}</> : <div className="no-route"><Construction size={24} /><h4>No open route found.</h4><p>A walkway on your route is closed. Try another destination, or reopen the paths.</p><button className="text-link" onClick={nav.reopenAll}>Reopen all walkways <ArrowRight size={15} /></button></div>}
        </div><p className="planner-footnote"><LocateFixed size={13} />Sample campus · Estimated distances</p>
      </aside>
      <div className="map-panel"><div className="map-toolbar"><div><span className="map-kicker"><i />INTERACTIVE CAMPUS MAP</span><h3>Northstar, at a glance.</h3></div><button className={`closure-button ${maintenance ? 'active' : ''}`} aria-pressed={maintenance} onClick={() => nav.setMaintenance(!maintenance)}><Construction size={15} /><span>{maintenance ? 'Done editing' : 'Edit walkways'}</span></button></div>
        {maintenance && <div className="closure-editor"><p><Construction size={14} />Select a walkway on the map to close or reopen it.</p><details><summary>Choose a walkway by name</summary><div className="closure-list">{edges.map((edge) => <button key={edge.id} onClick={() => nav.toggleBlocked(edge.id)} aria-pressed={blocked.has(edge.id)}><span>{nodeById[edge.from].name} → {nodeById[edge.to].name}<small>{edge.distance} m</small></span><span>{blocked.has(edge.id) ? 'Closed' : 'Open'}</span></button>)}</div></details></div>}
        <div className="map-scroll" tabIndex="0" role="region" aria-label="Campus map. Scroll horizontally to explore on smaller screens."><div className="map-canvas" style={{ width: `${zoom * 100}%`, minWidth: 710 * zoom }}><CampusMap start={start} destination={destination} routeEdges={nav.routeEdges} blocked={blocked} maintenanceMode={maintenance} onToggleBlocked={nav.toggleBlocked} onChooseDestination={nav.setDestination} /></div></div>
        <div className="map-bottom"><div className="map-legend"><span><i className="legend-route" />Your route</span><span><i className="legend-path" />Walkway</span><span><i className="legend-closed" />Closed</span></div><div className="map-zoom"><button aria-label="Zoom out map" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, +(value - 0.25).toFixed(2)))}><Minus size={15} /></button><button className="zoom-reset" aria-label="Reset map zoom" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button><button aria-label="Zoom in map" disabled={zoom >= 2} onClick={() => setZoom((value) => Math.min(2, value + 0.25))}><Plus size={15} /></button></div></div>
        <div className="map-footer"><p>{nodes.filter((node) => node.type !== 'path').length} campus places · Scroll the map to explore</p>{blocked.size > 0 ? <button onClick={nav.reopenAll}><RotateCcw size={12} />Reopen {blocked.size} closed {blocked.size === 1 ? 'path' : 'paths'}</button> : <button onClick={onGuide}>How routing works <ArrowRight size={13} /></button>}</div>
      </div>
    </Reveal>
    <Reveal className="recent-routes"><div className="recent-title"><History size={18} /><span>RECENT JOURNEYS<small>{nav.savedLocally ? 'Saved on this device' : 'Saved for this visit'}</small></span></div><div className="recent-items">{nav.history.length ? nav.history.slice(0, 3).map((item) => <button onClick={() => nav.restore(item)} key={`${item.from}-${item.to}-${item.mode}`}><span>{nodeById[item.from].name}<ArrowRight size={12} /><strong>{nodeById[item.to].name}</strong></span><small>{item.mode === 'fastest' ? 'Shortest distance' : 'Fewest segments'}<ArrowRight size={13} /></small></button>) : <p><Clock3 size={15} />The routes you explore will appear here.</p>}</div></Reveal>
    {watching && <AlgorithmVisualizer start={start} destination={destination} mode={mode} blocked={blocked} onClose={() => setWatching(false)} />}
  </div></section>;
}

function formatDistance(distance) { return distance >= 1000 ? <>{(distance / 1000).toFixed(1)}<small> km</small></> : <>{distance}<small> m</small></>; }
