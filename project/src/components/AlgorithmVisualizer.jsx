import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ArrowLeft, ArrowRight, Code2 } from 'lucide-react';
import { Modal } from './UI';
import { nodes, edges, nodeById } from '../data/campusGraph';
import { traceRouting } from '../algorithms/wasmRouter';
import cppSource from '../../cpp/routing_engine.cpp?raw';
import './styles-trace.css';

const lines = cppSource.split(/\r?\n/);
const markers = { 1:'start', 2:'bfs-visit', 3:'bfs-enqueue', 4:'dijkstra-visit', 5:'dijkstra-relax', 6:'bfs-closed', 7:'dijkstra-closed', 8:'complete', 10:'already' };
const linesByMarker = Object.fromEntries([...Object.values(markers), 'unreachable-bfs','unreachable-dijkstra'].map(key => [key, lines.findIndex(line => line.includes('@trace:' + key)) + 1]));
const place = id => nodeById[id]?.name ?? id ?? '—';

function explanation(event, mode, route) {
  switch(event.kind) {
    case 1: return ['Start the search', mode === 'fewest' ? 'BFS starts with a FIFO queue to find the fewest segments.' : 'Dijkstra starts with a binary min-heap to find the shortest walking distance.'];
    case 2: return ['BFS visits ' + place(event.node), 'Remove the first queued node and inspect its connected walkways.'];
    case 3: return ['Enqueue ' + place(event.node), 'Discover it from ' + place(event.from) + ', mark it visited, and place it at the back of the FIFO queue.'];
    case 4: return ['Dijkstra settles ' + place(event.node), 'The shortest known distance from the start is ' + event.value + ' m.'];
    case 5: return ['Improve ' + place(event.node), 'Relax ' + place(event.from) + ' → ' + place(event.node) + '. New tentative distance: ' + event.value + ' m.'];
    case 6: case 7: return ['Skip a closed path', place(event.from) + ' → ' + place(event.node) + ' is closed. This edge is ignored.'];
    case 8: return ['Search complete', 'Final route: ' + route.distance + ' m across ' + route.edgeIds.length + ' segments.'];
    case 9: return ['No open route', 'The search could not reach ' + place(event.node) + '. Try reopening a walkway.'];
    case 10: return ['Already at destination', 'No walking required: distance is zero.'];
    default: return ['Algorithm operation', 'A real C++ search step.'];
  }
}

function TraceMap({ start, destination, events, step, blocked, route }) {
  const current = events[step], visited = new Set(), frontier = new Set([start]);
  for (const e of events.slice(0,step+1)) {
    if (e.kind === 2 || e.kind === 4) {visited.add(e.node);frontier.delete(e.node);}
    if ((e.kind === 3 || e.kind === 5) && !visited.has(e.node)) frontier.add(e.node);
  }
  const pathEdges = current.kind === 8 ? new Set(route.edgeIds) : new Set();
  return <div className="trace-graph">
    <svg viewBox="30 80 875 530" role="img" aria-label={visited.size + ' visited campus places. Current: ' + place(current.node)}>
      {edges.map(edge => {
        const a=nodeById[edge.from], b=nodeById[edge.to];
        return <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={'trace-edge ' + (blocked.has(edge.id)?'blocked ':'') + (pathEdges.has(edge.id)?'final ':'')+(current.edgeId===edge.id?'current':'')} />;
      })}
      {nodes.map(n => <g key={n.id} className={'trace-node '+(visited.has(n.id)?'visited ':'')+(frontier.has(n.id)?'frontier ':'')+(current.node===n.id?'current':'')}>
        {current.node === n.id && <circle className="trace-halo" cx={n.x} cy={n.y} r="16" />}
        <circle className="trace-dot" cx={n.x} cy={n.y} r={current.node===n.id?9:6}/>
        {(n.id===start||n.id===destination||n.id===current.node) && <text x={n.x} y={n.y-18} textAnchor="middle">{n.name}</text>}
      </g>)}
    </svg>
    <div className="trace-legend"><span>● Visited</span><span>● Frontier</span><span>● Current</span><span>— Closed</span></div>
  </div>;
}

