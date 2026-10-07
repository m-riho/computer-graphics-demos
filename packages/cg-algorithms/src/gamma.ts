import { clamp, finiteOr } from './number.ts'
const validGamma = (gamma: number): number => clamp(finiteOr(gamma, 2.2), 0.1, 10)
/** 教育上のべき乗モデル。sRGBそのものではない。 */
export const gammaEncode = (linear: number, gamma: number): number =>
  clamp(linear) ** (1 / validGamma(gamma))
export const gammaDecode = (code: number, gamma: number): number =>
  clamp(code) ** validGamma(gamma)
/** 実際のsRGBの区分伝達関数。表示用の0〜1へ変換する。 */
export function srgbEncode(linear: number): number {
  const value = clamp(linear)
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
}
export function simulateGamma(linear: number, gamma: number, corrected: boolean): number {
  const code = corrected ? gammaEncode(linear, gamma) : clamp(linear)
  return srgbEncode(gammaDecode(code, gamma))
}
