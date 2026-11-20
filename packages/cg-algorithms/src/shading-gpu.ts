/** Shared GPU implementation. All inputs and lighting arithmetic are linear RGB.
 * CPU reference counterparts live in shading-classic.ts / shading-advanced.ts.
 * N points outward, L toward the light, V toward the orthographic camera.
 */
export const shadingLightingGLSL = `
const float PI = 3.141592653589793;
uniform int uModel;
uniform int uNdf;
uniform int uComponent;
uniform vec3 uLight;
uniform vec3 uView;
uniform vec3 uBase;
uniform vec3 uLightColor;
uniform float uIntensity;
uniform float uKd;
uniform float uKs;
uniform float uExponent;
uniform float uSigma;
uniform float uAlpha;
uniform float uF0;
uniform float uMetallic;
uniform float uIor;
uniform float uAmbient;
uniform vec3 uEnabled;
uniform float uAo;
vec3 safeUnit(vec3 v) { return v / max(length(v), 0.000001); }
float ndf(float nh) {
  if(nh <= 0.0) return 0.0;
  float a2=uAlpha*uAlpha, c2=nh*nh;
  if(uNdf==1) return exp((c2-1.0)/(a2*c2))/(PI*a2*c2*c2);
  float d=c2*(a2-1.0)+1.0;
  return a2/(PI*d*d);
}
float smithLambda(float c) {
  if(c<=0.0) return 1000000.0;
  float tan2=max(0.0,1.0-c*c)/max(c*c,0.0000000001);
  if(uNdf==0) return (sqrt(1.0+uAlpha*uAlpha*tan2)-1.0)*0.5;
  if(tan2<0.0000001) return 0.0;
  float a=1.0/(uAlpha*sqrt(tan2));
  if(a>=1.6) return 0.0;
  return max(0.0,(1.0-1.259*a+0.396*a*a)/(3.535*a+2.181*a*a));
}
vec3 illumination(vec3 normal, float occlusion, float floorSurface) {
  vec3 n=safeUnit(normal), l=uLight, v=uView;
  vec3 base=mix(uBase,vec3(0.36),floorSurface);
  if(uModel==0) return base;
  float nl=max(0.0,dot(n,l)),nv=max(0.0,dot(n,v));
  vec3 ambient=base*uAmbient*uEnabled.x*(1.0-uAo*occlusion);
  if(nl<=0.0 || nv<=0.0) return ambient;
  float diffuse=uKd*nl;
  if(uModel==2) {
    float sigma2=uSigma*uSigma;
    float A=1.0-0.5*sigma2/(sigma2+0.33);
    float B=0.45*sigma2/(sigma2+0.09);
    float ti=acos(clamp(nl,0.0,1.0)),to=acos(clamp(nv,0.0,1.0));
    vec3 lp=l-n*nl,vp=v-n*nv;
    float cosPhi=max(0.0,dot(safeUnit(lp),safeUnit(vp)));
    diffuse*=A+B*cosPhi*sin(max(ti,to))*tan(min(min(ti,to),1.570696));
  }
  vec3 h=safeUnit(l+v);
  float nh=max(0.0,dot(n,h)),vh=max(0.0,dot(v,h));
  float specular=0.0;
  if(uModel==3) specular=uKs*pow(max(0.0,dot(reflect(-l,n),v)),uExponent);
  if(uModel==4 || uModel==7) specular=uKs*pow(nh,uExponent);
  if(uModel==5 || uModel==6) {
    float D=ndf(nh);
    float G=1.0/(1.0+smithLambda(nl)+smithLambda(nv));
    float dielectric=pow((uIor-1.0)/(uIor+1.0),2.0);
    vec3 f0=uModel==6 ? mix(vec3(dielectric),base,uMetallic) : vec3(uF0);
    vec3 F=f0+(vec3(1.0)-f0)*pow(1.0-vh,5.0);
    vec3 brdf=D*F*G/max(4.0*nl*nv,0.00000001);
    if(uComponent==1) return vec3(D/(1.0+D));
    if(uComponent==2) return F;
    if(uComponent==3) return vec3(G);
    if(uComponent==4) return brdf;
    vec3 diffuseBRDF=(vec3(1.0)-F)*base/PI;
    if(uModel==6) diffuseBRDF*=1.0-uMetallic;
    else diffuseBRDF*=uKd;
    return ambient+(diffuseBRDF*uEnabled.y+brdf*uEnabled.z)*nl*uIntensity*uLightColor;
  }
  return ambient+(base*diffuse*uEnabled.y+vec3(specular)*uEnabled.z)*uIntensity*uLightColor;
}
`
export const shadingVertexShader = `
precision highp float;
precision highp int;
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aFaceNormal;
attribute vec2 aSurface;
attribute vec3 aRotationCenter;
uniform mat4 uMatrix;
uniform mat3 uObjectRotation;
uniform int uRotateScene;
uniform int uInterpolation;
varying vec3 vNormal;
varying vec3 vColor;
varying vec2 vSurface;
${shadingLightingGLSL}
void main() {
  // Visibility can rotate the whole scene; other demos rotate around object centers.
  mat3 rotation=mat3(1.0);
  if(uRotateScene==1 || aSurface.y<0.5) rotation=uObjectRotation;
  vec3 center=uRotateScene==1?vec3(0.0):aRotationCenter;
  vec3 position=rotation*(aPosition-center)+center;
  gl_Position=uMatrix*vec4(position,1.0);
  vNormal=rotation*aNormal;
  vSurface=aSurface;
  // Flat duplicates each face's constant normal; Gouraud evaluates at each vertex.
  vColor=illumination(rotation*(uInterpolation==1?aFaceNormal:aNormal),aSurface.x,aSurface.y);
}
`
export const shadingFragmentShader = `
precision highp float;
precision highp int;
uniform int uInterpolation;
uniform int uOverlay;
uniform vec3 uOverlayColor;
varying vec3 vNormal;
varying vec3 vColor;
varying vec2 vSurface;
${shadingLightingGLSL}
vec3 toSRGB(vec3 linear) {
  vec3 c=clamp(linear,0.0,1.0);
  return mix(12.92*c,1.055*pow(c,vec3(1.0/2.4))-0.055,step(vec3(0.0031308),c));
}
void main() {
  // Phong shading: interpolate normals, renormalize, THEN evaluate lighting.
  vec3 color=uInterpolation==0?illumination(normalize(vNormal),vSurface.x,vSurface.y):vColor;
  if(uOverlay==1) color=uOverlayColor;
  gl_FragColor=vec4(toSRGB(color),1.0);
}
`
