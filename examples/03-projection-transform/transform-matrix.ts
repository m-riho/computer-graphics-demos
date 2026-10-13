import {transformPoint, type Vec3} from '../../packages/cg-algorithms/src/matrix4.ts'
import {
  translationMatrix, scaleMatrix,
  rotationXMatrix, rotationYMatrix, rotationZMatrix,
} from '../../packages/cg-algorithms/src/transforms3d.ts'

// 右手系・列ベクトル。平行移動も同次座標 (x,y,z,1) で計算する。
export function runExample() {
  const point: Vec3 = [1, 1, 1]
  const transforms = [
    {name:'Translation', matrix:translationMatrix(2, 0, 0)},
    {name:'Scale', matrix:scaleMatrix(2, 1, .5)},
    {name:'Rotation X', matrix:rotationXMatrix(90)},
    {name:'Rotation Y', matrix:rotationYMatrix(90)},
    {name:'Rotation Z', matrix:rotationZMatrix(90)},
  ]
  // transformPointは点に同次成分1を補い、4×4行列を掛ける。
  return transforms.map(({name, matrix}) => ({
    name, before:point, matrix,
    after:transformPoint(matrix, point),
  }))
}
