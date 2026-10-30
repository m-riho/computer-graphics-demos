import test from 'node:test'
import assert from 'node:assert/strict'
import { sampleNoiseField, noiseTerrain, noiseClouds } from '../packages/cg-algorithms/src/nature-noise-applications.ts'
import { Perlin2D } from '../packages/cg-algorithms/src/nature-noise.ts'

test('sampled field matches signed Perlin fBm, preserves seed and rectangular domain',()=>{
 const options={width:9,height:7,seed:3,frequency:4,octaves:3,persistence:.5,lacunarity:2}
 const a=sampleNoiseField(options),b=sampleNoiseField(options)
 assert.deepEqual(a,b);assert.equal(a.values.length,63)
 assert.equal(a.values[4*9+2],new Perlin2D(3).fractal(2/8*4,4/6*3,3,.5,2))
 assert.notDeepEqual(a.values,sampleNoiseField({...options,seed:4}).values)
 assert.throws(()=>sampleNoiseField({...options,width:100000}),RangeError)
 assert.throws(()=>sampleNoiseField({...options,height:NaN}),RangeError)
})
test('terrain maps samples to heights with shared vertices and upward-facing triangles',()=>{
 const field={width:2,height:2,values:[-.5,0,.25,.5]}
 const mesh=noiseTerrain(field,2)
 assert.deepEqual(mesh.vertices,[[-1,-1,-.75],[1,0,-.75],[-1,.5,.75],[1,1,.75]])
 assert.deepEqual(mesh.faces,[[0,2,1],[1,2,3]])
 assert.ok(noiseTerrain(field,0).vertices.every(v=>v[1]===0))
 assert.deepEqual(field.values,[-.5,0,.25,.5])
})
test('cloud alpha is bounded, fades smoothly at threshold and decreases with threshold',()=>{
 const field={width:3,height:2,values:[-1,-.4,0,.4,.8,1]}
 const a=noiseClouds(field,.3,.4),b=noiseClouds(field,.5,.4)
 assert.equal(a.length,24)
 for(let i=0;i<6;i++){
  assert.deepEqual([...a.slice(i*4,i*4+3)],[255,255,255])
  assert.ok(a[i*4+3]>=b[i*4+3])
 }
 assert.equal(a[3],0);assert.equal(a[23],255)
 assert.equal(a[11],128)
 assert.throws(()=>noiseClouds(field,.4,0),RangeError)
 assert.throws(()=>noiseTerrain({...field,values:[0]},2),RangeError)
})
