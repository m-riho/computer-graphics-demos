import AlphaBlendingDemo from '../../../components/lecture02/AlphaBlendingDemo.vue'
import alphaExample from '../../../examples/02-color-image/alpha-blending.ts?raw'
import {runExample as runAlpha} from '../../../examples/02-color-image/alpha-blending.ts'
import alphaCore from '../../../packages/cg-algorithms/src/alpha-blending.ts?raw'
import SamplingTheoremDemo from '../../../components/lecture02/SamplingTheoremDemo.vue'
import theoremExample from '../../../examples/02-color-image/sampling-theorem.ts?raw'
import {runExample as runTheorem} from '../../../examples/02-color-image/sampling-theorem.ts'
import theoremCore from '../../../packages/cg-algorithms/src/sampling-theorem.ts?raw'
import type {CourseSession,Topic} from '../session-model.ts'
import Demo0 from '../../../components/lecture02/ConeResponseDemo.vue'
import example0 from '../../../examples/02-color-image/cone-response.ts?raw'
import {runExample as run0} from '../../../examples/02-color-image/cone-response.ts'
import Demo1 from '../../../components/lecture02/RGBMixingDemo.vue'
import example1 from '../../../examples/02-color-image/rgb-mixing.ts?raw'
import {runExample as run1} from '../../../examples/02-color-image/rgb-mixing.ts'
import Demo2 from '../../../components/lecture02/ColorModelDemo.vue'
import example2 from '../../../examples/02-color-image/rgb-hsv.ts?raw'
import {runExample as run2} from '../../../examples/02-color-image/rgb-hsv.ts'
import Demo3 from '../../../components/lecture02/SamplingQuantizationDemo.vue'
import example3 from '../../../examples/02-color-image/sampling.ts?raw'
import {runExample as run3} from '../../../examples/02-color-image/sampling.ts'
import Demo4 from '../../../components/lecture02/SamplingQuantizationDemo.vue'
import example4 from '../../../examples/02-color-image/quantization.ts?raw'
import {runExample as run4} from '../../../examples/02-color-image/quantization.ts'
import Demo5 from '../../../components/lecture02/GammaDemo.vue'
import example5 from '../../../examples/02-color-image/gamma.ts?raw'
import {runExample as run5} from '../../../examples/02-color-image/gamma.ts'
import Demo6 from '../../../components/lecture02/AliasingDemo.vue'
import example6 from '../../../examples/02-color-image/aliasing.ts?raw'
import {runExample as run6} from '../../../examples/02-color-image/aliasing.ts'
import Demo7 from '../../../components/lecture02/JpegCompressionDemo.vue'
import example7 from '../../../examples/02-color-image/jpeg-compression.ts?raw'
import {runExample as run7} from '../../../examples/02-color-image/jpeg-compression.ts'
import Demo8 from '../../../components/lecture02/ToneMappingDemo.vue'
import example8 from '../../../examples/02-color-image/tone-mapping.ts?raw'
import {runExample as run8} from '../../../examples/02-color-image/tone-mapping.ts'
import core0 from '../../../packages/cg-algorithms/src/aliasing.ts?raw'
import core1 from '../../../packages/cg-algorithms/src/color.ts?raw'
import core2 from '../../../packages/cg-algorithms/src/cone-response.ts?raw'
import core3 from '../../../packages/cg-algorithms/src/gamma.ts?raw'
import core4 from '../../../packages/cg-algorithms/src/jpeg.ts?raw'
import core5 from '../../../packages/cg-algorithms/src/quantization.ts?raw'
import core6 from '../../../packages/cg-algorithms/src/sampling.ts?raw'
import core7 from '../../../packages/cg-algorithms/src/tone-mapping.ts?raw'

