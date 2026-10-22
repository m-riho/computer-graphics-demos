import { cubeMesh, validateMesh, type Mesh, type Vec3 } from './mesh.ts';

export type SubdivisionMethod = 'catmull-clark' | 'loop' | 'butterfly' | 'doo-sabin';

/** Educational closed, consistently oriented manifold meshes only; no crease/boundary rules.
 * References: Zorin et al., SIGGRAPH 2000 course notes, chapters 2–3:
 * https://cs.nyu.edu/~dzorin/sig00course/coursenotes00.pdf
 * Modified Butterfly: Zorin, Schröder & Sweldens (1996):
 * https://mrl.cs.nyu.edu/publications/interpolating-subdivision/
 */
type Corner = { face: number; index: number; next: number; previous: number };
type Edge = { a: number; b: number; sides: { face: number; index: number; from: number; to: number }[] };
const edgeKey = (a: number, b: number): string => a < b ? `${a}:${b}` : `${b}:${a}`;
const copyPoint = (p: Vec3): Vec3 => [p[0], p[1], p[2]];
function weighted(points: Vec3[], weights: number[]): Vec3 {
  const result: Vec3 = [0, 0, 0];
  points.forEach((p, i) => { for (let k = 0; k < 3; k++) result[k] += p[k] * weights[i]; });
  return result;
}
const average = (points: Vec3[]): Vec3 => weighted(points, points.map(() => 1 / points.length));

/** A cyclic corner order also detects two surfaces meeting only at a vertex. */
function topology(mesh: Mesh, triangles = false) {
  if (mesh.vertices.length < 4 || mesh.faces.length < 4) throw new Error('A closed manifold mesh is required.');
  if (mesh.vertices.some(p => p.length !== 3 || !p.every(Number.isFinite))) throw new Error('Vertex coordinates must be finite.');
  const errors = validateMesh(mesh);
  if (errors.length) throw new Error(errors[0]);
  const edges: Edge[] = [], edgeIndex = new Map<string, number>();
  const corners: Corner[][] = mesh.vertices.map(() => []);
  mesh.faces.forEach((face, fi) => {
    if (triangles && face.length !== 3) throw new Error('This method requires triangle faces.');
    if (face.length < 3 || new Set(face).size !== face.length || face.some(v => !Number.isInteger(v) || v < 0 || v >= mesh.vertices.length)) throw new Error('Invalid face indices.');
    face.forEach((a, i) => {
      const b = face[(i + 1) % face.length], previous = face[(i + face.length - 1) % face.length];
      corners[a].push({ face: fi, index: i, next: b, previous });
      const key = edgeKey(a, b);
      if (!edgeIndex.has(key)) { edgeIndex.set(key, edges.length); edges.push({ a, b, sides: [] }); }
      edges[edgeIndex.get(key)!].sides.push({ face: fi, index: i, from: a, to: b });
    });
  });
  for (const edge of edges) {
    if (edge.sides.length !== 2) throw new Error('A closed manifold mesh must have two faces per edge.');
    if (edge.sides[0].from !== edge.sides[1].to) throw new Error('Faces must have consistent orientation.');
  }
  const rings = corners.map(list => {
    if (list.length < 3) throw new Error('A manifold vertex needs a single closed ring of at least three faces.');
    const byNext = new Map(list.map(c => [c.next, c]));
    const ordered: Corner[] = [], visited = new Set<Corner>();
    let current = list[0];
    while (!visited.has(current)) {
      visited.add(current); ordered.push(current);
      const following = byNext.get(current.previous);
      if (!following) throw new Error('Invalid manifold vertex ring.');
      current = following;
    }
    if (current !== list[0] || ordered.length !== list.length || byNext.size !== list.length) throw new Error('Non-manifold vertex: disconnected face rings.');
    return ordered;
  });
  return { edges, edgeIndex, rings };
}

