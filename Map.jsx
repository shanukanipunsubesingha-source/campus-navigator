import { useMemo } from 'react';
import { buildings, edges, nodeById, nodes } from './campusGraph.js';

const trees = [[95,185],[101,535],[130,460],[275,440],[296,295],[390,315],[390,440],[553,195],[580,240],[590,435],[745,290],[745,425],[922,425],[920,300],[730,530],[260,130],[550,535],[120,295],[910,200],[742,230],[730,370],[580,300],[260,535],[580,560],[120,550],[902,555],[430,125],[955,360],[330,150],[535,420],[900,135],[140,375],[735,145],[265,195],[940,510],[392,550],[720,470],[120,220],[930,235],[420,535],[570,130],[90,430],[275,490],[745,505],[450,190],[290,530]];

export default function CampusMap({ start, destination, routeEdges, blocked, maintenanceMode, onToggleBlocked, onChooseDestination }) {
  const greens = useMemo(() => trees, []);
  return <svg className="campus-svg" viewBox="0 0 1000 650" role="application" aria-label="Interactive illustrated campus map">
    <defs>
      <pattern id="map-grain" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#a8bea1" opacity=".14" /></pattern>
      <filter id="building-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#475c4d" floodOpacity=".11" /></filter>
    </defs>
    <rect width="1000" height="650" fill="#edf3e8" /><rect width="1000" height="650" fill="url(#map-grain)" />
    <path d="M0 308 C185 282 252 302 355 300 C540 298 714 282 1000 305 L1000 398 C772 421 643 403 477 414 C296 426 181 410 0 427Z" fill="#e3eddb" opacity=".88" />
    <path d="M265 0 C283 115 267 174 275 250 C284 343 272 445 286 650" fill="none" stroke="#e7eee1" strokeWidth="70" opacity=".75" />
    <path d="M735 0 C714 120 748 224 727 320 C711 409 733 519 718 650" fill="none" stroke="#e7eee1" strokeWidth="72" opacity=".8" />
    <text x="47" y="49" className="map-area-label">NORTHSTAR UNIVERSITY</text><text x="46" y="70" className="map-area-sub">MAIN CAMPUS · EST. 1924</text><text x="455" y="329" className="map-plaza-label">FOUNDERS GREEN</text>
    {greens.map(([x,y],i) => <g key={`tree-${i}`} opacity={i % 4 === 0 ? '.76' : '.55'}><circle cx={x} cy={y} r="9" fill={i % 3 === 0 ? '#a7c39a' : '#b4cba9'} /><circle cx={x-2} cy={y-2} r="4" fill="#c4d8b8" opacity=".8" /></g>)}
    {edges.map((edge) => {
      const a = nodeById[edge.from]; const b = nodeById[edge.to]; const d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
      const isClosed = blocked.has(edge.id); const isRoute = routeEdges.has(edge.id);
      return <g key={edge.id} className={maintenanceMode ? 'edge-group edge-editable' : 'edge-group'} onClick={() => maintenanceMode && onToggleBlocked(edge.id)}>
        <path d={d} className="walkway-under" /><path d={d} className="walkway-base" />
        {isRoute && !isClosed && <path d={d} className="route-highlight" />}{isClosed && <path d={d} className="blocked-highlight" />}
        <path d={d} className="edge-hit-area" />
        {maintenanceMode && <title>{isClosed ? 'Tap to reopen this path' : 'Tap to mark this path closed'}</title>}
      </g>;
    })}
    <g className="gate-art"><path d="M15 348 H66 M18 338 V362 M30 338 V362 M42 338 V362 M54 338 V362 M65 338 V362 M12 338 H69" stroke="#839c7c" strokeWidth="3" strokeLinecap="round" /><text x="26" y="390" className="gate-label">MAIN GATE</text></g>
    {buildings.map((building) => {
      const chosen = building.node === destination; const fill = { sand:'#f3e6cc', sage:'#e4eddd', blue:'#e2eaf0' }[building.color]; const dark = { sand:'#b6884e', sage:'#66866b', blue:'#6f8ca4' }[building.color];
      return <g key={building.node} className={`building building-${building.color} ${chosen ? 'selected-building' : ''}`} onClick={() => onChooseDestination(building.node)} role="button" tabIndex="0" aria-label={`Set destination to ${nodeById[building.node].name}`} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChooseDestination(building.node)}>
        <title>Set destination: {nodeById[building.node].name}</title><rect x={building.x} y={building.y} width={building.w} height={building.h} rx="9" fill={fill} filter="url(#building-shadow)" className="building-body" />
        <path d={`M${building.x+12} ${building.y+19} H${building.x+building.w-12}`} stroke={dark} strokeWidth="1.5" opacity=".23" />
        {[12,31,50].map((dx) => <rect key={dx} x={building.x+dx} y={building.y+26} width="12" height="12" rx="3" fill={dark} opacity=".18" />)}
        <text x={building.x+building.w/2} y={building.y+14} textAnchor="middle" className="building-label">{building.title}</text><text x={building.x+building.w-12} y={building.y+building.h-8} textAnchor="end" className="building-letter" fill={dark}>{building.icon}</text>
      </g>;
    })}
    {nodes.filter((node) => node.type === 'path' || node.type === 'plaza').map((node) => <circle key={node.id} cx={node.x} cy={node.y} r="4" className="junction-dot" />)}
    {nodes.filter((node) => node.id !== 'gate' && node.type !== 'path' && node.type !== 'plaza').map((node) => {
      const isStart = node.id === start; const isDestination = node.id === destination;
      return <g key={`marker-${node.id}`} className="place-marker">
        {(isStart || isDestination) && <circle cx={node.x} cy={node.y} r="17" className={isStart ? 'marker-halo start-halo' : 'marker-halo end-halo'} />}
        <circle cx={node.x} cy={node.y} r="8" className={isDestination ? 'marker-dot end-marker' : isStart ? 'marker-dot start-marker' : 'marker-dot'} /><circle cx={node.x} cy={node.y} r="3" className="marker-center" />
        {isStart && <g className="map-pill" transform={`translate(${node.x+12} ${node.y-34})`}><rect width="80" height="22" rx="11" /><text x="40" y="15" textAnchor="middle">START</text></g>}
        {isDestination && <g className="map-pill destination-pill" transform={`translate(${node.x+12} ${node.y-34})`}><rect width="106" height="22" rx="11" /><text x="53" y="15" textAnchor="middle">DESTINATION</text></g>}
      </g>;
    })}
    {destination === 'gate' && <g className="map-pill destination-pill" transform="translate(40 304)"><rect width="106" height="22" rx="11" /><text x="53" y="15" textAnchor="middle">DESTINATION</text></g>}
    {start === 'gate' && <g className="map-pill" transform="translate(43 370)"><rect width="80" height="22" rx="11" /><text x="40" y="15" textAnchor="middle">START</text></g>}
    {blocked.size > 0 && <g className="blocked-count" transform="translate(825 30)"><rect width="132" height="30" rx="15" /><circle cx="16" cy="15" r="4" /><text x="29" y="19">{blocked.size} path{blocked.size > 1 ? 's' : ''} closed</text></g>}
  </svg>;
}
