/**
 * App.jsx
 * ──────────────────────────────────────────────
 * Punto de entrada de la aplicación.
 *
 * Flujo:
 *  - Si NO hay sesión  → muestra Login o Register
 *  - Si HAY sesión     → muestra el panel con Sidebar
 *
 * ── Cómo agregar una nueva página ──────────────
 * 1. Crea el componente en src/pages/TuPagina/TuPagina.jsx
 * 2. Impórtalo aquí y agrégalo al objeto PAGES con su key
 * 3. En Sidebar.jsx, cambia ready: false → ready: true en el ítem correspondiente
 */

import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'

// ── Páginas de autenticación ─────────────────────────────────────────────────
import Login    from './pages/Auth/Login'
import Register from './pages/Auth/Register'

// ── Páginas del panel ────────────────────────────────────────────────────────
import Dashboard     from './pages/Dashboard/Dashboard'
import Administrador from './pages/Administrador/Administrador'
import Roles         from './pages/ROLES/Roles'
import MiPerfil      from './pages/Perfi/Miperfil'
import Fincas        from './pages/Fincas/Fincas'


import AnalisisIA from './pages/analisisia/AnalisisIA'
// ── Páginas por implementar (descomentar cuando estén listas) ────────────────
import Experto    from './pages/experto/pages/Experto'
// import Campesino  from './pages/Campesino/Campesino'
// import Categorias from './pages/Categorias/Categorias'


import Prioridades from './pages/prioridades/Prioridades'
// Mapa de key → componente  (la key debe coincidir con NAV_ITEMS en Sidebar.jsx)
const PAGES = {
  dashboard:     <Dashboard />,
  administrador: <Administrador />,
  perfil:        <MiPerfil />,
  roles:         <Roles />,
  fincas:        <Fincas />,
  experto:    <Experto />,
  // campesino:  <Campesino />,
  // categorias: <Categorias />,

  analisisia: <AnalisisIA />,
  prioridades: <Prioridades />
}

// ── AppContent ───────────────────────────────────────────────────────────────
function AppContent() {
  const { user, loading } = useAuth()
  const [activePage,  setActivePage]  = useState('dashboard')
  const [authScreen,  setAuthScreen]  = useState('login') // 'login' | 'register'

  // Mientras se recupera la sesión del localStorage, no renderizar nada
  if (loading) return null

  // Sin sesión → pantallas de autenticación
  if (!user) {
    return authScreen === 'login'
      ? <Login    onGoRegister={() => setAuthScreen('register')} />
      : <Register onGoLogin={()    => setAuthScreen('login')}    />
  }

  // Con sesión → panel completo
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
