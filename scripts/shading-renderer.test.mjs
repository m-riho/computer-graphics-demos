import test from 'node:test'
import assert from 'node:assert/strict'
import { createShadingSphere, ambientOcclusion, directionFromAngles, srgbToLinear, linearToSrgb } from '../packages/cg-algorithms/src/shading-geometry.ts'

test('all comparison modes use an outward unit sphere with exact icosphere counts', () => {
  for (let level=0;level<=3;level++) {
    const mesh=createShadingSphere(level)
    assert.equal(mesh.positions.length/9,20*4**level)
    for(let i=0;i<mesh.positions.length;i+=3) {
      assert.ok(Math.abs(Math.hypot(...mesh.positions.slice(i,i+3))-1)<1e-6)
      assert.ok(Math.abs(Math.hypot(...mesh.normals.slice(i,i+3))-1)<1e-6)
    }
    for(let i=0;i<mesh.faceNormals.length;i+=9) {
      assert.deepEqual(mesh.faceNormals.slice(i,i+3),mesh.faceNormals.slice(i+3,i+6))
      const n=mesh.faceNormals.slice(i,i+3),p=mesh.positions.slice(i,i+3)
      assert.ok(n.reduce((sum,v,j)=>sum+v*p[j],0)>0)
    }
  }
})
test('AO follows hemisphere visibility: contact obscured, top and distant floor open', () => {
  assert.ok(ambientOcclusion([0,-.999,0],[0,-1,0],true)>0.9)
  assert.equal(ambientOcclusion([0,1,0],[0,1,0],true),0)
  assert.ok(ambientOcclusion([1.05,-1,0],[0,1,0],true)>0.05)
  assert.equal(ambientOcclusion([8,-1,0],[0,1,0],true),0)
  assert.equal(ambientOcclusion([0,-.999,0],[0,-1,0],false),0)
})
test('angle convention and exact sRGB roundtrip', () => {
  assert.deepEqual(directionFromAngles(0),[0,1,0])
  assert.ok(Math.abs(directionFromAngles(90)[2]-1)<1e-12)
  for(const c of [0,.01,.04,.2,.5,1]) assert.ok(Math.abs(linearToSrgb(srgbToLinear(c))-c)<1e-12)
})

