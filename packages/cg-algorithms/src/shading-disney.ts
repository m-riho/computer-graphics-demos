import { normalizeShading, crossShading, type ShadingVector as Vec3 } from './shading-geometry.ts'
/** Independently written equations from Burley 2012 §§5.3–5.6.
 * https://disneyanimation.com/publications/physically-based-shading-at-disney/
 * Uses the original 2012 isotropic Smith-G roughness remapping, not the later
 * BRDF Explorer revision's anisotropic G. Inputs/outputs are linear RGB.
 */
export interface DisneyParameters {
 baseColor:Vec3; metallic:number; roughness:number; specular:number; specularTint:number;
 anisotropic:number; subsurface:number; sheen:number; sheenTint:number; clearcoat:number; clearcoatGloss:number
}
export function disneyDefaults():DisneyParameters {
 return {baseColor:[.5,.15,.05],metallic:0,roughness:.5,specular:.5,specularTint:0,anisotropic:0,subsurface:0,sheen:0,sheenTint:.5,clearcoat:0,clearcoatGloss:1}
}
const dot=(a:Vec3,b:Vec3)=>a.reduce((s,v,i)=>s+v*b[i]!,0)
const mix=(a:number,b:number,t:number)=>a+(b-a)*t
const fifth=(x:number)=>Math.max(0,1-x)**5
const rgb=(fn:(k:number)=>number):Vec3=>[fn(0),fn(1),fn(2)]
export function disneyBRDF(normal:Vec3,tangent:Vec3,light:Vec3,view:Vec3,p:DisneyParameters) {
 const zero=():Vec3=>[0,0,0]
 const n=normalizeShading(normal),l=normalizeShading(light),v=normalizeShading(view)
 const nl=dot(n,l),nv=dot(n,v)
 if(nl<=0||nv<=0)return {diffuse:zero(),specular:zero(),sheen:zero(),clearcoat:zero(),total:zero()}
 const t=normalizeShading(rgb(k=>tangent[k]!-n[k]!*dot(tangent,n))),b=crossShading(n,t)
 const h=normalizeShading(rgb(k=>l[k]!+v[k]!)),nh=Math.max(0,dot(n,h)),lh=Math.max(0,dot(l,h))
 const lum=dot(p.baseColor,[.3,.6,.1]),tint=lum>0?rgb(k=>p.baseColor[k]!/lum):[1,1,1] as Vec3
 const fl=fifth(nl),fv=fifth(nv),fh=fifth(lh)
 const grazing=.5+2*p.roughness*lh*lh
 const diffuseShape=mix(1,grazing,fl)*mix(1,grazing,fv)
 const ss90=p.roughness*lh*lh
 const ss=1.25*(mix(1,ss90,fl)*mix(1,ss90,fv)*(1/(nl+nv)-.5)+.5)
 const diffuse=rgb(k=>p.baseColor[k]!/Math.PI*mix(diffuseShape,ss,p.subsurface)*(1-p.metallic))
 const sheen=rgb(k=>p.sheen*fh*mix(1,tint[k]!,p.sheenTint)*(1-p.metallic))
 const aspect=Math.sqrt(1-.9*p.anisotropic),ax=Math.max(.001,p.roughness**2/aspect),ay=Math.max(.001,p.roughness**2*aspect)
 const den=(dot(h,t)/ax)**2+(dot(h,b)/ay)**2+nh*nh
 const D=1/(Math.PI*ax*ay*den*den)
 const g1=(c:number,a:number)=>2*c/(c+Math.sqrt(a*a+(1-a*a)*c*c))
 const ag=(.5+.5*p.roughness)**2
 const G=g1(nl,ag)*g1(nv,ag)
 const specular=rgb(k=>{
  const f0=mix(.08*p.specular*mix(1,tint[k]!,p.specularTint),p.baseColor[k]!,p.metallic)
  return D*mix(f0,1,fh)*G/(4*nl*nv)
 })
 const ac=mix(.1,.001,p.clearcoatGloss),a2=ac*ac
 const dc=(a2-1)/(Math.PI*Math.log(a2)*(1-nh*nh+a2*nh*nh))
 const coat=.25*p.clearcoat*dc*mix(.04,1,fh)*g1(nl,.25)*g1(nv,.25)/(4*nl*nv)
 const clearcoat:Vec3=[coat,coat,coat]
 return {diffuse,specular,sheen,clearcoat,total:rgb(k=>diffuse[k]!+specular[k]!+sheen[k]!+coat)}
}
