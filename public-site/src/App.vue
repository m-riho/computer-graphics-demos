<script setup lang="ts">
import {computed,ref,onMounted,onUnmounted,nextTick} from 'vue'
import {sessions} from './sessions'
import {resolveRoute,sessionHref,topicHref} from './routing'
import license from '../publish/LICENSE?raw'
import vueLicense from '../publish/VUE-LICENSE.md?raw'
import notices from '../publish/THIRD_PARTY_NOTICES.md?raw'
const path=ref(location.hash.slice(1)||'/'),heading=ref<HTMLElement>()
const route=computed(()=>resolveRoute(path.value,sessions))
const session=computed(()=>{const r=route.value;return r.kind==='session'||r.kind==='topic'?r.session:undefined})
const topic=computed(()=>{const r=route.value;return r.kind==='topic'?r.topic:undefined})
const mode=computed(()=>{const r=route.value;return r.kind==='topic'?r.mode:'demo'})
const sessionLabel=computed(()=>session.value?`第${session.value.number}回 / ${session.value.title}`:'授業回から選ぶCG教材')
const output=computed(()=>topic.value?JSON.stringify(topic.value.run(),(_,v)=>typeof v==='number'?Number(v.toFixed(5)):v,2):'')
function updateTitle(){document.title=[topic.value?.title,session.value?`第${session.value.number}回 ${session.value.title}`:undefined,'CGを、触って学ぶ。'].filter(Boolean).join(' | ')}
async function navigate(){path.value=location.hash.slice(1)||'/';updateTitle();await nextTick();window.scrollTo(0,0);heading.value?.focus({preventScroll:true})}
onMounted(()=>{window.addEventListener('hashchange',navigate);updateTitle()})
onUnmounted(()=>window.removeEventListener('hashchange',navigate))
</script>
<template>
<a class="skip" href="#content" @click.prevent="heading?.focus()">本文へ移動</a>
<header class="site-header"><a class="brand" href="#/" aria-label="CG教材 トップ"><span class="brand-mark">CG</span><span>触って学ぶ、グラフィックス。</span></a><span class="header-course">{{sessionLabel}}</span></header>
<main id="content">
<template v-if="route.kind==='home'">
<section class="hero"><p class="eyebrow">COMPUTER GRAPHICS</p><h1 ref="heading" tabindex="-1">CGを、<br>自分の手で確かめる。</h1><p class="hero-description">動かす。変化を見る。コードで理由を知る。<br>授業回を選んで、学びたいテーマへ進みましょう。</p><div class="learning-path"><span>01 操作する</span><b aria-hidden="true">→</b><span>02 観察する</span><b aria-hidden="true">→</b><span>03 コードを読む</span></div></section>
<section aria-labelledby="sessions-title"><div class="section-heading"><h2 id="sessions-title">授業回から選ぶ</h2><p>公開中の教材を、授業回ごとにまとめています。</p></div><div class="session-grid"><article class="session-card" v-for="s in sessions" :key="s.id"><p class="eyebrow">第{{s.number}}回 <span v-if="s.date">· {{s.date}}</span></p><h3><a :href="sessionHref(s)">{{s.title}}</a></h3><p>{{s.description}}</p><div class="session-card-bottom"><span>{{s.topics.length}}テーマ</span><a class="primary-link" :href="sessionHref(s)" :aria-label="`第${s.number}回の教材を見る`">教材を見る →</a></div></article></div><p v-if="!sessions.length">教材を準備しています。</p></section>
</template>
<template v-else-if="route.kind==='session' && session">
<nav class="breadcrumbs" aria-label="パンくず"><a href="#/">授業回一覧</a><span aria-hidden="true">/</span><span>第{{session.number}}回</span></nav>
<section class="lesson-heading"><p class="eyebrow">第{{session.number}}回 <span v-if="session.date">· {{session.date}}</span></p><h1 ref="heading" tabindex="-1">{{session.title}}</h1><p>{{session.description}}</p></section>
<section aria-labelledby="topics-title"><div class="section-heading"><h2 id="topics-title">学ぶテーマ</h2><p>{{session.topics.length}}テーマから選べます。</p></div><div class="topic-grid"><article class="topic-card" v-for="(t,i) in session.topics" :key="t.id"><span class="topic-number">{{String(i+1).padStart(2,'0')}}</span><h3>{{t.title}}</h3><p>{{t.question}}</p><div class="entry-links"><a class="primary-link" :href="topicHref(session,t,'demo')" :aria-label="`${t.title}：操作して理解する`">▶ 操作して理解する</a><a :href="topicHref(session,t,'code')" :aria-label="`${t.title}：コードで理解する`">&lt;/&gt; コードで理解する</a></div></article></div></section>
</template>
<section v-else-if="route.kind==='license'" class="license-page"><h1 ref="heading" tabindex="-1">ライセンス・参照資料</h1><h2>教材：MIT License</h2><pre>{{license}}</pre><h2>依存ライブラリ：Vue</h2><pre>{{vueLicense}}</pre><h2>素材と参照資料</h2><pre>{{notices}}</pre></section>
<template v-else-if="route.kind==='topic' && topic && session">
<nav class="breadcrumbs" aria-label="パンくず"><a href="#/">授業回一覧</a><span aria-hidden="true">/</span><a :href="sessionHref(session)">第{{session.number}}回：{{session.title}}</a><span aria-hidden="true">/</span><span>{{topic.title}}</span></nav>
<section class="lesson-heading"><p class="eyebrow">{{mode==='demo'?'INTERACTIVE DEMO':'ALGORITHM EXAMPLE'}}</p><h1 ref="heading" tabindex="-1">{{topic.title}}</h1><p>{{topic.purpose}}</p></section>
<nav class="lesson-tabs" aria-label="学び方"><a :href="topicHref(session,topic,'demo')" :aria-current="mode==='demo'?'page':undefined">▶ 操作して理解する</a><a :href="topicHref(session,topic,'code')" :aria-current="mode==='code'?'page':undefined">&lt;/&gt; コードで理解する</a></nav>
<template v-if="mode==='demo'"><div class="lesson-guidance"><section><h2>操作してみよう</h2><p>{{topic.operation}}</p></section><section><h2>ここを観察</h2><p>{{topic.observe}}</p></section></div><div class="site-demo"><component :is="topic.demo" :key="`${session.id}/${topic.id}`" v-bind="topic.demoProps ?? {}" /></div><section class="think"><h2>なぜだろう？</h2><p>{{topic.think}}</p><a class="primary-link" :href="topicHref(session,topic,'code')">コードで仕組みを確かめる →</a></section></template>
<template v-else><section class="code-intro"><h2>このコードで確かめること</h2><p>{{topic.explanation}}</p><p>入力値を変え、同じ計算からどんな結果が得られるか考えてみましょう。</p></section><div class="code-columns"><section><h2>短い実験コード <span>TypeScript</span></h2><pre class="source-code" tabindex="0" aria-label="実験コード"><code>{{topic.example}}</code></pre></section><section><h2>実行結果</h2><pre class="result-code" tabindex="0" aria-label="実行結果"><code>{{output}}</code></pre><p class="result-note">表示中の共通関数を実行した値です。小数は5桁に丸めています。</p></section></div><details class="core-code"><summary>計算の実装も読む：{{topic.coreName}}</summary><p>操作版と上の実験が共通で使う関数です。入力から結果までを追ってみましょう。</p><pre class="source-code" tabindex="0" aria-label="共通アルゴリズム"><code>{{topic.core}}</code></pre></details><section class="think"><h2>コードと観察をつなぐ</h2><p>{{topic.think}}</p><a class="primary-link" :href="topicHref(session,topic,'demo')">操作版でもう一度確かめる →</a></section></template>
</template>
<section v-else class="not-found"><h1 ref="heading" tabindex="-1">ページが見つかりません</h1><a href="#/">授業回一覧に戻る</a></section>
</main>
<footer class="site-footer"><span>CG学習教材</span><span>© 2026 Hisashi Sato · <a href="#/license">MIT License・参照資料</a></span></footer>
</template>
