import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    server: {
      host: true
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // Ensure xlsx resolves correctly for Vite
        'xlsx': 'xlsx/xlsx.mjs'
      }
    },
    optimizeDeps: {
      include: ['xlsx', 'dompurify', '@tiptap/extension-color']
    },
    define: {
      // Make env variables available in the app
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_ENV': JSON.stringify(env.VITE_ENV || mode),
    }
  }
})
