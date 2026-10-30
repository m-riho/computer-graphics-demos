/** 同じ符号付き2Dノイズを、山岳の高さと雲の不透明度へ変換する教材。 */
import { Perlin2D, noiseToGray } from './nature-noise.ts'
import type { Mesh } from './mesh.ts'
export type NoiseField = { width: number; height: number; values: number[] }
export type NoiseFieldOptions = { width: number; height: number; seed: number; frequency: number; octaves: number; persistence: number; lacunarity: number }
function dimensions(width: number, height: number) {
  if (![width, height].every(n => Number.isInteger(n) && n >= 2 && n <= 256)) throw new RangeError('Grid dimensions must be integers from 2 to 256')
}
function validate(field: NoiseField) {
  dimensions(field.width, field.height)
  if (field.values.length !== field.width * field.height || !field.values.every(Number.isFinite)) throw new RangeError('Invalid noise field')
}
/** 横4:縦3の領域。符号付きのまま重ね、振幅和で割る。 */
export function sampleNoiseField(options: NoiseFieldOptions): NoiseField {
  const { width, height, seed, frequency, octaves, persistence, lacunarity } = options
  dimensions(width, height)
  if (!Number.isFinite(frequency) || frequency < 0 || frequency > 12) throw new RangeError('Frequency must be from 0 to 12')
  const noise = new Perlin2D(seed)
  const values = Array.from({ length: width * height }, (_, i) => noise.fractal(
    (i % width) / (width - 1) * frequency,
    Math.floor(i / width) / (height - 1) * frequency * .75,
    octaves, persistence, lacunarity,
  ))
  return { width, height, values }
}
/** XZ平面の格子を三角形でつなぎ、Y = amplitude × N とする。 */
export function noiseTerrain(field: NoiseField, amplitude = 2.5): Mesh {
  validate(field)
  if (!Number.isFinite(amplitude) || amplitude < 0 || amplitude > 5) throw new RangeError('Amplitude must be from 0 to 5')
  const { width, height, values } = field
  const vertices: Mesh['vertices'] = values.map((n, i) => [
    (i % width) / (width - 1) * 2 - 1,
    amplitude * n,
    Math.floor(i / width) / (height - 1) * 1.5 - .75,
  ])
  const faces: Mesh['faces'] = []
  for (let z = 0; z < height - 1; z++) for (let x = 0; x < width - 1; x++) {
    const a = z * width + x, b = a + 1, c = a + width, d = c + 1
    faces.push([a, c, b], [b, c, d])
  }
  return { vertices, faces }
}
/** 白い雲のRGBA画像。青空との合成は描画側で行う。体積・流体の計算ではない。 */
export function noiseClouds(field: NoiseField, threshold = .43, softness = .2): Uint8ClampedArray {
  validate(field)
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1 || !Number.isFinite(softness) || softness <= 0 || softness > 1) throw new RangeError('Invalid cloud threshold or softness')
  const pixels = new Uint8ClampedArray(field.values.length * 4)
  field.values.forEach((n, i) => {
    const gray = noiseToGray(n)
    const t = Math.max(0, Math.min(1, (gray - threshold) / softness))
    const alpha = t * t * (3 - 2 * t) // smoothstep: 雲の縁を滑らかにする
    pixels.set([255, 255, 255, Math.round(255 * alpha)], i * 4)
  })
  return pixels
}
