import test from 'node:test'
import assert from 'node:assert/strict'
import {circleDistance, evaluateCircleBoolean, metaballContribution, metaballField, sampleScalarField, contourSegments} from '../packages/cg-algorithms/src/nature-fields.ts'
const a={center:[0,0],radius:2}, b={center:[2,0],radius:2}
test('circle slice and Boolean preserve signed membership and subtraction order',()=>{
  assert.equal(circleDistance([0,0],a),-2)
  assert.equal(circleDistance([2,0],a),0)
  assert.equal(circleDistance([3,0],a),1)
  assert.equal(evaluateCircleBoolean([1,0],a,b,'union').value,-1)
  assert.equal(evaluateCircleBoolean([1,0],a,b,'intersection').value,-1)
  assert.equal(evaluateCircleBoolean([1,0],a,b,'difference').value,1)
  assert.ok(evaluateCircleBoolean([-1,0],a,b,'difference').value<0)
})
test('compact metaball kernel has finite center, finite support, additive neck',()=>{
  const ball={center:[0,0],radius:2,weight:1}
  assert.equal(metaballContribution([0,0],ball),1)
  assert.equal(metaballContribution([2,0],ball),0)
  assert.equal(metaballContribution([3,0],ball),0)
  assert.equal(metaballContribution([1,0],ball),.421875)
  assert.equal(metaballField([1,0],[ball,{...ball,center:[2,0]}]),.84375)
  assert.equal(metaballContribution([0,0],{...ball,radius:0}),0)
  assert.equal(metaballContribution([0,0],{...ball,weight:NaN}),0)
})
test('sample and interpolated contours recover a linear field boundary',()=>{
  const grid=sampleScalarField((x,y)=>x,2,2,2,2)
  assert.deepEqual(grid.values,[0,1,2,0,1,2,0,1,2])
  const segments=contourSegments(grid,.5)
  assert.ok(segments.length>0)
  for(const segment of segments)for(const [x,y] of segment){assert.equal(x,.5);assert.ok(y>=0&&y<=2)}
  assert.equal(contourSegments(grid,5).length,0)
})
