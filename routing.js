import { adjacencyList } from './campusGraph.js';

// Dijkstra's algorithm: repeatedly settle the not-yet-visited vertex
// with the smallest known distance. Blocked edges are skipped during relaxation.
export function dijkstra(start, destination, blockedEdgeIds = new Set()) {
  const distance = Object.fromEntries(Object.keys(adjacencyList).map((id) => [id, Infinity]));
  const previous = {};
  const visited = new Set();
  distance[start] = 0;
  const queue = new MinPriorityQueue();
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
        previous[neighbor.node] = current.node;
        queue.push({ node: neighbor.node, distance: candidate });
      }
    }
  }

  return { path: reconstructPath(previous, start, destination, distance[destination]), distance: distance[destination] };
}

// Breadth-first search gives the route with the fewest edges (path segments).
// Its route may be longer in metres because it treats every edge equally.
export function breadthFirstSearch(start, destination, blockedEdgeIds = new Set()) {
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
      previous[neighbor.node] = current;
      queue.push(neighbor.node);
    }
  }

  const path = reconstructPath(previous, start, destination, visited.has(destination) ? 0 : Infinity);
  const totalDistance = path ? path.slice(1).reduce((sum, node, index) => {
    const prior = path[index];
    return sum + adjacencyList[prior].find((entry) => entry.node === node).distance;
  }, 0) : Infinity;
  return { path, distance: totalDistance };
}

function reconstructPath(previous, start, destination, total) {
  if (!Number.isFinite(total)) return null;
  const path = [destination];
  while (path[0] !== start) {
    const prior = previous[path[0]];
    if (!prior) return null;
    path.unshift(prior);
  }
  return path;
}

// A binary min-heap is a priority queue: push and pop both take O(log n).
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

export function edgeIdsForPath(path) {
  if (!path) return [];
  return path.slice(1).map((node, index) => {
    const prior = path[index];
    return adjacencyList[prior].find((entry) => entry.node === node)?.edgeId;
  }).filter(Boolean);
}
