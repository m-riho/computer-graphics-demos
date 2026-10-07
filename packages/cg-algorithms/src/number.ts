/** 数値入力を安全な範囲へ。NaN は下限、無限大は対応する端へ寄せる。 */
export function clamp(value: number, min = 0, max = 1): number {
  return Number.isNaN(value) ? min : Math.min(max, Math.max(min, value))
}
export function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}
