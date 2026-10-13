/** 第3回の共通規約：右手系、列ベクトル p' = M p。
 * 行列は row-major（行を順に並べた16要素）。保存順序と列ベクトルは別の概念。
 * M = T R は右側の R（回転）を先に、T（平行移動）を後に適用する。
 * カメラ前方は -Z、数学の +Y は上。画面の +Y は viewportTransform で下へ反転する。
 */
export type Vec3 = [number, number, number]
export type Vec2 = [number, number]
export type Matrix4 = number[]

function checkMatrix(matrix: Matrix4): void {
  if (matrix.length !== 16 || !Array.from(matrix).every(Number.isFinite)) {
    throw new RangeError('4×4行列は有限な数16個で指定します')
  }
}

export function identityMatrix(): Matrix4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}

/** a b を返す。点に作用させる順序は b → a。入力は変更しない。 */
export function multiplyMatrix4(a: Matrix4, b: Matrix4): Matrix4 {
  checkMatrix(a)
  checkMatrix(b)
  const result = Array<number>(16).fill(0)
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 4; column++) {
      for (let k = 0; k < 4; k++) {
        result[row * 4 + column] += a[row * 4 + k] * b[k * 4 + column]
      }
    }
  }
  checkMatrix(result)
  return result
}

/** 点 (x,y,z,1) を変換し、同次座標 w で割る。w=0 は無限遠なので返せない。 */
export function transformPoint(matrix: Matrix4, point: readonly [number, number, number]): Vec3 {
  checkMatrix(matrix)
  if (point.length !== 3 || !Array.from(point).every(Number.isFinite)) {
    throw new RangeError('3D点は有限な数3個で指定します')
  }
  const [x, y, z] = point
  const w = matrix[12] * x + matrix[13] * y + matrix[14] * z + matrix[15]
  if (!Number.isFinite(w) || w === 0) throw new RangeError('同次座標 w は有限かつ0以外である必要があります')
  const result: Vec3 = [
    (matrix[0] * x + matrix[1] * y + matrix[2] * z + matrix[3]) / w,
    (matrix[4] * x + matrix[5] * y + matrix[6] * z + matrix[7]) / w,
    (matrix[8] * x + matrix[9] * y + matrix[10] * z + matrix[11]) / w,
  ]
  if (!result.every(Number.isFinite)) throw new RangeError('変換結果が数値の範囲を超えています')
  return result
}
