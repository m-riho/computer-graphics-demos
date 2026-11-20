import test from 'node:test'
import assert from 'node:assert/strict'
import { sphereNormal, normalView, dotNormal, normalSamples, spherePixels, normalLight } from '../packages/cg-algorithms/src/shading-sphere-normals.ts'
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`)
test('circle position and meridian cover all six normal directions',()=>{
 for(const [a,m,want] of [[0,0,[1,0,0]],[180,0,[-1,0,0]],[90,0,[0,1,0]],[270,0,[0,-1,0]],[0,90,[0,0,1]],[180,90,[0,0,-1]]])sphereNormal(a,m).forEach((x,i)=>near(x,want[i]))
 for(let a=0;a<=360;a+=7)for(let m=0;m<=180;m+=13){const n=sphereNormal(a,m);near(Math.hypot(...n),1);near(dotNormal(n,[-Math.sin(m*Math.PI/180),0,Math.cos(m*Math.PI/180)]),0)}
})
test('orthographic camera changes visibility, never the world-space normal or light response',()=>{
 const n=sphereNormal(0,0),v=normalView(0,0),opposite=normalView(180,0)
 near(v.project(n)[2],1);near(opposite.project(n)[2],-1)
 for(const yaw of [0,45,180,270])for(const pitch of [-85,0,25,85]){
  const c=normalView(yaw,pitch);near(dotNormal(c.right,c.up),0);near(dotNormal(c.right,c.view),0);near(Math.hypot(...c.project(n)),1)
 }
 near(dotNormal(n,normalLight),1/Math.sqrt(3))
})
test('representative normals are unit length and distributed over both hemispheres',()=>{
 const ns=normalSamples(48);assert.equal(ns.length,48);ns.forEach(n=>near(Math.hypot(...n),1));assert.equal(ns.filter(n=>n[1]>0).length,24)
 assert.throws(()=>normalSamples(-1),RangeError);assert.throws(()=>sphereNormal(NaN,0),RangeError)
})
test('sphere pixels are deterministic, opaque on the surface and transparent outside',()=>{
 const p=spherePixels(40,25,101);assert.equal(p.length,101*101*4);assert.equal(p[(50*101+50)*4+3],255);assert.equal(p[3],0);assert.deepEqual(p,spherePixels(40,25,101));assert.notDeepEqual(p,spherePixels(130,25,101))
})
