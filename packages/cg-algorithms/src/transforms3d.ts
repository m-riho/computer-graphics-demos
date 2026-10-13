import type { Matrix4 } from './matrix4.ts'

function checkFinite(...values: number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('変換パラメータは有限な数で指定します')
}

/** 列ベクトルなので移動量は最終列。最終行 (0,0,0,1) が同次座標を保つ。 */
export function translationMatrix(tx: number, ty: number, tz: number): Matrix4 {
  checkFinite(tx, ty, tz)
  return [1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1]
}

/** 0倍のつぶれや負の倍率による鏡映も、モデル変換として有効。 */
export function scaleMatrix(sx: number, sy: number, sz: number): Matrix4 {
  checkFinite(sx, sy, sz)
  return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1]
}

function sinCos(degrees: number): [number, number] {
  checkFinite(degrees)
  const radians = (degrees % 360) * Math.PI / 180
  return [Math.sin(radians), Math.cos(radians)]
}

/** 回転角の単位は度。正の向きは右手の法則（+Y が +Z へ）。 */
export function rotationXMatrix(degrees: number): Matrix4 {
  const [s, c] = sinCos(degrees)
  return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1]
}

/** 正のY回転は +Z を +X へ移す。 */
export function rotationYMatrix(degrees: number): Matrix4 {
  const [s, c] = sinCos(degrees)
  return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1]
}

/** 正のZ回転は +X を +Y へ移す。 */
export function rotationZMatrix(degrees: number): Matrix4 {
  const [s, c] = sinCos(degrees)
  return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}
