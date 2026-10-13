import { projectPerspective } from '../../packages/cg-algorithms/src/projection.ts'
import type { Vec3 } from '../../packages/cg-algorithms/src/matrix4.ts'

export function runExample() {
  // カメラは原点にあり -Z を見る。点の奥行きは d = -z = 4。
  const point: Vec3 = [2, 1, -4]
  const fovDegrees = 90
  const aspect = 1
  const near = 0.1

  // FOV=90°なら f=1。X=x/d、Y=y/d になる。
  const projected = projectPerspective(point, fovDegrees, aspect, near)
  const depth = -point[2]

  // 視点そのもの (z=0) は割り算できないので、安全に null を返す。
  const atCamera: Vec3 = [2, 1, 0]
  const invalidProjection = projectPerspective(atCamera, fovDegrees, aspect, near)

  // X=0.5、Y=0.25。Yは上向き。画面に描く時だけYの符号を反転する。
  return { point, depth, projected, invalidProjection }
}
