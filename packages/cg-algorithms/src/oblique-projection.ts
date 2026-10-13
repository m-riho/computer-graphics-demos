import type { Vec2, Vec3 } from './matrix4.ts'

/** 斜投影：正面xyを保ち、zを画面上の一定方向へのずれとして加える。
 * θ は度、数学の +Y は上。画面のY反転は viewportTransform 側で行う。
 * 授業の代表値は Cavalier: s=1、Cabinet: s=0.5。
 */
export function projectOblique(point: Vec3, thetaDegrees = 45, depthScale = 0.5): Vec2 {
  if (point.length !== 3 || ![...point, thetaDegrees, depthScale].every(Number.isFinite)) {
    throw new RangeError('斜投影の入力は有限な数で指定します')
  }
  const [x, y, z] = point
  const theta = (thetaDegrees % 360) * Math.PI / 180
  const result: Vec2 = [x + depthScale * z * Math.cos(theta), y + depthScale * z * Math.sin(theta)]
  if (!result.every(Number.isFinite)) throw new RangeError('投影結果が数値の範囲を超えています')
  return result
}
