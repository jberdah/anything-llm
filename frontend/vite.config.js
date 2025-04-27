import { defineConfig } from "vite"
import { fileURLToPath, URL } from "url"
import postcss from "./postcss.config.js"
import react from "@vitejs/plugin-react"
import dns from "dns"
import { visualizer } from "rollup-plugin-visualizer"

dns.setDefaultResultOrder("verbatim")

// pick up the same BASE_PATH you injected at build-time
const BASE = process.env.VITE_BASE || process.env.BASE_URL || process.env.PUBLIC_URL || "/"

export default defineConfig({
  base: BASE,
  define: {
    // your API calls will now use <BASE>/api/…
    "process.env.API_BASE": JSON.stringify(`${BASE}api/`)
  },

  plugins: [
    react(),
    visualizer({ template: "treemap", open: false, gzipSize: true, brotliSize: true, filename: "bundleinspector.html" })
  ],

  resolve: {
    alias: [
      // your @ → /src alias
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      // polyfill node-core in the browser
      { find: "process", replacement: "process/browser" },
      { find: "stream",  replacement: "stream-browserify" },
      { find: "zlib",    replacement: "browserify-zlib" },
      { find: "util",    replacement: "util" },
      // support ~ imports
      { find: /^~(.+)/,  replacement: (_match, p1) => p1 }
    ]
  },

  optimizeDeps: {
    // force these through esbuild so they never hit Rollup’s CJS plugin
    include: [
      "@mintplex-labs/piper-tts-web",
      "react-router",
      "react-router-dom",
      "html-parse-stringify",
      "void-elements"
    ],
    esbuildOptions: {
      define: { global: "globalThis" },
      plugins: []
    }
  },

  build: {
    rollupOptions: {
      output: {
        entryFileNames:  "index.js",
        assetFileNames: (asset) => asset.name === "index.css" ? "index.css" : asset.name
      },
      external: [/@phosphor-icons\/react\/dist\/ssr/]
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      // turn CJS `module.exports = …` into a default export
      requireReturnsDefault: "preferred"
    }
  },

  css: { postcss },
  server: { port: 3000, host: "localhost" },
  assetsInclude: [
    "./public/piper/ort-wasm-simd-threaded.wasm",
    "./public/piper/piper_phonemize.wasm",
    "./public/piper/piper_phonemize.data"
  ],
  worker: { format: "es" }
})
