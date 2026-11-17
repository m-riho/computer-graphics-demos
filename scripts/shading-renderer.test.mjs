import test from 'node:test'
import assert from 'node:assert/strict'
import { shadingObjectRotation, createShadingSphere, ambientOcclusion, directionFromAngles, srgbToLinear, linearToSrgb } from '../packages/cg-algorithms/src/shading-geometry.ts'

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


test('object rotation uses right-handed X then Y axes and preserves lengths', () => {
  const apply=(matrix,v)=>[0,1,2].map(row=>matrix[row]*v[0]+matrix[row+3]*v[1]+matrix[row+6]*v[2])
  for(const [pitch,yaw,input,expected] of [
    [0,0,[1,2,3],[1,2,3]],
    [90,0,[0,1,0],[0,0,1]],
    [0,90,[0,0,1],[1,0,0]],
    [90,90,[0,1,0],[1,0,0]],
    [0,360,[1,2,3],[1,2,3]],
  ]) {
    const actual=apply(shadingObjectRotation(pitch,yaw),input)
    actual.forEach((value,i)=>assert.ok(Math.abs(value-expected[i])<1e-12))
  }
  const rotation=shadingObjectRotation(37,-53)
  for(const v of [[1,0,0],[0,1,0],[0,0,1],[1,2,3]]) {
    assert.ok(Math.abs(Math.hypot(...apply(rotation,v))-Math.hypot(...v))<1e-12)
  }
})
test('normal overlays use one outward face normal at each centroid for Flat, and unique vertex normals otherwise', async () => {
  const { createShadingNormalLines }=await import('../packages/cg-algorithms/src/shading-geometry.ts')
  assert.equal(typeof createShadingNormalLines,'function','normal overlay geometry must distinguish face and vertex normals')
  for(const level of [0,1,2,3]) {
    const mesh=createShadingSphere(level),face=createShadingNormalLines(mesh,'face'),vertex=createShadingNormalLines(mesh,'vertex')
    assert.equal(face.length/6,20*4**level)
    assert.equal(vertex.length/6,10*4**level+2)
    for(let i=0;i<face.length;i+=6) {
      const offset=i/6*9
      const center=[0,1,2].map(k=>(mesh.positions[offset+k]+mesh.positions[offset+3+k]+mesh.positions[offset+6+k])/3)
      const direction=[0,1,2].map(k=>face[i+3+k]-face[i+k])
      assert.ok(Math.abs(Math.hypot(...direction)-.146)<1e-6)
      for(let k=0;k<3;k++) assert.ok(Math.abs(face[i+k]-center[k]-.004*mesh.faceNormals[offset+k])<1e-6)
      const edge=[0,1,2].map(k=>mesh.positions[offset+3+k]-mesh.positions[offset+k])
      assert.ok(Math.abs(edge.reduce((sum,v,k)=>sum+v*direction[k],0))<1e-6,'normal perpendicular to face')
      assert.ok(center.reduce((sum,v,k)=>sum+v*direction[k],0)>0,'normal points outwards')
    }
    for(let i=0;i<vertex.length;i+=6) {
      assert.ok(Math.abs(Math.hypot(...vertex.slice(i,i+3))-1.004)<1e-6)
      assert.ok(Math.abs(Math.hypot(...vertex.slice(i+3,i+6))-1.15)<1e-6)
    }
  }
})
