import test from 'node:test'
import assert from 'node:assert/strict'
import { disneyDefaults, disneyBRDF } from '../packages/cg-algorithms/src/shading-disney.ts'
const N=[0,0,1],T=[1,0,0],L=[.5,.2,Math.sqrt(.71)],V=[-.2,.3,Math.sqrt(.87)]
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`)
test('Disney BRDF is reciprocal and finite at material endpoints',()=>{
 for(const roughness of [0,.5,1])for(const metallic of [0,1])for(const clearcoatGloss of [0,1]){
  const p={...disneyDefaults(),roughness,metallic,clearcoat:1,clearcoatGloss,sheen:1,subsurface:1,anisotropic:1}
  const a=disneyBRDF(N,T,L,V,p),b=disneyBRDF(N,T,V,L,p)
  a.total.forEach((x,i)=>{assert.ok(Number.isFinite(x)&&x>=0);near(x,b.total[i])})
 }
 assert.deepEqual(disneyBRDF(N,T,[0,0,-1],V,disneyDefaults()).total,[0,0,0])
})
test('metal removes diffuse and sheen; its F0 color is baseColor',()=>{
 const p={...disneyDefaults(),metallic:1,sheen:1}
 const a=disneyBRDF(N,T,L,V,p),b=disneyBRDF(N,T,L,V,{...p,subsurface:1,specular:0,specularTint:1})
 assert.deepEqual(a.diffuse,[0,0,0]);assert.deepEqual(a.sheen,[0,0,0])
 a.total.forEach((x,i)=>near(x,b.total[i]))
})
test('inactive sheen and coat tint/gloss have no effect',()=>{
 const p=disneyDefaults(),a=disneyBRDF(N,T,L,V,p)
 const b=disneyBRDF(N,T,L,V,{...p,sheenTint:1,clearcoatGloss:0})
 a.total.forEach((x,i)=>near(x,b.total[i]))
})
test('specular maps to F0=0.08*s and coat adds independent reflection',()=>{
 const p={...disneyDefaults(),baseColor:[0,0,0],roughness:.5}
 const a=disneyBRDF(N,T,N,N,p),b=disneyBRDF(N,T,N,N,{...p,specular:1})
 near(b.specular[0],2*a.specular[0])
 const d=1/(Math.PI*.25**2);near(a.specular[0],d*.04/4)
 const c=disneyBRDF(N,T,L,V,{...p,clearcoat:1})
 assert.ok(c.clearcoat[0]>0)
})
test('anisotropy changes tangent directions and zero anisotropy is rotation invariant',()=>{
 const p={...disneyDefaults(),metallic:1,anisotropic:0}
 const otherT=[0,1,0]
 disneyBRDF(N,T,L,V,p).total.forEach((x,i)=>near(x,disneyBRDF(N,otherT,L,V,p).total[i]))
 assert.notDeepEqual(disneyBRDF(N,T,L,V,{...p,anisotropic:1}).total,disneyBRDF(N,otherT,L,V,{...p,anisotropic:1}).total)
})
