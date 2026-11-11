import { adjacencyList } from '../data/campusGraph.js';

const noRoute = () => ({ path: null, edgeIds: [], distance: Infinity });
const hasPlace = (id) => Object.hasOwn(adjacencyList, id);

/** Find the shortest open walk in metres using a binary min-heap. */
export function dijkstra(start, destination, blockedEdgeIds = new Set()) {
  if (!hasPlace(start) || !hasPlace(destination)) return noRoute();

  const distance = Object.fromEntries(Object.keys(adjacencyList).map((id) => [id, Infinity]));
  const previous = {};
  const visited = new Set();
  const queue = new MinPriorityQueue();
  distance[start] = 0;
  queue.push({ node: start, distance: 0 });

  while (!queue.isEmpty()) {
    const current = queue.pop();
    if (visited.has(current.node)) continue;
    visited.add(current.node);
    if (current.node === destination) break;

    for (const neighbor of adjacencyList[current.node]) {
      if (blockedEdgeIds.has(neighbor.edgeId) || visited.has(neighbor.node)) continue;
      const candidate = distance[current.node] + neighbor.distance;
      if (candidate < distance[neighbor.node]) {
        distance[neighbor.node] = candidate;
        // Keep the chosen edge, not just its endpoint: parallel walkways can
        // have different lengths or closure states.
        previous[neighbor.node] = {
          node: current.node,
          edgeId: neighbor.edgeId,
          distance: neighbor.distance,
        };
        queue.push({ node: neighbor.node, distance: candidate });
      }
    }
  }

  if (!Number.isFinite(distance[destination])) return noRoute();
  return reconstructRoute(previous, start, destination);
}

/** Minimize walkway segments, then total the lengths of those exact edges. */
export function breadthFirstSearch(start, destination, blockedEdgeIds = new Set()) {
  if (!hasPlace(start) || !hasPlace(destination)) return noRoute();

  const queue = [start];
  const visited = new Set([start]);
  const previous = {};
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    if (current === destination) break;
    for (const neighbor of adjacencyList[current]) {
      if (blockedEdgeIds.has(neighbor.edgeId) || visited.has(neighbor.node)) continue;
      visited.add(neighbor.node);
      previous[neighbor.node] = {
        node: current,
        edgeId: neighbor.edgeId,
        distance: neighbor.distance,
      };
      queue.push(neighbor.node);
    }
  }

  if (!visited.has(destination)) return noRoute();
  return reconstructRoute(previous, start, destination);
}

function reconstructRoute(previous, start, destination) {
  const path = [destination];
  const edgeIds = [];
  let distance = 0;
  let current = destination;

  while (current !== start) {
    const step = previous[current];
    if (!step) return noRoute();
    path.push(step.node);
    edgeIds.push(step.edgeId);
    distance += step.distance;
    current = step.node;
  }

  return { path: path.reverse(), edgeIds: edgeIds.reverse(), distance };
}

/**
 * Compatibility helper for node-only paths. Prefer a route's edgeIds, which
 * preserve the algorithm's exact choice when two places have parallel edges.
 */
export function edgeIdsForPath(path, blockedEdgeIds = new Set()) {
  if (!path) return [];
  return path.slice(1).map((node, index) => {
    const connections = (adjacencyList[path[index]] || [])
      .filter((entry) => entry.node === node && !blockedEdgeIds.has(entry.edgeId));
    return connections.reduce((best, entry) =>
      !best || entry.distance < best.distance ? entry : best, null)?.edgeId;
  }).filter(Boolean);
}

class MinPriorityQueue {
  items = [];

  isEmpty() { return this.items.length === 0; }

  push(item) {
    this.items.push(item);
    let child = this.items.length - 1;
    while (child > 0) {
      const parent = Math.floor((child - 1) / 2);
      if (this.items[parent].distance <= this.items[child].distance) break;
      [this.items[parent], this.items[child]] = [this.items[child], this.items[parent]];
      child = parent;
    }
  }

  pop() {
    const min = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      let parent = 0;
      while (true) {
        const left = 2 * parent + 1;
        const right = left + 1;
        let smallest = parent;
        if (left < this.items.length && this.items[left].distance < this.items[smallest].distance) smallest = left;
        if (right < this.items.length && this.items[right].distance < this.items[smallest].distance) smallest = right;
        if (smallest === parent) break;
        [this.items[parent], this.items[smallest]] = [this.items[smallest], this.items[parent]];
        parent = smallest;
      }
    }
    return min;
  }
}
