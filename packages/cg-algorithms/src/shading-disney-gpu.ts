/** Independent GLSL counterpart of shading-disney.ts. See CPU module for sources.
 * Environment integration samples each lobe with its own normalized distribution.
 * Finite deterministic sampling is used for interactive teaching, not a path tracer.
 */
export const disneyBRDFGLSL = `
const float PI=3.141592653589793;
uniform vec3 uBase;
uniform vec4 uDisneyA; // metallic, roughness, specular, specularTint
uniform vec4 uDisneyB; // anisotropic, subsurface, sheen, sheenTint
uniform vec4 uDisneyC; // clearcoat, clearcoatGloss, exposure, environment rotation
float schlickWeight(float c){float a=max(0.0,1.0-c);return a*a*a*a*a;}
vec3 tintColor(){float lum=dot(uBase,vec3(.3,.6,.1));return lum>0.0?uBase/lum:vec3(1.0);}
vec3 mainF(float lh){
 vec3 dielectric=.08*uDisneyA.z*mix(vec3(1.0),tintColor(),uDisneyA.w);
 return mix(mix(dielectric,uBase,uDisneyA.x),vec3(1.0),schlickWeight(lh));
}
vec2 widths(){
 float aspect=sqrt(1.0-.9*uDisneyB.x),r2=uDisneyA.y*uDisneyA.y;
 return max(vec2(.001),vec2(r2/aspect,r2*aspect));
}
float smithOne(float c,float a){return 2.0*c/(c+sqrt(a*a+(1.0-a*a)*c*c));}
vec3 diffuseSheen(vec3 n,vec3 l,vec3 v){
 float nl=dot(n,l),nv=dot(n,v);if(nl<=0.0||nv<=0.0)return vec3(0.0);
 float lh=max(0.0,dot(l,normalize(l+v))),fl=schlickWeight(nl),fv=schlickWeight(nv);
 float f90=.5+2.0*uDisneyA.y*lh*lh;
 float fd=mix(1.0,f90,fl)*mix(1.0,f90,fv);
 float s90=uDisneyA.y*lh*lh;
 float ss=1.25*(mix(1.0,s90,fl)*mix(1.0,s90,fv)*(1.0/(nl+nv)-.5)+.5);
 vec3 diffuse=uBase/PI*mix(fd,ss,uDisneyB.y);
 vec3 sheen=uDisneyB.z*schlickWeight(lh)*mix(vec3(1.0),tintColor(),uDisneyB.w);
 return (diffuse+sheen)*(1.0-uDisneyA.x);
}
vec3 disneyEvaluate(vec3 n,vec3 t,vec3 b,vec3 l,vec3 v){
 float nl=dot(n,l),nv=dot(n,v);if(nl<=0.0||nv<=0.0)return vec3(0.0);
 vec3 h=normalize(l+v);float nh=max(0.0,dot(n,h)),lh=max(0.0,dot(l,h));
 vec2 a=widths(),q=vec2(dot(h,t),dot(h,b))/a;
 float denom=dot(q,q)+nh*nh,D=1.0/(PI*a.x*a.y*denom*denom);
 float ag=pow(.5+.5*uDisneyA.y,2.0);
 vec3 spec=D*mainF(lh)*smithOne(nl,ag)*smithOne(nv,ag)/(4.0*nl*nv);
 float ac=mix(.1,.001,uDisneyC.y),a2=ac*ac;
 float dc=(a2-1.0)/(PI*log(a2)*(1.0-nh*nh+a2*nh*nh));
 float coat=.25*uDisneyC.x*dc*mix(.04,1.0,schlickWeight(lh))*smithOne(nl,.25)*smithOne(nv,.25)/(4.0*nl*nv);
 return diffuseSheen(n,l,v)+spec+vec3(coat);
}
`
export const disneyVertexShader=`
attribute vec2 aPosition;
varying vec2 vUV;
void main(){vUV=aPosition;gl_Position=vec4(aPosition,0.0,1.0);}
`
export const disneyFragmentShader=`
precision highp float;
varying vec2 vUV;
uniform vec3 uView,uRight,uUp;
uniform mat3 uRotation;
uniform float uAspect,uWireframe;
${disneyBRDFGLSL}
vec3 studio(vec3 dir){
 float a=uDisneyC.w,c=cos(a),s=sin(a);
 vec3 d=vec3(c*dir.x+s*dir.z,dir.y,-s*dir.x+c*dir.z);
 vec3 sky=mix(vec3(.025),vec3(.18,.20,.24),smoothstep(-.4,1.0,d.y));
 // Two extended light panels in a generated distant environment.
 float front=max(.001,d.z);
 float key=exp(-2.0*(pow(abs((d.x/front+.7)/.55),2.0)+pow(abs((d.y/front-.95)/1.0),2.0)))*smoothstep(0.0,.2,d.z);
 float fill=exp(-2.0*(pow(abs((d.x/front-.9)/.6),2.0)+pow(abs((d.y/front-.5)/.9),2.0)))*smoothstep(0.0,.2,d.z);
 return sky+vec3(3.5)*key+vec3(1.5)*fill;
}
vec3 integrate(vec3 n,vec3 t,vec3 b,vec3 v){
 vec3 result=vec3(0.0),diff=vec3(0.0),spec=vec3(0.0),coat=vec3(0.0);
 float nv=max(.00001,dot(n,v)),ag=pow(.5+.5*uDisneyA.y,2.0);
 vec2 a=widths();float ac=mix(.1,.001,uDisneyC.y),a2=ac*ac;
 // Same sequence in reference/current views: material is the only difference.
 for(int i=0;i<64;i++){
  float u=(float(i)+.5)/64.0,phi=6.28318530718*fract(float(i)*.61803398875);
  float cp=cos(phi),sp=sin(phi);
  vec3 l=t*(sqrt(u)*cp)+b*(sqrt(u)*sp)+n*sqrt(1.0-u);
  if(uDisneyA.x<1.0)diff+=studio(l)*diffuseSheen(n,l,v)*PI;
  vec3 h=normalize(t*(a.x*sqrt(u/(1.0-u))*cp)+b*(a.y*sqrt(u/(1.0-u))*sp)+n);
  float vh=dot(v,h);
  if(vh>0.0){
   l=2.0*vh*h-v;float nl=dot(n,l),nh=max(.00001,dot(n,h));
   if(nl>0.0)spec+=studio(l)*mainF(vh)*smithOne(nl,ag)*smithOne(nv,ag)*vh/(nv*nh);
  }
  if(uDisneyC.x>0.0){
   float ch=sqrt(clamp((1.0-pow(a2,1.0-u))/(1.0-a2),0.0,1.0)),sh=sqrt(max(0.0,1.0-ch*ch));
   h=t*(sh*cp)+b*(sh*sp)+n*ch;vh=dot(v,h);
   if(vh>0.0){
    l=2.0*vh*h-v;float nl=dot(n,l);
    if(nl>0.0)coat+=studio(l)*mix(.04,1.0,schlickWeight(vh))*smithOne(nl,.25)*smithOne(nv,.25)*vh/(nv*max(.00001,ch));
   }
  }
 }
 return (diff+spec+.25*uDisneyC.x*coat)/64.0;
}
vec3 srgb(vec3 c){return mix(12.92*c,1.055*pow(c,vec3(1.0/2.4))-.055,step(vec3(.0031308),c));}
void main(){
 vec2 q=vUV*1.25*vec2(max(1.0,uAspect),max(1.0,1.0/uAspect));
 float r2=dot(q,q);
 if(r2>=1.0){gl_FragColor=vec4(mix(vec3(.055,.075,.105),vec3(.16,.19,.23),vUV.y*.5+.5),1.0);return;}
 vec3 n=normalize(uRight*q.x+uUp*q.y+uView*sqrt(1.0-r2));
 vec3 local=vec3(dot(uRotation[0],n),dot(uRotation[1],n),dot(uRotation[2],n));
 vec3 tangent=cross(vec3(0,1,0),local);
 if(length(tangent)<.00001)tangent=vec3(1,0,0);
 vec3 t=normalize(uRotation*normalize(tangent)),b=normalize(cross(n,t));
 vec3 c=integrate(n,t,b,uView)*pow(2.0,uDisneyC.z);
 c=srgb(c/(vec3(1.0)+c));
 if(uWireframe>.5 && (abs(sin(12.0*atan(local.x,local.z)))<.035 || abs(sin(12.0*acos(clamp(local.y,-1.0,1.0))))<.035))c=vec3(.1,.7,.8);
 gl_FragColor=vec4(c,1.0);
}
`
