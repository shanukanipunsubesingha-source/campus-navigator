# Wayfinder — premium campus navigator

A responsive React 18 + Vite interface with C++17 WebAssembly-powered route planning, Tailwind CSS v4, Lucide icons and Framer Motion. The campus graph is an illustrative Northstar University demonstration; distances are estimates, not real navigation guidance.

## Develop

Use Node.js 22.12+ or 24. Run `npm ci`, then `npm run dev` from `project/`.

The checked-in `public/routing.wasm` is compiled from `cpp/routing_engine.cpp`.
To rebuild that binary, install Clang/LLVM with wasm32 and wasm-ld, then run:

```sh
npm run build:wasm
```

The C++ engine implements an undirected graph using adjacency lists, Dijkstra's shortest-distance search with a binary min-heap priority queue, and breadth-first search using a FIFO array queue. Paths retain original walkway edge indices so parallel edges and individual walkway closures behave correctly. React loads the compiled WebAssembly before its first render; route calculation itself runs in C++.

## Test and build

```sh
npm test
npm run build
```

Seven integration checks run the real WebAssembly binary against independent Floyd–Warshall reference results for every campus pair, including closures, unreachable paths, same-node routes, and parallel walkways. Tests need no Emscripten and use native Node.js WebAssembly support.

## GitHub Pages

The deployed site serves compiled files from the repository root of `main`. Editable source lives in `project/`. To publish a source update, run the commands in `project/`, copy **all contents** of `project/dist/` into the repository root, and commit the compiled output. Include `routing.wasm` alongside `index.html`, JavaScript, and CSS. Preserve `.nojekyll`. The relative Vite base `./` supports `/campus-navigator/` and route hash links.

A GitHub Actions workflow can build and publish the compiled site after this branch is merged into `main`.

## Opening video

`public/hero.mp4` is a muted, compressed copy of the supplied `Video Project 2.mp4`; its full 8.27-second duration and portrait framing are retained. The existing in-video credit is preserved. `hero-poster.jpg` is an extracted still. Reduced-motion visitors see the poster and can choose to play the film. Background video has a pause control. Destination photography is illustrative and is loaded from Unsplash.

## Features

- Searchable starting point and destination; swap points.
- **C++/WebAssembly:** Dijkstra for shortest metres; BFS for fewest path segments.
- Interactive map with zoom and keyboard-accessible places and walkways.
- Close or reopen paths, with immediate C++ rerouting.
- Five recent routes stored locally where browser storage is available.
- Accessible native dialogs, motion preferences, mobile navigation.

No accounts, location tracking or server-side data collection are included.


## Optional interactive DSA explorer

The route planner has a **Watch DSA in Action** button. This opens a responsive educational viewer with step-through and play/pause controls, speed options, graph highlights, and the full C++ source with an active-line indicator. Trace events (visits, BFS enqueues, Dijkstra relaxations, ignored closures, and completion) are emitted by the **real C++ WebAssembly engine**, rather than simulated by JavaScript. Ordinary routing continues to run without tracing overhead.

**If working locally:** after changing the C++ source, run `npm run build:wasm` before `npm test` or `npm run dev`. CI compiles the WebAssembly module before tests and the production build. The deployed `routing.wasm` file is rebuilt automatically when this branch is merged.

## Optimized desktop opening video

For the 42-second landscape opening film, upload the provided **24.3 MB, 1920×1080, 30 fps H.264** video to `project/public/hero-desktop.mp4` on this branch before merging its pull request. The existing `project/public/hero.mp4` remains the portrait-oriented mobile background. The React header uses the new file only above 700 px, and falls back to the previous film if the new file cannot load.

The GitHub Pages build copies files from `project/public/` to the published site root. The video tag uses `preload="metadata"`, not a forced full 24 MB download. Users' actual buffering depends on network and decoder performance. If further optimization is needed, encode a shorter loop or serve responsive variants instead of a full 4K background.


## Fewest turns (direction-aware graph search)

The planner now offers **Shortest distance (Dijkstra)**, **Fewest segments (BFS)**, and **Fewest turns (modified Dijkstra)**. Fewest turns uses C++ WebAssembly, the same arrays and adjacency lists, and a binary min-heap.

A simple node-only visited array is not sufficient for turn routing: the decision to turn depends on the *incoming direction*. The algorithm therefore uses one search state per incoming **directed edge**, plus the start state. It minimizes the pair `(significant turns, total metres)` in lexicographic order—always minimize turns first, then choose the shorter route among ties. The `is_turn()` routine calculates the change of direction from three map coordinates, counting a heading change of approximately **30° or more** as a turn. Tiny bends do not count. Directions are calculated from the schematic demo map, **not surveyed physical walkways**, so turn instructions are approximate.

The optional DSA visualizer shows C++ visit/relax/closed-edge trace events for this third mode. The planner displays turn totals and highlights where the route requires a direction change. The existing two modes, walkway closures, mobile layout, and opening film are preserved. No database or backend is added.

Run `npm run build:wasm && npm test && npm run build` from `project/` before deploying; GitHub Actions automatically does this during PR validation.
