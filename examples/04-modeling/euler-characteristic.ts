import { cubeMesh } from '../../packages/cg-algorithms/src/mesh.ts'
import { eulerCharacteristic, splitEdge, splitFace, torusMesh } from '../../packages/cg-algorithms/src/euler-characteristic.ts'

/** V−E+F は分割後も同じ。全ての形状で2になるわけではない。 */
export function runExample() {
  const cube = cubeMesh()
  const edgeSplit = splitEdge(cube, 0)
  const faceSplit = splitFace(cube, 0)
  const torus = torusMesh()
  return {
    cube: eulerCharacteristic(cube),       // 8 − 12 + 6 = 2
    edgeSplit: eulerCharacteristic(edgeSplit), // 9 − 13 + 6 = 2
    faceSplit: eulerCharacteristic(faceSplit), // 8 − 13 + 7 = 2
    torus: eulerCharacteristic(torus),     // 穴が1つ: χ = 0
  }
  // edge split: ΔV = ΔE = 1、face split: ΔE = ΔF = 1。
  // 連結・閉じた向き付け可能な曲面では χ = 2 − 2g。
}
