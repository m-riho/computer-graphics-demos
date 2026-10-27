import { seededRandom } from './natural-modeling.ts'

const bounded = (n: number, low: number, high: number, fallback: number) => Number.isFinite(n) ? Math.max(low, Math.min(high, n)) : fallback
export const lsystemPresets = {
  Tree: { axiom: 'F', rules: { F: 'F[+F]F[-F]F' }, angle: 25, iterations: 3 },
  Bush: { axiom: 'F', rules: { F: 'FF+[+F-F-F]-[-F+F+F]' }, angle: 22.5, iterations: 3 },
  Koch: { axiom: 'F', rules: { F: 'F+F--F+F' }, angle: 60, iterations: 3 },
  Plant: { axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25, iterations: 4 },
}
/** 全記号を「前の世代」から同時に置換する。膨張する文字列には上限を置く。 */
export function rewriteLSystem(axiom: string, rules: Record<string, string>, iterations: number, limit = 40000) {
  limit = Math.floor(bounded(limit, 1, 40000, 40000))
  let word = axiom.slice(0, limit), truncated = axiom.length > limit
  const counts = [word.split('F').length - 1]
  for (let i = 0; i < Math.floor(bounded(iterations, 0, 8, 0)) && !truncated; i++) {
    let next = ''
    for (const symbol of word) {
      const replacement = rules[symbol] ?? symbol
      if (next.length + replacement.length > limit) { next += replacement.slice(0, limit - next.length); truncated = true; break }
      next += replacement
    }
    word = next; counts.push(word.split('F').length - 1)
  }
  return { word, counts, truncated }
}
export type TurtleState = { x: number; y: number; heading: number }
export type TurtleSegment = [number, number, number, number]
/** F:前進、±:回転、[:状態保存、]:復元。limit まで実行したstackも返す。 */
export function traceTurtle(word: string, angle: number, stepLength: number, limit = word.length) {
  let state: TurtleState = { x: 0, y: 0, heading: Math.PI / 2 }
  const stack: TurtleState[] = [], segments: TurtleSegment[] = []
  const turn = bounded(angle, -180, 180, 25) * Math.PI / 180, step = bounded(stepLength, .1, 40, 5)
  let error = ''
  const executed = Math.floor(bounded(limit, 0, Math.min(word.length, 40000), 0))
  for (const symbol of word.slice(0, executed)) {
    if (symbol === 'F' || symbol === 'G') {
      const x = state.x + Math.cos(state.heading) * step, y = state.y + Math.sin(state.heading) * step
      segments.push([state.x, state.y, x, y]); state = { ...state, x, y }
    } else if (symbol === '+') state = { ...state, heading: state.heading + turn }
    else if (symbol === '-') state = { ...state, heading: state.heading - turn }
    else if (symbol === '[') stack.push({ ...state })
    else if (symbol === ']') { const saved = stack.pop(); if (saved) state = saved; else error = '対応する [ がありません' }
  }
  if (executed === word.length && stack.length) error = '閉じていない [ があります'
  return { segments, state, stack, executed, error }
}
/** 中点を補間し、振幅以下の乱数変位を加える。各段階を保存する。 */
export function midpointStages(iterations: number, seed: number, amplitude: number, decay: number): number[][] {
  const random = seededRandom(seed), stages: number[][] = [[0, 0]]
  let strength = bounded(amplitude, 0, 2, .8)
  for (let level = 0; level < Math.floor(bounded(iterations, 0, 10, 5)); level++) {
    const previous = stages[level], next = [previous[0]]
    for (let i = 0; i < previous.length - 1; i++) {
      next.push((previous[i] + previous[i + 1]) / 2 + (random() * 2 - 1) * strength, previous[i + 1])
    }
    stages.push(next); strength *= bounded(decay, 0, 1, .5)
  }
  return stages
}
