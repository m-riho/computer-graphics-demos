import {lineCoverage} from './aliasing.ts'

export interface SignalSample {position:number;value:number}
function finite(value:number,name:string):void {
  if(!Number.isFinite(value)||Math.abs(value)>1e6)throw new RangeError(`${name}: finite value within ±1e6 required`)
}
function rate(fs:number):void {finite(fs,'sampling frequency');if(fs<1e-6)throw new RangeError('sampling frequency must be at least 1e-6')}
function count(value:number,max=4096):void {
  if(!Number.isInteger(value)||value<1||value>max)throw new RangeError(`count must be an integer from 1 to ${max}`)
}
/** 帯域制限された信号の最高周波数と比較。境界 fs = 2fmax は含めない。 */
export function nyquistSatisfied(fmax:number,fs:number):boolean {
  return Number.isFinite(fmax)&&Number.isFinite(fs)&&fmax>=0&&fs>0&&fs>2*fmax
}
/** f と f−k fs は n/fs で同じ位相を持つ。代表を [-fs/2, fs/2) に選ぶ。
 * 符号は円運動の方向を表す。実数cosだけなら正負の周波数を区別できない。
 * この代表を求めても、元の未知の周波数が特定できたことにはならない。 */
export function aliasFrequency(f:number,fs:number):number {
  finite(f,'frequency');rate(fs)
  const alias=f-fs*Math.floor(f/fs+.5)
  return Math.abs(alias)<1e-12?0:alias
}
export function cosineSignal(f:number,position:number):number {
  finite(f,'frequency');finite(position,'position')
  return Math.cos(2*Math.PI*f*position)
}
/** 初期位相0。n=0…count−1 を時刻/位置 n/fs で標本化する。 */
export function sampleSignal(f:number,fs:number,sampleCount:number):SignalSample[] {
  finite(f,'frequency');rate(fs);count(sampleCount)
  return Array.from({length:sampleCount},(_,n)=>({position:n/fs,value:cosineSignal(f,n/fs)}))
}
/** 幅1の区間 [0,1) を等間隔に標本化。位置は x=n/pixels（左端基準）。 */
export function sampleSpatialSignal(f:number,pixels:number):SignalSample[] {
  count(pixels)
  return sampleSignal(f,pixels,pixels).map(p=>({position:p.position,value:.5+.5*p.value}))
}
/** N本の同一スポークは1/N回転で同じ姿になる。
 * 最小角変位に対応する代表速度 alias(Nf,fs)/N を返す。
 * 車輪画像全体は高調波も含むため、Nfのみで厳密な復元を保証しない。 */
export function rotationState(f:number,fs:number,time:number,spokes=1) {
  finite(f,'frequency');rate(fs);finite(time,'time');count(spokes,64)
  if(time<0)throw new RangeError('time must be nonnegative')
  const sampleIndex=Math.floor(time*fs+1e-10),sampleTime=sampleIndex/fs
  const angle=(t:number)=>2*Math.PI*((f*t)%1)
  return {actualAngle:angle(time),observedAngle:angle(sampleTime),sampleTime,sampleIndex,
    apparentFrequency:aliasFrequency(spokes*f,fs)/spokes}
}
/** 数学は既存の被覆率関数を共有。Vueは返された格子を描く。 */
export function rasterizeLine(resolution:number,angle:number,antialias:boolean) {
  count(resolution,96);finite(angle,'angle')
  return Array.from({length:resolution**2},(_,i)=>{
    const x=i%resolution,y=Math.floor(i/resolution)
    return {x,y,coverage:lineCoverage(x,y,resolution,angle,antialias)}
  })
}
