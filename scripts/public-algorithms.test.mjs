import test from 'node:test'
import assert from 'node:assert/strict'
import * as a from '../examples/02-color-image/colorMath.ts'
const near=(x,y,t=1e-8)=>assert.ok(Math.abs(x-y)<t,`${x} != ${y}`)
test('non-finite color, gamma and luminance inputs stay finite and bounded',()=>{
 for(const v of [NaN,Infinity,-Infinity]){
  for(const x of a.hsvToRgb(v,v,v))assert.ok(Number.isFinite(x)&&x>=0&&x<=255)
  for(const x of a.rgbToHsv([v,v,v]))assert.ok(Number.isFinite(x))
  for(const x of [a.quantize(v,v),a.gammaEncode(v,v),a.gammaDecode(v,v),a.srgbEncode(v),a.reinhard(v)])assert.ok(Number.isFinite(x))
 }
 assert.equal(a.reinhard(-1),0)
})
test('center sampling preserves nearest source pixel and quantization is independent',()=>{
 assert.equal(typeof a.sampleNearest,'function')
 const rgba=new Uint8ClampedArray([0,0,0,255,64,64,64,255,128,128,128,255,255,255,255,255])
 const sampled=a.sampleNearest(rgba,4,1,2,1)
 assert.deepEqual([...sampled],[64,64,64,255,255,255,255,255])
 assert.deepEqual([...a.quantizeRgba(sampled,1)],[0,0,0,255,255,255,255,255])
 assert.deepEqual([...sampled],[64,64,64,255,255,255,255,255])
 assert.throws(()=>a.sampleNearest(rgba,NaN,1,2,1),RangeError)
})
test('8x8 orthonormal DCT has only DC for constant blocks and reconstructs edges',()=>{
 assert.equal(typeof a.dctBlock,'function')
 const dc=a.dctBlock(Array(64).fill(140));near(dc[0],96);dc.slice(1).forEach(x=>near(x,0))
 const block=Array.from({length:64},(_,i)=>i%8<4?16:240)
 a.idctBlock(a.dctBlock(block)).forEach((x,i)=>near(x,block[i]))
 const keep=a.quantizeDct(a.dctBlock(block),1)
 const coarse=a.quantizeDct(a.dctBlock(block),80)
 assert.ok(coarse.filter(x=>x===0).length>=keep.filter(x=>x===0).length)
 assert.ok(a.idctBlock(coarse.map(x=>x*80)).every(Number.isFinite))
 assert.throws(()=>a.dctBlock([1,2]),RangeError)
 assert.ok(a.jpegQuantizationStep(.01)>a.jpegQuantizationStep(1))
})
