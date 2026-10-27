/** 文字列の書換え → Turtle実行 → 線分。Vueに依存しない実験。 */
import { rewriteLSystem, traceTurtle } from '../../packages/cg-algorithms/src/nature-rules.ts'

export function runExample() {
  const axiom = 'F'
  const rules = { F: 'F[+F]F[-F]F' }
  const iterations = 3
  // 各世代で F を同時置換。F数は 1 → 5 → 25 → 125。
  const generated = rewriteLSystem(axiom, rules, iterations)
  const drawing = traceTurtle(generated.word, 25, 5)
  // 「F[+F」の4文字だけ実行すると、stackには分岐前の状態が1つ残る。
  const intermediate = traceTurtle('F[+F]F', 90, 1, 4)
  return {
    fCounts: generated.counts,
    stringLength: generated.word.length,
    preview: generated.word.slice(0, 70),
    segmentCount: drawing.segments.length,
    firstSegments: drawing.segments.slice(0, 3),
    stackAfterFourSymbols: intermediate.stack,
  }
}
