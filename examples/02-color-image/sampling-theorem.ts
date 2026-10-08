import {cosineSignal,sampleSignal,sampleSpatialSignal,nyquistSatisfied,aliasFrequency,rotationState} from '../../packages/cg-algorithms/src/sampling-theorem.ts'

/** 観測点だけから、元の信号を一意に選べるでしょうか？ */
export function runExample() {
  const f=4,fs=6 // Hz。fs > 2f を満たさない例。
  const alias=aliasFrequency(f,fs) // −2 Hz：円運動では逆向きの代表解。
  const samples=sampleSignal(f,fs,7) // 時刻 t=n/fs、x(t)=cos(2πft)
  const comparison=samples.map(p=>({
    t:p.position,original:p.value,alias:cosineSignal(alias,p.position),
  })) // 途中の曲線は違うのに、観測時刻の値は一致する。

  // 時間t → 位置x、Hz → 区間幅1当たりの周期数。
  // 7周期の縞を8点で標本化すると、1周期のcos縞とも区別できない。
  const stripes=sampleSpatialSignal(7,8)
  // 同一スポーク8本なら、1回転中に同じ見た目が8回現れる。
  const wheel=rotationState(.9,8,.25,8)
  return {f,fs,nyquist:nyquistSatisfied(f,fs),alias,comparison,
    spatial:{cycles:7,pixels:8,samples:stripes},
    wheel:{spokes:8,realHz:.9,apparentHz:wheel.apparentFrequency}}
}
