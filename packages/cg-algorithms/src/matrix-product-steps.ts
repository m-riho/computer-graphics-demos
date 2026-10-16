/** Teaching trace: each output is the dot product of one left row and one right column. */
export type MatrixProductEntry = {
  row: number
  column: number
  terms: { left: number; right: number; product: number }[]
  sum: number
}
export function matrixProductTrace(left: readonly (readonly number[])[], right: readonly (readonly number[])[]): MatrixProductEntry[] {
  const n = left.length
  const columns = right[0]?.length ?? 0
  if (n < 2 || n > 4 || right.length !== n || columns < 1 || columns > 4
    || !Array.from(left).every(row => Array.isArray(row) && row.length === n && Array.from(row).every(Number.isFinite))
    || !Array.from(right).every(row => Array.isArray(row) && row.length === columns && Array.from(row).every(Number.isFinite))) {
    throw new RangeError('左は2〜4次の正方行列、右は同じ行数の有限な数の行列で指定します')
  }
  const entries: MatrixProductEntry[] = []
  for (let row = 0; row < n; row++) {
    for (let column = 0; column < columns; column++) {
      const terms = left[row].map((value, k) => ({ left: value, right: right[k][column], product: value * right[k][column] }))
      const sum = terms.reduce((total, term) => total + term.product, 0)
      if (!Number.isFinite(sum) || terms.some(term => !Number.isFinite(term.product))) throw new RangeError('計算結果が数値の範囲を超えています')
      entries.push({ row, column, terms, sum })
    }
  }
  return entries
}
/** For each output: select the row/column, reveal n products, then commit the sum. */
export function matrixProductFrame(entries: readonly MatrixProductEntry[], cursor: number) {
  if (!entries.length) throw new RangeError('計算過程が必要です')
  const n = entries[0].terms.length
  const phases = n + 2
  const lastCursor = entries.length * phases
  const at = Math.min(lastCursor, Math.max(0, Math.floor(Number.isFinite(cursor) ? cursor : 0)))
  const done = at === lastCursor
  const entry = Math.min(entries.length - 1, Math.floor(at / phases))
  const phase = done ? n + 1 : at % phases
  return { entry, visibleTerms: Math.min(n, phase), committed: done ? entries.length : entry + (phase === n + 1 ? 1 : 0), done, lastCursor }
}
