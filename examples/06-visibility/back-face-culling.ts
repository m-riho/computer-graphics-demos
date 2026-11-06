import { inspectCullingScene } from '../../packages/cg-algorithms/src/visibility-culling.ts'

export function runExample() {
  // 凹形状の側面のうち、表向きでも中心が他の面に遮られるものを探す。
  const faces = inspectCullingScene('concave', [-5, 0, 0], false)
  return faces.filter(face => face.orientation === 'front')
    .map(face => ({ face: face.id, dot: face.product, blocker: face.blocker }))
}
