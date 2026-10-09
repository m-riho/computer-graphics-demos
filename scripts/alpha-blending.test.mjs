import test from 'node:test'
import assert from 'node:assert/strict'
import {compositeOverOpaque} from '../packages/cg-algorithms/src/alpha-blending.ts'

test('transparent foreground reveals background; opaque foreground replaces it', () => {
  const front = [240, 60, 20], back = [10, 80, 220]
  assert.deepEqual(compositeOverOpaque(front, back, 0), back)
  assert.deepEqual(compositeOverOpaque(front, back, 1), front)
})
test('half-transparent red over blue produces purple; white background produces pink', () => {
  assert.deepEqual(compositeOverOpaque([255, 0, 0], [0, 0, 255], .5), [128, 0, 128])
  assert.deepEqual(compositeOverOpaque([255, 0, 0], [255, 255, 255], .5), [255, 128, 128])
  assert.deepEqual(compositeOverOpaque([255, 0, 0], [0, 0, 255], .25), [64, 0, 191])
})
test('same colors remain unchanged and invalid alpha is bounded without mutating inputs', () => {
  const color = Object.freeze([64, 128, 192]), back = Object.freeze([0, 0, 0])
  for (const a of [0, .25, .5, 1]) assert.deepEqual(compositeOverOpaque(color, color, a), color)
  assert.deepEqual(compositeOverOpaque(color, back, -1), back)
  assert.deepEqual(compositeOverOpaque(color, back, 2), color)
  assert.deepEqual(compositeOverOpaque(color, back, NaN), back)
})
