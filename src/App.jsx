
import React, { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'

// ── Páginas ──────────────────────────────────────────────────────────────────
import Dashboard     from './pages/Dashboard/Dashboard'
import Administrador from './pages/Administrador/Administrador'
import Experto       from './pages/experto/pages/Experto'
import Roles         from './pages/ROLES/Roles'
import MiPerfil      from './pages/Perfi/Miperfil'
import Cafetero      from './pages/cafetero/Cafetero'
import Fincas        from './pages/Fincas/Fincas'
import Monitoreos from './pages/Monitoreos/Monitoreos'

// Mapa de key → componente  (la key debe coincidir con NAV_ITEMS en Sidebar.jsx)
const PAGES = {
  dashboard:     <Dashboard />,
  administrador: <Administrador />,
  experto:       <Experto />,
  roles:         <Roles />,
  perfil:        <MiPerfil />,
  cafetero:      <Cafetero />,
  fincas:        <Fincas />,
  experto:    <Experto />,
  // campesino:  <Campesino />,
  // categorias: <Categorias />,
  monitoreos:    <Monitoreos />,
}

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard')

  return (
    <AdminLayout activePage={activePage} onNavigate={setActivePage}>
      {PAGES[activePage] ?? <Dashboard />}
    </AdminLayout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}