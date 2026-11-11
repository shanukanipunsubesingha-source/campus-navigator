import { readFileSync } from 'node:fs';
import { initializeRoutingEngine } from '../src/algorithms/wasmRouter.js';

// Exercise the actual C++ WebAssembly binary, not the previous JS algorithm.
await initializeRoutingEngine(readFileSync(new URL('../public/routing.wasm', import.meta.url)));

import test from 'node:test';
import assert from 'node:assert/strict';
import { dijkstra, breadthFirstSearch, edgeIdsForPath } from '../src/algorithms/routing.js';
import { nodes, edges, edgeById } from '../src/data/campusGraph.js';

// A matrix-based oracle is independent of the production heap/queue searches.
function allPairs(blocked, metric) {
  const ids = nodes.map(({ id }) => id);
  const matrix = Object.fromEntries(ids.map((a) => [a,
    Object.fromEntries(ids.map((b) => [b, a === b ? 0 : Infinity])),
  ]));
  for (const edge of edges) {
    if (blocked.has(edge.id)) continue;
    const cost = metric === 'hops' ? 1 : edge.distance;
    matrix[edge.from][edge.to] = Math.min(matrix[edge.from][edge.to], cost);
    matrix[edge.to][edge.from] = Math.min(matrix[edge.to][edge.from], cost);
  }
  for (const via of ids) {
    for (const from of ids) {
      for (const to of ids) {
        matrix[from][to] = Math.min(matrix[from][to], matrix[from][via] + matrix[via][to]);
      }
    }
  }
  return matrix;
}

function assertValidRoute(route, start, destination, blocked) {
  if (!route.path) {
    assert.equal(route.distance, Infinity);
    assert.deepEqual(route.edgeIds, []);
    return;
  }
  assert.equal(route.path[0], start);
  assert.equal(route.path.at(-1), destination);
  assert.equal(route.edgeIds.length, route.path.length - 1);
  assert.equal(new Set(route.path).size, route.path.length, 'route must not cycle');
  let measuredDistance = 0;
  for (const [index, id] of route.edgeIds.entries()) {
    const edge = edgeById[id];
    assert.ok(edge, `edge ${id} exists`);
    assert.ok(!blocked.has(id), `route must avoid blocked edge ${id}`);
    const [from, to] = [route.path[index], route.path[index + 1]];
    assert.ok((edge.from === from && edge.to === to) || (edge.from === to && edge.to === from),
      `edge ${id} connects ${from} to ${to}`);
    measuredDistance += edge.distance;
  }
  assert.equal(route.distance, measuredDistance, 'distance must match the exact route edges');
}

const closureScenarios = [
  new Set(),
  new Set(['e-gym-sports']),
  new Set(['e-gate-west', 'e-quad-plaza', 'e-east-cafe']),
];

test('Dijkstra matches Floyd–Warshall for every campus pair, including closures', () => {
  for (const blocked of closureScenarios) {
    const distances = allPairs(blocked, 'metres');
    for (const start of nodes) {
      for (const destination of nodes) {
        const route = dijkstra(start.id, destination.id, blocked);
        assert.equal(route.distance, distances[start.id][destination.id],
          `${start.id} → ${destination.id}, blocked: ${[...blocked]}`);
        assertValidRoute(route, start.id, destination.id, blocked);
      }
    }
  }
});

test('BFS uses the minimum possible number of open segments for every campus pair', () => {
  for (const blocked of closureScenarios) {
    const hops = allPairs(blocked, 'hops');
    for (const start of nodes) {
      for (const destination of nodes) {
        const route = breadthFirstSearch(start.id, destination.id, blocked);
        assert.equal(route.path ? route.edgeIds.length : Infinity, hops[start.id][destination.id],
          `${start.id} → ${destination.id}, blocked: ${[...blocked]}`);
        assertValidRoute(route, start.id, destination.id, blocked);
      }
    }
  }
});

