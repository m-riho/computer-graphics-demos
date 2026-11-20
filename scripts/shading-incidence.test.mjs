import test from 'node:test'
import assert from 'node:assert/strict'
import * as incidence from '../packages/cg-algorithms/src/shading-incidence.ts'
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`)
test('fixed perpendicular beam width spreads by secant and conserves flux',()=>{
  for(const [angle,width,brightness] of [[0,1,1],[60,2,.5],[Math.acos(.25)*180/Math.PI,4,.25]]){
    const beam=incidence.beamFootprint(angle)
    near(beam.floorWidth,width);near(beam.relativeIlluminance,brightness)
    near(beam.floorWidth*beam.relativeIlluminance,1)
    near(beam.right-beam.left,width)
  }
  const beam=incidence.beamFootprint(60,2)
  near(beam.floorWidth,4);near(beam.relativeIlluminance,.5)
})
test('beam cross section is perpendicular to light and has constant width',()=>{
  for(const angle of [0,30,60,80]){
    const b=incidence.beamFootprint(angle),[a,c]=b.crossSection
    const dx=c[0]-a[0],dy=c[1]-a[1]
    near(Math.hypot(dx,dy),1);near(dx*b.light[0]+dy*b.light[1],0)
    for(const p of [a,c])assert.ok(p[1]>0,'cross section above floor')
    near(b.light[0],-b.incoming[0]);near(b.light[1],-b.incoming[1]);near(Math.hypot(...b.light),1)
    // The two beam boundaries intersect the floor at the footprint endpoints.
    near(a[0]-a[1]*b.light[0]/b.light[1],b.left)
    near(c[0]-c[1]*b.light[0]/b.light[1],b.right)
  }
})
test('grazing / invalid input is explicit instead of infinite geometry',()=>{
 for(const angle of [-1,90,120,NaN,Infinity])assert.throws(()=>incidence.beamFootprint(angle),RangeError)
 for(const width of [0,-1,NaN,Infinity])assert.throws(()=>incidence.beamFootprint(30,width),RangeError)
})
