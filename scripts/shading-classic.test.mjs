import test from 'node:test'
import assert from 'node:assert/strict'
import * as lighting from '../packages/cg-algorithms/src/shading-classic.ts'
const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`)

test('Lambert: unit directions, 0/60/90/120 degrees and coefficients', () => {
  for (const [angle, expected] of [[0,1],[60,.5],[90,0],[120,0]]) near(lighting.lambert(angle), expected)
  near(lighting.lambert(60,.4,2), .4)
  const direction = lighting.directionFromAngles(60,90)
  near(direction[0], Math.sqrt(3)/2); near(direction[1], .5); near(direction[2], 0)
})
test('Point source inverse-square and independent incidence', () => {
  near(lighting.pointIlluminance(1,0,1),1)
  near(lighting.pointIlluminance(2,0,1),.25)
  near(lighting.pointIlluminance(3,0,1),1/9)
  near(lighting.pointIlluminance(2,60,2),.25)
  near(lighting.pointIlluminance(2,120,1),0)
  assert.throws(() => lighting.pointIlluminance(0,0,1), RangeError)
})
test('Oren–Nayar sigma zero equals Lambert over directions', () => {
  for (const incidence of [0,30,60,85,90,120]) {
    for (const view of [0,40,80]) near(lighting.orenNayar(incidence,view,120,0), lighting.lambert(incidence))
  }
})
test('Oren–Nayar lecture example sigma45 thetaL60 thetaV60', () => {
  near(lighting.orenNayar(60,60,0,45), .63165866, 1e-8)
  near(lighting.orenNayar(60,60,90,45), .337130988, 1e-8)
  near(lighting.orenNayar(60,60,180,45), .337130988, 1e-8)
  assert.equal(lighting.orenNayar(90,90,0,60),0)
})
test('Phong R=V and Blinn N=H peak, back-facing and opposing vectors stay finite', () => {
  const peak = lighting.specularTerms(35,35,180,20,80,.7,2)
  near(peak.phong,1.4); near(peak.blinn,1.4)
  const away = lighting.specularTerms(35,55,180,20,80,.7,2)
  assert.ok(away.phong < peak.phong); assert.ok(away.blinn < peak.blinn)
  const back = lighting.specularTerms(120,30,180,20,80,1,1)
  near(back.phong,0); near(back.blinn,0)
  const tangent = lighting.specularTerms(90,90,180,20,80,1,1)
  assert.ok(Number.isFinite(tangent.phong) && Number.isFinite(tangent.blinn))
})
test('Ambient toggles independently; AO attenuates only ambient', () => {
  const inputs = { ambient:.2, diffuse:.5, specular:.8, ambientOn:true, diffuseOn:true, specularOn:true, occlusion:0 }
  near(lighting.combineLighting(inputs).total,1.5)
  near(lighting.combineLighting({...inputs,occlusion:1}).total,1.3)
  near(lighting.combineLighting({...inputs,ambientOn:false}).total,1.3)
  near(lighting.combineLighting({...inputs,diffuseOn:false}).total,1)
  near(lighting.combineLighting({...inputs,specularOn:false}).total,.7)
  near(lighting.combineLighting({...inputs,ambientOn:false,diffuseOn:false,specularOn:false}).total,0)
})
test('Shared sample runner supports all seven demos', () => {
  for (const id of ['visibility-shading','lambert','point-light','oren-nayar','phong-blinn','shading-comparison','ambient-components']) assert.ok(lighting.runClassicExample(id))
  assert.throws(() => lighting.runClassicExample('unknown'),RangeError)
})
