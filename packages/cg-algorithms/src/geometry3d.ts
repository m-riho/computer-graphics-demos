import { transformPoint, type Matrix4, type Vec2, type Vec3 } from './matrix4.ts'
import { inverseRigidTransform } from './camera.ts'
import { projectPerspective, viewportTransform } from './projection.ts'
import { projectOblique } from './oblique-projection.ts'

/** 原点中心。先に z=-h 面の4頂点、次に対応する z=+h 面の4頂点。 */
export function cubeVertices(size = 2): Vec3[] {
  if (!Number.isFinite(size) || size <= 0) throw new RangeError('立方体の一辺は正の有限値で指定します')
  const h = size / 2
  return [[-h,-h,-h], [h,-h,-h], [h,h,-h], [-h,h,-h], [-h,-h,h], [h,-h,h], [h,h,h], [-h,h,h]]
}

export const cubeEdges: [number, number][] = [
  [0,1], [1,2], [2,3], [3,0], [4,5], [5,6], [6,7], [7,4], [0,4], [1,5], [2,6], [3,7],
]

/** 座標系や立体の説明図用。カメラによる実際の見え方とは区別して使う。 */
export function projectDiagram(point: Vec3): Vec2 {
  return projectOblique(point, 35, 0.45)
}

/** 各段階の値を保持し、選んだ頂点を追跡する。camera は姿勢 C、ビューは C⁻¹。
 * projected はNDC、screen は左上原点の連続座標。近接面より手前なら両方 null。
 */
export function coordinatePipeline(point: Vec3, model: Matrix4, camera: Matrix4, fov = 60, width = 640, height = 400): {
  local: Vec3; world: Vec3; camera: Vec3; projected: Vec2 | null; screen: Vec2 | null
} {
  if (![width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    throw new RangeError('画面寸法は正の有限値で指定します')
  }
  const local: Vec3 = [...point]
  const world = transformPoint(model, local)
  const cameraPoint = transformPoint(inverseRigidTransform(camera), world)
  const projected = projectPerspective(cameraPoint, fov, width / height)
  const screen = projected === null ? null : viewportTransform(projected, width, height)
  return { local, world, camera: cameraPoint, projected, screen }
}
