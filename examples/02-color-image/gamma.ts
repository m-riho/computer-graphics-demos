import { gammaEncode, gammaDecode, srgbEncode } from '../../packages/cg-algorithms/src/index.ts'

// 仮想的な表示装置をL=E^gammaで表す、教育上の単純化です。
// 実際のsRGBの区分関数との違いも比較します。
export function runExample() {
  const gamma: number = 2.2
  const linearValues: number[] = [0, 0.003, 0.18, 0.5, 1]
  return linearValues.map(linear => {
    const code = gammaEncode(linear, gamma)
    const restored = gammaDecode(code, gamma)
    return { linear, code, restored, actualSrgb: srgbEncode(linear) }
  })
}
// エンコードと表示側の応答を組み合わせると元の輝度に戻ります。
// sRGBを単なるgamma=2.2と置き換えてはいけません。
