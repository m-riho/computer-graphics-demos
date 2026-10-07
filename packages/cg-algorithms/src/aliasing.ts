import { clamp, finiteOr } from './number.ts'
/** 有限線分が画素を覆う割合。AA時は画素内4×4点を平均する。 */
export function lineCoverage(x: number, y: number, resolution: number,
  angle: number, antialias: boolean): number {
  if (![x, y].every(Number.isFinite)) return 0
  const n = Math.round(clamp(finiteOr(resolution, 20), 1, 512))
  const radians = finiteOr(angle, 0) * Math.PI / 180
  const dx = Math.cos(radians), dy = Math.sin(radians), halfLength = n * 0.43
  const steps = antialias ? 4 : 1
  let hits = 0
  for (let sy = 0; sy < steps; sy++) {
    for (let sx = 0; sx < steps; sx++) {
      const px = x + (sx + 0.5) / steps - n / 2
      const py = y + (sy + 0.5) / steps - n / 2
      if (Math.abs(px * dx + py * dy) <= halfLength
        && Math.abs(-px * dy + py * dx) <= 0.65) hits++
    }
  }
  return hits / (steps * steps)
}
