import { matrixProductTrace } from '../../packages/cg-algorithms/src/matrix-product-steps.ts'

// 結果の各成分は「左の行」と「右の列」の内積です。
// ベクトルも、列が1本だけの行列として計算します。
export function runExample() {
  const A = [[1, 2], [3, 4]]
  const p = [[2], [1]]
  const vector2 = matrixProductTrace(A, p)
  // 1行目: 1×2 + 2×1 = 4、2行目: 3×2 + 4×1 = 10

  const R = [[0, -1, 0], [1, 0, 0], [0, 0, 1]]
  const rotation3 = matrixProductTrace(R, [[1], [2], [3]])

  const T = [[1, 0, 0, 3], [0, 1, 0, -1], [0, 0, 1, 2], [0, 0, 0, 1]]
  const point = matrixProductTrace(T, [[1], [2], [3], [1]])
  const direction = matrixProductTrace(T, [[1], [2], [3], [0]])
  // w=0の方向には、第4列の移動量が足されません。

  const matrix2 = matrixProductTrace([[1, 2], [0, 1]], [[2, 0], [1, 1]])
  const matrix3 = matrixProductTrace(
    [[1, 2, 0], [0, 1, 1], [2, 0, 1]],
    [[2, 0, 1], [1, 1, 0], [0, 2, 1]],
  )
  // 4×4の合成TR：右側の回転Rから、左側の平行移動Tへ。
  const R4 = [[0, -1, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  const matrix4 = matrixProductTrace(T, R4)
  return {
    vector2: { result: vector2.map(entry => entry.sum), steps: vector2 },
    rotation3: rotation3.map(entry => entry.sum),
    translatedPoint: point.map(entry => entry.sum),
    unchangedDirection: direction.map(entry => entry.sum),
    matrix3: matrix3.map(entry => ({ row: entry.row + 1, column: entry.column + 1, value: entry.sum })),
    matrix4: matrix4.map(entry => ({ row: entry.row + 1, column: entry.column + 1, value: entry.sum })),
    matrix2: matrix2.map(entry => ({ row: entry.row + 1, column: entry.column + 1, value: entry.sum })),
  }
}
