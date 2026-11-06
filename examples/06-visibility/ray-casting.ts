import { primaryRay, sphereIntersections, triangleIntersection, nearestPositiveHit } from '../../packages/cg-algorithms/src/visibility-rays.ts'

export function runExample() {
  const ray = primaryRay([0, 0, 0], [1, 0, 0])
  const sphere = sphereIntersections(ray, { center: [5, 0, 0], radius: 2 })
  const triangle = triangleIntersection(ray, [[8, -2, -1], [8, 2, -1], [8, 0, 2]])
  const hits = sphere.roots.map(t => ({ id: '球', t }))
  if (triangle) hits.push({ id: '三角形', t: triangle.t })
  return { hits, visible: nearestPositiveHit(hits) }
}
