import { useId } from 'react';
import { buildings, edges, nodeById, nodes } from '../data/campusGraph.js';

const trees = [[95,185],[101,535],[130,460],[275,440],[296,295],[390,315],[390,440],[553,195],[580,240],[590,435],[745,290],[745,425],[922,425],[920,300],[730,530],[260,130],[550,535],[120,295],[910,200],[742,230],[730,370],[580,300],[260,535],[580,560],[120,550],[902,555],[430,125],[955,360],[330,150],[535,420],[900,135],[140,375],[735,145],[265,195],[940,510],[392,550],[720,470],[120,220],[930,235],[420,535],[570,130],[90,430],[275,490],[745,505],[450,190],[290,530]];

const walkwayGroups = new Map();
const endpointKey = (edge) => [edge.from, edge.to].sort().join(':');
for (const edge of edges) {
  const key = endpointKey(edge);
  if (!walkwayGroups.has(key)) walkwayGroups.set(key, []);
  walkwayGroups.get(key).push(edge.id);
}

function walkwayGeometry(edge) {
  const from = nodeById[edge.from];
  const to = nodeById[edge.to];
  const parallelIds = walkwayGroups.get(endpointKey(edge));
  if (parallelIds.length === 1) return { path: `M ${from.x} ${from.y} L ${to.x} ${to.y}`, parallel: false };

  // Use one shared orientation so reverse-directed parallel edges move to
  // opposite sides rather than landing on the same line again.
  const direction = edge.from < edge.to ? 1 : -1;
  const dx = (to.x - from.x) * direction;
  const dy = (to.y - from.y) * direction;
  const length = Math.hypot(dx, dy) || 1;
  const offset = (parallelIds.indexOf(edge.id) - (parallelIds.length - 1) / 2) * 10;
  const offsetX = -dy / length * offset;
  const offsetY = dx / length * offset;
  return { path: `M ${from.x + offsetX} ${from.y + offsetY} L ${to.x + offsetX} ${to.y + offsetY}`, parallel: true };
}

