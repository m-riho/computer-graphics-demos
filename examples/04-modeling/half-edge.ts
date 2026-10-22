import { cubeMesh } from '../../packages/cg-algorithms/src/mesh.ts'
import { buildHalfEdges, faceLoop, vertexLoop } from '../../packages/cg-algorithms/src/half-edge.ts'

/** origin = 始点。反対側の向きは twin でたどる。 */
export function runExample() {
  const edges = buildHalfEdges(cubeMesh())
  const start = 4
  const selected = edges[start]

  // next: 同じ面の次の辺。twin: 隣の面の逆向きの辺。
  const next = edges[selected.next]
  const twin = edges[selected.twin]
  // faceLoop は next を繰り返す。
  // vertexLoop は twin → next を繰り返す（閉じた向き付き多様体）。
  return {
    selected, next, twin,
    faceBoundary: faceLoop(edges, start),
    aroundOrigin: vertexLoop(edges, start),
  }
}
