import { ambientOcclusion, createShadingSphere, crossShading, directionFromAngles, linearColor, normalizeShading, type ShadingVector } from '../../packages/cg-algorithms/src/shading-geometry'
import { shadingVertexShader, shadingFragmentShader } from '../../packages/cg-algorithms/src/shading-gpu'
export type ShadingSettings = Record<string,number|string|boolean>
/** Small WebGL 1 renderer, no external engine. Orthographic V is constant. */
export function createShadingRenderer(canvas: HTMLCanvasElement) {
  const context=canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:true})
  if(!context) throw new Error('WebGL を利用できません。ブラウザのハードウェアアクセラレーションを確認してください。')
  const gl:WebGLRenderingContext=context
  const shaders:WebGLShader[]=[],buffers:WebGLBuffer[]=[]
  const program=gl.createProgram()!
  function compile(type:number,source:string) {
    const shader=gl!.createShader(type)!
    shaders.push(shader);gl!.shaderSource(shader,source);gl!.compileShader(shader)
    if(!gl!.getShaderParameter(shader,gl!.COMPILE_STATUS)) throw new Error(`Shader compile: ${gl!.getShaderInfoLog(shader)}`)
    gl!.attachShader(program,shader)
  }
  try {
    compile(gl.VERTEX_SHADER,shadingVertexShader);compile(gl.FRAGMENT_SHADER,shadingFragmentShader)
    gl.linkProgram(program)
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(`Shader link: ${gl.getProgramInfoLog(program)}`)
  } catch(error) {shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);throw error}
  const uniforms=new Map<string,WebGLUniformLocation|null>()
  const uniform=(name:string)=>{if(!uniforms.has(name)) uniforms.set(name,gl.getUniformLocation(program,name));return uniforms.get(name)!}
  const f=(name:string,v:number)=>gl.uniform1f(uniform(name),v)
  const integer=(name:string,v:number)=>gl.uniform1i(uniform(name),v)
  const vec=(name:string,v:number[])=>gl.uniform3fv(uniform(name),v)
  const attributes=['aPosition','aNormal','aFaceNormal','aSurface'].map(name=>gl.getAttribLocation(program,name))
  for(let i=0;i<4;i++) buffers.push(gl.createBuffer()!)
  let geometryKey='',data:number[][]=[],surfaceCount=0,wireStart=0,wireCount=0,normalStart=0,normalCount=0
  function updateGeometry(subdivisions:number,floor:boolean,secondSphere:boolean) {
    const key=`${subdivisions}:${floor}:${secondSphere}`
    if(key===geometryKey) return
    geometryKey=key
    const sphere=createShadingSphere(subdivisions)
    data=[Array.from(sphere.positions),Array.from(sphere.normals),Array.from(sphere.faceNormals),[]]
    const p=data[0]!,n=data[1]!,fn=data[2]!,surface=data[3]!
    for(let i=0;i<p.length;i+=3) surface.push(ambientOcclusion(p.slice(i,i+3) as ShadingVector,n.slice(i,i+3) as ShadingVector,floor),0)
    if(secondSphere) {
      // A second object makes depth ordering visible in the D01 comparison.
      for(let i=0;i<sphere.positions.length;i+=3) {
        const v=Array.from(sphere.positions.slice(i,i+3))
        p.push(v[0]!*.65+.8,v[1]!*.65-.35,v[2]!*.65+.35)
        n.push(...Array.from(sphere.normals.slice(i,i+3)));fn.push(...Array.from(sphere.faceNormals.slice(i,i+3)));surface.push(0,0)
      }
    }
    if(floor) {
      const steps=32,size=3
      const vertex=(x:number,z:number)=>{p.push(x,-1,z);n.push(0,1,0);fn.push(0,1,0);surface.push(ambientOcclusion([x,-1,z],[0,1,0],true),1)}
      for(let x=0;x<steps;x++)for(let z=0;z<steps;z++) {
        const a=-size+x*size*2/steps,b=-size+z*size*2/steps,d=size*2/steps
        vertex(a,b);vertex(a,b+d);vertex(a+d,b);vertex(a+d,b);vertex(a,b+d);vertex(a+d,b+d)
      }
    }
    surfaceCount=p.length/3;wireStart=surfaceCount
    const lineVertex=(v:ShadingVector)=>{p.push(...v);n.push(0,1,0);fn.push(0,1,0);surface.push(0,0)}
    for(let i=0;i<sphere.positions.length;i+=9)for(const [a,b]of [[0,3],[3,6],[6,0]])for(const j of [a!,b!]) lineVertex(Array.from(sphere.positions.slice(i+j,i+j+3)).map(v=>v*1.002) as ShadingVector)
    if(secondSphere) for(let i=0;i<sphere.positions.length;i+=9)for(const [a,b]of [[0,3],[3,6],[6,0]])for(const j of [a!,b!]) {
      const v=Array.from(sphere.positions.slice(i+j,i+j+3))
      lineVertex([v[0]!*.652+.8,v[1]!*.652-.35,v[2]!*.652+.35])
    }
    // Floor wireframe uses a coarser grid for legibility.
    if(floor)for(let j=-3;j<=3;j+=.5) {lineVertex([j,-.997,-3]);lineVertex([j,-.997,3]);lineVertex([-3,-.997,j]);lineVertex([3,-.997,j])}
    wireCount=p.length/3-wireStart;normalStart=p.length/3
    const seen=new Set<string>()
    for(let i=0;i<sphere.positions.length;i+=3) {
      const v=Array.from(sphere.positions.slice(i,i+3)) as ShadingVector,key=v.map(x=>x.toFixed(5)).join(',')
      if(seen.has(key))continue
      seen.add(key);lineVertex(v.map(x=>x*1.004) as ShadingVector);lineVertex(v.map(x=>x*1.15) as ShadingVector)
    }
    normalCount=p.length/3-normalStart
    data.forEach((values,i)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffers[i]!);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW)})
  }
  function render(model:string,settings:ShadingSettings={}) {
    const number=(key:string,fallback:number)=> typeof settings[key]==='number'&&Number.isFinite(settings[key])?settings[key] as number:fallback
    const bool=(key:string,fallback:boolean)=>typeof settings[key]==='boolean'?settings[key] as boolean:fallback
    const floor=bool('floor',false),subdivisions=Math.max(0,Math.min(3,Math.round(number('subdivisions',3))))
    gl.useProgram(program);updateGeometry(subdivisions,floor,bool('secondSphere',false))
    const dpr=Math.min(window.devicePixelRatio||1,2),width=Math.max(1,Math.round(canvas.clientWidth*dpr)),height=Math.max(1,Math.round(canvas.clientHeight*dpr))
    if(canvas.width!==width||canvas.height!==height) {canvas.width=width;canvas.height=height}
    gl.viewport(0,0,width,height);gl.clearColor(.035,.055,.09,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK)
    const view=directionFromAngles(number('viewAngle',65),number('viewAzimuth',25))
    const right=normalizeShading(crossShading(Math.abs(view[1])>.999?[0,0,-1]:[0,1,0],view)),up=crossShading(view,right)
    const extent=floor?2.2:1.4,aspect=width/height,sx=1/(extent*Math.max(1,aspect)),sy=1/(extent*Math.max(1,1/aspect))
    // Column-major orthographic view. Floor framing targets Y=-0.35.
    const targetY=floor?-.35:0
    const matrix=new Float32Array([right[0]*sx,up[0]*sy,-view[0]/10,0,right[1]*sx,up[1]*sy,-view[1]/10,0,right[2]*sx,up[2]*sy,-view[2]/10,0,-right[1]*targetY*sx,-up[1]*targetY*sy,view[1]*targetY/10,1])
    gl.uniformMatrix4fv(uniform('uMatrix'),false,matrix)
    data.forEach((_,i)=>{const location=attributes[i]!;if(location<0)return;gl.bindBuffer(gl.ARRAY_BUFFER,buffers[i]!);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,i===3?2:3,gl.FLOAT,false,0,0)})
    const models:Record<string,number>={visible:0,wireframe:0,lambert:1,'oren-nayar':2,phong:3,'blinn-phong':4,flat:4,gouraud:4,smooth:4,'cook-torrance':5,pbr:6,ambient:7}
    integer('uModel',models[model]??1);integer('uInterpolation',model==='flat'?1:model==='gouraud'?2:0)
    integer('uNdf',settings.ndf==='beckmann'?1:0)
    integer('uComponent',({d:1,f:2,g:3,brdf:4} as Record<string,number>)[String(settings.component)]??0)
    vec('uLight',directionFromAngles(number('lightAngle',35),number('lightAzimuth',0)));vec('uView',view)
    vec('uBase',linearColor(String(settings.baseColor??'#619bd1')));vec('uLightColor',linearColor(String(settings.lightColor??'#ffffff')))
    f('uIntensity',Math.max(0,number('intensity',1)));f('uKd',Math.max(0,number('kd',.7)));f('uKs',Math.max(0,number('ks',.6)));f('uExponent',Math.max(.01,number('exponent',32)))
    f('uSigma',Math.max(0,number('sigma',30))*Math.PI/180);f('uAlpha',Math.max(.001,Math.min(1,number('alpha',number('roughness',.45)**2))))
    f('uF0',Math.max(0,Math.min(1,number('f0',.04))));f('uMetallic',Math.max(0,Math.min(1,number('metallic',0))));f('uIor',Math.max(1,number('ior',1.5)))
    // No hidden ambient is added to Lambert/Oren/Phong demonstrations.
    f('uAmbient',Math.max(0,number('ambient',model==='ambient'?.12:0)))
    vec('uEnabled',[bool('ambientOn',true)?1:0,bool('diffuseOn',true)?1:0,bool('specularOn',true)?1:0]);f('uAo',bool('ao',false)?1:0)
    integer('uOverlay',0)
    if(model==='wireframe') {integer('uOverlay',1);vec('uOverlayColor',[.035,.055,.09])}
    gl.drawArrays(gl.TRIANGLES,0,surfaceCount)
    if(model==='wireframe'||bool('wireframe',false)) {integer('uOverlay',1);vec('uOverlayColor',[.06,.6,.66]);gl.drawArrays(gl.LINES,wireStart,wireCount)}
    if(bool('normals',false)) {integer('uOverlay',1);vec('uOverlayColor',[1,.6,.08]);gl.drawArrays(gl.LINES,normalStart,normalCount)}
  }
  return { render, dispose(releaseContext=true) {buffers.forEach(buffer=>gl.deleteBuffer(buffer));shaders.forEach(shader=>gl.deleteShader(shader));gl.deleteProgram(program);if(releaseContext)gl.getExtension('WEBGL_lose_context')?.loseContext()} }
}
