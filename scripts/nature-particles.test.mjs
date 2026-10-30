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

test('Smoke rises, responds to wind, stays reproducible and expires after emission stops',()=>{
 assert.ok(particlePresets.Smoke, 'Smoke preset exists')
 const simulate=()=>{let s=createParticleState(7);for(let i=0;i<120;i++)s=advanceParticles(s,particlePresets.Smoke,1/30);return s}
 const state=simulate();assert.deepEqual(state,simulate());assert.ok(state.particles.length>0)
 const oldest=state.particles[0];assert.ok(oldest.y<150);assert.ok(oldest.vy<0)
 const next=advanceParticles(state,{...particlePresets.Smoke,emissionRate:0,windMode:'constant',wind:40},.1)
 assert.ok(next.particles[0].vx>oldest.vx)
 assert.deepEqual(state,simulate(), 'updates do not mutate the input')
 let expired=state;for(let i=0;i<240;i++)expired=advanceParticles(expired,{...particlePresets.Smoke,emissionRate:0},1/30)
 assert.equal(expired.particles.length,0)
})

test('Smoke puffs expand and fade to zero over their lifetime',async()=>{
 const { particleAppearance }=await import('../packages/cg-algorithms/src/nature-particles.ts')
 assert.equal(typeof particleAppearance,'function')
 const puff={id:1,x:300,y:265,vx:0,vy:-35,age:0,lifetime:5,size:10,color:'#cbd5e1'}
 const young=particleAppearance(puff,'Smoke'),older=particleAppearance({...puff,age:3},'Smoke'),end=particleAppearance({...puff,age:5},'Smoke')
 assert.ok(young.opacity>0&&young.opacity<1)
 assert.ok(older.radius>young.radius);assert.ok(older.opacity<young.opacity)
 assert.equal(end.opacity,0)
 assert.deepEqual(particleAppearance(puff,'Fire'),{radius:10,opacity:1})
})
