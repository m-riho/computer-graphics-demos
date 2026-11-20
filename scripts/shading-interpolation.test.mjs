import test from 'node:test'
import assert from 'node:assert/strict'
import { lerpValue, interpolationNormals, shadeInterpolationNormal, interpolateShading, interpolationPath } from '../packages/cg-algorithms/src/shading-interpolation.ts'
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9, `${a} != ${b}`)
test('linear interpolation reproduces endpoints and lecture values',()=>{
 near(lerpValue(.2,.8,0),.2);near(lerpValue(.2,.8,1),.8)
 near(lerpValue(.2,.8,.25),.35);near(lerpValue(.2,.8,.5),.5)
})
test('Gouraud interpolates colors while Phong normalizes the mixed normal first',()=>{
 const normals=interpolationNormals(1)
 for(let i=0;i<3;i++){
  const w=[0,0,0];w[i]=1
  const p=interpolateShading(w,0,1,true)
  near(p.gouraud,p.phong)
  near(p.phong,shadeInterpolationNormal(normals[i],0,true).total)
 }
 const p=interpolateShading([1/3,1/3,1/3],0,1,true)
 near(Math.hypot(...p.normal),1)
 assert.ok(Math.hypot(...p.rawNormal)<1)
 near(p.normal[0],0);near(p.normal[1],0);near(p.normal[2],1)
 assert.ok(p.phong>p.gouraud+.5,'interior specular highlight is absent from vertex colors')
 near(p.gouraud,p.vertexColors.reduce((a,b)=>a+b,0)/3)
})
test('equal normals give a constant field for both shading methods',()=>{
 for(const w of [[1,0,0],[0,1,0],[.2,.3,.5]]){
  const p=interpolateShading(w,35,0,true)
  near(p.gouraud,p.phong)
 }
})
test('animation stays inside the triangle with weights summing to one',()=>{
 for(let i=0;i<=1000;i++){
  const w=interpolationPath(i/1000)
  assert.ok(w.every(v=>v>=0 && v<=1));near(w.reduce((a,b)=>a+b,0),1)
 }
 assert.deepEqual(interpolationPath(0),interpolationPath(1))
})
test('screen point barycentrics recover vertices, centroid and outside points',async()=>{
 const {triangleWeights}=await import('../packages/cg-algorithms/src/shading-interpolation.ts')
 const v=[[0,0],[4,0],[0,3]]
 assert.deepEqual(triangleWeights([0,0],v),[1,0,0])
 assert.deepEqual(triangleWeights([4,0],v),[0,1,0])
 triangleWeights([4/3,1],v).forEach(x=>near(x,1/3))
 assert.ok(triangleWeights([4,3],v).some(x=>x<0))
 assert.throws(()=>triangleWeights([0,0],[[0,0],[1,1],[2,2]]),RangeError)
})
