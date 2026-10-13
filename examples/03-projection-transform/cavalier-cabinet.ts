import { projectOblique } from '../../packages/cg-algorithms/src/oblique-projection.ts'
import type { Vec3 } from '../../packages/cg-algorithms/src/matrix4.ts'

export function runExample() {
  // 手前から奥へ向かう長さ2の辺。+z が奥へ向かう。
  const front: Vec3 = [1, 1, 0]
  const back: Vec3 = [1, 1, 2]
  const angleDegrees = 45

  // 授業での代表例。角度などの慣習には幅がある。
  const cavalierScale = 1
  const cabinetScale = 0.5
  const cavalier = [
    projectOblique(front, angleDegrees, cavalierScale),
    projectOblique(back, angleDegrees, cavalierScale),
  ]
  const cabinet = [
    projectOblique(front, angleDegrees, cabinetScale),
    projectOblique(back, angleDegrees, cabinetScale),
  ]

  // 正面の位置は同じ。Cabinetでは奥行き方向へのずれが半分になる。
  return { angleDegrees, cavalierScale, cabinetScale, cavalier, cabinet }
}
