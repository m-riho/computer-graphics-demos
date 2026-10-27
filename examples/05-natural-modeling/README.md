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
| midpoint_displacement.ts | Seed・振幅・減衰 → 中点の変位 → 高さ列 |
| perlin_noise.ts | Seed・評価点 → 勾配／内積／Fade／補間 → Noise値 |
| particle_system.ts | 発生・速度・寿命 → 時間更新と除去 → 粒子状態 |

Node.js 22.18以降では、例えば次のように実行できます。

```sh
node --experimental-strip-types --input-type=module -e "import {runExample} from './examples/05-natural-modeling/quadtree.ts'; console.log(runExample())"
```

図形は自作トーラス・球・立方体などを使用。学生作品や過年度の画像は含めません。描画はVueとCanvas/SVG、分割・生成・Noise・粒子更新は自前の教育用計算です。描画や反復には上限があります。

Perlin Noiseは2D・8方向の単位勾配の教材版。NumPyのRandomStateに対応する置換表を使い、[昨年度Notebook](https://gist.github.com/m-riho/db6d2f5fa92edddd69f883e7e1454d67)の正しい計算例と一致します。符号付きのまま重ね合わせ、表示時だけ `(N+1)/2` を行います。
