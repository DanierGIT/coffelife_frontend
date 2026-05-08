import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/login':      'http://localhost:3333',
      '/register':   'http://localhost:3333',
      '/me':         'http://localhost:3333',
      '/logout':     'http://localhost:3333',
      '/admins':     'http://localhost:3333',
      '/usuarios':   'http://localhost:3333',
      '/cafeteros':  'http://localhost:3333',
      '/expertos':   'http://localhost:3333',
      '/roles':      'http://localhost:3333',
      '/cat_roles':  'http://localhost:3333',
      '/fincas':     'http://localhost:3333',
      '/monitoreos': 'http://localhost:3333',
      '/cultivos':   'http://localhost:3333',
    }
  }
})