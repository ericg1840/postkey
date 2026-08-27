import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Absolute so a deep-linked route like /u/:handle (loaded directly, not
  // via client-side navigation) still resolves its script/CSS tags against
  // the site root instead of that route's own path. Cloudflare serves this
  // app from the domain root, so an absolute base is always correct there.
  base: '/',
  plugins: [react()],
})
