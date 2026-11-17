// 入力値を変え、操作版と同じ共通関数で確かめる。
import { lambert, orenNayar } from '../../packages/cg-algorithms/src/shading-classic.ts'
export function runExample() {
  return [0,90,180].map(phi => ({phi, lambert:lambert(60), oren:orenNayar(60,60,phi,45)}))
}