/** Same starting cage within each family: quads = cube, triangles = octahedron. */
export function subdivisionInput(method: SubdivisionMethod): Mesh {
  if (method === 'catmull-clark' || method === 'doo-sabin') return cubeMesh();
  if (method !== 'loop' && method !== 'butterfly') throw new Error('Unknown subdivision method.');
  return {
    vertices: [[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
    faces: [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [1, 0, 5], [2, 1, 5], [3, 2, 5], [0, 3, 5]],
  };
}

/** Catmull–Clark: face average; edge average; P'=(F+2R+(n−3)P)/n. */
export function catmullClark(mesh: Mesh): Mesh {
  const t = topology(mesh), points = mesh.vertices;
  const facePoints = mesh.faces.map(face => average(face.map(i => points[i])));
  const edgePoints = t.edges.map(e => average([points[e.a], points[e.b], ...e.sides.map(s => facePoints[s.face])]));
  const vertexPoints = points.map((p, v) => {
    const ring = t.rings[v], n = ring.length;
    const F = average(ring.map(c => facePoints[c.face]));
    const R = average(ring.map(c => average([p, points[c.next]])));
    return weighted([F, R, p], [1 / n, 2 / n, (n - 3) / n]);
  });
  const edgeOffset = points.length, faceOffset = points.length + edgePoints.length;
  const faces: number[][] = [];
  mesh.faces.forEach((face, fi) => face.forEach((v, i) => {
    const next = face[(i + 1) % face.length], prev = face[(i + face.length - 1) % face.length];
    faces.push([v, edgeOffset + t.edgeIndex.get(edgeKey(v, next))!, faceOffset + fi, edgeOffset + t.edgeIndex.get(edgeKey(prev, v))!]);
  }));
  return { vertices: [...vertexPoints, ...edgePoints, ...facePoints], faces };
}

/** Both triangle schemes have the same 1-to-4 connectivity, but different geometry. */
function refineTriangles(mesh: Mesh, t: ReturnType<typeof topology>, oldPoints: Vec3[], edgePoints: Vec3[]): Mesh {
  const edgeVertex = (a: number, b: number) => mesh.vertices.length + t.edgeIndex.get(edgeKey(a, b))!;
  const faces: number[][] = [];
  for (const [a, b, c] of mesh.faces) {
    const ab = edgeVertex(a, b), bc = edgeVertex(b, c), ca = edgeVertex(c, a);
    faces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
  }
  return { vertices: [...oldPoints, ...edgePoints], faces };
}
function opposite(mesh: Mesh, face: number, a: number, b: number): number {
  return mesh.faces[face].find(v => v !== a && v !== b)!;
}

/** Loop's original cosine beta (not the simplified 3/(8n) variant). */
export function loopSubdivision(mesh: Mesh): Mesh {
  const t = topology(mesh, true), points = mesh.vertices;
  const oldPoints = points.map((p, v) => {
    const neighbors = t.rings[v].map(c => points[c.next]), n = neighbors.length;
    const beta = (5 / 8 - (3 / 8 + Math.cos(2 * Math.PI / n) / 4) ** 2) / n;
    return weighted([p, ...neighbors], [1 - n * beta, ...neighbors.map(() => beta)]);
  });
  const edgePoints = t.edges.map(e => weighted(
    [points[e.a], points[e.b], ...e.sides.map(s => points[opposite(mesh, s.face, e.a, e.b)])],
    [3 / 8, 3 / 8, 1 / 8, 1 / 8],
  ));
  return refineTriangles(mesh, t, oldPoints, edgePoints);
}

/** Modified Butterfly interpolates old vertices exactly, including extraordinary ones.
 * Regular edge: 1/2 endpoints + 1/8 opposites − 1/16 four outer vertices.
 * Extraordinary endpoint: 3/4 center plus a valence-dependent cyclic one-ring mask.
 * With two extraordinary endpoints, average the two one-sided predictions.
 */
export function modifiedButterfly(mesh: Mesh): Mesh {
  const t = topology(mesh, true), points = mesh.vertices;
  function extraordinary(center: number, toward: number): Vec3 {
    const ring = t.rings[center].map(c => c.next), n = ring.length;
    const start = ring.indexOf(toward);
    const neighbors = ring.map((_, i) => points[ring[(start + i) % n]]);
    const weights = neighbors.map((_, j) => {
      if (n === 3) return j === 0 ? 5 / 12 : -1 / 12;
      if (n === 4) return [3 / 8, 0, -1 / 8, 0][j];
      return (1 / 4 + Math.cos(2 * Math.PI * j / n) + Math.cos(4 * Math.PI * j / n) / 2) / n;
    });
    return weighted([points[center], ...neighbors], [3 / 4, ...weights]);
  }
  const edgePoints = t.edges.map(e => {
    const aExtra = t.rings[e.a].length !== 6, bExtra = t.rings[e.b].length !== 6;
    if (aExtra && bExtra) return average([extraordinary(e.a, e.b), extraordinary(e.b, e.a)]);
    if (aExtra) return extraordinary(e.a, e.b);
    if (bExtra) return extraordinary(e.b, e.a);
    const opposites = e.sides.map(s => opposite(mesh, s.face, e.a, e.b));
    const outer: number[] = [];
    e.sides.forEach((side, i) => {
      for (const endpoint of [e.a, e.b]) {
        const across = t.edges[t.edgeIndex.get(edgeKey(endpoint, opposites[i]))!];
        const other = across.sides.find(s => s.face !== side.face)!;
        outer.push(opposite(mesh, other.face, endpoint, opposites[i]));
      }
    });
    return weighted([points[e.a], points[e.b], ...opposites.map(v => points[v]), ...outer.map(v => points[v])], [1 / 2, 1 / 2, 1 / 8, 1 / 8, -1 / 16, -1 / 16, -1 / 16, -1 / 16]);
  });
  return refineTriangles(mesh, t, points.map(copyPoint), edgePoints);
}

/** Doo–Sabin creates one point per face corner, then face-, edge-, and vertex-faces.
 * For an n-gon: alpha_0=(n+5)/(4n), alpha_j=(3+2cos(2πj/n))/(4n).
 * On a quad these weights are 9/16, 3/16, 1/16, 3/16.
 */
export function dooSabin(mesh: Mesh): Mesh {
  const t = topology(mesh), vertices: Vec3[] = [], faces: number[][] = [];
  const cornerIds = mesh.faces.map(face => face.map((_, i) => {
    const n = face.length;
    const weights = face.map((_, j) => i === j ? (n + 5) / (4 * n) : (3 + 2 * Math.cos(2 * Math.PI * (i - j) / n)) / (4 * n));
    const id = vertices.length;
    vertices.push(weighted(face.map(v => mesh.vertices[v]), weights));
    return id;
  }));
  faces.push(...cornerIds.map(face => [...face]));
  for (const edge of t.edges) {
    const [s, r] = edge.sides;
    const left = cornerIds[s.face], right = cornerIds[r.face];
    faces.push([left[(s.index + 1) % left.length], left[s.index], right[(r.index + 1) % right.length], right[r.index]]);
  }
  for (const ring of t.rings) faces.push(ring.map(c => cornerIds[c.face][c.index]));
  return { vertices, faces };
}

/** Level is deliberately bounded for a responsive teaching demo. Inputs are never mutated. */
export function subdivide(mesh: Mesh, method: SubdivisionMethod, levels = 1): Mesh {
  if (!Number.isInteger(levels) || levels < 0 || levels > 4) throw new Error('Subdivision level must be an integer from 0 to 4.');
  const rules = { 'catmull-clark': catmullClark, loop: loopSubdivision, butterfly: modifiedButterfly, 'doo-sabin': dooSabin };
  if (!Object.hasOwn(rules, method)) throw new Error('Unknown subdivision method.');
  topology(mesh, method === 'loop' || method === 'butterfly');
  let result: Mesh = { vertices: mesh.vertices.map(copyPoint), faces: mesh.faces.map(face => [...face]) };
  for (let i = 0; i < levels; i++) result = rules[method](result);
  if (!result.vertices.every(p => p.every(Number.isFinite))) throw new Error('Subdivision produced non-finite coordinates.');
  return result;
}