export default function AlgorithmVisualizer({ start, destination, mode, blocked, onClose }) {
  const { route, events } = useMemo(() => traceRouting(start,destination,blocked,mode), [start,destination,blocked,mode]);
  const [step,setStep] = useState(0), [playing,setPlaying] = useState(false), [speed,setSpeed]=useState(850), [showCode,setShowCode]=useState(true);
  const codePane=useRef(null), last=Math.max(0,events.length-1), event=events[step];
  const [heading,detail]=explanation(event,mode,route);
  const sourceLine=linesByMarker[event.kind===9?(mode==='fewest'?'unreachable-bfs':'unreachable-dijkstra'):markers[event.kind]] || 0;
  const visitCount=new Set(events.slice(0,step+1).filter(e=>e.kind===2||e.kind===4).map(e=>e.node)).size;
  useEffect(()=>{if (!playing) return;const timer=setInterval(()=>setStep(x=>Math.min(x+1,last)),speed);return ()=>clearInterval(timer);},[playing,last,speed]);
  useEffect(()=>{if(step>=last)setPlaying(false);},[step,last]);
  useEffect(()=>{const pane=codePane.current,active=pane?.querySelector('[data-current="true"]');if(active) pane.scrollTop=active.offsetTop-pane.offsetTop-pane.clientHeight/2;},[sourceLine,showCode]);
  const seek=x=>{setPlaying(false);setStep(Math.max(0,Math.min(last,x)));};
  return <Modal title="Watch DSA in action" className="trace-modal" onClose={onClose}>
    <div className="trace-body">
      <div className="trace-intro"><strong>LIVE C++ / WEBASSEMBLY TRACE</strong><span>{mode==='fewest'?'BFS + FIFO queue':'Dijkstra + min-heap'} · {place(start)} → {place(destination)}</span><small>{blocked.size} closed paths · {events.length} C++ events</small></div>
      <div className="trace-layout">
        <div className="trace-visual">
          <div className="trace-heading"><h3>Campus graph</h3><small>{visitCount} / {nodes.length} visited</small></div>
          <TraceMap start={start} destination={destination} events={events} step={step} blocked={blocked} route={route} />
          <section className="trace-description" aria-live="polite" aria-atomic="true"><small>OPERATION {step+1} / {events.length}</small><h3>{heading}</h3><p>{detail}</p></section>
          <div className="trace-controls">
            <button aria-label="Restart" onClick={()=>seek(0)}><RotateCcw size={16}/></button>
            <button aria-label="Previous step" disabled={step===0} onClick={()=>seek(step-1)}><ArrowLeft size={16}/></button>
            <button className="trace-play" onClick={()=>{if(step===last)setStep(0);setPlaying(!playing);}} disabled={events.length<2}>{playing?<Pause size={17}/>:<Play size={17}/>} {playing?'Pause':'Play'}</button>
            <button aria-label="Next step" disabled={step===last} onClick={()=>seek(step+1)}><ArrowRight size={16}/></button>
            <label>Speed <select aria-label="Animation speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={1300}>Slow</option><option value={850}>Normal</option><option value={350}>Fast</option></select></label>
          </div>
          <input className="trace-slider" type="range" min="0" max={last} value={step} onChange={e=>seek(Number(e.target.value))} aria-label="Jump to C++ operation"/>
          <p className="trace-note">Steps are recorded by the compiled C++ engine. Watch mode is optional and never changes your selected route.</p>
        </div>
        <div className="trace-code">
          <div className="trace-heading"><h3><Code2 size={16}/> Actual C++ source</h3><button onClick={()=>setShowCode(x=>!x)}>{showCode?'Hide code':'Show full code'}</button></div>
          {showCode && <><p className="trace-file">project/cpp/routing_engine.cpp · line {sourceLine} / {lines.length}</p>
          <div ref={codePane} className="trace-code-pane" role="region" aria-label="C++ source with highlighted current operation" tabIndex={0}>
            {lines.map((text,i)=><div key={i} data-current={i+1===sourceLine?'true':undefined} className={'trace-code-line '+(i+1===sourceLine?'active':'')}><span>{i+1}</span><code>{text||' '}</code></div>)}
          </div><a className="trace-github" href="https://github.com/shanukanipunsubesingha-source/campus-navigator/blob/main/project/cpp/routing_engine.cpp" target="_blank" rel="noreferrer">View full C++ code on GitHub ↗</a></>}
        </div>
      </div>
    </div>
  </Modal>;
}
