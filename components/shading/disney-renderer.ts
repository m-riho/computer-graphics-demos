import { disneyVertexShader, disneyFragmentShader } from '../../packages/cg-algorithms/src/shading-disney-gpu.ts'
import { directionFromAngles, normalizeShading, crossShading, shadingObjectRotation, linearColor } from '../../packages/cg-algorithms/src/shading-geometry.ts'
import type { ShadingSettings } from './shading-renderer.ts'
/** Analytic sphere avoids polygon silhouettes; distant generated studio environment. */
export function createDisneyRenderer(canvas:HTMLCanvasElement) {
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true})
 if(!gl)throw new Error('WebGLを利用できません。')
 const program=gl.createProgram()!,shaders:WebGLShader[]=[]
 try {
  for(const [type,source] of [[gl.VERTEX_SHADER,disneyVertexShader],[gl.FRAGMENT_SHADER,disneyFragmentShader]] as const){
   const shader=gl.createShader(type)!;shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader)
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader)??'Shader compile failed')
   gl.attachShader(program,shader)
  }
  gl.linkProgram(program)
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)??'Shader link failed')
 }catch(error){shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);throw error}
 const buffer=gl.createBuffer()!,locations=new Map<string,WebGLUniformLocation|null>()
 const loc=(name:string)=>{if(!locations.has(name))locations.set(name,gl.getUniformLocation(program,name));return locations.get(name)!}
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW)
 const position=gl.getAttribLocation(program,'aPosition')
 return {
  render(_model:string,settings:ShadingSettings={}){
   const number=(key:string,def:number)=>typeof settings[key]==='number'&&Number.isFinite(settings[key])?settings[key] as number:def
   const unit=(key:string,def:number)=>Math.max(0,Math.min(1,number(key,def)))
   const scale=Math.min(1,640/Math.max(1,canvas.clientWidth),520/Math.max(1,canvas.clientHeight))
   canvas.width=Math.max(1,Math.round(canvas.clientWidth*scale));canvas.height=Math.max(1,Math.round(canvas.clientHeight*scale))
   gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0)
   const view=directionFromAngles(number('viewAngle',65),number('viewAzimuth',0)),right=normalizeShading(crossShading([0,1,0],view)),up=crossShading(view,right)
   gl.uniform3fv(loc('uView'),view);gl.uniform3fv(loc('uRight'),right);gl.uniform3fv(loc('uUp'),up)
   gl.uniformMatrix3fv(loc('uRotation'),false,shadingObjectRotation(number('objectPitch',0),number('objectYaw',0)))
   gl.uniform3fv(loc('uBase'),linearColor(String(settings.baseColor??'#c97943')))
   gl.uniform4fv(loc('uDisneyA'),[unit('metallic',0),unit('roughness',.5),unit('specular',.5),unit('specularTint',0)])
   gl.uniform4fv(loc('uDisneyB'),[unit('anisotropic',0),unit('subsurface',0),unit('sheen',0),unit('sheenTint',.5)])
   gl.uniform4fv(loc('uDisneyC'),[unit('clearcoat',0),unit('clearcoatGloss',1),number('exposure',0),number('environmentRotation',0)*Math.PI/180])
   gl.uniform1f(loc('uAspect'),canvas.width/canvas.height);gl.uniform1f(loc('uWireframe'),settings.wireframe?1:0)
   gl.drawArrays(gl.TRIANGLES,0,3)
  },
  dispose(releaseContext=true){gl.deleteBuffer(buffer);shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);if(releaseContext)gl.getExtension('WEBGL_lose_context')?.loseContext()}
 }
}
