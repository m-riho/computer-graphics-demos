import type { Vec2, Vec3 } from './matrix4.ts'
import { cross, difference, dot, nearestPositiveHit, primaryRay, triangleIntersection, unit, type RayHit } from './visibility-rays.ts'

export type CullingShape = 'convex' | 'concave' | 'multiple'

/** 法線は頂点順、視線は面の中心→視点で定義する。 */
export function classifyFace(vertices: Vec3[], eye: Vec3) {
  const [a, b, c] = vertices
  const normal = unit(cross(difference(b, a), difference(c, a)))
  const center: Vec3 = [0, 0, 0]
  for (const p of vertices) {
    center[0] += p[0] / vertices.length
    center[1] += p[1] / vertices.length
    center[2] += p[2] / vertices.length
  }
  const view = difference(eye, center)
  const product = dot(normal, view)
  const orientation = Math.abs(product) < 1e-9 ? 'edge' : product > 0 ? 'front' : 'back'
  return { normal, center, view, product, orientation }
}

/** 下記の反時計回りの輪郭を z=−1〜+1 に押し出した閉じた柱体を見る。 */
export function cullingSections(shape: CullingShape): Vec2[][] {
  if (shape === 'concave') return [[[-2,-1.3],[2,-1.3],[2,1.3],[0.7,1.3],[0.7,-0.6],[-0.7,-0.6],[-0.7,1.3],[-2,1.3]]]
  if (shape === 'multiple') return [
    [[-2,-0.9],[-1,-0.9],[-1,0.9],[-2,0.9]],
    [[0.6,-1.3],[2,-1.3],[2,1.3],[0.6,1.3]],
  ]
  return [[[-1.4,-1.2],[1.4,-1.2],[1.4,1.2],[-1.4,1.2]]]
}

/** 断面を通るレイで各側面の中心を調べる。蓋 (z=±1) はこのレイと交差しない。 */
export function inspectCullingScene(shape: CullingShape, eye: Vec3, reverse: boolean) {
  const walls = cullingSections(shape).flatMap((loop, object) => loop.map(([ax, ay], i) => {
    const [bx, by] = loop[(i + 1) % loop.length]
    const vertices: Vec3[] = [[ax,ay,-1],[bx,by,-1],[bx,by,1],[ax,ay,1]]
    if (reverse) vertices.reverse()
    return { id: String.fromCharCode(65 + object) + (i + 1), vertices, ...classifyFace(vertices, eye) }
  }))
  return walls.map(wall => {
    const ray = primaryRay(eye, wall.center)
    const distance = Math.hypot(...wall.view)
    const hits: RayHit[] = []
    for (const other of walls) {
      if (other === wall) continue
      const [a, b, c, d] = other.vertices
      const hit = triangleIntersection(ray, [a,b,c]) ?? triangleIntersection(ray, [a,c,d])
      if (hit && hit.t < distance - 1e-9) hits.push({ id: other.id, t: hit.t })
    }
    return { ...wall, blocker: nearestPositiveHit(hits)?.id ?? null }
  })
}