const topics:Topic[] = [
  {id:"cone-response",title:"錐体応答",question:"波長が変わると、目の応答はどう変わる？",purpose:"3種類の錐体の感度は、波長に対して広く重なっています。",operation:"波長のスライダーを青側から赤側まで動かします。",observe:"1つの波長でも複数の応答が同時に生じることに注目します。",explanation:"3本の模式曲線を同じ波長で評価します。実測データではありません。",think:"応答が最大になる波長と、応答範囲は同じ意味でしょうか？",coreName:"cone-response.ts",demo:Demo0,example:example0,core:core2,run:run0},
  {id:"rgb-mixing",title:"RGB加法混色",question:"3つの成分から、どんな色が生まれる？",purpose:"RGBはRed（赤）・Green（緑）・Blue（青）の頭文字。3成分の数値で色を表します。",operation:"R・G・Bを動かすか、Yellowなどのプリセットを選びます。",observe:"2成分だけを使った色と、3成分をそろえた色を比較します。",explanation:"各成分8 bitなら0〜255（256段階）、正規化表現では0〜1を使います。255で割ると換算でき、128は約0.502です。これは光量への変換ではありません。RGBAのAlphaは不透明度で、0が透明・1が不透明です。コードはRGBからHEXへの変換を示しています。",think:"黄色にするには、どの成分を使えばよいでしょうか？",coreName:"color.ts",demo:Demo1,demoProps:{showExplanation:true},example:example1,core:core1,run:run1},
  {id:'alpha-blending',title:'アルファ値と画像の合成',question:'同じ色でも、背景の透け方が変わる？',purpose:'RGBAのAlpha（α）は不透明度です。0は透明、1は不透明、間の値は半透明を表します。',operation:'αを0から1へ動かし、前景色と背景色を切り替えます。0・0.5・1のボタンでも比較できます。',observe:'αが0なら前景のRGBに関係なく背景だけが見えます。同じαでも背景色が変わると合成色が変わります。',explanation:'不透明な背景へのsource-over合成では、各RGB成分を「前景×α＋背景×(1−α)」で計算します。この教材はsRGB符号値を重み付けし、8 bitへ丸めます。光量を混ぜる線形光での計算とは区別します。αを8 bitで保存する場合の範囲は0〜255です。',think:'赤い前景のαを0にすると黒くなるでしょうか？ 背景を白と青にして確かめてみましょう。',coreName:'alpha-blending.ts',demo:AlphaBlendingDemo,example:alphaExample,core:alphaCore,run:runAlpha},
  {id:"rgb-hsv",title:"RGBとHSV",question:"同じ色を、違う座標で表す。",purpose:"RGBとHSV（HSB）は、同じ色を異なる数値の組として扱います。",operation:"RGB側とHSV側のどちらも操作して、相手側の変化を見ます。",observe:"Sを0にしたときの色相、Hが0度と360度の色を比べます。",explanation:"最大・最小成分の差から彩度と色相を求めます。Vは最大成分です。",think:"灰色の色相を、1つに決められるでしょうか？",coreName:"color.ts",demo:Demo2,example:example2,core:core1,run:run2},
  {id:'sampling-theorem',title:'標本化定理とエイリアシング',question:'違う運動や模様が、同じ観測点になる？',purpose:'ストロボ、縞模様、斜め線を通して、標本化不足による見え方の変化をつなぎます。',operation:'1点の回転を再生し、fsを下げます。波形の標本点を確かめてから、車輪、空間の縞、CGの斜め線へ進みます。',observe:'異なる連続信号が同じ標本点を通ること、AAで境界に中間値が入ることを観察します。',explanation:'x(t)=cos(2πft)を時刻n/fsで標本化します。帯域上限が既知ならfs > 2 fmaxが理想復元の条件です。コードのcomparisonでは元波形とaliasの値が一致します。時間tを位置xへ、ストロボ周波数を画素密度へ置き換えると、同じ式で空間標本化を扱えます。',think:'観測した点だけから、元の信号がもっと高い周波数でなかったと言い切れるでしょうか？',coreName:'sampling-theorem.ts',demo:SamplingTheoremDemo,example:theoremExample,core:theoremCore,run:runTheorem},
  {id:"sampling",title:"標本化",question:"どこを、どれだけ細かく測る？",purpose:"空間方向の細かさを変える処理が標本化です。",operation:"各成分を8 bitにして、横の画素数だけを変更します。元画像も切り替えます。",observe:"画素を減らすと、細かい線や形がどのように変化するか観察します。",explanation:"縮小先の画素中心に近い元画素を選びます。値の丸めは別の処理です。",think:"細かい縞は、画素数を半分にすると必ず正しく残るでしょうか？",coreName:"sampling.ts",demo:Demo3,example:example3,core:core6,run:run3},
  {id:"quantization",title:"量子化",question:"色の値を、何段階で残す？",purpose:"画素の位置はそのままに、成分の値を限られた段階へ丸めます。",operation:"横の画素数を固定し、各成分のbitを8から1へ減らします。",observe:"グラデーションに現れる段差と、画素の格子を区別します。",explanation:"2^bits個の値へ丸めます。入力と出力の差が量子化誤差です。",think:"画素数を増やすだけで、階調の段差は消えるでしょうか？",coreName:"quantization.ts",demo:Demo4,example:example4,core:core5,run:run4},
  {id:"gamma",title:"ガンマ",question:"数値の半分は、光の半分？",purpose:"画像の符号値と、表示される光の強さの関係を考えます。",operation:"γを1から3へ動かし、補正あり・なしの明るさを比較します。",observe:"エンコードと表示側の応答を組み合わせた結果を見ます。",explanation:"単純なべき乗モデルを計算し、実際のsRGB区分関数とは区別します。",think:"γが変わっても、補正ありの表示が保たれるのはなぜでしょうか？",coreName:"gamma.ts",demo:Demo5,example:example5,core:core3,run:run5},
  {id:"aliasing",title:"エイリアシング",question:"斜めの線が、階段に見えるのはなぜ？",purpose:"連続的な形を画素の格子へ置き換えるときの変化を見ます。",operation:"角度と解像度を変え、AAをON/OFFします。",observe:"画素中心1点の判定と、画素内16点の平均を比較します。",explanation:"画素内の被覆率を濃淡にします。中間値が境界の見え方を変えます。",think:"AAは画素数を増やしているのでしょうか？",coreName:"aliasing.ts",demo:Demo6,example:example6,core:core0,run:run6},
  {id:"jpeg-compression",title:"JPEG圧縮",question:"小さなファイルでは、何が失われる？",purpose:"画像の見え方とサイズの変化を、周波数成分の量子化につなげます。",operation:"品質スライダーを下げ、文字・境界・縞を見ます。下の8×8ブロックも比較します。",observe:"係数が0になる数と復元誤差を観察します。品質は画質の百分率ではありません。",explanation:"8×8輝度のDCT→量子化→逆DCTを計算します。完全なJPEGの実装ではありません。",think:"一度0へ丸めた係数は、保存し直すと元に戻るでしょうか？",coreName:"jpeg.ts",demo:Demo7,demoProps:{showProcess:true},example:example7,core:core4,run:run7},
  {id:"tone-mapping",title:"トーンマッピング",question:"明るさの幅を、画面に収める。",purpose:"広い輝度範囲を、表示可能な0〜1へ写す処理を比べます。",operation:"露出を動かしてから、トーンマッピングをON/OFFします。",observe:"明るい領域の差が、白飛びと圧縮でどう変わるか見ます。",explanation:"露出を調整し、単純Reinhard L/(1+L)を適用してからsRGBへ変換します。",think:"露出を下げる処理と、輝度を圧縮する処理は同じでしょうか？",coreName:"tone-mapping.ts",demo:Demo8,example:example8,core:core7,run:run8},
]

export const session02:CourseSession={
  id:'02',
  number:2,
  title:'色とデジタル画像',
  description:'光と色を、デジタル画像として扱う仕組みを学びます。',
  date:'2026年10月9日',
  topics,
}
