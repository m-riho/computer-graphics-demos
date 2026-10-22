import { cubeMesh, meshAdjacency } from '../../packages/cg-algorithms/src/mesh.ts'

/** Geometry を変えても、Topology は変えずに保てる。 */
export function runExample() {
  const mesh = cubeMesh()
  const vertex = 6
  const before = [...mesh.vertices[vertex]]
  const adjacency = meshAdjacency(mesh)

  // 頂点の位置だけを変える。face の頂点番号列には触れない。
  mesh.vertices[vertex][0] += 0.5
  const after = mesh.vertices[vertex]
  const afterAdjacency = meshAdjacency(mesh)
  return {
    vertex, before, after,
    connectedEdges: adjacency.vertexEdges[vertex],
    adjacentFaces: adjacency.vertexFaces[vertex],
    topologyUnchanged: JSON.stringify(adjacency) === JSON.stringify(afterAdjacency),
  }
}
