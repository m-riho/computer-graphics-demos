/** Browser-only image helpers. Assets are local so demos also work offline. */
export function makeSample(width=384,height=256):HTMLCanvasElement {
 const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d')!
 const g=x.createLinearGradient(0,0,width,0);g.addColorStop(0,'black');g.addColorStop(1,'white');x.fillStyle=g;x.fillRect(0,0,width,height)
 x.fillStyle='#e04432';x.fillRect(width*.12,height*.15,width*.35,height*.4)
 x.fillStyle='#20a5df';x.beginPath();x.arc(width*.7,height*.4,height*.25,0,2*Math.PI);x.fill()
 x.fillStyle='white';x.font='bold 32px sans-serif';x.fillText('RGB 2026',16,height-30)
 for(let i=0;i<width;i+=8){x.fillStyle=i%16?'black':'white';x.fillRect(i,height-15,8,15)}
 return c
}
export async function photoCanvas(url:string):Promise<HTMLCanvasElement> {
 const im=new Image();im.src=url;await im.decode()
 const c=document.createElement('canvas');c.width=384;c.height=256;const x=c.getContext('2d')!
 // Center crop only within the demo, with original source asset retained.
 const scale=Math.max(c.width/im.width,c.height/im.height);x.drawImage(im,(c.width-im.width*scale)/2,(c.height-im.height*scale)/2,im.width*scale,im.height*scale);return c
}
export function copyCanvas(target:HTMLCanvasElement,source:CanvasImageSource){const x=target.getContext('2d')!;x.clearRect(0,0,target.width,target.height);x.drawImage(source,0,0,target.width,target.height)}
