import { useEffect, useMemo, useState } from 'react';
import { nodeById } from '../data/campusGraph';
import { breadthFirstSearch, dijkstra, fewestTurns } from '../algorithms/routing';

const key = 'campus-wayfinder-history';
const validPlaceId = (id) => typeof id === 'string' && Object.hasOwn(nodeById, id);
const validItem = (item) => item && typeof item === 'object' && validPlaceId(item.from) && validPlaceId(item.to) && ['fastest', 'fewest', 'turns'].includes(item.mode);

function normalizeHistory(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const history = [];
  for (const item of items) {
    if (!validItem(item)) continue;
    const routeKey = `${item.from}:${item.to}:${item.mode}`;
    if (seen.has(routeKey)) continue;
    seen.add(routeKey);
    history.push(item);
    if (history.length === 5) break;
  }
  return history;
}

function readHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return normalizeHistory(data);
  } catch { return []; }
}

export function useNavigator() {
  const [start, setStart] = useState('gate');
  const [destination, setDestination] = useState('library');
  const [mode, setMode] = useState('fastest');
  const [blocked, setBlocked] = useState(new Set());
  const [maintenance, setMaintenance] = useState(false);
  const [history, setHistory] = useState(readHistory);
  const [savedLocally, setSavedLocally] = useState(true);
  const route = useMemo(() => (mode === 'fastest' ? dijkstra : mode === 'fewest' ? breadthFirstSearch : fewestTurns)(start, destination, blocked), [start, destination, mode, blocked]);
  const routeEdges = useMemo(() => new Set(route.edgeIds || []), [route]);

  useEffect(() => {
    if (!route.path || start === destination) return;
    const item = { from: start, to: destination, mode, timestamp: Date.now() };
    setHistory((previous) => normalizeHistory([item, ...previous]));
  }, [start, destination, mode, route]);

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(history)); setSavedLocally(true); }
    catch { setSavedLocally(false); }
  }, [history]);

  const toggleBlocked = (id) => setBlocked((previous) => {
    const next = new Set(previous);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const swap = () => { setStart(destination); setDestination(start); };
  const restore = (item) => { if (validItem(item)) { setStart(item.from); setDestination(item.to); setMode(item.mode); } };
  const reopenAll = () => setBlocked(new Set());
  return { start, setStart, destination, setDestination, mode, setMode, blocked, maintenance, setMaintenance, history, savedLocally, route, routeEdges, toggleBlocked, swap, restore, reopenAll };
}
