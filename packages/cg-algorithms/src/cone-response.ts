import { finiteOr } from './number.ts'
/** 実測ではない模式モデル。S/M/Lの応答が広く重なることだけを説明する。 */
export function coneResponse(wavelength: number): [number, number, number] {
  const w = finiteOr(wavelength, 550)
  const gaussian = (peak: number, width: number): number =>
    Math.exp(-0.5 * ((w - peak) / width) ** 2)
  return [gaussian(440, 25), gaussian(535, 45), gaussian(565, 50)]
}
