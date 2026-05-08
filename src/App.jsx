import React, { useState } from 'react'

import { AuthProvider, useAuth } from './context/AuthContext'

import AdminLayout from './layouts/AdminLayout'

import Dashboard from './pages/Dashboard/Dashboard'
import Administrador from './pages/Administrador/Administrador'
import Experto from './pages/experto/pages/Experto'
import Roles from './pages/ROLES/Roles'
import MiPerfil from './pages/Perfi/Miperfil'
import Cafetero from './pages/cafetero/Cafetero'
import Fincas from './pages/Fincas/Fincas'
import Monitoreos from './pages/Monitoreos/Monitoreos'

import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

const PAGES = {
  dashboard: <Dashboard />,
  administrador: <Administrador />,
  experto: <Experto />,
  roles: <Roles />,
  perfil: <MiPerfil />,
  cafetero: <Cafetero />,
  fincas: <Fincas />,
  monitoreos: <Monitoreos />,
}

function AppContent() {

  const { user, loading } = useAuth()

  const [activePage, setActivePage] = useState('dashboard')

  // Control Login / Register
  const [authPage, setAuthPage] = useState('login')

  // Pantalla de carga
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '20px',
          fontWeight: 'bold'
        }}
      >
        Cargando...
      </div>
    )
  }

  // Si NO hay usuario autenticado
  if (!user) {

    // Mostrar Register
    if (authPage === 'register') {
      return (
        <Register
          onGoLogin={() => setAuthPage('login')}
        />
      )
    }

    // Mostrar Login
    return (
      <Login
        onGoRegister={() => setAuthPage('register')}
      />
    )
  }

  // Si hay usuario → mostrar sistema
  return (
    <AdminLayout
      activePage={activePage}
      onNavigate={setActivePage}
    >
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