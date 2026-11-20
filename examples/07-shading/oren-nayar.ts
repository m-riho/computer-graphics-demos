// 固定点N=(0,1,0)で方位差だけを変える。σ=0ならLambertと一致。
// σはこの関数では度で入力し、内部でラジアンへ変換する。
import { lambert, orenNayar } from '../../packages/cg-algorithms/src/shading-classic.ts'
export function runExample() {
  return [0,90,180].map(phi => ({phi, lambert:lambert(60), oren:orenNayar(60,60,phi,45), smoothOren:orenNayar(60,60,phi,0)}))
}
