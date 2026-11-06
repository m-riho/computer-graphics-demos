import type { Vec3 } from './matrix4.ts'

export interface Ray { origin: Vec3; direction: Vec3 }
export interface Sphere { center: Vec3; radius: number }
export interface RayHit { id: string; t: number }
export type TriangleVertices = [Vec3, Vec3, Vec3]

export function difference(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
export function dot(a: Vec3, b: Vec3): number {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
}
export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]]
}
export function unit(v: Vec3): Vec3 {
  const length = Math.hypot(...v)
  if (!Number.isFinite(length) || length === 0) throw new RangeError('方向には有限の非零ベクトルが必要です')
  return [v[0]/length, v[1]/length, v[2]/length]
}

/** 視点から視平面上の標本を通る単位レイ。正の t は視点からの距離。 */
export function primaryRay(origin: Vec3, sample: Vec3): Ray {
  return { origin, direction: unit(difference(sample, origin)) }
}

export function pointOnRay(ray: Ray, t: number): Vec3 {
  const [x, y, z] = ray.origin
  const [dx, dy, dz] = ray.direction
  return [x + t*dx, y + t*dy, z + t*dz]
}

/** |O+tD−C|²=r² を a t²+b t+c=0 に展開。背後の根も幾何学的候補として返す。 */
export function sphereIntersections(ray: Ray, sphere: Sphere) {
  const offset = difference(ray.origin, sphere.center)
  const a = dot(ray.direction, ray.direction)
  const b = 2 * dot(offset, ray.direction)
  const c = dot(offset, offset) - sphere.radius ** 2
  const discriminant = b*b - 4*a*c
  const roots: number[] = []
  if (discriminant >= 0) {
    const root = Math.sqrt(discriminant)
    roots.push((-b - root) / (2*a))
    if (root > 0) roots.push((-b + root) / (2*a))
  }
  return { a, b, c, discriminant, roots }
}

/** P=O+tD=A+u(B−A)+v(C−A) を外積・内積で解く。両面を対象にする。 */
export function triangleIntersection(ray: Ray, [a, b, c]: TriangleVertices, tolerance = 1e-10) {
  const ab = difference(b, a)
  const ac = difference(c, a)
  const p = cross(ray.direction, ac)
  const determinant = dot(ab, p)
  if (Math.abs(determinant) <= tolerance) return null
  const offset = difference(ray.origin, a)
  const q = cross(offset, ab)
  const u = dot(offset, p) / determinant
  const v = dot(ray.direction, q) / determinant
  const weights: Vec3 = [1 - u - v, u, v]
  // 行列式と同じ尺度で境界を判定する。+z の単位レイなら投影三角形の辺値に一致する。
  const signedEdges = weights.map(weight => weight * Math.abs(determinant))
  if (signedEdges.some(edge => edge < -tolerance)) return null
  const onBoundary = signedEdges.some(edge => Math.abs(edge) <= tolerance)
  // O→交点 = A−O + u AB + v AC を D に射影。定深度の面では z を正確に保てる。
  const t = (u*dot(ab, ray.direction) + v*dot(ac, ray.direction) - dot(offset, ray.direction))
    / dot(ray.direction, ray.direction)
  return { t, weights, onBoundary }
}

/** 背後 (t<0) と始点 (t=0) を除外し、同距離では最初の物体を保つ。 */
export function nearestPositiveHit(hits: RayHit[]): RayHit | null {
  let nearest: RayHit | null = null
  for (const hit of hits) {
    if (hit.t > 0 && Number.isFinite(hit.t) && (!nearest || hit.t < nearest.t)) nearest = hit
  }
  return nearest
}
