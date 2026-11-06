import test from 'node:test'
import assert from 'node:assert/strict'
import { makeVisibilityScene, renderPainter, renderZBuffer, rasterizeTriangle, replayDepth } from '../packages/cg-algorithms/src/visibility-raster.ts'

// 手元の推定値ではなく、p.33–36 の各図の 7×5 Color Buffer を読んだ期待値。
const stages = [
  ['.......', '.......', '.......', '.......', '.......'],
  ['..A....', '..AA...', '.AAAA..', '.AAAAA.', 'A......'],
  ['..A..BB', '.BBBBB.', '.ABBBB.', '.AABBA.', 'A...B..'],
  ['C.A..BB', 'CBBBBB.', 'CABBBB.', '.AABBA.', 'AC..B..'],
]
const depths = { A: 8, B: 5, C: 12, '.': Infinity }

function permutations(faces) {
  if (faces.length === 0) return [[]]
  return faces.flatMap(face => permutations(faces.filter(f => f !== face)).map(rest => [face, ...rest]))
}

test('講義図の4段階、35画素の面IDと深度', () => {
  const scene = makeVisibilityScene('lecture')
  for (const [i, rows] of stages.entries()) {
    const result = renderZBuffer(scene, scene.triangles.slice(0, i))
    assert.deepEqual(result.color.map(id => id ?? '.'), [...rows.join('')])
    assert.deepEqual(result.depth, [...rows.join('')].map(id => depths[id]))
  }
  const expected = renderZBuffer(scene)
  for (const order of permutations(scene.triangles)) assert.deepEqual(renderZBuffer(scene, order), expected)
})

test('画素Pの比較とフラグメント単位で停止した途中結果', () => {
  const scene = makeVisibilityScene('lecture')
  const fragments = scene.triangles.flatMap(t => rasterizeTriangle(scene, t))
  const p = 2 * 7 + 3
  for (const [i, expected] of [Infinity, 8, 5, 5].entries()) {
    const limit = i === 0 ? 0 : fragments.indexOf(fragments.filter(f => f.x === 3 && f.y === 2)[i - 1]) + 1
    const state = replayDepth(scene, fragments.slice(0, limit), p)
    assert.equal(state.depth[p], expected)
    assert.deepEqual(state.history.map(h => [h.stored, h.depth, h.accepted]), [[Infinity, 8, true], [8, 5, true], [5, 12, false]].slice(0,i))
  }
})

test('面単位の全順列を比較し、通常例のみ正しい順序が存在する', () => {
  for (const preset of ['ordered','crossing','cycle']) {
    const scene = makeVisibilityScene(preset)
    const reference = renderZBuffer(scene).color
    const errors = permutations(scene.triangles).map(order => renderPainter(scene, order).color.filter((id,i) => id !== reference[i]).length)
    if (preset === 'ordered') assert.equal(errors[0], 0)
    else assert.ok(Math.min(...errors) > 0, preset)
    assert.ok(Math.max(...errors) > 0)
  }
})

test('循環例の各重なり領域の前後関係は一意であり三面同時の重なりはない', () => {
  const scene = makeVisibilityScene('cycle')
  const samples = new Map()
  for (const t of scene.triangles) {
    for (const f of rasterizeTriangle(scene,t)) {
      const key = f.y * scene.width + f.x
      if (!samples.has(key)) samples.set(key, [])
      samples.get(key).push(f)
    }
  }
  const relations = new Set()
  for (const faces of samples.values()) {
    assert.ok(faces.length <= 2)
    if (faces.length === 2) {
      const [front,back] = faces.sort((a,b) => a.depth - b.depth)
      assert.ok(front.depth < back.depth)
      relations.add(front.faceId + back.faceId)
    }
  }
  assert.deepEqual(relations, new Set(['AB','BC','CA']))
})