test('parallel open edge is reconstructed accurately when the shorter edge is closed', () => {
  const blocked = new Set(['e-gym-sports']);
  for (const search of [dijkstra, breadthFirstSearch]) {
    for (const [start, destination] of [['gym', 'sports'], ['sports', 'gym']]) {
      const route = search(start, destination, blocked);
      assert.deepEqual(route.path, [start, destination]);
      assert.deepEqual(route.edgeIds, ['e-sports-gym']);
      assert.equal(route.distance, 115);
    }
  }
  assert.deepEqual(edgeIdsForPath(['gym', 'sports'], blocked), ['e-sports-gym']);
});

test('closing every edge out of the start returns an explicit no-route result', () => {
  for (const start of nodes) {
    const blocked = new Set(edges.filter((edge) => edge.from === start.id || edge.to === start.id).map(({ id }) => id));
    const destination = nodes.find(({ id }) => id !== start.id).id;
    for (const search of [dijkstra, breadthFirstSearch]) {
      assert.deepEqual(search(start.id, destination, blocked), { path: null, edgeIds: [], distance: Infinity });
    }
  }
});

test('same start and destination is a zero-length walk, even when all paths are closed', () => {
  const blocked = new Set(edges.map(({ id }) => id));
  for (const { id } of nodes) {
    for (const search of [dijkstra, breadthFirstSearch]) {
      assert.deepEqual(search(id, id, blocked), { path: [id], edgeIds: [], distance: 0 });
    }
  }
});

test('shortest-distance and fewest-segment modes retain their distinct objectives', () => {
  const shortest = dijkstra('gate', 'engineering');
  const fewest = breadthFirstSearch('gate', 'engineering');
  assert.equal(shortest.distance, 455);
  assert.equal(fewest.distance, 540);
  assert.ok(shortest.distance < fewest.distance);
  assert.equal(fewest.edgeIds.length, 4);
});

test('invalid stored place IDs cannot crash the planner', () => {
  for (const search of [dijkstra, breadthFirstSearch]) {
    for (const [start, destination] of [['missing', 'library'], ['gate', 'missing'], [null, 'gate'], ['__proto__', 'gate']]) {
      assert.deepEqual(search(start, destination), { path: null, edgeIds: [], distance: Infinity });
    }
  }
});


test('actual C++ WebAssembly trace matches each computed route', async () => {
  const { traceRouting } = await import('../src/algorithms/wasmRouter.js');
  for (const blocked of [new Set(), new Set(['e-gym-sports']), new Set(['e-gate-west', 'e-quad-plaza'])]) {
    for (const [mode, algorithm, visit, advance] of [
      ['fastest', dijkstra, 4, 5],
      ['fewest', breadthFirstSearch, 2, 3],
    ]) {
      for (const [from, to] of [['gate', 'engineering'], ['gym', 'sports'], ['bus', 'library']]) {
        const expected = algorithm(from, to, blocked);
        const { route, events } = traceRouting(from, to, blocked, mode);
        assert.deepEqual(route, expected, 'the teaching trace must not affect the real route');
        assert.equal(events[0]?.kind, 1);
        assert.ok(events.some((e) => e.kind === visit), 'C++ recorded a visit');
        if (route.path) assert.ok(events.some((e) => e.kind === advance), 'C++ recorded a frontier update');
        assert.ok(events.every((e) => !e.edgeId || edges.some((edge) => edge.id === e.edgeId)), 'trace uses actual walkway IDs');
        assert.equal(events.at(-1)?.kind, route.path ? 8 : 9);
      }
    }
  }
});

test('C++ trace captures same-node and blocked unreachable paths', async () => {
  const { traceRouting } = await import('../src/algorithms/wasmRouter.js');
  const same = traceRouting('gate', 'gate', new Set(edges.map((e) => e.id)));
  assert.deepEqual(same.route, { path: ['gate'], edgeIds: [], distance: 0 });
  assert.deepEqual(same.events.map((e) => e.kind), [1, 10]);
  const isolate = new Set(edges.filter((e) => e.from === 'gate' || e.to === 'gate').map((e) => e.id));
  const unreachable = traceRouting('gate', 'science', isolate, 'fewest');
  assert.equal(unreachable.route.path, null);
  assert.equal(unreachable.events.at(-1)?.kind, 9);
  assert.ok(unreachable.events.some((e) => e.kind === 6), 'C++ emitted blocked-edge events');
});
