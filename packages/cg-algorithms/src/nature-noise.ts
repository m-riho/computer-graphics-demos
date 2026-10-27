/** 第5回 Python / 教員Notebook と一致する 2D Perlin Noise。
 * NumPy RandomState(uint32 seed) の MT19937 と rk_interval によるshuffleを使用。
 * 8方向の単位勾配（対角も長さ1）。Improved Noiseの3D勾配集合とは異なる。
 */
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback
const clamp = (value: number, lo: number, hi: number, fallback: number) => Math.max(lo, Math.min(hi, finite(value, fallback)))
export const noiseFade = (t: number) => t * t * t * (t * (6 * t - 15) + 10)
export const noiseLerp = (a: number, b: number, t: number) => a + t * (b - a)
/** 表示時の線形変換。fieldごとの最小最大再正規化ではない。 */
export const noiseToGray = (signed: number) => (signed + 1) / 2

function numpyPermutation(seed: number): number[] {
  const state = new Uint32Array(624); state[0] = finite(seed) >>> 0
  for (let i = 1; i < 624; i++) state[i] = (Math.imul(1812433253, state[i - 1] ^ (state[i - 1] >>> 30)) + i) >>> 0
  let index = 624
  function nextUint32() {
    if (index >= 624) {
      for (let i = 0; i < 624; i++) {
        const y = (state[i] & 0x80000000) | (state[(i + 1) % 624] & 0x7fffffff)
        state[i] = state[(i + 397) % 624] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0)
      }
      index = 0
    }
    let y = state[index++]; y ^= y >>> 11; y ^= (y << 7) & 0x9d2c5680; y ^= (y << 15) & 0xefc60000; y ^= y >>> 18
    return y >>> 0
  }
  // NumPy legacy shuffle samples a masked integer, rejecting values above i.
  const permutation = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    let mask = i; mask |= mask >>> 1; mask |= mask >>> 2; mask |= mask >>> 4; mask |= mask >>> 8; mask |= mask >>> 16
    let j: number; do { j = nextUint32() & mask } while (j > i)
    ;[permutation[i], permutation[j]] = [permutation[j], permutation[i]]
  }
  return [...permutation, ...permutation]
}
export type NoiseVector = [number, number]
const diagonal = Math.SQRT1_2
const gradients: NoiseVector[] = [[diagonal, diagonal], [-diagonal, diagonal], [diagonal, -diagonal], [-diagonal, -diagonal], [1, 0], [-1, 0], [0, 1], [0, -1]]
export class Perlin2D {
  readonly permutation: number[]
  constructor(seed = 0) { this.permutation = numpyPermutation(seed) }
  gradient(ix: number, iy: number): NoiseVector {
    const x = ((Math.floor(finite(ix)) % 256) + 256) % 256, y = ((Math.floor(finite(iy)) % 256) + 256) % 256
    return gradients[this.permutation[this.permutation[x] + y] % 8]
  }
  details(x: number, y: number) {
    x = finite(x); y = finite(y)
    const x0 = Math.floor(x), y0 = Math.floor(y), s = x - x0, t = y - y0
    const corners: NoiseVector[] = [[0, 0], [1, 0], [0, 1], [1, 1]]
    const gs = corners.map(([a, b]) => this.gradient(x0 + a, y0 + b))
    const displacements = corners.map(([a, b]) => [s - a, t - b] as NoiseVector)
    const dots = gs.map((g, i) => g[0] * displacements[i][0] + g[1] * displacements[i][1])
    const u = noiseFade(s), v = noiseFade(t), lower = noiseLerp(dots[0], dots[1], u), upper = noiseLerp(dots[2], dots[3], u)
    return { cell: [x0, y0] as NoiseVector, local: [s, t] as NoiseVector, gradients: gs, displacements, dots, weights: [u, v] as NoiseVector, rows: [lower, upper] as NoiseVector, value: noiseLerp(lower, upper, v) }
  }
  sample(x: number, y: number): number { return this.details(x, y).value }
  /** 振幅和で割った符号付き値を返す。gray変換は足し合わせた後に1回だけ。 */
  fractal(x: number, y: number, octaves = 6, persistence = .5, lacunarity = 2): number {
    let total = 0, weight = 0, amplitude = 1, frequency = 1
    for (let i = 0; i < Math.floor(clamp(octaves, 1, 8, 6)); i++) {
      total += amplitude * this.sample(x * frequency, y * frequency); weight += amplitude
      amplitude *= clamp(persistence, 0, 1, .5); frequency *= clamp(lacunarity, 1, 4, 2)
    }
    return total / weight
  }
  /** 値ノイズ: 格子点の乱数値を補間。勾配との内積は使わない。 */
  valueNoise(x: number, y: number): number {
    x = finite(x); y = finite(y)
    const ix = Math.floor(x), iy = Math.floor(y), u = noiseFade(x - ix), v = noiseFade(y - iy)
    const at = (a: number, b: number) => this.permutation[this.permutation[((a % 256) + 256) % 256] + ((b % 256) + 256) % 256] / 255 * 2 - 1
    return noiseLerp(noiseLerp(at(ix, iy), at(ix + 1, iy), u), noiseLerp(at(ix, iy + 1), at(ix + 1, iy + 1), u), v)
  }
}
/** 画素ごとの独立な乱数比較用。座標をhashするので描画順で値が変化しない。 */
export function independentNoise(x: number, y: number, seed: number): number {
  let h = Math.imul(Math.floor(x), 374761393) ^ Math.imul(Math.floor(y), 668265263) ^ (seed >>> 0)
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16
  return (h >>> 0) / 4294967295 * 2 - 1
}