export default function CampusMap({ start, destination, routeEdges, blocked, maintenanceMode, onToggleBlocked, onChooseDestination }) {
  const instanceId = useId().replace(/:/g, '');
  const grainId = `map-grain-${instanceId}`;
  const shadowId = `building-shadow-${instanceId}`;

  const activateBuilding = (event, nodeId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onChooseDestination(nodeId);
    }
  };

  return <svg className="campus-svg" viewBox="0 0 1000 650" role="group" aria-label="Interactive illustrated Northstar campus map. Select a building to choose your destination.">
    <defs>
      <pattern id={grainId} width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#8d9aac" opacity=".12" /></pattern>
      <filter id={shadowId} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity=".25" /></filter>
    </defs>
    <g aria-hidden="true">
      <rect width="1000" height="650" fill="#111b28" /><rect width="1000" height="650" fill={`url(#${grainId})`} />
      <path d="M0 308 C185 282 252 302 355 300 C540 298 714 282 1000 305 L1000 398 C772 421 643 403 477 414 C296 426 181 410 0 427Z" fill="#182332" opacity=".88" />
      <path d="M265 0 C283 115 267 174 275 250 C284 343 272 445 286 650" fill="none" stroke="#152332" strokeWidth="70" opacity=".75" />
      <path d="M735 0 C714 120 748 224 727 320 C711 409 733 519 718 650" fill="none" stroke="#152332" strokeWidth="72" opacity=".8" />
      <text x="47" y="49" className="map-area-label">NORTHSTAR UNIVERSITY</text><text x="46" y="70" className="map-area-sub">MAIN CAMPUS · ILLUSTRATED MAP</text><text x="455" y="329" className="map-plaza-label">FOUNDERS GREEN</text>
      {trees.map(([x, y], index) => <g key={`tree-${index}`} opacity={index % 4 === 0 ? '.76' : '.55'}><circle cx={x} cy={y} r="9" fill={index % 3 === 0 ? '#344936' : '#2b413a'} /><circle cx={x - 2} cy={y - 2} r="4" fill="#597054" opacity=".55" /></g>)}
    </g>
    {edges.map((edge) => {
      const from = nodeById[edge.from];
      const to = nodeById[edge.to];
      const { path, parallel } = walkwayGeometry(edge);
      const isClosed = blocked.has(edge.id);
      const isRoute = routeEdges.has(edge.id);
      const walkwayLabel = `${from.name} to ${to.name}, ${edge.distance} metres, ${isClosed ? 'closed' : 'open'}. ${isClosed ? 'Reopen' : 'Close'} walkway.`;
      return <g key={edge.id} className={maintenanceMode ? 'edge-group edge-editable' : 'edge-group'}
        role={maintenanceMode ? 'button' : undefined} tabIndex={maintenanceMode ? 0 : undefined}
        aria-label={maintenanceMode ? walkwayLabel : undefined} aria-pressed={maintenanceMode ? isClosed : undefined}
        onClick={() => { if (maintenanceMode) onToggleBlocked(edge.id); }}
        onKeyDown={(event) => { if (maintenanceMode && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onToggleBlocked(edge.id); } }}>
        <path d={path} className="walkway-under" /><path d={path} className="walkway-base" />
        {isRoute && !isClosed && <path d={path} className="route-highlight" />}{isClosed && <path d={path} className="blocked-highlight" />}
        <path d={path} className="edge-hit-area" style={parallel ? { strokeWidth: 9 } : undefined} />
        {maintenanceMode && <title>{walkwayLabel}</title>}
      </g>;
    })}
    <g className="gate-art" aria-hidden="true"><path d="M15 348 H66 M18 338 V362 M30 338 V362 M42 338 V362 M54 338 V362 M65 338 V362 M12 338 H69" stroke="#9b8857" strokeWidth="3" strokeLinecap="round" /><text x="26" y="390" className="gate-label">MAIN GATE</text></g>
    {buildings.map((building) => {
      const chosen = building.node === destination;
      const fill = { sand: '#332d22', sage: '#24332e', blue: '#223248' }[building.color];
      const accent = { sand: '#d4af37', sage: '#a0b8a5', blue: '#a0b9d6' }[building.color];
      return <g key={building.node} className={`building building-${building.color} ${chosen ? 'selected-building' : ''}`}
        onClick={() => onChooseDestination(building.node)} role="button" tabIndex="0"
        aria-label={`Set destination to ${nodeById[building.node].name}`} aria-pressed={chosen}
        onKeyDown={(event) => activateBuilding(event, building.node)}>
        <title>{`Set destination: ${nodeById[building.node].name}`}</title>
        <rect x={building.x} y={building.y} width={building.w} height={building.h} rx="7" fill={fill} filter={`url(#${shadowId})`} className="building-body" />
        <path d={`M${building.x + 12} ${building.y + 19} H${building.x + building.w - 12}`} stroke={accent} strokeWidth="1.5" opacity=".32" />
        {[12, 31, 50].map((dx) => <rect key={dx} x={building.x + dx} y={building.y + 26} width="12" height="12" rx="2" fill={accent} opacity=".2" />)}
        <text x={building.x + building.w / 2} y={building.y + 14} textAnchor="middle" className="building-label">{building.title}</text>
        <text x={building.x + building.w - 12} y={building.y + building.h - 8} textAnchor="end" className="building-letter" fill={accent}>{building.icon}</text>
      </g>;
    })}
    <g aria-hidden="true" pointerEvents="none">
      {nodes.filter((node) => node.type === 'path' || node.type === 'plaza').map((node) => <circle key={node.id} cx={node.x} cy={node.y} r="4" className="junction-dot" />)}
      {nodes.filter((node) => node.id !== 'gate' && node.type !== 'path' && node.type !== 'plaza').map((node) => {
        const isStart = node.id === start;
        const isDestination = node.id === destination;
        return <g key={`marker-${node.id}`} className="place-marker">
          {(isStart || isDestination) && <circle cx={node.x} cy={node.y} r="17" className={isStart ? 'marker-halo start-halo' : 'marker-halo end-halo'} />}
          <circle cx={node.x} cy={node.y} r="8" className={isDestination ? 'marker-dot end-marker' : isStart ? 'marker-dot start-marker' : 'marker-dot'} /><circle cx={node.x} cy={node.y} r="3" className="marker-center" />
          {isStart && <g className="map-pill" transform={`translate(${node.x + 12} ${node.y - 34})`}><rect width="80" height="22" rx="11" /><text x="40" y="15" textAnchor="middle">START</text></g>}
          {isDestination && <g className="map-pill destination-pill" transform={`translate(${node.x + 12} ${node.y - 34})`}><rect width="106" height="22" rx="11" /><text x="53" y="15" textAnchor="middle">DESTINATION</text></g>}
        </g>;
      })}
      {destination === 'gate' && <g className="map-pill destination-pill" transform="translate(40 304)"><rect width="106" height="22" rx="11" /><text x="53" y="15" textAnchor="middle">DESTINATION</text></g>}
      {start === 'gate' && <g className="map-pill" transform="translate(43 370)"><rect width="80" height="22" rx="11" /><text x="40" y="15" textAnchor="middle">START</text></g>}
      {blocked.size > 0 && <g className="blocked-count" transform="translate(825 30)"><rect width="132" height="30" rx="15" /><circle cx="16" cy="15" r="4" /><text x="29" y="19">{blocked.size} path{blocked.size > 1 ? 's' : ''} closed</text></g>}
    </g>
  </svg>;
}
