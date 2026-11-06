import test from 'node:test'
import assert from 'node:assert/strict'
import { primaryRay, sphereIntersections, triangleIntersection, nearestPositiveHit } from '../packages/cg-algorithms/src/visibility-rays.ts'
import { classifyFace, inspectCullingScene } from '../packages/cg-algorithms/src/visibility-culling.ts'

const ray = primaryRay([0, 0, 0], [1, 0, 0])
const triangle = [[8, -2, -1], [8, 2, -1], [8, 0, 2]]

test('球の入口・接線・ミスと視点の背後を区別する', () => {
  const roots = (center) => sphereIntersections(ray, {center, radius: 2}).roots
  assert.deepEqual(roots([5, 0, 0]), [3, 7])
  assert.deepEqual(roots([5, 2, 0]), [5])
  assert.deepEqual(roots([5, 3, 0]), [])
  assert.deepEqual(roots([-5, 0, 0]), [-7, -3])
  assert.deepEqual(roots([0, 0, 0]), [-2, 2])
  assert.equal(nearestPositiveHit([{id:'S', t:-2}, {id:'S', t:2}, {id:'T', t:8}]).t, 2)
  assert.equal(nearestPositiveHit([{id:'S', t:-2}, {id:'S', t:0}]), null)
})

test('視平面の点を通る単位レイと三角形の両面交差', () => {
  const oblique = primaryRay([1, 2, 0], [4, 6, 0])
  assert.deepEqual(oblique.direction, [0.6, 0.8, 0])
  const hit = triangleIntersection(ray, triangle)
  assert.equal(hit.t, 8)
  for (const w of hit.weights) assert.ok(Math.abs(w - 1/3) < 1e-12)
  assert.equal(triangleIntersection(ray, [...triangle].reverse()).t, 8)
  assert.equal(triangleIntersection(primaryRay([0, 4, 0], [1, 4, 0]), triangle), null)
  assert.equal(triangleIntersection(primaryRay([0, 0, 0], [0, 1, 0]), triangle), null)
})

test('面から視点への方向と頂点順が内積の正負を決める', () => {
  const vertices = [[0,0,0], [1,0,0], [0,1,0]]
  assert.equal(classifyFace(vertices, [0,0,1]).orientation, 'front')
  assert.equal(classifyFace([...vertices].reverse(), [0,0,1]).orientation, 'back')
  assert.equal(classifyFace(vertices, [3,0,0]).orientation, 'edge')
})

test('凸形状では表向きの面中心が見え、凹形状・複数物体では手前の壁に遮られる', () => {
  for (const shape of ['convex','concave','multiple']) {
    const faces = inspectCullingScene(shape, [-5,0,0], false)
    const front = faces.filter(f => f.orientation === 'front')
    assert.ok(front.some(f => !f.blocker))
    assert.equal(front.some(f => f.blocker !== null), shape !== 'convex')
  }
})

test('全プリセット・全画素で独立したレイ交差がZバッファの可視面と一致する', async () => {
  const {makeVisibilityScene, renderZBuffer} = await import('../packages/cg-algorithms/src/visibility-raster.ts')
  const {castVisibilitySample} = await import('../packages/cg-algorithms/src/visibility-compare.ts')
  for (const preset of ['lecture','ordered','crossing','cycle']) {
    const scene = makeVisibilityScene(preset)
    const expected = renderZBuffer(scene).color
    expected.forEach((id,i) => {
      const result = castVisibilitySample(scene, i % scene.width, Math.floor(i / scene.width))
      assert.equal(result.visible?.id ?? null, id, preset + ' pixel ' + i)
    })
  }
})

test('クリッピング遠端を含み近端を除く。等深度では先の面を残す', async () => {
  const { castVisibilitySample } = await import('../packages/cg-algorithms/src/visibility-compare.ts')
  const face = (id, r) => ({id, vertices:[[.5-r,.5-r,7],[.5+r,.5-r,7],[.5,.5+r,7]]})
  const scene = {width:1, height:1, camera:{near:0,far:7}, triangles:[face('A',.3), face('B',1)]}
  assert.deepEqual(castVisibilitySample(scene,0,0).visible, {id:'A',t:7})
  scene.camera = {near:7,far:10}
  assert.equal(castVisibilitySample(scene,0,0).visible, null)
})

test('共有辺上のレイのヒットを左上規則で片面だけに割り当てる', async () => {
  const {castVisibilitySample} = await import('../packages/cg-algorithms/src/visibility-compare.ts')
  const scene = {width:1,height:1,camera:{near:0,far:9},triangles:[
    {id:'A', vertices:[[0,0,2],[1,0,2],[1,1,2]]},
    {id:'B', vertices:[[0,0,2],[1,1,2],[0,1,2]]},
  ]}
  assert.deepEqual(castVisibilitySample(scene,0,0).hits, [{id:'A',t:2}])
})
