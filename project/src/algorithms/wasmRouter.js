import { adjacencyList, edges, nodes } from '../data/campusGraph.js';

const nodeIndices = new Map(nodes.map((node, index) => [node.id, index]));
const edgeIndices = new Map(edges.map((edge, index) => [edge.id, index]));
const noRoute = () => ({ path: null, edgeIds: [], distance: Infinity });
let engine;
let pending;

/**
 * Load the precompiled C++17 WebAssembly graph engine before rendering React.
 * An optional binary is accepted by Node tests, avoiding network requests.
 */
export function initializeRoutingEngine(binary) {
  if (engine) return Promise.resolve();
  if (pending) return pending;
  pending = (async () => {
    const data = binary ?? await (async () => {
      const base = import.meta.env?.BASE_URL ?? './';
      const response = await fetch(`${base}routing.wasm`);
      if (!response.ok) throw new Error(`WebAssembly download failed: ${response.status}`);
      return response.arrayBuffer();
    })();
    const instantiated = await WebAssembly.instantiate(data, {});
    const api = (instantiated.instance ?? instantiated).exports;
    if (!api.graph_reset(nodes.length)) throw new Error('Too many campus vertices for C++ engine');
    for (const [index, node] of nodes.entries()) {
      if (!api.graph_set_node_position(index, node.x, node.y)) {
        throw new Error(`C++ engine rejected campus coordinate ${node.id}`);
      }
    }
    for (const [index, edge] of edges.entries()) {
      if (!api.graph_add_edge(nodeIndices.get(edge.from), nodeIndices.get(edge.to), edge.distance, index)) {
        throw new Error(`C++ engine rejected walkway ${edge.id}`);
      }
    }
    engine = api;
  })().catch((error) => { pending = undefined; throw error; });
  return pending;
}

function findRoute(start, destination, blocked, mode) {
  if (!nodeIndices.has(start) || !nodeIndices.has(destination)) return noRoute();
  if (!engine) throw new Error('C++ routing engine is not initialized');
  engine.graph_clear_blocked();
  for (const edgeId of blocked) {
    const index = edgeIndices.get(edgeId);
    if (index !== undefined) engine.graph_block_edge(index);
  }
  const length = engine.graph_route(nodeIndices.get(start), nodeIndices.get(destination), mode);
  if (length === 0) return noRoute();
  const path = Array.from({ length }, (_, index) => nodes[engine.graph_result_node(index)].id);
  const edgeIds = Array.from({ length: length - 1 }, (_, index) => edges[engine.graph_result_edge(index)].id);
  const result = { path, edgeIds, distance: engine.graph_result_metres() };
  if (mode === 2) {
    result.turns = engine.graph_result_turns();
    result.turnSteps = Array.from({ length }, (_, index) => Boolean(engine.graph_result_turn(index)));
  }
  return result;
}

export function dijkstra(start, destination, blockedEdgeIds = new Set()) {
  return findRoute(start, destination, blockedEdgeIds, 0);
}

export function breadthFirstSearch(start, destination, blockedEdgeIds = new Set()) {
  return findRoute(start, destination, blockedEdgeIds, 1);
}

export function fewestTurns(start, destination, blockedEdgeIds = new Set()) {
  return findRoute(start, destination, blockedEdgeIds, 2);
}

/** Node-only display compatibility helper. Route planning itself runs in C++. */
export function edgeIdsForPath(path, blockedEdgeIds = new Set()) {
  if (!path) return [];
  return path.slice(1).map((node, index) => {
    const connections = (adjacencyList[path[index]] || [])
      .filter((entry) => entry.node === node && !blockedEdgeIds.has(entry.edgeId));
    return connections.reduce((best, entry) =>
      !best || entry.distance < best.distance ? entry : best, null)?.edgeId;
  }).filter(Boolean);
}


/**
 * Record real algorithm events from the C++ WebAssembly engine, on demand.
 * The normal planner never traces and does not incur recording overhead.
 */
export function traceRouting(start, destination, blockedEdgeIds = new Set(), mode = 'fastest') {
  if (!engine) throw new Error('C++ routing engine is not initialized');
  if (!['fastest', 'fewest', 'turns'].includes(mode)) throw new Error('Unknown routing mode');
  if (!nodeIndices.has(start) || !nodeIndices.has(destination)) return { route: noRoute(), events: [] };
  engine.graph_trace_set(1);
  try {
    const route = findRoute(start, destination, blockedEdgeIds, mode === 'fastest' ? 0 : mode === 'fewest' ? 1 : 2);
    const total = engine.graph_trace_count();
    const events = Array.from({ length: total }, (_, index) => {
      const get = (field) => engine.graph_trace_field(index, field);
      const node = get(1), from = get(2), edge = get(3);
      return {
        kind: get(0),
        node: node >= 0 ? nodes[node].id : null,
        from: from >= 0 ? nodes[from].id : null,
        edgeId: edge >= 0 ? edges[edge].id : null,
        value: get(4),
      };
    });
    return { route, events };
  } finally {
    engine.graph_trace_set(0);
  }
}
