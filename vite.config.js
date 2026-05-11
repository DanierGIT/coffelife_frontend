import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/login':                     { target: 'http://localhost:3333', changeOrigin: true },
      '/register':                  { target: 'http://localhost:3333', changeOrigin: true },
      '/logout':                    { target: 'http://localhost:3333', changeOrigin: true },
      '/profile':                   { target: 'http://localhost:3333', changeOrigin: true },
      '/admins':                    { target: 'http://localhost:3333', changeOrigin: true },
      '/usuarios':                  { target: 'http://localhost:3333', changeOrigin: true },
      '/cafeteros':                 { target: 'http://localhost:3333', changeOrigin: true },
      '/expertos':                  { target: 'http://localhost:3333', changeOrigin: true },
      '/roles':                     { target: 'http://localhost:3333', changeOrigin: true },
      '/cat_roles':                 { target: 'http://localhost:3333', changeOrigin: true },
      '/fincas':                    { target: 'http://localhost:3333', changeOrigin: true },
      '/monitoreos':                { target: 'http://localhost:3333', changeOrigin: true },
      '/cultivos':                  { target: 'http://localhost:3333', changeOrigin: true },
      '/categorias':                { target: 'http://localhost:3333', changeOrigin: true },
      '/cat_estados_cultivo':       { target: 'http://localhost:3333', changeOrigin: true },
      '/cat_estados_analisis':      { target: 'http://localhost:3333', changeOrigin: true },
      '/cat_niveles_roya':          { target: 'http://localhost:3333', changeOrigin: true },
      '/cat_prioridades':           { target: 'http://localhost:3333', changeOrigin: true },
      '/cat_tipos_tratamiento':     { target: 'http://localhost:3333', changeOrigin: true },
      '/cat_tipos_recomendacion':   { target: 'http://localhost:3333', changeOrigin: true },
      '/tratamientos':              { target: 'http://localhost:3333', changeOrigin: true },
      '/recomendaciones':           { target: 'http://localhost:3333', changeOrigin: true },
      '/analisis_ia':               { target: 'http://localhost:3333', changeOrigin: true },
      '/imagenes':                  { target: 'http://localhost:3333', changeOrigin: true },
      '/aplicaciones_tratamientos': { target: 'http://localhost:3333', changeOrigin: true },
    }
  }
})