# 依存ライブラリと教材上の参照資料

## 配布に含まれる自作素材

図形・グラデーション・JPEGの8×8輝度ブロックはプログラムで生成します。第三者の写真・実測錐体データは含みません。錐体応答は重なりを説明するガウス曲線の模式モデルであり、科学的な標準観測者のデータではありません。

## 依存ライブラリ

- [Vue](https://github.com/vuejs/core/blob/main/LICENSE)：MIT License。配布用NOTICEは同梱の `VUE-LICENSE.md` に全文を掲載。
- [Vite](https://github.com/vitejs/vite/blob/main/LICENSE)：MIT License（ビルド時）。
- [TypeScript](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt)：Apache-2.0（型検査時）。
- [Vue language tools](https://github.com/vuejs/language-tools/blob/master/LICENSE)：MIT License（型検査時）。
- [Vite plugin Vue](https://github.com/vitejs/vite-plugin-vue/blob/main/LICENSE)：MIT License（ビルド時）。

各npmパッケージはそのパッケージ同梱のライセンスに従います。

## 方式を確認するための一次資料

- sRGB：[ICC sRGB registry](https://registry.color.org/rgb-registry/srgb)。教材の単純なガンマモデルとは区別。
- JPEG：[JPEG committee — JPEG 1](https://jpeg.org/jpeg/)。8×8輝度DCT・同一刻みの量子化実験は自作の簡略実装であり、JPEGのすべての処理を再現しません。
- トーンマッピング：[Reinhard et al. (2002)](https://www.cs.utah.edu/docs/techreports/2002/pdf/UUCS-02-001.pdf)。教材では基本的なL/(1+L)の形を用います。

上記資料から文章・図・データを転載したものではありません。

- 標本化：[PBRT 4e, Sampling Theory](https://pbr-book.org/4ed/Sampling_and_Reconstruction/Sampling_Theory)。標本化不足、帯域制限、エイリアシングの説明を確認。波形・回転・縞・画素図は自作。車輪の代表速度は同一スポークの回転対称性から計算します。

- RGB値と不透明度：[W3C CSS Color 4](https://www.w3.org/TR/css-color-4/#rgb-functions)。RGBA比較図は同じ赤をα=0・0.5・1で重ねた自作図。

### アルファ合成デモ（2026年10月9日追加）

- W3C, Compositing and Blending Level 1, Simple alpha compositing: https://www.w3.org/TR/compositing-1/#simplealphacompositing
- 不透明な背景へのsource-over合成を説明。図はHTML/CSSによる自作。前景・背景のsRGB符号値を重み付けする教材例で、線形光での計算とは区別。

### モデリング教材（2026年10月23日・第4回）

デモの立体・図・計算実装は本教材の自作です。外部モデル、過年度資料の画像、第三者のコードは配布していません。新しい3Dライブラリは追加せず、Vue/SVGと純粋TypeScriptで構成しています。

方式の確認に用いた一次資料：

- CGAL Halfedge Data Structures: https://doc.cgal.org/latest/HalfedgeDS/index.html
- Blender Manual, Boolean Modifier: https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/booleans.html
- Blender Manual, Bevel Modifier: https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/bevel.html
- Pixar OpenSubdiv, Subdivision Surfaces: https://opensubdiv.org/docs/subdivision_surfaces.html
- Zorin, Schröder, Sweldens (1996), Interpolating Subdivision for Meshes with Arbitrary Topology: https://mrl.cs.nyu.edu/publications/interpolating-subdivision/butterfly.pdf
- Zorin et al., Subdivision for Modeling and Animation, SIGGRAPH 2000 course notes: https://cs.nyu.edu/~dzorin/sig00course/coursenotes00.pdf

教材上の範囲：Booleanは浮動小数点の教育用BSP、曲面Primitiveは多角形近似、Bevelは立方体用の構成です。Subdivisionは閉じた向きの整合したManifoldに限定し、境界・Crease拡張は含めません。Manifold検査は接続構造を調べ、自己交差や製造可能性までは保証しません。元資料の文・図やライブラリ実装の転載ではありません。
