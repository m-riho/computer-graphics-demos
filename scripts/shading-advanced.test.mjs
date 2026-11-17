import test from 'node:test';
import assert from 'node:assert/strict';
import { lambertBrdf, empiricalLobe, ndf, sampleNdf, projectedNdfIntegral, fresnelDielectric, schlick, smithLambda, cookTorrance, roughnessToAlpha, srgbHexToLinear, pbrParameters, repartitionIrradiance, renderingSum } from '../packages/cg-algorithms/src/shading-advanced.ts';
const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
test('Lambert divides reflectance by pi, empirical lobes peak only at reflection alignment', () => {
 near(lambertBrdf(.6), .1909859317102744);
 near(empiricalLobe('phong', 35, -35, 20), 1);
 near(empiricalLobe('blinn-phong', 35, -35, 80), 1);
 assert.ok(empiricalLobe('phong', 35, 35, 20) < .0001);
});
test('both NDFs normalize with projected area, not plain solid angle', () => {
 for (const type of ['ggx','beckmann']) for (const alpha of [.05,.2,.6,1]) near(projectedNdfIntegral(type,alpha),1, .0001);
 near(ndf('ggx',1,.5),1.2732395447351628);
 assert.equal(ndf('beckmann',0,.2),0);
});
test('NDF samples invert projected distribution and are unit hemisphere normals', () => {
 for(const type of ['ggx','beckmann']) {
  const samples = Array.from({length:1000},(_,i)=>sampleNdf(type,.5,(i+.5)/1000,(i*.61803398875)%1));
  for(const m of samples){near(Math.hypot(...m),1); assert.ok(m[1]>=0);}
  // Median tan²(theta) is alpha² for GGX, alpha² ln(2) for Beckmann.
  const median=sampleNdf(type,.5,.5,0);
  near((1-median[1]**2)/median[1]**2,type==='ggx' ? .25 : .17328679513998632);
 }
});
test('dielectric Fresnel handles normal, oblique, equal IOR and total internal reflection',()=>{
 near(fresnelDielectric(0,1,1.5).reflectance,.04);
 near(fresnelDielectric(60,1,1.5).reflectance,.08918671280221276);
 assert.equal(fresnelDielectric(50,1.5,1).totalInternalReflection,true);
 assert.equal(fresnelDielectric(50,1.5,1).reflectance,1);
 assert.equal(fresnelDielectric(90,1,1).reflectance,0);
 near(schlick(1,.04),.04); near(schlick(0,.04),1);
});
test('Cook Torrance uses correlated Smith, consistent DFG and guards tangent/backface',()=>{
 near(smithLambda('ggx',.5,.5),.16143782776614768);
 const c=cookTorrance(60,-60,.5,.04,'ggx');
 near(c.G,.7559289460184544);
 near(c.brdf,c.D*c.F*c.G/(4*.5*.5));
 near(cookTorrance(0,0,.5,.04,'ggx').brdf,.012732395447351628);
 assert.equal(cookTorrance(90,0,.5,.04,'ggx').brdf,0);
 assert.equal(cookTorrance(120,0,.5,.04,'ggx').brdf,0);
});
test('UI roughness is squared; material metal endpoint has no diffuse and colored F0',()=>{
 near(roughnessToAlpha(.5),.25);
 assert.ok(cookTorrance(0,0,roughnessToAlpha(.2),.04,'ggx').brdf > cookTorrance(0,0,roughnessToAlpha(.8),.04,'ggx').brdf);
 const dielectric=pbrParameters(0,1.5,[.6,.2,.1]); near(dielectric.f0[0],.04);
 const metal=pbrParameters(1,2,[.6,.2,.1]); assert.deepEqual(metal.f0,[.6,.2,.1]); near(metal.diffuseWeight,0);
});
test('rendering equation lecture example is .35 and repartition preserves energy',()=>{
 near(renderingSum([.2,.2,.2],[1,.5,.25]),.35);
 for(const count of [1,3,8,16]) {
  const irradiances=repartitionIrradiance([1,.5,.25],count);
  near(irradiances.reduce((a,b)=>a+b,0),1.75);
  near(renderingSum(Array(count).fill(.2),irradiances),.35);
 }
});

test('sRGB material input agrees with linear rendering values',()=>{
 for(const c of srgbHexToLinear('#808080')) near(c,.21586050011389926);
 assert.deepEqual(srgbHexToLinear('#000000'),[0,0,0]);
 assert.deepEqual(srgbHexToLinear('#ffffff'),[1,1,1]);
});
