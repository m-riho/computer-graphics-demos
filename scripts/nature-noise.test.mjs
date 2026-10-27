import test from 'node:test'
import assert from 'node:assert/strict'
import { Perlin2D, noiseToGray } from '../packages/cg-algorithms/src/nature-noise.ts'
test('seed 0 matches the Python/Notebook unit-gradient reference',()=>{
 const n=new Perlin2D(0),d=n.details(2.3,3.7)
 assert.ok(Math.abs(d.value-(-.23926379486292323))<1e-14)
 assert.equal(n.sample(3,4),0)
 assert.equal(noiseToGray(-.5),.25)
 for(const g of d.gradients)assert.ok(Math.abs(Math.hypot(...g)-1)<1e-14)
})
test('Perlin noise and its derivative are continuous at a cell boundary',()=>{
 const n=new Perlin2D(0),e=1e-5
 assert.ok(Math.abs(n.sample(3-e,3.7)-n.sample(3+e,3.7))<4*e)
 const l=(n.sample(3,3.7)-n.sample(3-e,3.7))/e,r=(n.sample(3+e,3.7)-n.sample(3,3.7))/e
 assert.ok(Math.abs(l-r)<1e-6)
 assert.deepEqual(new Perlin2D(42).permutation,new Perlin2D(42).permutation)
 assert.notDeepEqual(n.permutation,new Perlin2D(42).permutation)
})
test('fractal combines signed octaves and normalizes amplitude only',()=>{
 const n=new Perlin2D(0)
 assert.equal(n.fractal(2.3,3.7,1,.5,2),n.sample(2.3,3.7))
 assert.ok(Math.abs(n.fractal(2.3,3.7,2,.5,2)-(n.sample(2.3,3.7)+.5*n.sample(4.6,7.4))/1.5)<1e-14)
 assert.ok(Number.isFinite(n.fractal(NaN,Infinity,Infinity,NaN,NaN)))
})
test('multiple uint32 seeds match NumPy RandomState fixtures at positive and negative coordinates',()=>{
 // Generated with examples/05-natural-modeling/perlin_noise.py and NumPy RandomState.
 const fixtures=[
  [1,[183,34,185,233,216,181,160,27],-.32349723194021013,-.3332627664360045],
  [42,[228,6,79,206,117,185,242,167],-.4275371972755548,-.06680230386791519],
  [4294967295,[21,120,94,174,6,113,177,228],.469631758184655,.2753246461265748],
 ]
 for(const [seed,permutation,a,b] of fixtures){const n=new Perlin2D(seed);assert.deepEqual(n.permutation.slice(0,8),permutation);assert.ok(Math.abs(n.sample(2.3,3.7)-a)<1e-14);assert.ok(Math.abs(n.sample(-1.2,4.8)-b)<1e-14)}
})
