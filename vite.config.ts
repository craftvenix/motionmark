import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Vercel exposes the production domain at build time. Falling back to an
// empty prefix keeps the Open Graph paths relative during local builds.
const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
const siteUrl = vercelHost
  ? `https://${vercelHost.replace(/^https?:\/\//, '')}`
  : ''

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'motionmark-site-url',
      transformIndexHtml(html) {
        return html.replaceAll('%SITE_URL%', siteUrl)
      },
    },
  ],
})
