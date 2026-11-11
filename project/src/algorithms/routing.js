// Public routing API stays unchanged. All route searches are executed in C++
// WebAssembly; see cpp/routing_engine.cpp and wasmRouter.js.
export { dijkstra, breadthFirstSearch, edgeIdsForPath } from './wasmRouter.js';
