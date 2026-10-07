# 色とデジタル画像：短いTypeScript実験

各ファイルの `runExample()` は入力値を用意して共通関数を呼び、観察用の結果を返します。UIやCanvas処理は含みません。計算の本体は `packages/cg-algorithms/src/` に1か所だけ置き、コード解説ページでも同じ内容を表示しています。

| ファイル | 確かめること | 共通の実装 |
|---|---|---|
| cone-response.ts | 波長とS/M/L模式応答 | cone-response.ts |
| rgb-mixing.ts | RGBの符号値から表示色へ | color.ts |
| rgb-hsv.ts | RGB→HSV→RGBの往復 | color.ts |
| sampling.ts | 位置・画素数を変える | sampling.ts |
| quantization.ts | 値を2^bits段階へ丸める | quantization.ts |
| gamma.ts | べき乗モデルとsRGBの違い | gamma.ts |
| aliasing.ts | 1点判定と4×4点の被覆率 | aliasing.ts |
| jpeg-compression.ts | DCT係数の量子化と復元誤差 | jpeg.ts |
| tone-mapping.ts | 露出・Reinhard・クリップ | tone-mapping.ts |

`colorMath.ts` は既存コードの互換用re-exportで、独自の計算処理を持ちません。実験の条件を変える際はこれらの共通関数を呼び、同じアルゴリズムを別ファイルへコピーしないでください。
