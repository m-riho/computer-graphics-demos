// 入力値を変え、操作版と同じ共通関数で確かめる。
import { specularTerms } from '../../packages/cg-algorithms/src/shading-classic.ts'
export function runExample() {
  return [20,80].map(m => specularTerms(35,55,180,20,m,1,1))
}
