import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// In sviluppo le chiamate /api vanno al backend Spring Boot: nessun problema di CORS nel browser.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
