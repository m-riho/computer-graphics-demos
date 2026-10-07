import { clamp, finiteOr } from './number.ts'
export type RGB = [number, number, number]
export type HSV = [number, number, number]

/** RGBは0〜255の符号値。表示用の16進表記へ変換する。 */
export function hex(rgb: RGB): string {
  return '#' + rgb.map(value => Math.round(clamp(value, 0, 255))
    .toString(16).padStart(2, '0')).join('').toUpperCase()
}
/** HSV: 色相0〜360度、彩度・明度0〜100%。Vは最大RGB成分。 */
export function hsvToRgb(hue: number, saturation: number, value: number): RGB {
  const h = ((finiteOr(hue, 0) % 360) + 360) % 360
  const s = clamp(saturation / 100), v = clamp(value / 100)
  const chroma = v * s
  const second = chroma * (1 - Math.abs((h / 60) % 2 - 1))
  const minimum = v - chroma
  const channels: RGB = h < 60 ? [chroma, second, 0]
    : h < 120 ? [second, chroma, 0] : h < 180 ? [0, chroma, second]
    : h < 240 ? [0, second, chroma] : h < 300 ? [second, 0, chroma]
    : [chroma, 0, second]
  return channels.map(channel => Math.round((channel + minimum) * 255)) as RGB
}
export function rgbToHsv(rgb: RGB): HSV {
  const [r, g, b] = rgb.map(value => clamp(value / 255))
  const maximum = Math.max(r, g, b), minimum = Math.min(r, g, b)
  const difference = maximum - minimum
  let hue = 0 // 無彩色の色相は未定義。操作上は0とする。
  if (difference > 0) {
    hue = 60 * (maximum === r ? ((g - b) / difference) % 6
      : maximum === g ? (b - r) / difference + 2 : (r - g) / difference + 4)
  }
  return [(hue + 360) % 360, maximum === 0 ? 0 : 100 * difference / maximum, 100 * maximum]
}
