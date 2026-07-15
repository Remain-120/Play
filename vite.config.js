import { defineConfig } from 'vite'
import pkg from '@dcloudio/vite-plugin-uni'
const uni = pkg.default || pkg

export default defineConfig({
  plugins: [uni()],
  server: {
    port: 5173,
    host: true,
    open: false
  }
})