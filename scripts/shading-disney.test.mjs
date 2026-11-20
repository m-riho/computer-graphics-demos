import test from 'node:test'
import assert from 'node:assert/strict'
import { disneyDefaults, disneyBRDF } from '../packages/cg-algorithms/src/shading-disney.ts'
const N=[0,0,1],T=[1,0,0],L=[.5,.2,Math.sqrt(.71)],V=[-.2,.3,Math.sqrt(.87)]
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`)
test('Disney BRDF is reciprocal and finite at material endpoints',()=>{
 for(const roughness of [0,.5,1])for(const metallic of [0,1])for(const clearcoatGloss of [0,1]){
  const p={...disneyDefaults(),roughness,metallic,clearcoat:1,clearcoatGloss,sheen:1,subsurface:1,anisotropic:1}
  const a=disneyBRDF(N,T,L,V,p),b=disneyBRDF(N,T,V,L,p)
  a.total.forEach((x,i)=>{assert.ok(Number.isFinite(x)&&x>=0);near(x,b.total[i])})
 }
 assert.deepEqual(disneyBRDF(N,T,[0,0,-1],V,disneyDefaults()).total,[0,0,0])
})
test('metal removes diffuse and sheen; its F0 color is baseColor',()=>{
 const p={...disneyDefaults(),metallic:1,sheen:1}
 const a=disneyBRDF(N,T,L,V,p),b=disneyBRDF(N,T,L,V,{...p,subsurface:1,specular:0,specularTint:1})
 assert.deepEqual(a.diffuse,[0,0,0]);assert.deepEqual(a.sheen,[0,0,0])
 a.total.forEach((x,i)=>near(x,b.total[i]))
})
test('inactive sheen and coat tint/gloss have no effect',()=>{
 const p=disneyDefaults(),a=disneyBRDF(N,T,L,V,p)
 const b=disneyBRDF(N,T,L,V,{...p,sheenTint:1,clearcoatGloss:0})
 a.total.forEach((x,i)=>near(x,b.total[i]))
})
test('specular maps to F0=0.08*s and coat adds independent reflection',()=>{
 const p={...disneyDefaults(),baseColor:[0,0,0],roughness:.5}
 const a=disneyBRDF(N,T,N,N,p),b=disneyBRDF(N,T,N,N,{...p,specular:1})
 near(b.specular[0],2*a.specular[0])
 const d=1/(Math.PI*.25**2);near(a.specular[0],d*.04/4)
 const c=disneyBRDF(N,T,L,V,{...p,clearcoat:1})
 assert.ok(c.clearcoat[0]>0)
})
test('anisotropy changes tangent directions and zero anisotropy is rotation invariant',()=>{
 const p={...disneyDefaults(),metallic:1,anisotropic:0}
 const otherT=[0,1,0]
 disneyBRDF(N,T,L,V,p).total.forEach((x,i)=>near(x,disneyBRDF(N,otherT,L,V,p).total[i]))
 assert.notDeepEqual(disneyBRDF(N,T,L,V,{...p,anisotropic:1}).total,disneyBRDF(N,otherT,L,V,{...p,anisotropic:1}).total)
})

test('Disney GLSL matches CPU equations for all parameter groups',async()=>{
 const {chromium}=await import('playwright-chromium')
 const {disneyBRDFGLSL,disneyVertexShader}=await import('../packages/cg-algorithms/src/shading-disney-gpu.ts')
 const {linearToSrgb}=await import('../packages/cg-algorithms/src/shading-geometry.ts')
 const samples=[
  disneyDefaults(),{...disneyDefaults(),metallic:1},{...disneyDefaults(),subsurface:1},
  {...disneyDefaults(),sheen:1,sheenTint:1,specularTint:1},
  {...disneyDefaults(),clearcoat:1,clearcoatGloss:0,anisotropic:1},
  {...disneyDefaults(),clearcoat:1,clearcoatGloss:1,roughness:0},
  {...disneyDefaults(),roughness:1,anisotropic:.8,specular:1}
 ]
 const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl']})
 try {
  const page=await browser.newPage()
  const values=await page.evaluate(({source,vertex,samples,L,V})=>{
   const canvas=document.createElement('canvas');canvas.width=8;canvas.height=8;const gl=canvas.getContext('webgl')
   const program=gl.createProgram()
   const fragment='precision highp float;'+source+'uniform vec3 testL,testV; void main(){vec3 c=disneyEvaluate(vec3(0,0,1),vec3(1,0,0),vec3(0,1,0),testL,testV);c=c/(vec3(1)+c);c=mix(12.92*c,1.055*pow(c,vec3(1.0/2.4))-.055,step(vec3(.0031308),c));gl_FragColor=vec4(c,1);}'
   for(const [kind,code] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
    const shader=gl.createShader(kind);gl.shaderSource(shader,code);gl.compileShader(shader);assertCompile(shader);gl.attachShader(program,shader)
   }
   function assertCompile(shader){if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader))}
   gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program))
   gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW)
   const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0)
   const uniform=n=>gl.getUniformLocation(program,n)
   gl.uniform3fv(uniform('testL'),L);gl.uniform3fv(uniform('testV'),V)
   return samples.map(p=>{
    gl.uniform3fv(uniform('uBase'),p.baseColor)
    gl.uniform4fv(uniform('uDisneyA'),[p.metallic,p.roughness,p.specular,p.specularTint])
    gl.uniform4fv(uniform('uDisneyB'),[p.anisotropic,p.subsurface,p.sheen,p.sheenTint])
    gl.uniform4fv(uniform('uDisneyC'),[p.clearcoat,p.clearcoatGloss,0,0])
    gl.drawArrays(gl.TRIANGLES,0,3);const out=new Uint8Array(4);gl.readPixels(4,4,1,1,gl.RGBA,gl.UNSIGNED_BYTE,out);return [...out]
   })
  },{source:disneyBRDFGLSL,vertex:disneyVertexShader,samples,L,V})
  for(const [i,p] of samples.entries()){
   const expected=disneyBRDF(N,T,L,V,p).total.map(c=>255*linearToSrgb(c/(1+c)))
   expected.forEach((v,k)=>assert.ok(Math.abs(values[i][k]-v)<=2,`GPU mismatch sample ${i}, channel ${k}`))
  }
 }finally{await browser.close()}
})
