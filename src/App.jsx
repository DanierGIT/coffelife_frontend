/**
 * App.jsx
 * ──────────────────────────────────────────────
 * Punto de entrada de la aplicación.
 *
 * ┌─────────────────────────────────────────────┐
 * │  AuthProvider  →  contexto de sesión         │
 * │    AdminLayout →  sidebar + área de contenido│
 * │      <página activa>                         │
 * └─────────────────────────────────────────────┘
 *
 * ── Cómo agregar una nueva página ──────────────
 * 1. Crea el componente en src/pages/TuPagina/TuPagina.jsx
 * 2. Impórtalo aquí y agrégalo al objeto PAGES con su key
 * 3. En Sidebar.jsx, cambia ready: false → ready: true en el ítem correspondiente
 */

import React, { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'

// ── Páginas listas ───────────────────────────────────────────────────────────
import Dashboard     from './pages/Dashboard/Dashboard'
import Administrador from './pages/Administrador/Administrador'
import Roles from './pages/ROLES/Roles'
import MiPerfil from './pages/Perfi/Miperfil'
// ── Páginas por implementar (descomentar cuando estén listas) ────────────────
// import Perfil     from './pages/Perfil/Perfil'
// import Experto    from './pages/Experto/Experto'
// import Campesino  from './pages/Campesino/Campesino'
// import Categorias from './pages/Categorias/Categorias'

// Mapa de key → componente  (la key debe coincidir con NAV_ITEMS en Sidebar.jsx)
const PAGES = {
  dashboard:     <Dashboard />,
  administrador: <Administrador />,
  perfil:     <MiPerfil />,
  roles:      <Roles />
  // experto:    <Experto />,
  // campesino:  <Campesino />,
  // categorias: <Categorias />,
}

// ── AppContent ───────────────────────────────────────────────────────────────
function AppContent() {
  const [activePage, setActivePage] = useState('dashboard')

  return (
    <AdminLayout activePage={activePage} onNavigate={setActivePage}>
      {PAGES[activePage] ?? <Dashboard />}
    </AdminLayout>
  )
}

// ── App principal ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
