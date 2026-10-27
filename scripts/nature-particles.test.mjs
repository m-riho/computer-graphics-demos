import test from 'node:test'
import assert from 'node:assert/strict'
import { createParticleState, advanceParticles, particlePresets } from '../packages/cg-algorithms/src/nature-particles.ts'
test('particle update applies acceleration, age and removes expired particles',()=>{
 const p={id:1,x:0,y:0,vx:2,vy:3,age:0,lifetime:1,size:3,color:'#fff'}
 const state={...createParticleState(1),particles:[p]}
 const parameters={...particlePresets.Fountain,emissionRate:0,gravity:4,wind:2,windMode:'constant'}
 const result=advanceParticles(state,parameters,.1)
 assert.ok(Math.abs(result.particles[0].vx-2.2)<1e-12)
 assert.ok(Math.abs(result.particles[0].vy-3.4)<1e-12)
 assert.equal(result.particles[0].age,.1)
 assert.equal(state.particles[0].age,0)
 let expired=result;for(let i=0;i<10;i++)expired=advanceParticles(expired,parameters,.1)
 assert.equal(expired.particles.length,0)
})
test('emission is reproducible from seed and bounded',()=>{
 const a=advanceParticles(createParticleState(3),particlePresets.Fire,.1)
 const b=advanceParticles(createParticleState(3),particlePresets.Fire,.1)
 assert.deepEqual(a,b);assert.ok(a.particles.length>0)
 const bad=advanceParticles(a,{...particlePresets.Fire,emissionRate:Infinity,lifetime:NaN},Infinity)
 assert.ok(bad.particles.length<=1200)
 assert.ok(bad.particles.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))
})
