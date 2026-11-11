// Wayfinder C++17 routing engine, compiled to standalone browser WebAssembly.
// Array-backed adjacency lists, a FIFO BFS queue, and a binary min-heap for
// Dijkstra. Every arc stores its exact edge index so parallel paths work.

// Freestanding wasm32 does not link libc; supply Clang's required intrinsic.
extern "C" void* memset(void* destination, int value, __SIZE_TYPE__ size) {
  volatile unsigned char* bytes = static_cast<volatile unsigned char*>(destination);
  for (__SIZE_TYPE__ i = 0; i < size; ++i) bytes[i] = static_cast<unsigned char>(value);
  return destination;
}

namespace {
constexpr int MAX_NODES = 256;
constexpr int MAX_EDGES = 1024;
constexpr int MAX_ARCS = 2 * MAX_EDGES;
constexpr int MAX_HEAP = 8192;
constexpr int INFINITY_METRES = 0x3fffffff;
// Native events for the optional teaching visualizer.
constexpr int MAX_TRACE = 8192;
// 1 start; 2 BFS visit; 3 BFS enqueue; 4 Dijkstra visit; 5 relax;
// 6 BFS closed; 7 Dijkstra closed; 8 complete; 9 unreachable; 10 same node.
struct TraceEvent { int kind; int node; int from; int edge; int value; };
TraceEvent trace_events[MAX_TRACE];
int trace_length = 0;
int trace_enabled = 0;
void trace_add(int kind, int node, int from, int edge, int value) {
  if (trace_enabled && trace_length < MAX_TRACE)
    trace_events[trace_length++] = {kind, node, from, edge, value};
}

struct Arc { int from; int destination; int metres; int edge; int next; };
struct HeapItem { int node; int distance; };

int node_count = 0;
int arc_count = 0;
int head[MAX_NODES];
int tail[MAX_NODES];
Arc arcs[MAX_ARCS];
int blocked[MAX_EDGES];
int node_x[MAX_NODES];
int node_y[MAX_NODES];
int has_position[MAX_NODES];

int best[MAX_NODES];
int parent_node[MAX_NODES];
int parent_edge[MAX_NODES];
int parent_metres[MAX_NODES];
int seen[MAX_NODES];
int queue_nodes[MAX_NODES];
HeapItem heap[MAX_HEAP];
int heap_size = 0;

int result_nodes[MAX_NODES];
int result_edges[MAX_NODES];
int result_length = 0;
int result_metres = -1;
int result_turns = 0;

void append_arc(int from, int to, int metres, int edge) {
  const int position = arc_count++;
  arcs[position] = {from, to, metres, edge, -1};
  if (head[from] < 0) head[from] = position;
  else arcs[tail[from]].next = position;
  tail[from] = position;
}

void heap_push(int node, int distance) {
  if (heap_size >= MAX_HEAP) return;
  int child = heap_size++;
  heap[child] = {node, distance};
  while (child > 0) {
    const int parent = (child - 1) / 2;
    if (heap[parent].distance <= heap[child].distance) break;
    const HeapItem previous = heap[parent];
    heap[parent] = heap[child];
    heap[child] = previous;
    child = parent;
  }
}

HeapItem heap_pop() {
  const HeapItem first = heap[0];
  const HeapItem last = heap[--heap_size];
  if (heap_size > 0) {
    heap[0] = last;
    int parent = 0;
    while (true) {
      const int left = 2 * parent + 1;
      const int right = left + 1;
      int smallest = parent;
      if (left < heap_size && heap[left].distance < heap[smallest].distance) smallest = left;
      if (right < heap_size && heap[right].distance < heap[smallest].distance) smallest = right;
      if (smallest == parent) break;
      const HeapItem previous = heap[parent];
      heap[parent] = heap[smallest];
      heap[smallest] = previous;
      parent = smallest;
    }
  }
  return first;
}


/*
 * Fewest turns is NOT ordinary BFS: whether a step is a turn depends on
 * the direction we entered the current vertex. One state per directed arc
 * (plus a virtual start state) preserves that information.
 * We count changes greater than ~30 degrees; small bends are ignored.
 * Map coordinates are illustrative: real deployments need surveyed geometry.
 */
int turn_cost[MAX_ARCS + 1];
int turn_distance[MAX_ARCS + 1];
int turn_parent[MAX_ARCS + 1];
int turn_done[MAX_ARCS + 1];
int turn_heap[MAX_ARCS + 1];
int turn_heap_position[MAX_ARCS + 1];
int turn_heap_size = 0;

int is_turn(int before, int at, int after) {
  if (!has_position[before] || !has_position[at] || !has_position[after]) return 0;
  const long long ax = static_cast<long long>(node_x[at]) - node_x[before];
  const long long ay = static_cast<long long>(node_y[at]) - node_y[before];
  const long long bx = static_cast<long long>(node_x[after]) - node_x[at];
  const long long by = static_cast<long long>(node_y[after]) - node_y[at];
  if ((ax == 0 && ay == 0) || (bx == 0 && by == 0)) return 0;
  const long long cross = ax * by - ay * bx;
  const long long dot = ax * bx + ay * by;
  const long long abs_cross = cross < 0 ? -cross : cross;
  // tan(30 deg) ~= 0.577. dot <= 0 also catches reversals.
  return dot <= 0 || abs_cross * 1000 > dot * 577;
}

bool turn_less(int left, int right) {
  return turn_cost[left] < turn_cost[right] ||
         (turn_cost[left] == turn_cost[right] && turn_distance[left] < turn_distance[right]);
}

void turn_heap_swap(int a, int b) {
  const int previous = turn_heap[a];
  turn_heap[a] = turn_heap[b];
  turn_heap[b] = previous;
  turn_heap_position[turn_heap[a]] = a;
  turn_heap_position[turn_heap[b]] = b;
}

void turn_heap_push_or_decrease(int state) {
  int child = turn_heap_position[state];
  if (child < 0) {
    if (turn_heap_size >= MAX_ARCS + 1) return;
    child = turn_heap_size++;
    turn_heap[child] = state;
    turn_heap_position[state] = child;
  }
  while (child > 0) {
    const int parent = (child - 1) / 2;
    if (!turn_less(turn_heap[child], turn_heap[parent])) break;
    turn_heap_swap(child, parent);
    child = parent;
  }
}

int turn_heap_pop() {
  const int first = turn_heap[0];
  const int last = turn_heap[--turn_heap_size];
  turn_heap_position[first] = -1;
  if (turn_heap_size > 0) {
    turn_heap[0] = last;
    turn_heap_position[last] = 0;
    int parent = 0;
    while (true) {
      const int left = parent * 2 + 1, right = left + 1;
      int smallest = parent;
      if (left < turn_heap_size && turn_less(turn_heap[left], turn_heap[smallest])) smallest = left;
      if (right < turn_heap_size && turn_less(turn_heap[right], turn_heap[smallest])) smallest = right;
      if (smallest == parent) break;
      turn_heap_swap(parent, smallest);
      parent = smallest;
    }
  }
  return first;
}

int fewest_turns_route(int start, int destination) {
  const int virtual_start = arc_count;
  for (int i = 0; i <= arc_count; ++i) {
    turn_cost[i] = INFINITY_METRES;
    turn_distance[i] = INFINITY_METRES;
    turn_parent[i] = -1;
    turn_done[i] = 0;
    turn_heap_position[i] = -1;
  }
  turn_heap_size = 0;
  turn_cost[virtual_start] = 0;
  turn_distance[virtual_start] = 0;
  turn_heap_push_or_decrease(virtual_start);
  int finish = -1;
  while (turn_heap_size > 0) {
    const int state = turn_heap_pop();
    if (turn_done[state]) continue;
    turn_done[state] = 1;
    const int current = state == virtual_start ? start : arcs[state].destination;
    trace_add(11, current, state == virtual_start ? -1 : arcs[state].from,
              state == virtual_start ? -1 : arcs[state].edge, turn_cost[state]); // @trace:turn-visit
    if (current == destination) { finish = state; break; }
    for (int arc = head[current]; arc >= 0; arc = arcs[arc].next) {
      const Arc connection = arcs[arc];
      if (blocked[connection.edge]) {
        trace_add(13, connection.destination, current, connection.edge, 0); // @trace:turn-closed
        continue;
      }
      if (turn_done[arc]) continue;
      const int extra = state == virtual_start ? 0 : is_turn(arcs[state].from, current, connection.destination);
      const int next_turns = turn_cost[state] + extra;
      const int next_metres = turn_distance[state] + connection.metres;
      if (next_turns < turn_cost[arc] ||
          (next_turns == turn_cost[arc] && next_metres < turn_distance[arc])) {
        turn_cost[arc] = next_turns;
        turn_distance[arc] = next_metres;
        turn_parent[arc] = state;
        turn_heap_push_or_decrease(arc);
        trace_add(12, connection.destination, current, connection.edge, next_turns); // @trace:turn-relax
      }
    }
  }
  if (finish < 0) {
    trace_add(9, destination, -1, -1, -1); // @trace:unreachable-turns
    return 0;
  }
  int reversed[MAX_NODES];
  int count = 0, cursor = finish;
  while (cursor != virtual_start) {
    if (cursor < 0 || count >= MAX_NODES - 1) return 0;
    reversed[count++] = cursor;
    cursor = turn_parent[cursor];
  }
  result_nodes[0] = start;
  result_metres = 0;
  for (int i = count - 1, output = 1; i >= 0; --i, ++output) {
    const Arc connection = arcs[reversed[i]];
    result_nodes[output] = connection.destination;
    result_edges[output - 1] = connection.edge;
    result_metres += connection.metres;
  }
  result_length = count + 1;
  result_turns = turn_cost[finish];
  trace_add(8, destination, -1, -1, result_turns); // @trace:complete
  return result_length;
}

int build_result(int start, int destination) {
  int reverse_nodes[MAX_NODES];
  int reverse_edges[MAX_NODES];
  int count = 0;
  int cursor = destination;
  int metres = 0;
  while (cursor != start) {
    if (cursor < 0 || count >= node_count || parent_node[cursor] < 0) return 0;
    reverse_nodes[count] = cursor;
    reverse_edges[count] = parent_edge[cursor];
    metres += parent_metres[cursor];
    ++count;
    cursor = parent_node[cursor];
  }
  result_nodes[0] = start;
  for (int i = count - 1, output = 1; i >= 0; --i, ++output) {
    result_nodes[output] = reverse_nodes[i];
    result_edges[output - 1] = reverse_edges[i];
  }
  result_length = count + 1;
  result_metres = metres;
  return result_length;
}
} // namespace

