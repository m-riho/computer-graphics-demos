import type {CourseSession,Topic} from '../session-model.ts'
import sweepCore from '../../../packages/cg-algorithms/src/sweep.ts?raw'
import meshCore from '../../../packages/cg-algorithms/src/mesh.ts?raw'
import Demo0 from '../../../components/lecture04/RepresentationComparisonDemo.vue'
import example0 from '../../../examples/04-modeling/representation.ts?raw'
import {runExample as run0} from '../../../examples/04-modeling/representation.ts'
import core0 from '../../../packages/cg-algorithms/src/mesh.ts?raw'
import Demo1 from '../../../components/lecture04/MeshExplorerDemo.vue'
import example1 from '../../../examples/04-modeling/mesh-elements.ts?raw'
import {runExample as run1} from '../../../examples/04-modeling/mesh-elements.ts'
import core1 from '../../../packages/cg-algorithms/src/mesh.ts?raw'
import Demo2 from '../../../components/lecture04/HalfEdgeDemo.vue'
import example2 from '../../../examples/04-modeling/half-edge.ts?raw'
import {runExample as run2} from '../../../examples/04-modeling/half-edge.ts'
import core2 from '../../../packages/cg-algorithms/src/half-edge.ts?raw'
import Demo3 from '../../../components/lecture04/ManifoldDemo.vue'
import example3 from '../../../examples/04-modeling/manifold.ts?raw'
import {runExample as run3} from '../../../examples/04-modeling/manifold.ts'
import core3 from '../../../packages/cg-algorithms/src/manifold.ts?raw'
import Demo4 from '../../../components/lecture04/BooleanCSGDemo.vue'
import example4 from '../../../examples/04-modeling/boolean-csg.ts?raw'
import {runExample as run4} from '../../../examples/04-modeling/boolean-csg.ts'
import core4 from '../../../packages/cg-algorithms/src/csg.ts?raw'
import Demo5 from '../../../components/lecture04/SweepDemo.vue'
import example5 from '../../../examples/04-modeling/extrude.ts?raw'
import {runExample as run5} from '../../../examples/04-modeling/extrude.ts'
import core5 from '../../../packages/cg-algorithms/src/sweep.ts?raw'
import Demo6 from '../../../components/lecture04/BevelFilletDemo.vue'
import example6 from '../../../examples/04-modeling/bevel.ts?raw'
import {runExample as run6} from '../../../examples/04-modeling/bevel.ts'
import core6 from '../../../packages/cg-algorithms/src/bevel.ts?raw'
import Demo7 from '../../../components/lecture04/SubdivisionLabDemo.vue'
import example7 from '../../../examples/04-modeling/subdivision.ts?raw'
import {runExample as run7} from '../../../examples/04-modeling/subdivision.ts'
import core7 from '../../../packages/cg-algorithms/src/subdivision.ts?raw'
import Demo8 from '../../../components/lecture04/EulerCharacteristicDemo.vue'
import example8 from '../../../examples/04-modeling/euler-characteristic.ts?raw'
import {runExample as run8} from '../../../examples/04-modeling/euler-characteristic.ts'
import core8 from '../../../packages/cg-algorithms/src/euler-characteristic.ts?raw'
import revolveExample from '../../../examples/04-modeling/revolve.ts?raw'
const topics:Topic[]=[
{"id": "representation-comparison", "title": "表現を比較する", "question": "同じ立方体で、何を記録している？", "purpose": "Wireframe・Surface・Solidを切り替えて、面の有無と内外判定の違いを理解します。", "operation": "表現を選び、判定点を移動します。表示と、持っている情報の説明を見比べます。", "observe": "Solidでは点が内部・境界・外部のどこにあるかを判定します。面を塗っただけでSolidになるわけではありません。", "explanation": "立方体の内外は各座標が範囲内かで判定できます。一般のMeshには閉鎖性や整合した境界が必要です。", "think": "Wireframeだけから、どの面が手前かをいつも決められるでしょうか？",demo:Demo0,example:example0,core:core0,coreName:'mesh.ts',run:run0},
{"id": "mesh-explorer", "title": "Meshの要素とつながり", "question": "座標を変えることと、接続を変えることは同じ？", "purpose": "Vertex・Edge・Faceを選び、座標・隣接要素を対応づけます。", "operation": "モードと要素番号を選びます。Geometry/Topologyでは頂点を動かし、座標と接続の変化を比較します。", "observe": "Geometryは位置、Topologyは接続。面の頂点列から辺と隣接関係を求められます。", "explanation": "Meshはverticesの座標配列とfacesの頂点番号列で保持します。辺と隣接関係は同じデータから導出します。", "think": "頂点を1つ動かしたとき、辺の数や面の数は変わるでしょうか？",demo:Demo1,example:example1,core:core1,coreName:'mesh.ts',run:run1},
{"id": "half-edge", "title": "Half-edgeをたどる", "question": "nextとtwinは、それぞれどこに進む？", "purpose": "半辺が持つorigin・next・twin・faceを図と番号で確認します。", "operation": "半辺を選び、next・twin・face・vertexを操作します。Resetで最初の状態に戻せます。", "observe": "nextは面を一周、twinは同じ辺の反対側へ移ります。頂点の周囲も接続からたどれます。", "explanation": "各面の頂点列から向き付き半辺を作り、逆向きの組をtwinとして対応づけます。境界では相手がない場合があります。", "think": "三角形の面でnextを3回進むと、どこへ戻るでしょうか？",demo:Demo2,example:example2,core:core2+'\n\n// mesh.ts\n'+meshCore,coreName:'half-edge.ts / mesh.ts',run:run2},
{"id": "manifold", "title": "Manifoldと境界", "question": "見た目が立体でも、正しい境界とは限らない？", "purpose": "辺や頂点の周囲を検査し、閉じたManifold・境界を持つManifold・Non-manifoldを区別します。", "operation": "5つのプリセットを選び、問題箇所のハイライトと理由を確認します。", "observe": "開いた境界と、面の分岐は異なります。内部の不要な面も、接続だけでは問題と判定できない場合があります。", "explanation": "各辺に接続する面の数と、頂点リンクが1つの輪または道になるかを調べます。自己交差や製造可能性を全て保証する検査ではありません。", "think": "全ての辺を2枚の面が共有していても、頂点に問題がある例は作れるでしょうか？",demo:Demo3,example:example3,core:core3+'\n\n// mesh.ts\n'+meshCore,coreName:'manifold.ts / mesh.ts',run:run3},
{"id": "boolean-csg", "title": "BooleanとCSG tree", "question": "2つの立体を足す・引くと、どの面が残る？", "purpose": "Union・Intersection・A−B・B−Aを、入力と出力を並べて比較します。", "operation": "A/Bの立体、Bの位置と大きさ、演算を変えます。木の節を選ぶと部分結果を確認できます。", "observe": "差集合では順序が重要です。円柱をCubeから引くと、穴のある部品を作れます。", "explanation": "教育用BSPで面を平面分割し、内外に応じた面を残します。浮動小数点の許容誤差を使うため、任意のCAD形状での頑健性は保証しません。", "think": "AとBが離れた場合、Intersectionはどのような結果になるでしょうか？",demo:Demo4,example:example4,core:core4+'\n\n// sweep.ts\n'+sweepCore+'\n\n// mesh.ts\n'+meshCore,coreName:'csg.ts / mesh.ts',run:run4},
{"id": "sweep", "title": "ExtrudeとRevolve", "question": "2Dの断面を動かすと、どんな立体になる？", "purpose": "断面・移動量・回転角と、できあがるMeshを対応づけます。", "operation": "Extrude/Revolve、Profile、距離・角度・分割数・軸を選びます。", "observe": "断面と経路が形を決めます。回転方向の分割数は円周の近似の細かさを変えます。", "explanation": "Extrudeは断面の頂点を平行移動して側面を結び、Revolveは軸回りの回転点列を結びます。端面も生成して閉じた境界を作ります。", "think": "回転角が180°のとき、360°の場合と比べてどんな端面が必要でしょうか？",demo:Demo5,example:example5+'\n\n// Revolveの例\n'+revolveExample,core:core5+'\n\n// mesh.ts\n'+meshCore,coreName:'sweep.ts / mesh.ts',run:run5},
{"id": "bevel-fillet", "title": "Bevelと角の丸み", "question": "小さな面が、光り方をどう変える？", "purpose": "鋭いCubeと角を処理したCubeを、固定照明で比較します。", "operation": "Sharp・Chamfer・Roundedのプリセット、widthとsegmentsを動かします。", "observe": "幅を変えると角の大きさ、分割数を変えると丸みの近似が変わります。", "explanation": "教育用の角丸立方体を、面・円柱状の辺・球面状の角で構成します。任意形状への一般Bevelではありません。CAD/DCCで用語の運用は異なります。", "think": "丸める幅を固定して分割数だけ増やすと、どこが変化するでしょうか？",demo:Demo6,example:example6,core:core6+'\n\n// mesh.ts\n'+meshCore,coreName:'bevel.ts / mesh.ts',run:run6},
{"id": "subdivision", "title": "細分割曲面の実験室", "question": "元の頂点は、残る？移動する？", "purpose": "4方式の更新規則と、入力Mesh・細分割レベル・元頂点の関係を比較します。", "operation": "MethodとLevelを変更し、Control Mesh・Wireframe・Original Vertices・Result Surfaceを切り替えます。", "observe": "近似型のCatmull–Clark・Loop・Doo–Sabinと、補間型のModified Butterflyで元頂点の扱いが異なります。", "explanation": "閉じた向きの整合したManifoldを対象に各手法の重みと再接続を実装しています。四角形中心と三角形入力を分け、Butterflyには不規則な頂点の修正规則を使います。", "think": "元頂点の表示を残すと、どの方式が必ず元の点を通ることを確認できますか？",demo:Demo7,example:example7,core:core7+'\n\n// mesh.ts\n'+meshCore,coreName:'subdivision.ts / mesh.ts',run:run7},
{"id": "euler-characteristic", "title": "Euler characteristic", "question": "V・E・Fを変えても、χは同じ？", "purpose": "辺や面の分割による要素数とEuler characteristicの変化を調べます。", "operation": "Split Edge・Split Faceを操作し、V−E＋Fを確かめます。", "observe": "辺の分割ではVとE、面の分割ではEとFが1ずつ増えます。", "explanation": "立方体の境界は球面と同じ位相でχ=2です。2になることだけで全てのMeshの妥当性は保証されません。", "think": "開いた円盤やトーラスの表面でもχ=2になるでしょうか？",demo:Demo8,example:example8,core:core8+'\n\n// mesh.ts\n'+meshCore,coreName:'euler-characteristic.ts / mesh.ts',run:run8},
]
for(const topic of topics) topic.operation += ' 3D表示はドラッグで回転、ホイール／ピンチで拡大縮小。Reset Viewで視点を戻せます。'
export const session04:CourseSession={id:'04',number:4,title:'モデリングその1',description:'形状のデータとつながりを調べ、Boolean・Sweep・Bevel・Subdivisionで人工物の形を作ります。',date:'2026年10月23日',topics}
