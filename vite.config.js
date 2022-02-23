import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { viteSingleFile } from "vite-plugin-singlefile"
import webWorkerLoader from 'rollup-plugin-web-worker-loader'

export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  build: {
    target: "esnext",
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    brotliSize: false,
    rollupOptions: {
      plugins: [
        webWorkerLoader(/* configuration */),
    ],
      inlineDynamicImports: true,
      output: {
        manualChunks: () => "everything.js",
      },
    },
  },
})