import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true
  },
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // Ensure side-effect modules are not tree-shaken
      treeshake: {
        moduleSideEffects: (id) => {
          // Preserve side effects for interceptor module
          return id.includes('modelFileInterceptor') || id.includes('node_modules')
        }
      }
    }
  }
})
