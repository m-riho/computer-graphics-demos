import test from 'node:test'
import assert from 'node:assert/strict'
import { sampleTriangle } from '../packages/cg-algorithms/src/visibility-raster.ts'
import { makeScanlineTriangles, scanlineSpan, scanVisibleSpans, traceLayers } from '../packages/cg-algorithms/src/visibility-labs.ts'

const vertices = [[1, 1, .2], [5, 1, .6], [1, 5, 1]]
test('appendix raster: winding, edge ownership, depths and barycentric coordinates', () => {
  const hit = sampleTriangle(vertices, [2.5, 1.5])
  assert.ok(hit.covered)
  assert.deepEqual(hit.edges, [8, 6, 2])
  assert.deepEqual(hit.weights, [.5, .375, .125])
  assert.ok(Math.abs(hit.depth - .45) < 1e-10)
  const neighbor = [vertices[1], [5, 5, 0], vertices[2]]
  for (let x = .5; x < 6; x++) {
    for (let y = .5; y < 6; y++) {
      const first = sampleTriangle(vertices, [x, y])
      const reversed = sampleTriangle([...vertices].reverse(), [x, y])
      const second = sampleTriangle(neighbor, [x, y])
      assert.equal(first.covered, reversed.covered)
      assert.equal(Number(first.covered) + Number(second.covered), Number(x >= 1 && x < 5 && y >= 1 && y < 5))
      assert.ok(Math.abs(first.weights.reduce((sum, n) => sum + n, 0) - 1) < 1e-10)
    }
  }
  assert.equal(sampleTriangle(vertices, [4.5, 1.5]).covered, false)
  assert.equal(sampleTriangle(neighbor, [4.5, 1.5]).covered, true)
})

test('half-open scanline intervals agree with the appendix, including vertex rows', () => {
  for (const v of [vertices, [...vertices].reverse()]) {
    assert.deepEqual(scanlineSpan(v, 1), [1, 5])
    assert.deepEqual(scanlineSpan(v, 1.5), [1, 4.5])
    assert.deepEqual(scanlineSpan(v, 3.5), [1, 2.5])
    assert.equal(scanlineSpan(v, 5), null)
  }
})
test('visible spans split at the true crossing and preserve uncovered gaps', () => {
  const a = { id: 'A', vertices: [[0, 0, 1], [8, 0, 9], [0, 8, 1]] }
  const b = { id: 'B', vertices: [[0, 0, 7], [8, 0, -1], [0, 8, 7]] }
  assert.deepEqual(scanVisibleSpans([a, b], 1), [
    { left: 0, right: 3, faceId: 'A' }, { left: 3, right: 7, faceId: 'B' },
  ])
  assert.deepEqual(scanVisibleSpans([a, {...a, id:'B'}], 1), [{left:0, right:7, faceId:'A'}])
  assert.deepEqual(scanVisibleSpans([a,b], 9), [])
})
test('lecture row has four candidate samples and switches from A to constant-depth B at x=3.5', () => {
  const [a,b] = makeScanlineTriangles()
  const span = scanlineSpan(a.vertices, 2.5)
  const centers = Array.from({length:7}, (_,i) => i+.5)
  assert.deepEqual(centers.filter(x => span[0] <= x && x < span[1]), [1.5,2.5,3.5,4.5])
  assert.ok(b.vertices.every(v => v[2] === 4.5))
  const visible = scanVisibleSpans([a,b], 2.5)
  assert.deepEqual(visible.map(s => s.faceId), ['A','B'])
  assert.ok(Math.abs(visible[0].right-3.5) < 1e-9)
})
const a = { id: 'A', depth: 5, color: [255, 0, 0], alpha: 1 }
const b = { id: 'B', depth: 5, color: [0, 0, 255], alpha: 1 }
const bg = [255, 255, 255]
test('equal depth LESS keeps first; LEQUAL takes last', () => {
  assert.deepEqual(traceLayers([a,b], bg, 'LESS', true).map(s => s.accepted), [true, false])
  assert.deepEqual(traceLayers([a,b], bg, 'LEQUAL', true).at(-1).color, b.color)
  assert.deepEqual(traceLayers([b,a], bg, 'LESS', true).at(-1).color, b.color)
})
test('source-over depends on order; transparent depth writes can hide the far layer', () => {
  const near = {...a, alpha:.5, depth:3}, far = {...b, alpha:.5, depth:7}
  assert.deepEqual(traceLayers([near,far], bg, 'LESS', false).at(-1).color, [128,64,192])
  assert.deepEqual(traceLayers([far,near], bg, 'LESS', false).at(-1).color, [192,64,128])
  assert.deepEqual(traceLayers([near,far], bg, 'LESS', true).at(-1).color, [255,128,128])
  assert.equal(traceLayers([far], bg, 'LESS', false)[0].stored, Infinity)
})
