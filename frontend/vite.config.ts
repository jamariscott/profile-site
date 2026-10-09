import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// The heading font is only discovered after the app's JavaScript runs, which
// delays the hero headline. Preload it from the HTML instead, by its hashed
// build name (latin subset only: that's what the page's text needs).
function preloadHeadingFont(): Plugin {
  return {
    name: 'preload-heading-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find((f) => /archivo-latin-wdth-normal-.*\.woff2$/.test(f))
        if (!font) return
        return [
          {
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${font}`, crossorigin: '' },
            injectTo: 'head',
          },
        ]
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadHeadingFont()],
})
