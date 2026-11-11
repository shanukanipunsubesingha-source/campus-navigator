// A small, editable walking network for the fictional Northstar campus.
// Vertices are path junctions and building entrances; edge weights are metres.
export const nodes = [
  { id: 'gate', name: 'Main Gate', type: 'entrance', x: 82, y: 350 },
  { id: 'west', name: 'West Walk', type: 'path', x: 205, y: 350 },
  { id: 'arts', name: 'Arts Centre', type: 'building', x: 205, y: 235 },
  { id: 'library', name: 'Library', type: 'building', x: 345, y: 235 },
  { id: 'quad', name: 'Central Quad', type: 'plaza', x: 345, y: 350 },
  { id: 'engineering', name: 'Engineering', type: 'building', x: 470, y: 235 },
  { id: 'plaza', name: 'Founders Plaza', type: 'plaza', x: 525, y: 350 },
  { id: 'student', name: 'Student Centre', type: 'building', x: 565, y: 480 },
  { id: 'science', name: 'Science Hall', type: 'building', x: 675, y: 235 },
  { id: 'east', name: 'East Walk', type: 'path', x: 675, y: 350 },
  { id: 'cafeteria', name: 'Cafeteria', type: 'building', x: 675, y: 480 },
  { id: 'gym', name: 'Sports Centre', type: 'building', x: 835, y: 235 },
  { id: 'sports', name: 'Sports Walk', type: 'path', x: 835, y: 350 },
  { id: 'dorms', name: 'Residence Hall', type: 'building', x: 345, y: 505 },
  { id: 'auditorium', name: 'Auditorium', type: 'building', x: 470, y: 505 },
  { id: 'admin', name: 'Admin Office', type: 'building', x: 205, y: 505 },
  { id: 'bus', name: 'Bus Stop', type: 'transport', x: 835, y: 480 },
];

export const edges = [
  { id: 'e-gate-west', from: 'gate', to: 'west', distance: 110 },
  { id: 'e-west-quad', from: 'west', to: 'quad', distance: 130 },
  { id: 'e-quad-plaza', from: 'quad', to: 'plaza', distance: 155 },
  { id: 'e-plaza-east', from: 'plaza', to: 'east', distance: 135 },
  { id: 'e-east-sports', from: 'east', to: 'sports', distance: 140 },
  { id: 'e-west-arts', from: 'west', to: 'arts', distance: 105 },
  { id: 'e-arts-library', from: 'arts', to: 'library', distance: 125 },
  { id: 'e-library-engineering', from: 'library', to: 'engineering', distance: 115 },
  { id: 'e-engineering-science', from: 'engineering', to: 'science', distance: 175 },
  { id: 'e-science-gym', from: 'science', to: 'gym', distance: 150 },
  { id: 'e-gym-sports', from: 'gym', to: 'sports', distance: 105 },
  { id: 'e-west-admin', from: 'west', to: 'admin', distance: 100 },
  { id: 'e-admin-dorms', from: 'admin', to: 'dorms', distance: 125 },
  { id: 'e-dorms-auditorium', from: 'dorms', to: 'auditorium', distance: 120 },
  { id: 'e-auditorium-student', from: 'auditorium', to: 'student', distance: 95 },
  { id: 'e-student-cafe', from: 'student', to: 'cafeteria', distance: 115 },
  { id: 'e-cafe-bus', from: 'cafeteria', to: 'bus', distance: 140 },
  { id: 'e-bus-sports', from: 'bus', to: 'sports', distance: 120 },
  { id: 'e-quad-library', from: 'quad', to: 'library', distance: 105 },
  { id: 'e-quad-dorms', from: 'quad', to: 'dorms', distance: 145 },
  { id: 'e-quad-auditorium', from: 'quad', to: 'auditorium', distance: 160 },
  { id: 'e-plaza-engineering', from: 'plaza', to: 'engineering', distance: 145 },
  { id: 'e-plaza-student', from: 'plaza', to: 'student', distance: 125 },
  { id: 'e-east-science', from: 'east', to: 'science', distance: 115 },
  { id: 'e-east-cafe', from: 'east', to: 'cafeteria', distance: 115 },
  { id: 'e-sports-gym', from: 'sports', to: 'gym', distance: 115 },
];

export const buildings = [
  { node: 'arts', x: 154, y: 148, w: 104, h: 57, title: 'ARTS CENTRE', color: 'sand', icon: 'A' },
  { node: 'library', x: 296, y: 128, w: 105, h: 59, title: 'LIBRARY', color: 'sage', icon: 'L' },
  { node: 'engineering', x: 428, y: 132, w: 88, h: 57, title: 'ENGINEERING', color: 'blue', icon: 'E' },
  { node: 'science', x: 622, y: 130, w: 106, h: 58, title: 'SCIENCE HALL', color: 'sage', icon: 'S' },
  { node: 'gym', x: 786, y: 148, w: 98, h: 56, title: 'SPORTS CENTRE', color: 'blue', icon: '✳' },
  { node: 'admin', x: 155, y: 548, w: 100, h: 55, title: 'ADMIN OFFICE', color: 'sand', icon: 'i' },
  { node: 'dorms', x: 296, y: 552, w: 102, h: 55, title: 'RESIDENCE HALL', color: 'blue', icon: 'R' },
  { node: 'auditorium', x: 428, y: 553, w: 88, h: 55, title: 'AUDITORIUM', color: 'sand', icon: '◖' },
  { node: 'student', x: 524, y: 530, w: 82, h: 57, title: 'STUDENT CENTRE', color: 'sage', icon: '✦' },
  { node: 'cafeteria', x: 632, y: 552, w: 87, h: 55, title: 'CAFETERIA', color: 'sand', icon: '⌁' },
  { node: 'bus', x: 786, y: 542, w: 98, h: 52, title: 'CAMPUS BUS', color: 'blue', icon: '↗' },
];

export const adjacencyList = nodes.reduce((list, node) => {
  list[node.id] = [];
  return list;
}, {});

for (const edge of edges) {
  adjacencyList[edge.from].push({ node: edge.to, distance: edge.distance, edgeId: edge.id });
  adjacencyList[edge.to].push({ node: edge.from, distance: edge.distance, edgeId: edge.id });
}

export const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
export const edgeById = Object.fromEntries(edges.map((edge) => [edge.id, edge]));
