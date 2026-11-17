import type { CourseSession } from '../session-model.ts'
import { shadingDemos } from '../../../components/shading/shading-registry.ts'
import classicCore from '../../../packages/cg-algorithms/src/shading-classic.ts?raw'
import advancedCore from '../../../packages/cg-algorithms/src/shading-advanced.ts?raw'
import geometryCore from '../../../packages/cg-algorithms/src/shading-geometry.ts?raw'
import gpuCore from '../../../packages/cg-algorithms/src/shading-gpu.ts?raw'
import example0 from '../../../examples/07-shading/visibility-shading.ts?raw'
import { runExample as run0 } from '../../../examples/07-shading/visibility-shading.ts'
import example1 from '../../../examples/07-shading/lambert.ts?raw'
import { runExample as run1 } from '../../../examples/07-shading/lambert.ts'
import example2 from '../../../examples/07-shading/point-light.ts?raw'
import { runExample as run2 } from '../../../examples/07-shading/point-light.ts'
import example3 from '../../../examples/07-shading/oren-nayar.ts?raw'
import { runExample as run3 } from '../../../examples/07-shading/oren-nayar.ts'
import example4 from '../../../examples/07-shading/phong-blinn.ts?raw'
import { runExample as run4 } from '../../../examples/07-shading/phong-blinn.ts'
import example5 from '../../../examples/07-shading/shading-comparison.ts?raw'
import { runExample as run5 } from '../../../examples/07-shading/shading-comparison.ts'
import example6 from '../../../examples/07-shading/brdf-lobe.ts?raw'
import { runExample as run6 } from '../../../examples/07-shading/brdf-lobe.ts'
import example7 from '../../../examples/07-shading/microfacet-ndf.ts?raw'
import { runExample as run7 } from '../../../examples/07-shading/microfacet-ndf.ts'
import example8 from '../../../examples/07-shading/fresnel.ts?raw'
import { runExample as run8 } from '../../../examples/07-shading/fresnel.ts'
import example9 from '../../../examples/07-shading/cook-torrance.ts?raw'
import { runExample as run9 } from '../../../examples/07-shading/cook-torrance.ts'
import example10 from '../../../examples/07-shading/principled.ts?raw'
import { runExample as run10 } from '../../../examples/07-shading/principled.ts'
import example11 from '../../../examples/07-shading/rendering-equation.ts?raw'
import { runExample as run11 } from '../../../examples/07-shading/rendering-equation.ts'
import example12 from '../../../examples/07-shading/ambient-components.ts?raw'
import { runExample as run12 } from '../../../examples/07-shading/ambient-components.ts'
const examples = [example0,example1,example2,example3,example4,example5,example6,example7,example8,example9,example10,example11,example12]
const runs = [run0,run1,run2,run3,run4,run5,run6,run7,run8,run9,run10,run11,run12]
export const session07: CourseSession = {
 id:'07', number:7, date:'2026年11月20日', title:'レンダリングその2：Shading / BRDF / PBR',
 description:'数式のどの部分を変えると、見た目のどこが変わるか。13の実験で、照明・反射・補間・材質を結び付けます。',
 topics: shadingDemos.map((d,i)=>({
  id:d.id,title:d.title,priority:d.priority,studyMode:d.studyMode,slideReference:d.slideReference,
  purpose:d.purpose,question:d.question,operation:d.operation,observe:d.observe,
  explanation:d.explanation,think:d.question,
  demo:d.component,demoProps:{topic:d.id},example:examples[i],run:runs[i],
  coreName:'shading-classic.ts / shading-advanced.ts / shading-geometry.ts / shading-gpu.ts',
  core:classicCore+'\n\n'+advancedCore+'\n\n'+geometryCore+'\n\n'+gpuCore,
 })),
 stories:[
  {title:'一つの面を照らす',description:'光源・法線・視線のどれを変えるかを区別します。',topicIds:['visibility-shading','lambert','point-light','ambient-components']},
  {title:'方向と補間を見比べる',description:'反射モデルと照明を計算する場所を分けて考えます。',topicIds:['oren-nayar','phong-blinn','shading-comparison','brdf-lobe']},
  {title:'微小面から材質、光の合計へ',description:'D・F・Gから反射と入射光の寄与を組み立てます。',topicIds:['microfacet-ndf','fresnel','cook-torrance','principled','rendering-equation']},
 ],
}
