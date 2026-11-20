import test from 'node:test'
import assert from 'node:assert/strict'
import { diffuseRGB, displayRGB, renderDiffuseSphere } from '../packages/cg-algorithms/src/shading-light-color.ts'
test('p.26: red material under white and blue light',()=>{
 assert.deepEqual(diffuseRGB([.8,.04,.02],[1,1,1]),[.8,.04,.02])
 assert.deepEqual(diffuseRGB([.8,.04,.02],[0,0,1]),[0,0,.02])
 assert.deepEqual(diffuseRGB([1,0,0],[0,1,1]),[0,0,0])
 assert.deepEqual(diffuseRGB([1,1,1],[.2,.5,.8]),[.2,.5,.8])
})
test('cosine, intensity, darkness and input validation',()=>{
 assert.deepEqual(diffuseRGB([.8,.04,.02],[1,1,1],.5,.5),[.2,.01,.005])
 assert.deepEqual(diffuseRGB([1,1,1],[1,1,1],-1),[0,0,0])
 assert.deepEqual(diffuseRGB([1,1,1],[0,0,0]),[0,0,0])
 for(const v of [NaN,Infinity,-.1,1.1])assert.throws(()=>diffuseRGB([v,0,0],[1,1,1]),RangeError)
 assert.throws(()=>diffuseRGB([1,1,1],[1,1,1],NaN),RangeError)
})
test('display encoding is sRGB, not raw linear values',()=>{
 assert.deepEqual(displayRGB([0,.5,1]),[0,188,255])
 assert.deepEqual(displayRGB([0,0,.02]),[0,0,39])
})
test('sphere center matches the displayed calculation and dark surfaces stay dark',()=>{
 const pixels=renderDiffuseSphere([.8,.04,.02],[0,0,1],0,1,101)
 const at=(x,y)=>Array.from(pixels.slice((y*101+x)*4,(y*101+x)*4+4))
 assert.deepEqual(at(50,50),[0,0,39,255])
 const black=renderDiffuseSphere([1,0,0],[0,1,1],0,1,101)
 assert.deepEqual(Array.from(black.slice((50*101+50)*4,(50*101+50)*4+4)),[0,0,0,255])
 assert.deepEqual(at(0,0),[0,0,0,0])
})
