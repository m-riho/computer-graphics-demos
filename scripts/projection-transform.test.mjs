import test from 'node:test'
import assert from 'node:assert/strict'
import { identityMatrix, multiplyMatrix4, transformPoint } from '../packages/cg-algorithms/src/matrix4.ts'
import { translationMatrix, scaleMatrix, rotationXMatrix, rotationYMatrix, rotationZMatrix } from '../packages/cg-algorithms/src/transforms3d.ts'
import { projectParallel, projectPerspective, viewportTransform } from '../packages/cg-algorithms/src/projection.ts'
import { projectOblique } from '../packages/cg-algorithms/src/oblique-projection.ts'
import { cameraMatrix, inverseRigidTransform, viewMatrix } from '../packages/cg-algorithms/src/camera.ts'
import { cubeVertices, cubeEdges, coordinatePipeline, projectDiagram } from '../packages/cg-algorithms/src/geometry3d.ts'

const close = (actual, expected, tolerance = 1e-10) => {
  assert.equal(actual.length, expected.length)
  actual.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < tolerance, `${value} != ${expected[i]} at ${i}`))
}

test('identity, translation and nonuniform scale use column-vector homogeneous points', () => {
  close(transformPoint(identityMatrix(), [2, -3, 4]), [2, -3, 4])
  close(transformPoint(translationMatrix(3, -2, 5), [2, -3, 4]), [5, -5, 9])
  close(transformPoint(scaleMatrix(2, -3, 0), [2, -3, 4]), [4, 9, 0])
})
test('positive rotations follow the right-hand rule on every axis', () => {
  close(transformPoint(rotationXMatrix(90), [1, 2, 3]), [1, -3, 2])
  close(transformPoint(rotationYMatrix(90), [1, 2, 3]), [3, 2, -1])
  close(transformPoint(rotationZMatrix(90), [1, 2, 3]), [-2, 1, 3])
  close(transformPoint(rotationZMatrix(-90), [1, 2, 3]), [2, -1, 3])
})
test('TR and RT produce different positions for an offset rotation center', () => {
  const translation = translationMatrix(3, 0, 2)
  const rotation = rotationZMatrix(90)
  close(transformPoint(multiplyMatrix4(translation, rotation), [1, 0, 0]), [3, 1, 2])
  close(transformPoint(multiplyMatrix4(rotation, translation), [1, 0, 0]), [0, 4, 2])
  close(multiplyMatrix4(translationMatrix(1, 2, 3), scaleMatrix(2, 3, 4)), [2,0,0,1, 0,3,0,2, 0,0,4,3, 0,0,0,1])
})
test('transformPoint divides by homogeneous w and rejects points at infinity', () => {
  const matrix = identityMatrix(); matrix[15] = 2
  close(transformPoint(matrix, [2, 4, 6]), [1, 2, 3])
  matrix[15] = 0
  assert.throws(() => transformPoint(matrix, [2, 4, 6]), RangeError)
})
test('matrix operations reject malformed or nonfinite data rather than return NaN', () => {
  for (const bad of [[], Array(15).fill(0), Array(17).fill(0), Array(16), Array(16).fill(NaN)]) {
    assert.throws(() => multiplyMatrix4(bad, identityMatrix()), RangeError)
    assert.throws(() => multiplyMatrix4(identityMatrix(), bad), RangeError)
    assert.throws(() => transformPoint(bad, [0, 0, 0]), RangeError)
    assert.throws(() => inverseRigidTransform(bad), RangeError)
  }
  for (const bad of [[1,2], [1,2,3,4], [NaN,0,0], [0,Infinity,0]]) assert.throws(() => transformPoint(identityMatrix(), bad), RangeError)
  for (const fn of [translationMatrix, scaleMatrix]) assert.throws(() => fn(1, NaN, 1), RangeError)
  for (const fn of [rotationXMatrix, rotationYMatrix, rotationZMatrix]) assert.throws(() => fn(Infinity), RangeError)
})
test('parallel projection has the same size at different depths', () => {
  close(projectParallel([2, -1, -2], 0.5), [1, -0.5])
  close(projectParallel([2, -1, -20], 0.5), [1, -0.5])
})
test('perspective divides by positive forward depth and accounts for FOV and aspect', () => {
  close(projectPerspective([2, 1, -2], 90), [1, 0.5])
  close(projectPerspective([2, 1, -4], 90), [0.5, 0.25])
  close(projectPerspective([2, 1, -2], 90, 2), [0.5, 0.5])
  close(projectPerspective([1, 1, -1], 60), [Math.sqrt(3), Math.sqrt(3)])
})
test('perspective clips near/behind points and all nonfinite points safely', () => {
  for (const z of [0, 1, -0.099, NaN, Infinity, -Infinity]) assert.equal(projectPerspective([1, 1, z]), null)
  close(projectPerspective([0, 0, -0.1]), [0, 0])
  assert.equal(projectPerspective([NaN, 1, -2]), null)
  assert.equal(projectPerspective([1, Infinity, -2]), null)
  assert.equal(projectPerspective([Number.MAX_VALUE, 1, -0.1]), null)
  for (const fov of [0, 180, NaN, Infinity]) assert.throws(() => projectPerspective([0,0,-2], fov), RangeError)
  assert.throws(() => projectPerspective([0,0,-2], 60, 0), RangeError)
  assert.throws(() => projectPerspective([0,0,-2], 60, 1, 0), RangeError)
})
test('oblique depth has a constant direction and Cavalier/Cabinet length ratio', () => {
  close(projectOblique([2, 3, 4], 0, 1), [6, 3])
  close(projectOblique([2, 3, 4], 0, 0.5), [4, 3])
  close(projectOblique([2, 3, 4], 90, 0.5), [2, 5])
  close(projectOblique([2, 3, 0], 27, 0.7), [2, 3])
  close(projectOblique([2, 3, 4]), [2 + Math.sqrt(2), 3 + Math.sqrt(2)])
  close(projectDiagram([2, 3, 0]), [2, 3])
})
test('viewport converts NDC to a top-left origin with downward screen y', () => {
  close(viewportTransform([-1, 1], 640, 400), [0, 0])
  close(viewportTransform([1, -1], 640, 400), [640, 400])
  close(viewportTransform([0, 0], 640, 400), [320, 200])
  assert.throws(() => viewportTransform([0,0], 0, 400), RangeError)
  assert.throws(() => viewportTransform([NaN,0], 640, 400), RangeError)
})
test('camera pose is T Ry Rx and inverse view uses the opposite translation', () => {
  close(transformPoint(cameraMatrix([3, 4, 5], 90, 90), [0, 1, 0]), [4, 4, 5])
  close(transformPoint(viewMatrix([3, 4, 5]), [1, 2, 3]), [-2, -2, -2])
  close(transformPoint(viewMatrix([0, 0, 0], 90), [-2, 0, 0]), [0, 0, -2])
})
test('rigid inverse roundtrip and camera/object inverse equivalence hold with combined rotations', () => {
  const camera = cameraMatrix([3, -2, 5], 37, -24)
  const inverse = inverseRigidTransform(camera)
  close(multiplyMatrix4(camera, inverse), [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
  close(transformPoint(inverse, transformPoint(camera, [2, -3, 7])), [2, -3, 7])
  close(viewMatrix([3, -2, 5], 37, -24), inverse)
  const model = translationMatrix(1, 2, -4)
  const world = transformPoint(model, [1, 0, 0])
  close(transformPoint(inverse, world), transformPoint(multiplyMatrix4(inverse, model), [1, 0, 0]))
  assert.throws(() => inverseRigidTransform(scaleMatrix(2, 1, 1)), RangeError)
})
test('cube geometry has eight corners and twelve unique edges of equal length', () => {
  const vertices = cubeVertices(2)
  assert.equal(vertices.length, 8)
  assert.equal(new Set(vertices.map(v => v.join(','))).size, 8)
  vertices.forEach(v => v.forEach(value => assert.equal(Math.abs(value), 1)))
  assert.equal(cubeEdges.length, 12)
  assert.equal(new Set(cubeEdges.map(([a,b]) => [Math.min(a,b),Math.max(a,b)].join(','))).size, 12)
  for (const [a,b] of cubeEdges) assert.equal(Math.hypot(...vertices[a].map((value,i) => value-vertices[b][i])), 2)
})
test('coordinate pipeline reports each space independently and clips screen output', () => {
  const point = [1, 1, 0]
  const result = coordinatePipeline(point, translationMatrix(1, 0, 0), cameraMatrix([0, 0, 4]), 90, 800, 400)
  close(result.local, [1,1,0]); close(result.world, [2,1,0]); close(result.camera, [2,1,-4])
  close(result.projected, [0.25,0.25]); close(result.screen, [500,150])
  const behind = coordinatePipeline(point, identityMatrix(), identityMatrix())
  assert.equal(behind.projected, null); assert.equal(behind.screen, null)
  assert.deepEqual(point, [1,1,0])
})
