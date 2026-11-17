// 入力値を変え、操作版と同じ共通関数で確かめる。
import { lambert } from '../../packages/cg-algorithms/src/shading-classic.ts'
export function runExample() {
  const kd=1, intensity=1
  return [0,60,90,120].map(angle => ({angle, diffuse:lambert(angle,kd,intensity)}))
}
