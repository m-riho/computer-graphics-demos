# 第4回 モデリングその1：短い実験コード

公開サイトの各テーマの「コードで理解する」で、入力・共有関数・出力を確認できます。各ファイルの `runExample()` はVueなしで実行可能です。例えばプロジェクトルートから：

```sh
node --experimental-strip-types -e "import('./examples/04-modeling/subdivision.ts').then(m=>m.runExample())"
```

| 例 | 対応する概念 |
|---|---|
| representation.ts | Wireframe / Surface / Solid、点の内外 |
| mesh-elements.ts | 頂点・辺・面と接続 |
| half-edge.ts | next / twinと面・頂点の周回 |
| manifold.ts | 接続の局所検査と境界 |
| boolean-csg.ts | BSPによる集合演算 |
| extrude.ts / revolve.ts | 断面から側面・端面を作る |
| bevel.ts | 面取り幅と円柱・球面近似 |
| subdivision.ts | 4方式の要素数と元頂点の保持 |
| euler-characteristic.ts | 局所編集とV−E＋F |

Meshは `{vertices: [x,y,z][], faces: number[][]}`。faceは向きを持つ頂点番号の列です。辺と隣接関係を導出し、表示と計算で共用します。入力条件と教育用の簡略化は各関数の説明、およびサイトの参照資料ページに記載しています。
