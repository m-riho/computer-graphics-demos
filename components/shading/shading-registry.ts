import { defineAsyncComponent } from 'vue'
import { shadingCatalog } from './catalog.ts'
const classic = defineAsyncComponent(() => import('./ClassicExplorer.vue'))
const advanced = defineAsyncComponent(() => import('./AdvancedExplorer.vue'))
export const shadingDemos = shadingCatalog.map(info => ({
  ...info, component: ['brdf-lobe','microfacet-ndf','fresnel','cook-torrance','principled','rendering-equation'].includes(info.id) ? advanced : classic,
}))
export type { ShadingDemoId } from './catalog.ts'
