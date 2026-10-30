import type {CourseSession,Topic} from '../session-model.ts'
import sharedCore from '../../../packages/cg-algorithms/src/natural-modeling.ts?raw'
import Demo0 from '../../../components/lecture05/CharacterRepresentationDemo.vue'
import example0 from '../../../examples/05-natural-modeling/point_cloud.ts?raw'
import {runExample as run0} from '../../../examples/05-natural-modeling/point_cloud.ts'
import core0 from '../../../packages/cg-algorithms/src/nature-spatial.ts?raw'
import Demo1 from '../../../components/lecture05/QuadtreeTileExplorer.vue'
import example1 from '../../../examples/05-natural-modeling/quadtree.ts?raw'
import {runExample as run1} from '../../../examples/05-natural-modeling/quadtree.ts'
import core1 from '../../../packages/cg-algorithms/src/nature-spatial.ts?raw'
import Demo2 from '../../../components/lecture05/OctreeVoxelExplorer.vue'
import example2 from '../../../examples/05-natural-modeling/octree.ts?raw'
import {runExample as run2} from '../../../examples/05-natural-modeling/octree.ts'
import core2 from '../../../packages/cg-algorithms/src/nature-spatial.ts?raw'
import Demo3 from '../../../components/lecture05/SDFBooleanExplorer.vue'
import example3 from '../../../examples/05-natural-modeling/sdf.ts?raw'
import {runExample as run3} from '../../../examples/05-natural-modeling/sdf.ts'
import core3 from '../../../packages/cg-algorithms/src/nature-fields.ts?raw'
import Demo4 from '../../../components/lecture05/MetaballExplorer.vue'
import example4 from '../../../examples/05-natural-modeling/metaball.ts?raw'
import {runExample as run4} from '../../../examples/05-natural-modeling/metaball.ts'
import core4 from '../../../packages/cg-algorithms/src/nature-fields.ts?raw'
import Demo5 from '../../../components/lecture05/FractalExplorer.vue'
import example5 from '../../../examples/05-natural-modeling/fractal.ts?raw'
import {runExample as run5} from '../../../examples/05-natural-modeling/fractal.ts'
import core5 from '../../../packages/cg-algorithms/src/nature-fractals.ts?raw'
import Demo6 from '../../../components/lecture05/IFSFernExplorer.vue'
import example6 from '../../../examples/05-natural-modeling/ifs_fern.ts?raw'
import {runExample as run6} from '../../../examples/05-natural-modeling/ifs_fern.ts'
import core6 from '../../../packages/cg-algorithms/src/nature-fractals.ts?raw'
import Demo7 from '../../../components/lecture05/LSystemLab.vue'
import example7 from '../../../examples/05-natural-modeling/lsystem.ts?raw'
import {runExample as run7} from '../../../examples/05-natural-modeling/lsystem.ts'
import core7 from '../../../packages/cg-algorithms/src/nature-rules.ts?raw'
import Demo8 from '../../../components/lecture05/MidpointDisplacementLab.vue'
import example8 from '../../../examples/05-natural-modeling/midpoint_displacement.ts?raw'
import {runExample as run8} from '../../../examples/05-natural-modeling/midpoint_displacement.ts'
import core8 from '../../../packages/cg-algorithms/src/nature-rules.ts?raw'
import Demo9 from '../../../components/lecture05/PerlinNoiseLab.vue'
import example9 from '../../../examples/05-natural-modeling/perlin_noise.ts?raw'
import {runExample as run9} from '../../../examples/05-natural-modeling/perlin_noise.ts'
import core9 from '../../../packages/cg-algorithms/src/nature-noise.ts?raw'
import Demo10 from '../../../components/lecture05/ParticleSystemLab.vue'
import example10 from '../../../examples/05-natural-modeling/particle_system.ts?raw'
import {runExample as run10} from '../../../examples/05-natural-modeling/particle_system.ts'
import core10 from '../../../packages/cg-algorithms/src/nature-particles.ts?raw'
const topics:Topic[]=[
{"id": "character-representation", "title": "同じ形を5つのデータで表す", "question": "Meshの頂点と、表面から取った点は同じ？", "purpose": "同じ自作モデルをMesh・Wireframe・Vertices・Point Cloud・Voxelで比較します。", "operation": "表現と点数を変え、ドラッグで回転します。Reset Viewで視点を戻します。", "observe": "Meshは面と接続を持ちます。Point Cloudは面積に応じた表面標本化で、元頂点の抽出ではありません。", "explanation": "三角形を面積比で選び、重心座標で表面へ点を置きます。Voxelは3Dセルの占有を表します。", "think": "何点なら穴や曲面が分かるでしょうか？", "priority": true,demo:Demo0,example:example0,core:core0+'\n\n// 共通の基本計算\n'+sharedCore,coreName:'nature-spatial.ts / natural-modeling.ts',run:run0},
{"id": "quadtree", "title": "4分木とタイル図形", "question": "同じ色の領域をまとめると、木はどうなる？", "purpose": "編集できる二値タイルと領域分割・木構造の対応を調べます。", "operation": "プリセットを選ぶかタイルを編集し、Stepで進めます。Buildは全体を構築、Autoは順に進めます。", "observe": "一様な領域は葉、混在する領域は4つの子になります。子の順序は左上・右上・左下・右下です。", "explanation": "領域の全セルが同じ値か調べ、混在するときだけ再帰的に分割します。", "think": "Checkerboardでは、元のGridより記録量が少なくなるでしょうか？", "priority": true,demo:Demo1,example:example1,core:core1+'\n\n// 共通の基本計算\n'+sharedCore,coreName:'nature-spatial.ts / natural-modeling.ts',run:run1},
{"id": "octree", "title": "8分木で3D空間を分ける", "question": "2Dの4つの子は、3Dでどう変わる？", "purpose": "Uniform GridとOctreeの領域・葉・内部ノードを比較します。", "operation": "形状とMax depth、占有／空／Octree／元の面の表示を変え、回転して観察します。", "observe": "x・y・zをそれぞれ2等分すると8領域。一様領域は大きいセルのまま残せます。", "explanation": "有限解像度の占有Gridを基準に、値が一様な部分をまとめる教育用8分木です。", "think": "球の内部と境界では、セルの大きさがどう違いますか？", "priority": true,demo:Demo2,example:example2,core:core2+'\n\n// 共通の基本計算\n'+sharedCore,coreName:'nature-spatial.ts / natural-modeling.ts',run:run2},
{"id": "sdf-boolean", "title": "SDFと集合演算", "question": "負・0・正だけで内外を決められる？", "purpose": "評価点の距離と符号を、図形の内側・境界・外側に対応づけます。", "operation": "評価点pと図形Bをドラッグし、Union・Intersection・A−Bを比較します。", "observe": "Unionはmin、Intersectionはmax、A−Bはmax(dA,−dB)。差集合は順序に注意します。", "explanation": "円の断面の距離は中心からの長さ−半径。合成の符号と境界は集合に対応しますが、値が常に厳密な最短距離になるとは限りません。", "think": "Bを遠ざけると、IntersectionとA−Bはどうなりますか？", "priority": true,demo:Demo3,example:example3,core:core3+'\n\n// 共通の基本計算\n'+sharedCore,coreName:'nature-fields.ts / natural-modeling.ts',run:run3},
{"id": "metaball", "title": "Metaballの影響を足す", "question": "中心を近づけると、なぜ間がつながる？", "purpose": "複数の影響値の和としきい値から、輪郭が生まれる過程を見ます。", "operation": "中心をドラッグし、個数・重み・影響半径・しきい値を変更します。", "observe": "輪郭は影響の和がしきい値に等しい場所。SDFのminによるUnionとは異なります。", "explanation": "中心から離れるほど弱くなる有限半径で0になる滑らかな影響を足し、格子上の等値線を近似して描きます。", "think": "しきい値を上げると、つながった部分はどう変わりますか？", "priority": false,demo:Demo4,example:example4,core:core4+'\n\n// 共通の基本計算\n'+sharedCore,coreName:'nature-fields.ts / natural-modeling.ts',run:run4},
{"id": "fractal", "title": "Fractalの規則と反復", "question": "少ない規則を繰り返すと、どこまで細かくなる？", "purpose": "Koch・Sierpiński・Mandelbrot・Juliaを反復回数と対応づけます。", "operation": "モードと反復を変更します。複素反復ではZoom・Pan・Reset、Juliaではcの実部・虚部を操作します。", "observe": "Kochは線分を4本へ、Sierpińskiは三角形を3個へ。複素反復は発散判定で模様を作ります。", "explanation": "線分・三角形の再帰分割と、z←z²+cの有限回反復を実装しています。画素解像度と回数には上限があります。", "think": "反復を増やすと、描く要素数は何倍になりますか？", "priority": false,demo:Demo5,example:example5,core:core5+'\n\n// 共通の基本計算\n'+sharedCore,coreName:'nature-fractals.ts / natural-modeling.ts',run:run5},
{"id": "ifs-fern", "title": "IFSでシダを生成する", "question": "4つの変換を選ぶだけでシダになる？", "purpose": "変換の選択・点の移動・反復からBarnsley fernを生成します。", "operation": "点数とSeedを変更し、少数点から形が現れる過程を観察します。", "observe": "次の点は現在の点にアフィン変換を適用した結果。同じSeedなら同じ点列です。", "explanation": "確率で4つの縮小アフィン変換を選び、p(k+1)=Aᵢp(k)+bᵢを繰り返します。", "think": "どの変換が茎や左右の小葉を作っているでしょうか？", "priority": false,demo:Demo6,example:example6,core:core6+'\n\n// 共通の基本計算\n'+sharedCore,coreName:'nature-fractals.ts / natural-modeling.ts',run:run6},
{"id": "lsystem", "title": "L-system：文字列から枝へ", "question": "文字列の書換えが、どう枝分かれになる？", "purpose": "Axiom・Rule・反復から文字列を作り、Turtleの動きとStackを追います。", "operation": "プリセットや規則、角度、長さを変えます。Stepで描画命令を進めます。", "observe": "Fは前進、+／−は回転、[は位置と向きを保存、]は復元。授業の規則ではF数が5倍ずつ増えます。", "explanation": "全文字を同時に置換して次の世代を作り、Turtleが命令を順に読みます。長さの上限を設けています。", "think": "[ と ] がなければ、枝を描いた後に元の分岐へ戻れるでしょうか？", "priority": true,demo:Demo7,example:example7,core:core7+'\n\n// 共通の基本計算\n'+sharedCore,coreName:'nature-rules.ts / natural-modeling.ts',run:run7},
{"id": "midpoint-displacement", "title": "中点変位で地形を作る", "question": "三角形を分割し、中点を上下にずらすと？", "purpose": "線分の1D断面と三角形の3D地形を切り替え、再帰分割と変位幅の減衰を確認します。", "operation": "Modeを選び、Iteration・Amplitude・Decay・Seedと途中段階を操作します。三角形はドラッグで回転できます。", "observe": "新しい高さは両端の平均＋乱数変位。Decayを変えると小さい凹凸の強さが変わります。", "explanation": "線分は2分割、三角形は各辺に中点を追加して4分割します。中点の高さを両端の平均＋乱数変位で求め、共有辺では同じ中点を再利用します。段階ごとに変位幅を減らし、Seedを固定すると再現できます。", "think": "Decayが大きいと、細部の起伏は強くなるでしょうか？", "priority": false,demo:Demo8,example:example8,core:core8+'\n\n// 共通の基本計算\n'+sharedCore,coreName:'nature-rules.ts / natural-modeling.ts',run:run8},
{"id": "perlin-noise", "title": "Perlin Noiseのしくみと用途", "question": "同じNoiseを、明るさ・高さ・密度に使うと？", "purpose": "Random／Value／Perlinの比較から、勾配・内積・補間の計算まで追います。", "operation": "比較・Fractal Noise・計算過程を切り替えます。Seedや周波数を変更し、計算過程では点pをドラッグします。", "observe": "Perlinは格子の勾配と変位の内積を補間します。表示用の(N+1)/2は最後に1回だけです。", "explanation": "昨年度Python例の8方向の単位勾配と5次Fadeを継承。Seed 0、点(2.3,3.7)の値は−0.23926379です。", "think": "格子点だけを評価した場合と、格子間を評価した場合はどう違いますか？", "priority": true,demo:Demo9,example:example9,core:core9+'\n\n// 共通の基本計算\n'+sharedCore,coreName:'nature-noise.ts / natural-modeling.ts',run:run9},
{"id": "particle-system", "title": "Particle：生成から消滅まで", "question": "点の状態を更新すると、炎・煙・雪に見える？", "purpose": "生成→更新→描画→除去と、各粒子の位置・速度・寿命を対応づけます。", "operation": "Fire・Smoke・Sparks・Fountain・Snowを選び、Play/PauseやStepで進めます。放出率・速度・重力・風・寿命などを変えます。", "observe": "Smokeは上昇しながら拡大し、薄くなって消えます。寿命を過ぎた粒子は除去。ConstantとNoiseの風を比べ、規則と見え方を対応づけます。", "explanation": "固定時間刻みで速度・位置・年齢を更新します。最大粒子数を制限した教育用シミュレーションです。Smokeは半透明粒子による簡略表現で、流体シミュレーションではありません。", "think": "放出率が同じで寿命だけ長くなると、生きている粒子数はどう変わりますか？", "priority": true,demo:Demo10,example:example10,core:core10+'\n\n// 共通の基本計算\n'+sharedCore,coreName:'nature-particles.ts / natural-modeling.ts',run:run10},
]
// 粒子で使うNoiseも、コード版で中身を読めるようにする。
topics[10].core += '\n\n// nature-noise.ts\n' + core9
topics[10].coreName += ' / nature-noise.ts'
export const session05:CourseSession={id:'05',number:5,title:'モデリングその2',date:'2026年10月30日',description:'自然物・複雑形状を、どう表し、どう生成し、どう取得するか。データ・途中の計算・結果を11本の操作とコードで結びます。',topics,stories:[
{"title": "A 同じ形を違うデータで表す", "description": "Mesh → Point Cloud → Voxel → Octree", "topicIds": ["character-representation", "octree"]},
{"title": "B 2Dから3Dの階層表現", "description": "Tile → Quadtree ／ Voxel → Octree", "topicIds": ["quadtree", "octree"]},
{"title": "C 関数から形を作る", "description": "SDF → Boolean ／ 影響の和 → Metaball", "topicIds": ["sdf-boolean", "metaball"]},
{"title": "D 規則から複雑さを作る", "description": "Fractal → IFS → L-system", "topicIds": ["fractal", "ifs-fern", "lsystem"]},
{"title": "E 乱数を自然らしい変化へ", "description": "中点変位 ／ Random → Value → Perlin → Terrain", "topicIds": ["midpoint-displacement", "perlin-noise"]},
{"title": "F 値を時間変化へ使う", "description": "Noise → Wind → Particle System", "topicIds": ["perlin-noise", "particle-system"]},
]}
