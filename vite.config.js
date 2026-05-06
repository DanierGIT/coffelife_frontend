import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/login':    'http://localhost:3333',
      '/register': 'http://localhost:3333',
      '/me':       'http://localhost:3333',
      '/logout':   'http://localhost:3333',
    }
  }
})
