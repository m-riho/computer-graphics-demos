import { defineAsyncComponent } from 'vue'
import { shadingCatalog } from './catalog.ts'
const classic = defineAsyncComponent(() => import('./ClassicExplorer.vue'))
const advanced = defineAsyncComponent(() => import('./AdvancedExplorer.vue'))
const beam = defineAsyncComponent(() => import('./BeamFootprintExplorer.vue'))
const interpolation = defineAsyncComponent(() => import('./InterpolationExplorer.vue'))
const lightMaterial = defineAsyncComponent(() => import('./LightMaterialExplorer.vue'))
const sphereNormals = defineAsyncComponent(() => import('./SphereNormalsExplorer.vue'))
const disney = defineAsyncComponent(() => import('./DisneyBRDFExplorer.vue'))
export const shadingDemos = shadingCatalog.map(info => ({
  ...info, component: info.id === 'sphere-normals' ? sphereNormals : info.id === 'light-material-color' ? lightMaterial : info.id === 'disney-brdf' ? disney : info.id.endsWith('-interpolation') ? interpolation : info.id === 'beam-footprint' ? beam : ['brdf-lobe','microfacet-ndf','fresnel','cook-torrance','principled','rendering-equation'].includes(info.id) ? advanced : classic,
}))
export type { ShadingDemoId } from './catalog.ts'
