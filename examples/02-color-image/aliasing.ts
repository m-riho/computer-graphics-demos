import { lineCoverage } from '../../packages/cg-algorithms/src/index.ts'

// 画素中心1点と、画素内4×4点で斜線の被覆率を比較します。
// 斜線と境界が交わる画素では、AA時に0と1の中間値が生まれます。
export function runExample() {
  const resolution: number = 20
  const angle: number = 25
  return [7, 8, 9, 10, 11, 12].map(x => ({
    x, y: 10,
    centerOnly: lineCoverage(x, 10, resolution, angle, false),
    supersampled: lineCoverage(x, 10, resolution, angle, true),
  }))
}
// 中間値を濃淡として表示するのが、このAAの模式表現です。
// すべてのエイリアシングを解消する万能な処理ではありません。
