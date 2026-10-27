import test from 'node:test'
import assert from 'node:assert/strict'
import {torusMesh,sampleMesh,lsystem,turtle,midpoint,randomSeries,valueNoise,sphereSdf,combineSdf} from '../packages/cg-algorithms/src/natural-modeling.ts'
test('surface samples stay on their mesh triangles and are reproducible',()=>{const m={vertices:[[0,0,0],[1,0,0],[0,1,0]],faces:[[0,1,2]]};const p=sampleMesh(m,1000,4);assert.equal(p.length,1000);for(const [x,y,z] of p){assert.equal(z,0);assert.ok(x>=0&&y>=0&&x+y<=1+1e-12)}assert.deepEqual(p,sampleMesh(m,1000,4));assert.equal(torusMesh().faces.length,960)})
test('branch rewriting and turtle restore branch state',()=>{assert.equal(lsystem(2).split('F').length-1,25);const s=turtle('F[+F]F',90);assert.equal(s.length,3);assert.ok(Math.abs(s[2][2])<1e-10);assert.ok(Math.abs(s[2][3]-2)<1e-10)})
test('midpoint preserves endpoints and seed',()=>{const a=midpoint(5,7,.5);assert.equal(a.length,33);assert.equal(a[0],0);assert.equal(a.at(-1),0);assert.deepEqual(a,midpoint(5,7,.5));assert.notDeepEqual(a,midpoint(5,8,.5))})
test('noise is continuous across lattice boundary',()=>{const v=randomSeries(10,2);assert.ok(Math.abs(valueNoise(3-1e-5,v)-valueNoise(3+1e-5,v))<1e-7)})
test('negative-inside SDF Boolean signs, subtraction order',()=>{assert.equal(sphereSdf([0,0,0],[0,0,0],1),-1);assert.equal(sphereSdf([2,0,0],[0,0,0],1),1);assert.ok(combineSdf(-1,1,'difference')<0);assert.ok(combineSdf(-1,-1,'difference')>0);assert.ok(combineSdf(-1,1,'union')<0);assert.ok(combineSdf(-1,1,'intersection')>0)})
