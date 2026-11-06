import type { CourseSession, Topic } from '../session-model.ts'
import { visibilityDemos } from '../../../components/visibility/demos.ts'
import raysSource from '../../../packages/cg-algorithms/src/visibility-rays.ts?raw'
import rasterSource from '../../../packages/cg-algorithms/src/visibility-raster.ts?raw'
import cullingSource from '../../../packages/cg-algorithms/src/visibility-culling.ts?raw'
import labsSource from '../../../packages/cg-algorithms/src/visibility-labs.ts?raw'
import compareSource from '../../../packages/cg-algorithms/src/visibility-compare.ts?raw'
import alphaSource from '../../../packages/cg-algorithms/src/alpha-blending.ts?raw'
import cullingExample0 from '../../../examples/06-visibility/back-face-culling.ts?raw'
import { runExample as run0 } from '../../../examples/06-visibility/back-face-culling.ts'
import rasterExample1 from '../../../examples/06-visibility/painter.ts?raw'
import { runExample as run1 } from '../../../examples/06-visibility/painter.ts'
import rasterExample2 from '../../../examples/06-visibility/triangle-rasterization.ts?raw'
import { runExample as run2 } from '../../../examples/06-visibility/triangle-rasterization.ts'
import rasterExample3 from '../../../examples/06-visibility/z-buffer.ts?raw'
import { runExample as run3 } from '../../../examples/06-visibility/z-buffer.ts'
import labsExample4 from '../../../examples/06-visibility/scanline.ts?raw'
import { runExample as run4 } from '../../../examples/06-visibility/scanline.ts'
import raysExample5 from '../../../examples/06-visibility/ray-casting.ts?raw'
import { runExample as run5 } from '../../../examples/06-visibility/ray-casting.ts'
import compareExample6 from '../../../examples/06-visibility/raster-vs-ray.ts?raw'
import { runExample as run6 } from '../../../examples/06-visibility/raster-vs-ray.ts'
import labsExample7 from '../../../examples/06-visibility/transparency-depth.ts?raw'
import { runExample as run7 } from '../../../examples/06-visibility/transparency-depth.ts'

import waveSource from '../../../packages/cg-algorithms/src/visibility-wave.ts?raw'
import waveExample from '../../../examples/06-visibility/wave-surface.ts?raw'
import { runExample as runWave } from '../../../examples/06-visibility/wave-surface.ts'

