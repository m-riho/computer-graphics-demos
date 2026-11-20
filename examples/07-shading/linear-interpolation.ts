import { lerpValue } from '../../packages/cg-algorithms/src/shading-interpolation.ts'

// 明るさ0.2から0.8へ。tはAからBへの割合。
export function runExample() {
  return [0,.25,.5,.75,1].map(t => ({
    t, weightA:1-t, weightB:t, value:lerpValue(.2,.8,t),
  }))
}
