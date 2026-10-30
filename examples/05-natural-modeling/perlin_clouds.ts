/** 雲：Perlinの重ね合わせを、白い雲のアルファ値にする。 */
import { sampleNoiseField, noiseClouds } from '../../packages/cg-algorithms/src/nature-noise-applications.ts'

export function createClouds(seed = 0, threshold = .43, softness = .2) {
  const field = sampleNoiseField({
    width: 128, height: 96, seed, frequency: 4,
    octaves: 4, persistence: .5, lacunarity: 2,
  })
  // 符号付きNを(N+1)/2へ変換 → しきい値とsmoothstep → alpha。
  // thresholdを下げると雲が増え、softnessを上げると境界が柔らかくなる。
  return { width: field.width, height: field.height, rgba: noiseClouds(field, threshold, softness) }
}
// ブラウザでは、青い背景のCanvasへ次のように描ける。
// const cloud = createClouds()
// canvas.width = cloud.width; canvas.height = cloud.height
// canvas.style.background = '#237bc1'
// const image = context.createImageData(cloud.width, cloud.height)
// image.data.set(cloud.rgba); context.putImageData(image, 0, 0)
// これは2Dテクスチャ表現。3Dの体積雲や流体シミュレーションではない。
export function runExample() {
  const cloud = createClouds()
  const alphas = Array.from(cloud.rgba).filter((_, i) => i % 4 === 3)
  return { size: [cloud.width, cloud.height], alphaRange: [Math.min(...alphas), Math.max(...alphas)],
    meanAlpha: alphas.reduce((sum, alpha) => sum + alpha, 0) / alphas.length / 255,
    firstPixels: Array.from(cloud.rgba.slice(0, 20)) }
}
