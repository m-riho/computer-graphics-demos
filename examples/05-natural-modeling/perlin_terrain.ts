/** 山岳：Perlinの重ね合わせを、格子のY座標にする。 */
import { sampleNoiseField, noiseTerrain } from '../../packages/cg-algorithms/src/nature-noise-applications.ts'

export function createMountain(seed = 0, amplitude = 2.5) {
  const field = sampleNoiseField({
    width: 49, height: 37, seed, frequency: 4,
    octaves: 4, persistence: .5, lacunarity: 2,
  })
  // 格子の位置(x,z) → N(x,z) → (x, amplitude*N, z)。
  // 1セルを2枚の三角形でつなぐ。返るMeshは描画・OBJ保存などに使える。
  return noiseTerrain(field, amplitude)
}
export function runExample() {
  const mesh = createMountain()
  const heights = mesh.vertices.map(v => v[1])
  return { vertices: mesh.vertices.length, triangles: mesh.faces.length,
    heightRange: [Math.min(...heights), Math.max(...heights)],
    firstVertices: mesh.vertices.slice(0, 5), firstTriangles: mesh.faces.slice(0, 4) }
}
