import { linearColor } from './shading-geometry.ts'

/** Lecture 07: scalar reflection math. Angles are degrees from N, in one plane.
 * N=(0,1,0); positive angle points along +Z, negative along -Z.
 * References: PBRT 4e §§9.3,9.6; lecture07 appendix. All RGB inputs are linear.
 */
export type NdfKind = 'ggx' | 'beckmann';
export type LobeKind = 'lambert' | 'phong' | 'blinn-phong';
const radians = (degrees: number) => degrees * Math.PI / 180;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const roughnessToAlpha = (roughness: number): number => Math.max(.001, clamp01(roughness) ** 2);
export const lambertBrdf = (reflectance: number): number => clamp01(reflectance) / Math.PI;
/** Empirical highlight shape: deliberately NOT described as a normalized BRDF. */
export function empiricalLobe(kind: LobeKind, lightAngle: number, viewAngle: number, exponent: number): number {
 if (Math.abs(lightAngle)>=90 || Math.abs(viewAngle)>=90) return 0;
 if(kind==='lambert') return lambertBrdf(.6);
 const angle = kind==='phong' ? lightAngle+viewAngle : (lightAngle+viewAngle)/2;
 return Math.max(0, Math.cos(radians(angle))) ** Math.max(1,exponent);
}
/** Isotropic NDF D(m), sr^-1. Integral D(m) cos(theta_m) dω_m = 1. */
export function ndf(kind: NdfKind, cosTheta: number, alpha: number): number {
 const c=clamp01(cosTheta), a=Math.max(.001,alpha);
 if(c<=0) return 0;
 if(kind==='ggx') return a*a / (Math.PI * (1+(a*a-1)*c*c)**2);
 return Math.exp(-(1-c*c)/(a*a*c*c)) / (Math.PI*a*a*c**4);
}
/** Sample p(m)=D(m) cos(theta_m), NOT D alone or a uniform hemisphere. */
export function sampleNdf(kind:NdfKind, alpha:number, u:number, v:number):[number,number,number] {
 const a=Math.max(.001,alpha), q=Math.max(0,Math.min(1-1e-12,u));
 const tanSquared=kind==='ggx' ? a*a*q/(1-q) : -a*a*Math.log(1-q);
 const cosTheta=1/Math.sqrt(1+tanSquared), sinTheta=Math.sqrt(1-cosTheta*cosTheta), phi=2*Math.PI*v;
 return [sinTheta*Math.cos(phi),cosTheta,sinTheta*Math.sin(phi)];
}
export function projectedNdfIntegral(kind:NdfKind, alpha:number, steps=16000):number {
 const delta=Math.PI/(2*steps); let sum=0;
 for(let i=0;i<steps;i++){const theta=(i+.5)*delta; sum+=ndf(kind,Math.cos(theta),alpha)*Math.cos(theta)*Math.sin(theta)*2*Math.PI*delta;}
 return sum;
}
export const schlick = (cosTheta:number, f0:number):number => f0+(1-f0)*(1-clamp01(cosTheta))**5;
/** Unpolarized, lossless dielectric interface. Reflectance is power ratio. */
export function fresnelDielectric(angle:number, etaIncident:number, etaTransmitted:number):{reflectance:number;transmittedAngle:number|null;totalInternalReflection:boolean;f0:number} {
 const ei=Math.max(.001,etaIncident), et=Math.max(.001,etaTransmitted), theta=radians(Math.max(0,Math.min(90,angle)));
 const f0=((ei-et)/(ei+et))**2;
 if(ei===et) return {reflectance:0,transmittedAngle:angle,totalInternalReflection:false,f0};
 const sinT=ei/et*Math.sin(theta);
 if(sinT>=1) return {reflectance:1,transmittedAngle:null,totalInternalReflection:true,f0};
 const ci=Math.cos(theta), ct=Math.sqrt(1-sinT*sinT);
 const rs=((ei*ci-et*ct)/(ei*ci+et*ct))**2, rp=((et*ci-ei*ct)/(et*ci+ei*ct))**2;
 return {reflectance:(rs+rp)/2,transmittedAngle:Math.asin(sinT)*180/Math.PI,totalInternalReflection:false,f0};
}
/** Beckmann uses the standard rational approximation (a>=1.6 => Lambda=0). */
export function smithLambda(kind:NdfKind, cosTheta:number, alpha:number):number {
 if(cosTheta<=0) return Infinity;
 const tanTheta=Math.sqrt(Math.max(0,1-cosTheta*cosTheta))/cosTheta;
 if(tanTheta===0) return 0;
 if(kind==='ggx') return (Math.sqrt(1+alpha*alpha*tanTheta*tanTheta)-1)/2;
 const a=1/(Math.max(.001,alpha)*tanTheta);
 return a>=1.6 ? 0 : Math.max(0,(1-1.259*a+.396*a*a)/(3.535*a+2.181*a*a));
}
export function cookTorrance(lightAngle:number, viewAngle:number, alpha:number, f0:number, kind:NdfKind='ggx'):{D:number;F:number;G:number;brdf:number;nDotL:number;nDotV:number} {
 const nl=Math.cos(radians(lightAngle)), nv=Math.cos(radians(viewAngle));
 if(nl<=1e-8 || nv<=1e-8) return {D:0,F:0,G:0,brdf:0,nDotL:Math.max(0,nl),nDotV:Math.max(0,nv)};
 const halfAngle=(lightAngle+viewAngle)/2;
 const D=ndf(kind,Math.cos(radians(halfAngle)),alpha), F=schlick(Math.cos(radians(lightAngle-halfAngle)),f0);
 const G=1/(1+smithLambda(kind,nl,alpha)+smithLambda(kind,nv,alpha));
 return {D,F,G,brdf:D*F*G/(4*nl*nv),nDotL:nl,nDotV:nv};
}
/** Metallic workflow teaching subset, not a full Blender Principled BSDF. */
export function pbrParameters(metallic:number, ior:number, baseColor:[number,number,number]):{f0:[number,number,number];diffuseWeight:number} {
 const m=clamp01(metallic), dielectric=((ior-1)/(ior+1))**2;
 return {f0:baseColor.map(c=>dielectric*(1-m)+c*m) as [number,number,number],diffuseWeight:1-m};
}
/** Use the same sRGB transfer function as the WebGL renderer's inputs. */
export function srgbHexToLinear(hex:string):[number,number,number] {
 return linearColor(hex);
}

