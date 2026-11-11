# Wayfinder — premium campus navigator

A responsive React 18 + Vite interface with Tailwind CSS v4, Lucide icons and Framer Motion. The campus graph is an illustrative Northstar University demonstration; distances are estimates, not real navigation guidance.

## Develop

Use Node.js 22.12+ or 24. Run `npm ci`, then `npm run dev`.

## Check and build

Run `npm test` for seven routing checks, including independent all-pairs distance and hop-count comparisons. Run `npm run build` to create the static website in `dist/`. Run `npm run preview` to serve that build locally.

## GitHub Pages

The live repository serves the compiled files from the root of `main`. Editable Vite source is stored in the `project/` directory of that repository. To update it, work inside `project/`, build it, and copy the contents of `project/dist/` into the repository root. Keep `.nojekyll`. Relative asset URLs work at `/campus-navigator/`.

## Opening video

`public/hero.mp4` is a muted, compressed copy of the supplied `Video Project 2.mp4`; its full 8.27-second duration and portrait framing are retained. The existing in-video credit is preserved. `hero-poster.jpg` is an extracted still. Reduced-motion visitors see the poster and can choose to play the film. Background video has a pause control. Destination photography is illustrative and is loaded from Unsplash; the map represents sample locations.

## Features

- Searchable starting point and destination; swap points.
- Dijkstra for shortest distance, BFS for fewest segments.
- Interactive map with zoom and keyboard-accessible places and walkways.
- Close or reopen paths, with immediate rerouting.
- Five recent routes stored locally where browser storage is available.
- Accessible native dialogs, motion preferences, mobile navigation.

No accounts, location tracking or server-side data collection are included. Browser history storage failures do not prevent routing.
