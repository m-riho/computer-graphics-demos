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
