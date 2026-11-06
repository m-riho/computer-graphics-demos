import { stripTriangles, waveSections } from '../../packages/cg-algorithms/src/visibility-wave.ts'

export function runExample() {
  // 奥の線を描いた後、次の断面までの帯を紙の色で塗り、手前の線を描く。
  const rows = waveSections(19, 22, 0)
  const strip = stripTriangles(rows[0], rows[1])
  return { 断面の数: rows.length, 各断面の点数: rows[0].length,
    最初の帯の三角形数: strip.length, 最初の三角形の投影座標: strip[0] }
}
