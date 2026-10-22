import { meshEdges } from '../../packages/cg-algorithms/src/mesh.ts';
import { subdivisionInput, subdivide, type SubdivisionMethod } from '../../packages/cg-algorithms/src/subdivision.ts';

/** Compare geometry while keeping the starting cage identical within each mesh family. */
export function runExample() {
  const methods: SubdivisionMethod[] = ['catmull-clark', 'loop', 'butterfly', 'doo-sabin'];
  const rows = methods.map(method => {
    // Catmull–Clark / Doo–Sabin: quad cube. Loop / Modified Butterfly: triangle octahedron.
    const input = subdivisionInput(method);
    const result = subdivide(input, method, 2);
    const originalPositionsKept = input.vertices.filter(p =>
      result.vertices.some(q => p.every((coordinate, axis) => Math.abs(coordinate - q[axis]) < 1e-10)),
    ).length;
    return {
      method,
      level: 2,
      vertices: result.vertices.length,
      edges: meshEdges(result).length,
      faces: result.faces.length,
      originalPositionsKept,
      originalVertices: input.vertices.length,
    };
  });
  console.table(rows);
  return rows;
}
