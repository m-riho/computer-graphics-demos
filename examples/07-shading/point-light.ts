// 入力値を変え、操作版と同じ共通関数で確かめる。
import { pointIlluminance } from '../../packages/cg-algorithms/src/shading-classic.ts'
export function runExample() {
  return [1,2,3].map(distance => ({distance, E:pointIlluminance(distance,0,1)}))
}
