import type { Vec2, Vec3 } from './matrix4.ts'

/** 正投影（平行投影の一種）。z によって大きさは変わらない。 */
export function projectParallel(point: Vec3, scale = 1): Vec2 {
  if (point.length !== 3 || ![...point, scale].every(Number.isFinite)) {
    throw new RangeError('投影の入力は有限な数で指定します')
  }
  const result: Vec2 = [point[0] * scale, point[1] * scale]
  if (!result.every(Number.isFinite)) throw new RangeError('投影結果が数値の範囲を超えています')
  return result
}

/** カメラ座標からNDCへ：前方 -Z、距離 d=-z、縦FOV（度）、aspect=幅/高さ。
 * X = x / (d tan(FOV/2) aspect), Y = y / (d tan(FOV/2))。
 * near 未満・背後・非有限の点は null。左右上下の画面外の点はそのまま返す。
 */
export function projectPerspective(point: Vec3, fovDegrees = 60, aspect = 1, near = 0.1): Vec2 | null {
  if (![fovDegrees, aspect, near].every(Number.isFinite)
    || fovDegrees <= 0 || fovDegrees >= 180 || aspect <= 0 || near <= 0) {
    throw new RangeError('FOVは0〜180度の間、aspectとnearは正の有限値で指定します')
  }
  if (point.length !== 3 || !Array.from(point).every(Number.isFinite)) return null
  const [x, y, z] = point
  const depth = -z
  if (depth < near) return null
  const focalScale = 1 / Math.tan(fovDegrees * Math.PI / 360)
  const result: Vec2 = [(x / depth) * focalScale / aspect, (y / depth) * focalScale]
  return result.every(Number.isFinite) ? result : null
}

/** NDCの[-1,+1]をビューポートの境界[0,幅]×[0,高さ]へ。画面Yは下向き。
 * ピクセルの整数インデックスではなく連続座標なので、右端は width になる。
 */
export function viewportTransform(point: Vec2, width: number, height: number): Vec2 {
  if (point.length !== 2 || ![...point, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    throw new RangeError('画面座標は有限値、画面寸法は正の有限値で指定します')
  }
  const result: Vec2 = [(point[0] + 1) * width / 2, (1 - point[1]) * height / 2]
  if (!result.every(Number.isFinite)) throw new RangeError('画面座標が数値の範囲を超えています')
  return result
}
