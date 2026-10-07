import { sampleNearest } from '../../packages/cg-algorithms/src/index.ts'

// 横4画素の参照画像を横2画素へ再標本化します。
// それぞれの画素はR,G,B,αの順。階調の丸めはしません。
export function runExample() {
  const source = new Uint8ClampedArray([
    0, 0, 0, 255, 64, 64, 64, 255,
    128, 128, 128, 255, 255, 255, 255, 255,
  ])
  const result = sampleNearest(source, 4, 1, 2, 1)
  return { sourceRed: [0, 64, 128, 255], sampledRed: [result[0], result[4]] }
}
// 出力画素中心に最も近い参照画素を選びます。
// 前置フィルターなしの縮小ではエイリアシングが生じ得ます。
