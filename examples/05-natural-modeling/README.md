# 第5回：自然物・複雑形状の計算例

各TypeScriptファイルは `runExample()` を公開し、共通の純粋計算へ入力を渡して、結果を返します。公開サイトの「コードで理解する」では、短い例・実行結果・共通関数の本体を読めます。

| ファイル | 入力 → 処理 → 結果 |
|---|---|
| point_cloud.ts | 三角形Mesh・点数 → 面積比例の表面標本化 → 点群 |
| quadtree.ts | 二値Grid → 一様判定・4分割 → 木と葉 |
| octree.ts | 占有Grid → 一様判定・8分割 → 大小のセル |
| sdf.ts | 評価点・円 → 距離とmin/max → 内外 |
| metaball.ts | 中心・重み → 影響値の和 → 等値線 |
| fractal.ts | 反復数 → 再帰分割／複素反復 → 件数・発散判定 |
| ifs_fern.ts | Seed・点数 → 確率でアフィン変換 → シダの点列 |
| lsystem.ts | Axiom・Rule → 書換えとStack → 枝の線分 |
| midpoint_displacement.ts | Seed・振幅・減衰 → 中点の変位 → 1D高さ列／三角形Mesh |
| perlin_noise.ts | Seed・評価点 → 勾配／内積／Fade／補間 → Noise値 |
| perlin_terrain.ts | Seed・周波数・重ね合わせ → 高さ場 → 山岳Mesh |
| perlin_clouds.ts | Seed・しきい値・柔らかさ → 不透明度 → 雲のRGBA画像 |
| particle_system.ts | 発生・速度・寿命 → 時間更新と除去 → 粒子状態 |

Node.js 22.18以降では、例えば次のように実行できます。

```sh
node --experimental-strip-types --input-type=module -e "import {runExample} from './examples/05-natural-modeling/quadtree.ts'; console.log(runExample())"
```

図形は自作トーラス・球・立方体などを使用。学生作品や過年度の画像は含めません。描画はVueとCanvas/SVG、分割・生成・Noise・粒子更新は自前の教育用計算です。描画や反復には上限があります。

Perlin Noiseは2D・8方向の単位勾配の教材版。NumPyのRandomStateに対応する置換表を使い、[昨年度Notebook](https://gist.github.com/m-riho/db6d2f5fa92edddd69f883e7e1454d67)の正しい計算例と一致します。符号付きのまま重ね合わせ、表示時だけ `(N+1)/2` を行います。

中点変位法の三角形版は、XZ平面を4分割し、Y（高さ）を変位させます。各共有辺の中点を1つだけ生成するため亀裂が生じません。閉じた立体のSubdivisionではなく、境界を持つ高さ場の教材です。最大5段階・1,024面に制限しています。

## 山岳と雲のサンプル

Perlinデモの「B Fractal Noise」→「用途」で、Terrain（山岳）／Clouds（雲）を選択します。Seed・Frequency・Octaves・Persistence・Lacunarityは共通です。山岳は高さと回転、雲はしきい値と境界の柔らかさを操作できます。

以下は別々のTypeScriptファイルです。コードページに並んでいる場合も、ファイルごとに保存して実行してください。

```sh
node --experimental-strip-types --input-type=module -e "import {runExample} from './examples/05-natural-modeling/perlin_terrain.ts'; console.log(runExample())"
node --experimental-strip-types --input-type=module -e "import {runExample} from './examples/05-natural-modeling/perlin_clouds.ts'; console.log(runExample())"
```

- `createMountain(seed, amplitude)` は49×37頂点・3,456三角形のMeshを返します。Y座標は `amplitude × N`。高さ0ではXZ平面になります。標本格子で表せる細かさには限界があり、極端に高い周波数では細部を正しく表せません。
- `createClouds(seed, threshold, softness)` は128×96の白い雲のRGBA画像を返します。`(N+1)/2` からsmoothstepでアルファ値を作ります。しきい値を下げると雲が増えます。Canvasへの表示方法はファイル内に記載しています。2Dテクスチャによる表現で、3Dの体積雲・気象・流体計算ではありません。
- `runExample()` は返り値の要約を出します。メッシュや画素の全データを使う場合は、上記の `createMountain`／`createClouds` を呼んでください。
- 共通計算は `packages/cg-algorithms/src/nature-noise-applications.ts`。操作版とサンプルで同じ関数を利用します。
