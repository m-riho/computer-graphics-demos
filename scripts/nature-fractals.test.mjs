import test from 'node:test'
import assert from 'node:assert/strict'
import {kochCurve,sierpinskiTriangles,escapeTime,fernPoints,fernTransform,boundedInteger} from '../packages/cg-algorithms/src/nature-fractals.ts'
test('Koch replaces a segment with four equal segments, preserving endpoints',()=>{
  const points=kochCurve(1)
  assert.equal(points.length,5)
  assert.deepEqual(points[0],[0,0]); assert.deepEqual(points.at(-1),[1,0])
  for(let i=1;i<points.length;i++)assert.ok(Math.abs(Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1])-1/3)<1e-12)
  assert.equal(kochCurve(6).length,4097)
  assert.equal(kochCurve(99).length,4097)
  assert.equal(kochCurve(NaN).length,2)
})
test('Sierpinski removes central triangles: counts and corner bounds',()=>{
  assert.equal(sierpinskiTriangles(0).length,1)
  const triangles=sierpinskiTriangles(3)
  assert.equal(triangles.length,27)
  for(const triangle of triangles)for(const [x,y] of triangle){assert.ok(x>=0&&x<=1);assert.ok(y>=0&&y<=Math.sqrt(3)/2)}
})
test('escape-time distinguishes known Mandelbrot and filled Julia samples',()=>{
  assert.equal(escapeTime([0,0],[0,0],50),50)
  assert.equal(escapeTime([0,0],[-1,0],50),50)
  assert.equal(escapeTime([0,0],[2,0],50),2)
  assert.equal(escapeTime([2,0],[0,0],50),1)
  assert.equal(escapeTime([0,0],[NaN,0],50),0)
  // z=2+0.5i is a fixed point for c=−1.75−1.5i, although |z|>2.
  assert.equal(escapeTime([2,.5],[-1.75,-1.5],50),50)
})
test('fern uses original coordinates in affine transform and reproducible selection',()=>{
  assert.deepEqual(fernTransform([1,2],0),[0,.32])
  const p=fernTransform([1,2],1)
  assert.ok(Math.abs(p[0]-.93)<1e-12);assert.ok(Math.abs(p[1]-3.26)<1e-12)
  const a=fernPoints(1000,42)
  assert.equal(a.length,1000);assert.deepEqual(a,fernPoints(1000,42));assert.notDeepEqual(a,fernPoints(1000,43))
  for(const {point:[x,y],transform} of a){assert.ok(x>-3&&x<3&&y>=0&&y<11);assert.ok(transform>=0&&transform<4)}
  assert.equal(fernPoints(200000,1).length,100000)
  assert.equal(boundedInteger(NaN,0,6,2),2)
})
