/** Integer error accumulation; includes both endpoints in every octant. */
export function bresenham(x0:number,y0:number,x1:number,y1:number):[number,number][] {
 if (![x0,y0,x1,y1].every(v=>Number.isInteger(v)&&Math.abs(v)<=10000)) throw new RangeError('座標は-10000〜10000の整数です')
 const pts:[number,number][]=[],dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1
 let err=dx+dy
 for(;;){pts.push([x0,y0]);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx}if(e2<=dx){err+=dx;y0+=sy}}
 return pts
}
