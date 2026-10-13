import {multiplyMatrix4, transformPoint, type Vec3} from '../../packages/cg-algorithms/src/matrix4.ts'
import {translationMatrix, rotationYMatrix} from '../../packages/cg-algorithms/src/transforms3d.ts'
import {cameraMatrix, inverseRigidTransform} from '../../packages/cg-algorithms/src/camera.ts'
import {projectPerspective, viewportTransform} from '../../packages/cg-algorithms/src/projection.ts'

export function runExample() {
  const local: Vec3 = [1, 1, 1] // 立方体自身の座標
  const model = multiplyMatrix4(translationMatrix(1, 0, 0), rotationYMatrix(25))
  const world = transformPoint(model, local) // 物体をワールドへ配置

  const cameraPose = cameraMatrix([0, 0, 7])
  const view = inverseRigidTransform(cameraPose)
  const camera = transformPoint(view, world) // カメラを原点とする座標

  // カメラ前方は−Z。d=−z>0で透視除算し、NDCへ。
  const projected = projectPerspective(camera, 60, 640 / 400)
  // NDCのyは上向き、画面ピクセルのyは下向き。
  const screen = projected ? viewportTransform(projected, 640, 400) : null
  return {local, world, camera, projected, screen}
}
