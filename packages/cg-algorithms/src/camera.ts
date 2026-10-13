import { multiplyMatrix4, type Matrix4, type Vec3 } from './matrix4.ts'
import { translationMatrix, rotationXMatrix, rotationYMatrix } from './transforms3d.ts'

/** カメラの姿勢（カメラ座標→ワールド座標）。C = T Ry(yaw) Rx(pitch)。
 * yaw/pitchは度。カメラ自身の前方は -Z。ビュー行列とは向きが逆。
 */
export function cameraMatrix(position: Vec3, yaw = 0, pitch = 0): Matrix4 {
  if (position.length !== 3 || !Array.from(position).every(Number.isFinite)) {
    throw new RangeError('カメラ位置は有限な数3個で指定します')
  }
  return multiplyMatrix4(translationMatrix(...position), multiplyMatrix4(rotationYMatrix(yaw), rotationXMatrix(pitch)))
}

/** 剛体変換だけの逆行列：[R t; 0 1]⁻¹ = [Rᵀ -Rᵀt; 0 1]。
 * Rの列は単位長で互いに直交することが必要。拡縮・せん断・透視行列は対象外。
 */
export function inverseRigidTransform(matrix: Matrix4): Matrix4 {
  if (matrix.length !== 16 || !Array.from(matrix).every(Number.isFinite)) {
    throw new RangeError('4×4行列は有限な数16個で指定します')
  }
  const tolerance = 1e-8
  if (Math.abs(matrix[12]) > tolerance || Math.abs(matrix[13]) > tolerance
    || Math.abs(matrix[14]) > tolerance || Math.abs(matrix[15] - 1) > tolerance) {
    throw new RangeError('逆変換には剛体変換行列を指定します')
  }
  for (let a = 0; a < 3; a++) {
    for (let b = 0; b < 3; b++) {
      const dot = matrix[a] * matrix[b] + matrix[4 + a] * matrix[4 + b] + matrix[8 + a] * matrix[8 + b]
      if (Math.abs(dot - (a === b ? 1 : 0)) > tolerance) throw new RangeError('回転部分は正規直交行列である必要があります')
    }
  }
  const [tx, ty, tz] = [matrix[3], matrix[7], matrix[11]]
  const result: Matrix4 = [
    matrix[0], matrix[4], matrix[8], -(matrix[0] * tx + matrix[4] * ty + matrix[8] * tz),
    matrix[1], matrix[5], matrix[9], -(matrix[1] * tx + matrix[5] * ty + matrix[9] * tz),
    matrix[2], matrix[6], matrix[10], -(matrix[2] * tx + matrix[6] * ty + matrix[10] * tz),
    0, 0, 0, 1,
  ]
  if (!result.every(Number.isFinite)) throw new RangeError('逆変換結果が数値の範囲を超えています')
  return result
}

/** ワールド座標→カメラ座標。カメラ姿勢 C の逆変換 V=C⁻¹。 */
export function viewMatrix(position: Vec3, yaw = 0, pitch = 0): Matrix4 {
  return inverseRigidTransform(cameraMatrix(position, yaw, pitch))
}
