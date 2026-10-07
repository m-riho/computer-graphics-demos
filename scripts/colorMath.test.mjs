import test from 'node:test'
import assert from 'node:assert/strict'
import {hsvToRgb,rgbToHsv,quantize,gammaEncode,gammaDecode,srgbEncode,reinhard,lineCoverage,bresenham} from '../examples/02-color-image/colorMath.ts'
test('RGB/HSV primary colors, grayscale, black and hue wrap',()=>{
 for(const [rgb,hsv] of [[[255,0,0],[0,100,100]],[[0,255,0],[120,100,100]],[[0,0,255],[240,100,100]],[[0,0,0],[0,0,0]],[[255,255,255],[0,0,100]]]){assert.deepEqual(rgbToHsv(rgb),hsv);assert.deepEqual(hsvToRgb(...hsv),rgb)}
 assert.deepEqual(hsvToRgb(360,100,100),[255,0,0]);assert.deepEqual(hsvToRgb(-120,100,100),[0,0,255])
 for(let r=0;r<=255;r+=51)for(let g=0;g<=255;g+=51)for(let b=0;b<=255;b+=51)assert.deepEqual(hsvToRgb(...rgbToHsv([r,g,b])),[r,g,b])
})
test('quantization levels and endpoints',()=>{for(const bits of [1,2,4,8]){const levels=new Set(Array.from({length:4097},(_,i)=>quantize(i/4096,bits)));assert.equal(levels.size,2**bits);assert.equal(quantize(0,bits),0);assert.equal(quantize(1,bits),1)}})
test('gamma round trip and sRGB breakpoint',()=>{for(const g of [1,2.2,3])for(const l of [0,.01,.18,.5,1])assert.ok(Math.abs(gammaDecode(gammaEncode(l,g),g)-l)<1e-12);assert.ok(Math.abs(srgbEncode(.0031308)-.040449936)<1e-10)})
test('tone mapping is bounded and monotonic',()=>{let last=-1;for(const l of [0,.01,.18,1,4,16,1000]){const y=reinhard(l);assert.ok(y>=last&&y<1);last=y}})
test('AA has partial coverage while point sampling is binary',()=>{const samples=[];for(let y=0;y<20;y++)for(let x=0;x<20;x++){assert.ok([0,1].includes(lineCoverage(x,y,20,25,false)));samples.push(lineCoverage(x,y,20,25,true))}assert.ok(samples.some(x=>x>0&&x<1))})
test('Bresenham every octant, endpoint and adjacent pixels',()=>{for(const end of [[8,3],[3,8],[-8,3],[3,-8],[-3,-8],[0,0],[0,7],[7,0]]){const pts=bresenham(0,0,...end);assert.deepEqual(pts.at(-1),end);assert.equal(pts.length,Math.max(Math.abs(end[0]),Math.abs(end[1]))+1);for(let i=1;i<pts.length;i++)assert.equal(Math.max(Math.abs(pts[i][0]-pts[i-1][0]),Math.abs(pts[i][1]-pts[i-1][1])),1)}})
