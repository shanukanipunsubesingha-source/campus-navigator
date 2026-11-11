import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { initializeRoutingEngine } from './algorithms/wasmRouter.js';
import './styles.css';

const root = createRoot(document.getElementById('root'));
// Initialize the C++ engine first so the existing synchronous React route
// computations are safe on the very first render.
document.getElementById('root').textContent = 'Preparing campus routes…';
initializeRoutingEngine()
  .then(() => root.render(<React.StrictMode><App /></React.StrictMode>))
  .catch((error) => {
    console.error('C++ campus routing failed to load:', error);
    root.render(<main role="alert" style={{ color: '#fff', padding: '4rem 2rem', fontFamily: 'sans-serif' }}>
      <h1>Could not load the campus route planner.</h1>
      <p>Check your connection and reload the page.</p>
      <button onClick={() => window.location.reload()} style={{ padding: '1rem', cursor: 'pointer' }}>Try again</button>
    </main>);
  });
