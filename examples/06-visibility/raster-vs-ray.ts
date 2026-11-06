import { makeVisibilityScene, renderZBuffer } from '../../packages/cg-algorithms/src/visibility-raster.ts'
import { castVisibilitySample } from '../../packages/cg-algorithms/src/visibility-compare.ts'

export function runExample() {
  const scene = makeVisibilityScene('lecture')
  const x = 3, y = 2
  const raster = renderZBuffer(scene).color[y * scene.width + x]
  const ray = castVisibilitySample(scene, x, y)
  return { pixel: [x, y], raster, rayHits: ray.hits, ray: ray.visible?.id ?? null,
    match: raster === (ray.visible?.id ?? null) }
}