/** Repartition same total irradiance, so merely changing count never adds power. */
export function repartitionIrradiance(values:number[], count:number):number[] {
 const n=Math.max(1,Math.round(count)), total=values.reduce((sum,x)=>sum+Math.max(0,x),0);
 return Array.from({length:n},()=>total/n);
}
export function renderingSum(brdfs:number[], irradiances:number[]):number {
 return irradiances.reduce((sum,e,i)=>sum+(brdfs[i]??0)*Math.max(0,e),0);
}
export function runAdvancedExample(topic:string):unknown {
 switch(topic){
 case 'brdf-lobe': return {reflectance:.6,lambertBrdf:lambertBrdf(.6),unit:'sr⁻¹'};
 case 'microfacet-ndf': return {alpha:.4,projectedIntegral:projectedNdfIntegral('ggx',.4),sample:sampleNdf('ggx',.4,.5,.25)};
 case 'fresnel': return fresnelDielectric(60,1,1.5);
 case 'cook-torrance': return cookTorrance(35,-20,.25,.04,'ggx');
 case 'principled': return pbrParameters(.8,1.5,srgbHexToLinear('#c99155'));
 case 'rendering-equation': return {irradiances:[1,.5,.25],brdf:.2,radiance:renderingSum([.2,.2,.2],[1,.5,.25]),unit:'W/(m²·sr)'};
 default: throw new Error(`Unknown advanced topic: ${topic}`);
 }
}
