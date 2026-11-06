import { sampleTriangle, VISIBILITY_EPSILON, type VisibilityScene } from './visibility-raster.ts'
import { nearestPositiveHit, triangleIntersection, type Ray, type RayHit } from './visibility-rays.ts'
import type { Vec2 } from './matrix4.ts'

/** 正投影では各画素中心から平行な +z レイが出る。交差の t は深度 z に等しい。 */
export function castVisibilitySample(scene: VisibilityScene, x: number, y: number) {
  const sample: Vec2 = [x + 0.5, y + 0.5]
  const ray: Ray = { origin: [...sample, 0], direction: [0, 0, 1] }
  const hits: RayHit[] = []
  for (const face of scene.triangles) {
    const hit = triangleIntersection(ray, face.vertices, VISIBILITY_EPSILON)
    if (!hit || hit.t <= scene.camera.near || hit.t > scene.camera.far) continue
    // 辺上に限り、ラスタ側と同じ左上規則で標本を片側に割り当てる。
    if (hit.onBoundary && !sampleTriangle(face.vertices, sample)?.covered) continue
    hits.push({ id: face.id, t: hit.t })
  }
  return { ray, hits, visible: nearestPositiveHit(hits) }
}
