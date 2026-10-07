import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('.',import.meta.url))
const base=process.env.PAGES_BASE_PATH || '/'
if(!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(base))throw new Error('PAGES_BASE_PATH must be / or /repository-name/')
export default defineConfig({
  root,base,plugins:[vue()],publicDir:false,
  cacheDir:fileURLToPath(new URL('../node_modules/.vite-public-demos',import.meta.url)),
  build:{outDir:fileURLToPath(new URL('../dist/demos',import.meta.url)),emptyOutDir:true,sourcemap:false},
  server:{host:'127.0.0.1',port:3040,strictPort:true},
  preview:{host:'127.0.0.1',port:4174,strictPort:true},
})