const topics: Topic[] = [
  {
    id: 'wave-surface', title: visibilityDemos['wave-surface'].title, priority: false,
    question: '手前の峰に重なった奥の線は、どこまで見えるでしょうか。',
    purpose: '同じ波面を使って、すべての断面線と隠線消去後の線を比べます。',
    operation: '隠れた線の表示を切り替え、角度や断面数を動かします。',
    observe: 'ある峰の後ろを目で追い、線が途切れる場所を比べましょう。',
    explanation: '奥から順に、隣の断面までの帯を背景色で塗ってから手前の断面線を描きます。',
    think: '見下ろす角度を大きくすると、手前の峰が隠す範囲はどう変わるでしょうか。',
    demo: visibilityDemos['wave-surface'].component, example: waveExample, run: runWave,
    coreName: 'visibility-wave.ts', core: waveSource,
  },
  {
    title: visibilityDemos['back-face-culling'].title,
    id: "back-face-culling",
    priority: true,
    question: "表向きの面は、必ず画面に見えるでしょうか。",
    purpose: "カメラから見た裏表を法線と内積で調べます。",
    operation: "凸形状と凹形状を切り替え、視点を動かします。面を選んで頂点順を反転してみましょう。",
    observe: "内積の符号が変わる位置と、表向きなのに別の面に隠れる位置を見比べます。",
    explanation: "面から視点へ向かうベクトルと外向き法線の内積で向きを分類します。",
    think: "頂点順を反転したとき、物体の形と面の判定はそれぞれどうなるでしょうか。",
    demo: visibilityDemos['back-face-culling'].component, example: cullingExample0, run: run0,
    coreName: 'visibility-culling.ts / visibility-rays.ts',
    core: cullingSource + '\n\n' + raysSource,
  },
  {
    title: visibilityDemos['painter'].title,
    id: "painter",
    priority: true,
    question: "交差する2枚を、どんな順に塗ればよいでしょうか。",
    purpose: "Painter法で面を順に上書きし、正しい可視面と比較します。",
    operation: "非交差、交差、循環を選び、描画順を変えて1面ずつ進めます。",
    observe: "交差例では、順序を入れ替えると誤る領域も移ります。",
    explanation: "同じ三角形を深度テストで描いた結果を基準に、各画素の面IDを照合します。",
    think: "3面の前後関係が一周したとき、最後に塗れる面はあるでしょうか。",
    demo: visibilityDemos['painter'].component, example: rasterExample1, run: run1,
    coreName: 'visibility-raster.ts',
    core: rasterSource,
  },
  {
    title: visibilityDemos['triangle-rasterization'].title,
    id: "triangle-rasterization",
    priority: false,
    question: "斜辺にぴったり乗る画素中心は、どちらの三角形に入るでしょうか。",
    purpose: "三角形と画素中心の位置から被覆と重心座標を求めます。",
    operation: "頂点を動かし、格子の点を選び、被覆・エッジ関数・共有辺・深度補間を切り替えます。",
    observe: "画素中心が辺をまたぐとエッジ関数の符号が変わります。共有辺では採用する向きが決まっています。",
    explanation: "3辺のエッジ関数を評価し、面積で割った重みで頂点の深度を補間します。",
    think: "頂点の深度だけを変えたとき、被覆と補間結果のどちらが変わるでしょうか。",
    demo: visibilityDemos['triangle-rasterization'].component, example: rasterExample2, run: run2,
    coreName: 'visibility-raster.ts',
    core: rasterSource,
  },
  {
    title: visibilityDemos['z-buffer'].title,
    id: "z-buffer",
    priority: true,
    question: "最後に奥の面を描くと、画素Pは上書きされるでしょうか。",
    purpose: "講義と同じ7×5格子で、形状・色・深度を対応させます。",
    operation: "画素Pを選んだままA、B、Cの順に進め、逆順の結果とも比べます。",
    observe: "候補8と5は順に採用され、12では深度5と面Bが残ります。",
    explanation: "覆われた各画素で候補深度と記録深度を比較し、手前の面だけで色と深度を更新します。",
    think: "途中の色が変わっても、最後の面IDが一致するのはなぜでしょうか。",
    demo: visibilityDemos['z-buffer'].component, example: rasterExample3, run: run3,
    coreName: 'visibility-raster.ts',
    core: rasterSource,
  },
  {
    title: visibilityDemos['scanline'].title,
    id: "scanline",
    priority: false,
    question: "同じ横一列でも、途中で見える面が替わるのはなぜでしょうか。",
    purpose: "走査線で塗る区間を探し、重なる面の前後を調べます。",
    operation: "被覆モードで行を移動し、可視判定モードで同じ行の深度を比べます。",
    observe: "輪郭との交点は塗る候補の端です。面どうしの深度が等しくなる場所でも、見える面が切り替わります。",
    explanation: "左右の辺との交点からスパンを作り、重なる区間では深度の小さい面を選びます。",
    think: "画素中心が2面に含まれるとき、何をもう一度比べればよいでしょうか。",
    demo: visibilityDemos['scanline'].component, example: labsExample4, run: run4,
    coreName: 'visibility-labs.ts / visibility-raster.ts',
    core: labsSource + '\n\n' + rasterSource,
  },
  {
    title: visibilityDemos['ray-casting'].title,
    id: "ray-casting",
    priority: true,
    question: "球を通り抜けるレイには、いくつの交点があるでしょうか。",
    purpose: "画素を通るレイと球・三角形の交点を調べます。",
    operation: "中央の画素から始め、球の半径や位置、カメラを動かして候補と採用結果を比べます。",
    observe: "初期配置では球の入射と退出が t=3、7、奥の三角形が t=8 です。",
    explanation: "レイと各物体の交点を計算し、正のパラメータのうち最小のものを選びます。",
    think: "球の外側へ画素を移したとき、次に見える物体を予想しましょう。",
    demo: visibilityDemos['ray-casting'].component, example: raysExample5, run: run5,
    coreName: 'visibility-rays.ts',
    core: raysSource,
  },
  {
    title: visibilityDemos['raster-vs-ray'].title,
    id: "raster-vs-ray",
    priority: true,
    question: "調べる順が逆でも、同じ画素に同じ面が見えるでしょうか。",
    purpose: "同じ三角形とカメラを、ラスタライズと一次レイで比較します。",
    operation: "シーンと画素を選び、面から標本へ、標本から面へという二つの手順を進めます。",
    observe: "途中で列挙する候補を比べ、最後に両者が返した面IDを確かめます。",
    explanation: "画素中心、奥行きの向き、境界を含める規則を対応させて照合します。",
    think: "背景の画素では、それぞれの手法は何を手がかりに背景を選ぶでしょうか。",
    demo: visibilityDemos['raster-vs-ray'].component, example: compareExample6, run: run6,
    coreName: 'visibility-compare.ts / visibility-rays.ts / visibility-raster.ts',
    core: compareSource + '\n\n' + raysSource + '\n\n' + rasterSource,
  },
  {
    title: visibilityDemos['transparency-depth'].title,
    id: "transparency-depth",
    priority: false,
    question: "深度が等しい2面で、先に描いた色は残るでしょうか。",
    purpose: "深度比較の条件と、半透明の色合成を別々に試します。",
    operation: "等深度ではLESSとLEQUAL、半透明ではアルファ値・描画順・深度書込みを変えます。",
    observe: "等深度では比較条件が、半透明では合成の順序も結果を左右します。",
    explanation: "第2回と同じsource-over合成を使い、深度テストを通った面を背景色に重ねます。",
    think: "奥の半透明面を先に描く場合と後に描く場合で、何が変わるでしょうか。",
    demo: visibilityDemos['transparency-depth'].component, example: labsExample7, run: run7,
    coreName: 'visibility-labs.ts / alpha-blending.ts / visibility-raster.ts',
    core: labsSource + '\n\n' + alphaSource + '\n\n' + rasterSource,
  },
]

export const session06: CourseSession = {
  id: '06', number: 6, date: '2026年11月13日', title: 'レンダリングその1',
  description: '同じ画素に複数の面が重なるとき、どれが見えるか。面の向き、描画順、深度、一次レイを9つの実験で比べます。',
  topics,
  stories: [
    { title: '描く順番で解けるか', description: '交差する面を順番に塗り、深度バッファと一次レイの結果に照らし合わせます。', topicIds: ['painter', 'z-buffer', 'raster-vs-ray'] },
    { title: '1画素の候補を調べる', description: '三角形に覆われた画素を選び、選ばれた候補のうち手前の面を求めます。', topicIds: ['triangle-rasterization', 'scanline', 'ray-casting'] },
  ],
}