extern "C" {
// Returns 1 for a valid graph, 0 for an invalid vertex count.
int graph_reset(int nodes) {
  if (nodes <= 0 || nodes > MAX_NODES) return 0;
  node_count = nodes;
  arc_count = 0;
  result_length = 0;
  result_metres = -1;
  for (int i = 0; i < MAX_NODES; ++i) { head[i] = -1; tail[i] = -1; has_position[i] = 0; }
  for (int i = 0; i < MAX_EDGES; ++i) blocked[i] = 0;
  return 1;
}

// Locations used to measure changes in heading without any database.
int graph_set_node_position(int node, int x, int y) {
  if (node < 0 || node >= node_count) return 0;
  node_x[node] = x; node_y[node] = y; has_position[node] = 1;
  return 1;
}

// Undirected edge. Keep the original edge index to handle parallel walkways.
int graph_add_edge(int from, int to, int metres, int edge_index) {
  if (from < 0 || to < 0 || from >= node_count || to >= node_count ||
      metres <= 0 || edge_index < 0 || edge_index >= MAX_EDGES ||
      arc_count + 2 > MAX_ARCS) return 0;
  append_arc(from, to, metres, edge_index);
  append_arc(to, from, metres, edge_index);
  return 1;
}

void graph_clear_blocked() {
  for (int i = 0; i < MAX_EDGES; ++i) blocked[i] = 0;
}

void graph_block_edge(int edge_index) {
  if (edge_index >= 0 && edge_index < MAX_EDGES) blocked[edge_index] = 1;
}

// mode 0: Dijkstra (minimum metres); 1: BFS (minimum segments);
// mode 2: expanded-state Dijkstra (fewest ~30 degree turns, then metres).
// Returns vertex count, or zero if invalid/unreachable.
int graph_route(int start, int destination, int mode) {
  result_length = 0;
  result_metres = -1;
  result_turns = 0;
  trace_length = 0;
  if (start < 0 || destination < 0 || start >= node_count ||
      destination >= node_count || (mode != 0 && mode != 1 && mode != 2)) return 0;
  trace_add(1, start, -1, -1, 0); // @trace:start
  if (start == destination) {
    trace_add(10, start, -1, -1, 0); // @trace:already
    result_nodes[0] = start;
    result_length = 1;
    result_metres = 0;
    return 1;
  }
  for (int i = 0; i < node_count; ++i) {
    best[i] = INFINITY_METRES;
    parent_node[i] = -1;
    parent_edge[i] = -1;
    parent_metres[i] = 0;
    seen[i] = 0;
  }
  if (mode == 2) return fewest_turns_route(start, destination);
  if (mode == 1) {
    // Fixed-size FIFO queue with head/tail indexes.
    int front = 0;
    int back = 0;
    queue_nodes[back++] = start;
    seen[start] = 1;
    while (front < back) {
      const int current = queue_nodes[front++];
      trace_add(2, current, -1, -1, 0); // @trace:bfs-visit
      if (current == destination) break;
      for (int arc = head[current]; arc >= 0; arc = arcs[arc].next) {
        const Arc connection = arcs[arc];
        if (blocked[connection.edge]) {
          trace_add(6, connection.destination, current, connection.edge, 0); // @trace:bfs-closed
          continue;
        }
        if (seen[connection.destination]) continue;
        seen[connection.destination] = 1;
        parent_node[connection.destination] = current;
        parent_edge[connection.destination] = connection.edge;
        parent_metres[connection.destination] = connection.metres;
        queue_nodes[back++] = connection.destination;
        trace_add(3, connection.destination, current, connection.edge, connection.metres); // @trace:bfs-enqueue
      }
    }
    if (!seen[destination]) {
      trace_add(9, destination, -1, -1, -1); // @trace:unreachable-bfs
      return 0;
    }
  } else {
    // Dijkstra, using a binary min-heap priority queue.
    best[start] = 0;
    heap_size = 0;
    heap_push(start, 0);
    while (heap_size > 0) {
      const HeapItem current = heap_pop();
      if (seen[current.node]) continue;
      seen[current.node] = 1;
      trace_add(4, current.node, -1, -1, current.distance); // @trace:dijkstra-visit
      if (current.node == destination) break;
      for (int arc = head[current.node]; arc >= 0; arc = arcs[arc].next) {
        const Arc connection = arcs[arc];
        if (blocked[connection.edge]) {
          trace_add(7, connection.destination, current.node, connection.edge, 0); // @trace:dijkstra-closed
          continue;
        }
        if (seen[connection.destination]) continue;
        const int candidate = best[current.node] + connection.metres;
        if (candidate < best[connection.destination]) {
          best[connection.destination] = candidate;
          parent_node[connection.destination] = current.node;
          parent_edge[connection.destination] = connection.edge;
          parent_metres[connection.destination] = connection.metres;
          heap_push(connection.destination, candidate);
          trace_add(5, connection.destination, current.node, connection.edge, candidate); // @trace:dijkstra-relax
        }
      }
    }
    if (best[destination] == INFINITY_METRES) {
      trace_add(9, destination, -1, -1, -1); // @trace:unreachable-dijkstra
      return 0;
    }
  }
  trace_add(8, destination, -1, -1, 0); // @trace:complete
  const int length = build_result(start, destination);
  for (int i = 2; i < length; ++i)
    result_turns += is_turn(result_nodes[i - 2], result_nodes[i - 1], result_nodes[i]);
  return length;
}

int graph_result_node(int index) {
  return index >= 0 && index < result_length ? result_nodes[index] : -1;
}
int graph_result_edge(int index) {
  return index >= 0 && index < result_length - 1 ? result_edges[index] : -1;
}
int graph_result_metres() { return result_metres; }
int graph_result_turns() { return result_turns; }
int graph_result_turn(int path_index) {
  if (path_index < 2 || path_index >= result_length) return 0;
  return is_turn(result_nodes[path_index - 2], result_nodes[path_index - 1],
                 result_nodes[path_index]);
}

// Disabled during normal routing; enabled only when opening the visualizer.
void graph_trace_set(int enabled) { trace_enabled = enabled ? 1 : 0; trace_length = 0; }
int graph_trace_count() { return trace_length; }
int graph_trace_field(int index, int field) {
  if (index < 0 || index >= trace_length) return -1;
  const TraceEvent event = trace_events[index];
  if (field == 0) return event.kind;
  if (field == 1) return event.node;
  if (field == 2) return event.from;
  if (field == 3) return event.edge;
  if (field == 4) return event.value;
  return -1;
}
} // extern C
