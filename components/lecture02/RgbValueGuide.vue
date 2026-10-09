<script setup lang="ts">
withDefaults(defineProps<{section?:'rgb'|'alpha'|'all';compact?:boolean}>(),{section:'all'})
</script>
<template>
<div class="rgb-value-guide" :class="{compact}">
<section v-if="section!=='alpha'" aria-label="RGBの名前と数値範囲">
<div class="rgb-names"><span><b>R</b> = Red（赤）</span><span><b>G</b> = Green（緑）</span><span><b>B</b> = Blue（青）</span></div>
<p>各成分をどれだけ含めるかを、3つの数値で表します。</p>
<table><thead><tr><th>表し方</th><th>各成分の範囲</th><th>赤の例（R, G, B）</th></tr></thead><tbody><tr><td>各成分8 bitの整数</td><td>0〜255（256段階）</td><td>(255, 0, 0)</td></tr><tr><td>0〜1に正規化した値</td><td>0〜1</td><td>(1, 0, 0)</td></tr></tbody></table>
<p class="value-equation">正規化した値 = 8 bitの値 ÷ 255</p>
<div class="value-examples"><span>0 ↔ 0</span><span>128 ↔ 約0.502</span><span>255 ↔ 1</span></div>
<p class="guide-note">同じ色空間・符号化なら、数値の尺度を変えても同じ色です。<br>0〜1に換算しても、光の強さに比例する値になるとは限りません。</p>
<p class="guide-caption">ここではよく使う表現を紹介しています。HDRなどでは0〜1の範囲を超える値も扱います。</p>
</section>
<section v-if="section!=='rgb'" aria-label="アルファ値と不透明度" :class="{'alpha-section':section==='all'}">
<p><strong>RGBA = Red, Green, Blue, Alpha</strong><br>α（アルファ）は<strong>不透明度</strong>。RGBとは別に、背景の透け方を指定します。</p>
<div class="alpha-comparison"><figure v-for="a in [0,.5,1]" :key="a"><div class="alpha-background" role="img" :aria-label="`赤い四角、アルファ値${a}`"><span>背景</span><div class="alpha-paint" :style="{background:`rgb(255 0 0 / ${a})`}" /></div><figcaption><b>α = {{a}}</b><br>{{a===0?'透明':a===1?'不透明':'半透明'}}</figcaption></figure></div>
<p class="guide-note">同じ赤でも、αが小さいほど背景が透けて見えます。<br>α = 0 は「黒」ではなく、前景が見えない状態です。</p>
<p class="guide-caption">RGBAを各成分8 bitで保存する形式では、αも0〜255で表します（0：透明、255：不透明）。<br>上の図は同じ背景・同じRGBを使い、αだけを変更しています。</p>
</section>
<p class="guide-source">参考：<a href="https://www.w3.org/TR/css-color-4/#rgb-functions">W3C CSS Color 4 — RGB</a>・<a href="https://www.w3.org/TR/css-color-4/#alpha-value">Alpha</a></p>
</div>
</template>
<style scoped>
.rgb-value-guide{font-size:24px;line-height:1.55;color:var(--ink,#203649)}.rgb-names{display:flex;justify-content:space-between;gap:16px;font-size:29px;margin:0 0 16px}.rgb-value-guide p{margin:14px 0}.rgb-value-guide table{width:100%;font-size:24px;border-collapse:collapse}.rgb-value-guide th,.rgb-value-guide td{padding:12px 14px;border-bottom:1px solid var(--rule,#c8d2db);text-align:left}.value-equation{font-weight:700}.value-examples{display:flex;justify-content:space-around;gap:20px;background:var(--soft,#f0f5fa);padding:12px}.rgb-value-guide .guide-note{font-size:22px;border-left:4px solid var(--accent,#175f9f);padding-left:18px;margin-top:20px}.rgb-value-guide .guide-caption,.rgb-value-guide .guide-source{font-size:17px;line-height:1.5;margin:12px 0}.alpha-section{margin-top:32px;padding-top:20px;border-top:1px solid var(--rule,#c8d2db)}.alpha-comparison{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin:22px 0}.alpha-comparison figure{margin:0;text-align:center}.alpha-background{position:relative;height:150px;border:1px solid #c1c9d0;background:conic-gradient(#ddd 25%,white 0 50%,#ddd 0 75%,white 0) 0 0/30px 30px;display:grid;place-items:center}.alpha-background span{font-size:25px;color:#202124;font-weight:600}.alpha-paint{position:absolute;inset:12px}.alpha-comparison figcaption{font-size:22px;margin-top:8px}.guide-source a{text-decoration:underline}
@media(max-width:650px){.rgb-value-guide{font-size:18px}.rgb-names{font-size:20px;flex-direction:column;gap:5px}.rgb-value-guide table{font-size:15px}.rgb-value-guide th,.rgb-value-guide td{padding:8px 5px}.value-examples{font-size:16px;gap:8px;padding:8px;flex-wrap:wrap}.rgb-value-guide .guide-note{font-size:18px}.alpha-comparison{gap:8px}.alpha-background{height:120px}.alpha-background span{font-size:18px}.alpha-paint{inset:8px}.alpha-comparison figcaption{font-size:17px}.rgb-value-guide .guide-caption,.rgb-value-guide .guide-source{font-size:15px}}
.rgb-value-guide.compact p{margin:6px 0}.rgb-value-guide.compact th,.rgb-value-guide.compact td{padding:5px 14px}.rgb-value-guide.compact .rgb-names{margin-bottom:8px}.rgb-value-guide.compact .value-examples{padding:8px}.rgb-value-guide.compact .guide-note{margin-top:14px}.rgb-value-guide.compact .guide-caption,.rgb-value-guide.compact .guide-source{margin:8px 0}.rgb-value-guide.compact .alpha-comparison{margin:18px 0}
</style>
