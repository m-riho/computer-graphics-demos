import { defineAsyncComponent } from 'vue'

export const visibilityDemos = {
  'wave-surface': { title: '波面を線で描くと、奥の線はどう見えるか', component: defineAsyncComponent(() => import('./WaveSurface.vue')) },
  'back-face-culling': { title: '面の向きと裏面除去', component: defineAsyncComponent(() => import('./CullingExplorer.vue')) },
  'painter': { title: '描く順番で変わる可視面', component: defineAsyncComponent(() => import('./PainterExplorer.vue')) },
  'triangle-rasterization': { title: '三角形が覆う画素を探す', component: defineAsyncComponent(() => import('./RasterLab.vue')) },
  'z-buffer': { title: 'Z-bufferを1面ずつ更新する', component: defineAsyncComponent(() => import('./ZBufferExplorer.vue')) },
  'scanline': { title: '走査線と可視スパン', component: defineAsyncComponent(() => import('./ScanlineExplorer.vue')) },
  'ray-casting': { title: '一次レイと最初の交点', component: defineAsyncComponent(() => import('./RayExplorer.vue')) },
  'raster-vs-ray': { title: '面から描く・画素から探す', component: defineAsyncComponent(() => import('./CompareExplorer.vue')) },
  'transparency-depth': { title: '同じ深度と半透明の重なり', component: defineAsyncComponent(() => import('./TransparencyLab.vue')) },
} as const

export type VisibilityDemoId = keyof typeof visibilityDemos
