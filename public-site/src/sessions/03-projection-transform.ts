import type {CourseSession,Topic} from '../session-model.ts'
import ProjectionComparisonDemo from '../../../components/lecture03/ProjectionComparisonDemo.vue'
import ProjectionPointDemo from '../../../components/lecture03/ProjectionPointDemo.vue'
import ObliqueDiscoveryDemo from '../../../components/lecture03/ObliqueDiscoveryDemo.vue'
import CavalierCabinetDemo from '../../../components/lecture03/CavalierCabinetDemo.vue'
import CoordinatePipelineDemo from '../../../components/lecture03/CoordinatePipelineDemo.vue'
import TransformMatrixDemo from '../../../components/lecture03/TransformMatrixDemo.vue'
import TransformOrderDemo from '../../../components/lecture03/TransformOrderDemo.vue'
import CameraObjectDemo from '../../../components/lecture03/CameraObjectDemo.vue'
import example0 from '../../../examples/03-projection-transform/parallel-perspective.ts?raw'
import {runExample as run0} from '../../../examples/03-projection-transform/parallel-perspective.ts'
import example1 from '../../../examples/03-projection-transform/project-point.ts?raw'
import {runExample as run1} from '../../../examples/03-projection-transform/project-point.ts'
import example2 from '../../../examples/03-projection-transform/depth-offset-projection.ts?raw'
import {runExample as run2} from '../../../examples/03-projection-transform/depth-offset-projection.ts'
import example3 from '../../../examples/03-projection-transform/cavalier-cabinet.ts?raw'
import {runExample as run3} from '../../../examples/03-projection-transform/cavalier-cabinet.ts'
import example4 from '../../../examples/03-projection-transform/coordinate-pipeline.ts?raw'
import {runExample as run4} from '../../../examples/03-projection-transform/coordinate-pipeline.ts'
import example5 from '../../../examples/03-projection-transform/transform-matrix.ts?raw'
import {runExample as run5} from '../../../examples/03-projection-transform/transform-matrix.ts'
import example6 from '../../../examples/03-projection-transform/transform-order.ts?raw'
import {runExample as run6} from '../../../examples/03-projection-transform/transform-order.ts'
import example7 from '../../../examples/03-projection-transform/camera-object.ts?raw'
import {runExample as run7} from '../../../examples/03-projection-transform/camera-object.ts'
import matrix from '../../../packages/cg-algorithms/src/matrix4.ts?raw'
import transforms from '../../../packages/cg-algorithms/src/transforms3d.ts?raw'
import projection from '../../../packages/cg-algorithms/src/projection.ts?raw'
import depthOffset from '../../../packages/cg-algorithms/src/oblique-projection.ts?raw'
import camera from '../../../packages/cg-algorithms/src/camera.ts?raw'
import geometry from '../../../packages/cg-algorithms/src/geometry3d.ts?raw'
const core=(...files:[string,string][])=>files.map(([name,source])=>`// ===== ${name} =====\n${source}`).join('\n\n')
const projectionCore=core(['matrix4.ts',matrix],['projection.ts',projection])
const transformCore=core(['matrix4.ts',matrix],['transforms3d.ts',transforms])
const cameraCore=core(['matrix4.ts',matrix],['transforms3d.ts',transforms],['camera.ts',camera],['projection.ts',projection])
const topics:Topic[]=[
 {id:'parallel-perspective',title:'平行投影と透視投影',question:'同じ大きさでも、遠いと小さく見える？',purpose:'同じ立方体を異なる奥行きに置き、距離と見かけの大きさの関係を比べます。',operation:'物体のz位置、カメラ距離、FOVを変え、左右比較と個別表示を切り替えます。',observe:'平行投影では距離を変えてもサイズが保たれます。透視投影では奥行きと視野角が影響します。',explanation:'カメラの前方を−Zとし、正の奥行きd=−zを使います。平行投影ではx,yを一定倍率で写し、透視投影ではdで割ります。',think:'遠くの物体が小さくなることと、FOVを広げることにはどんな違いがありますか？',demo:ProjectionComparisonDemo,example:example0,core:projectionCore,coreName:'projection.ts / matrix4.ts',run:run0},
 {id:'project-point',title:'3Dの点は画面のどこへ？',question:'点を動かして、投影の計算を追う。',purpose:'空間の1点と、スクリーン上の1点を対応づけます。',operation:'x,y,zを変更して、視点から点へ伸びる線と投影点の変化を見ます。',observe:'奥行きだけを変えると、投影点は画面中心へ近づいたり遠ざかったりします。',explanation:'カメラ前方−Z、FOV=90°、縦横比1ではx′=x/d、y′=y/dです。d=−zがnearより小さい点は投影せず、安全に扱います。',think:'z=0で割り算を続けられないのはなぜでしょうか？',demo:ProjectionPointDemo,example:example1,core:projectionCore,coreName:'projection.ts / matrix4.ts',run:run1},
 {id:'depth-offset-discovery',title:'奥行きの描き方を発見する',question:'この立方体は、どんな規則で描かれている？',purpose:'角度と奥行きの長さを変え、図形に共通する規則を自分の言葉で説明します。',operation:'まずθとsを動かします。観察を書き留めてから、仕組み・数式・名前を順に開きます。',observe:'正面の形、奥の面の大きさ、奥行き方向の辺の関係を観察しましょう。',explanation:'奥行きの値を、一定方向への横と縦のずれに変える計算を追います。',think:'この図を描くプログラムをAIに頼むなら、どの特徴をどんな言葉で伝えますか？',codeReveal:'この先のコードには完成式と名称が含まれます。宿題では、まず操作版の図を観察し、自分の言葉で規則を書き留めてください。',demo:ObliqueDiscoveryDemo,example:example2,core:core(['matrix4.ts',matrix],['oblique-projection.ts',depthOffset]),coreName:'oblique-projection.ts / matrix4.ts',run:run2},
 {id:'cavalier-cabinet',title:'Cavalier / Cabinetを比べる',question:'奥行きをどれだけ短く描く？',purpose:'奥行き縮尺の異なる代表的な描き方を比較します。',operation:'Cavalier、Cabinet、Customを選び、角度と縮尺を調整します。',observe:'正面の形を保ちながら、奥行き方向の辺の長さが変わります。',explanation:'同じ投影関数で縮尺sを切り替えます。この授業では代表例としてCavalierをs=1、Cabinetをs=0.5とします。',think:'奥行きを半分にしたとき、正面の縦横も半分になりますか？',demo:CavalierCabinetDemo,example:example3,core:core(['matrix4.ts',matrix],['oblique-projection.ts',depthOffset]),coreName:'oblique-projection.ts / matrix4.ts',run:run3},
 {id:'coordinate-pipeline',title:'座標変換の流れを追う',question:'同じ頂点の座標は、どの段階で変わる？',purpose:'Local → World → Camera → Projected → Screenを、選んだ頂点とともに追跡します。',operation:'段階を進め、頂点を選び、物体やカメラの位置を変えます。',observe:'座標系が変わることと、3Dを2Dへ投影することを区別します。',explanation:'モデル行列Mでワールドへ、ビュー行列Vでカメラへ移し、透視除算後に画面座標へ写します。Screenではy軸が下向きになります。',think:'物体が動いていなくても、カメラ座標が変わるのはなぜでしょうか？',demo:CoordinatePipelineDemo,example:example4,core:cameraCore+'\n\n'+core(['geometry3d.ts',geometry],['oblique-projection.ts',depthOffset]),coreName:'matrix4.ts / camera.ts / projection.ts / geometry3d.ts',run:run4},
 {id:'transform-matrix',title:'形の変化と4×4行列',question:'スライダーと行列のどの値が対応する？',purpose:'平行移動・拡大縮小・3軸の回転を、図形と行列の両方で確かめます。',operation:'変換モードを選び、移動量・倍率・角度を動かします。',observe:'平行移動の成分、拡大縮小の対角成分、回転のsinとcosに注目します。',explanation:'位置を(x,y,z,1)という同次座標で表すと、平行移動も4×4行列の積で計算できます。列ベクトルを使い、行列を左から掛けます。',think:'点の最後の成分を1にすると、なぜ移動量を足せるのでしょうか？',demo:TransformMatrixDemo,example:example5,core:transformCore,coreName:'matrix4.ts / transforms3d.ts',run:run5},
 {id:'transform-order',title:'変換の順序を入れ替える',question:'回してから移動、移動してから回す。',purpose:'同じ角度と移動量でも、適用順序で結果が変わることを確認します。',operation:'回転角とtx,ty,tzを変更して、左右の立方体と合成行列を比較します。',observe:'移動後に原点の周りを回すと、物体の中心も原点の周りを移動します。',explanation:'列ベクトルではM=TRはR→T、M=RTはT→Rです。行列積は右側から作用し、一般にTRとRTは一致しません。',think:'どのような角度や移動量なら、左右の結果が一致するでしょうか？',demo:TransformOrderDemo,example:example6,core:transformCore,coreName:'matrix4.ts / transforms3d.ts',run:run6},
 {id:'camera-object',title:'カメラを動かす・物体を動かす',question:'反対に動かすと、同じ画像になる？',purpose:'視点の変更を、物体側の対応する変換として捉えます。',operation:'カメラ位置・回転・物体位置を変え、対応する物体変換を有効にして比較します。',observe:'同じ投影条件で、物体全体に対応する変換を適用すると、カメラ画像が一致します。',explanation:'カメラの配置Cに対するビュー変換はV=C⁻¹です。固定カメラC₀側で物体にC₀VMを適用すると、同じカメラ座標になります。',think:'物体だけを動かし、背景を動かさない場合にも画像全体が一致するでしょうか？',demo:CameraObjectDemo,example:example7,core:cameraCore,coreName:'camera.ts / transforms3d.ts / matrix4.ts / projection.ts',run:run7},
]
export const session03:CourseSession={id:'03',number:3,title:'投影とモデリング変換',description:'3Dの形が画面に届くまでを、図形・座標・行列の変化から学びます。',date:'2026年10月16日',topics}
