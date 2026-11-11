import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(project, 'cpp/routing_engine.cpp');
const target = resolve(project, 'public/routing.wasm');
const functions = [
  'graph_reset', 'graph_add_edge', 'graph_set_node_position', 'graph_clear_blocked',
  'graph_block_edge', 'graph_route', 'graph_result_node',
  'graph_result_edge', 'graph_result_metres', 'graph_result_turns', 'graph_result_turn', 'graph_trace_set', 'graph_trace_count', 'graph_trace_field',
];
const args = [
  '--target=wasm32', '-std=c++17', '-O2', '-fno-exceptions', '-fno-rtti',
  '-nostdlib', '-Wl,--no-entry', '-Wl,--export-memory', '-Wl,--strip-all',
  ...functions.map((name) => `-Wl,--export=${name}`),
  source, '-o', target,
];
const result = spawnSync(process.env.CLANGXX || 'clang++', args, { stdio: 'inherit' });
if (result.error || result.status !== 0) {
  console.error('C++ to WebAssembly compilation failed. Install Clang/LLVM with wasm-ld.');
  if (result.error) console.error(result.error.message);
  process.exit(result.status || 1);
}
console.log('Compiled C++ DSA to public/routing.wasm');
