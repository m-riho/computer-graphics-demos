import { fernPoints, fernTransform, FERN_TRANSFORMS } from '../../packages/cg-algorithms/src/nature-fractals.ts'

/** 確率に従って変換を選び、同じ点を繰り返し変換する。 */
export function runExample() {
  const count = 1000, seed = 42
  const points = fernPoints(count,seed)
  const frequencies = [0,0,0,0]
  for (const point of points) frequencies[point.transform]++
  // 2番目の変換: x'=.85x+.04y, y'=−.04x+.85y+1.6
  const transformed = fernTransform([1,2],1)
  return {
    count, seed,
    probabilities:FERN_TRANSFORMS.map(t=>t.probability),
    transformed,
    frequencies,
    firstFive:points.slice(0,5),
    interpretation:'同じ Seed は同じ変換選択・点列を再現する。最初の20点は除外。',
  }
}
