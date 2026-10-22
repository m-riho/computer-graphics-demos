import { cubeMesh, meshEdges } from '../../packages/cg-algorithms/src/mesh.ts'

/** 同じ立方体を「記録している情報」の違いから見る。 */
export function runExample() {
  const mesh = cubeMesh()
  // Wireframe は位置と辺を記録する。
  const wireframe = { vertices: mesh.vertices.length, edges: meshEdges(mesh).length }
  // Surface は面の境界を、頂点番号の列として記録する。
  const surface = { ...wireframe, faces: mesh.faces.length }
  // Solid は内部を定義する。この立方体では解析的な不等式を使える。
  // 一般のメッシュを塗るだけでは内部は定義されない。
  const queries = [-1.4, 0.25, 1].map(x => ({
    point: [x, 0, 0],
    location: Math.abs(x) < 1 ? 'inside' : Math.abs(x) === 1 ? 'boundary' : 'outside',
  }))
  return { wireframe, surface, solidQueries: queries }
}
