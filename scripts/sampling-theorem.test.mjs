import test from 'node:test'
import assert from 'node:assert/strict'
import * as a from '../packages/cg-algorithms/src/index.ts'
const near=(x,y)=>assert.ok(Math.abs(x-y)<1e-9,`${x} ≠ ${y}`)
test('Nyquist uses strict greater-than and rejects invalid frequencies',()=>{
 assert.equal(typeof a.nyquistSatisfied,'function')
 assert.equal(a.nyquistSatisfied(4,12),true)
 for(const fs of [8,6,0,NaN,Infinity])assert.equal(a.nyquistSatisfied(4,fs),false)
 assert.equal(a.nyquistSatisfied(NaN,12),false)
})
test('signed alias distinguishes forward, stopped and reverse observations',()=>{
 assert.equal(typeof a.aliasFrequency,'function')
 for(const [f,fs,expected] of [[4,12,4],[4,8,-4],[4,6,-2],[4,4,0],[4,3,1],[-4,6,2],[.1,30,.1]])near(a.aliasFrequency(f,fs),expected)
})
test('uniform samples agree with original AND representative alias, including negative aliases',()=>{
 assert.equal(typeof a.sampleSignal,'function')
 for(const [f,fs] of [[4,12],[4,6],[4,4],[4,8],[9.3,5]]){
  const pts=a.sampleSignal(f,fs,12),alias=a.aliasFrequency(f,fs)
  pts.forEach((p,i)=>{near(p.position,i/fs);near(p.value,Math.cos(2*Math.PI*f*i/fs));near(p.value,a.cosineSignal(alias,p.position))})
 }
})
test('spatial sampling shows a lower-frequency pattern or a constant without changing density',()=>{
 assert.equal(typeof a.sampleSpatialSignal,'function')
 const points=a.sampleSpatialSignal(7,8);assert.equal(points.length,8)
 points.forEach((p,i)=>{near(p.position,i/8);near(p.value,.5+.5*Math.cos(2*Math.PI*i/8))})
 a.sampleSpatialSignal(8,8).forEach(p=>near(p.value,1))
})
test('strobe holds until next sample; identical spokes repeat N times per revolution',()=>{
 assert.equal(typeof a.rotationState,'function')
 const p=a.rotationState(4,6,.2,1)
 near(p.sampleTime,1/6);near(p.apparentFrequency,-2)
 near(a.rotationState(4,6,.3,1).observedAngle,p.observedAngle)
 near(a.rotationState(1,8,.2,8).apparentFrequency,0)
 near(a.rotationState(.9,8,.2,8).apparentFrequency,-.1)
 near(a.rotationState(1.1,8,.2,8).apparentFrequency,.1)
 for(let i=0;i<10;i++){
  const s=a.rotationState(.9,8,i/8,8)
  near(Math.cos(8*s.observedAngle),Math.cos(2*Math.PI*8*s.apparentFrequency*i/8))
 }
})
test('rasterization reuses line coverage and AA creates partial values',()=>{
 assert.equal(typeof a.rasterizeLine,'function')
 const hard=a.rasterizeLine(12,25,false),aa=a.rasterizeLine(12,25,true)
 assert.equal(hard.length,144);assert.ok(hard.every(c=>c.coverage===0||c.coverage===1))
 assert.ok(aa.some(c=>c.coverage>0&&c.coverage<1))
 aa.forEach(c=>near(c.coverage,a.lineCoverage(c.x,c.y,12,25,true)))
})
test('invalid or excessive inputs fail explicitly rather than render NaN or allocate unbounded arrays',()=>{
 assert.equal(typeof a.sampleSignal,'function')
 for(const args of [[4,0,10],[Infinity,12,10],[4,12,Infinity],[4,12,1e9],[4,12,-1],[4,12,2.5]])assert.throws(()=>a.sampleSignal(...args),RangeError)
 assert.throws(()=>a.aliasFrequency(4,0),RangeError)
 assert.throws(()=>a.aliasFrequency(4,Number.MIN_VALUE),RangeError)
 assert.throws(()=>a.rotationState(4,6,NaN),RangeError)
 assert.throws(()=>a.rotationState(4,6,0,0),RangeError)
 assert.throws(()=>a.sampleSpatialSignal(4,0),RangeError)
 assert.throws(()=>a.rasterizeLine(10000,25,true),RangeError)
})
