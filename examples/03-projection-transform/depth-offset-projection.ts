import { projectOblique } from '../../packages/cg-algorithms/src/oblique-projection.ts'
import type { Vec3 } from '../../packages/cg-algorithms/src/matrix4.ts'

export function runExample() {
  const angleDegrees = 45
  const depthScale = 0.5
  // 同じ正方形を z=0 と z=2 に置く。+z は奥の面へ向かう。
  const front: Vec3[] = [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0]]
  const back: Vec3[] = [[-1, -1, 2], [1, -1, 2], [1, 1, 2], [-1, 1, 2]]

  const front2D = front.map(point => projectOblique(point, angleDegrees, depthScale))
  const back2D = back.map(point => projectOblique(point, angleDegrees, depthScale))
  // 奥の各頂点は同じ方向に、同じ量だけずれる。
  const offsets = front2D.map((point, i) => [
    back2D[i][0] - point[0],
    back2D[i][1] - point[1],
  ])

  // Yは上向き。angleDegrees と depthScale を変えて結果を比べよう。
  // 奥の正方形は小さくならず、奥行きの辺は互いに平行になる。
  return { front2D, back2D, offsets }
}
