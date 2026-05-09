import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout   from './layouts/AdminLayout'
import Dashboard     from './pages/Dashboard/Dashboard'
import Administrador from './pages/Administrador/Administrador'
import Experto       from './pages/experto/pages/Experto'
import Roles         from './pages/ROLES/Roles'
import MiPerfil      from './pages/Perfi/Miperfil'
import Cafetero      from './pages/cafetero/Cafetero'
import Fincas        from './pages/Fincas/Fincas'
import Monitoreos    from './pages/Monitoreos/Monitoreos'
import Categorias    from './pages/Categorias/Categorias/Categorias'
import Login         from './pages/Auth/Login'
import Register      from './pages/Auth/Register'

function AppContent() {
  const { user, loading } = useAuth()
  const [activePage,  setActivePage]  = useState('dashboard')
  const [catSubPage,  setCatSubPage]  = useState('cultivo')
  const [authPage,    setAuthPage]    = useState('login')

  // onNavigate recibe la página y opcionalmente la subcategoría
  const handleNavigate = (page, sub) => {
    setActivePage(page)
    if (sub) setCatSubPage(sub)
  }

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontSize:'20px', fontWeight:'bold' }}>
        Cargando...
      </div>
    )
  }

  if (!user) {
    if (authPage === 'register') return <Register onGoLogin={() => setAuthPage('login')} />
    return <Login onGoRegister={() => setAuthPage('register')} />
  }

  const PAGES = {
    dashboard:     <Dashboard />,
    administrador: <Administrador />,
    experto:       <Experto />,
    roles:         <Roles />,
    perfil:        <MiPerfil />,
    cafetero:      <Cafetero />,
    fincas:        <Fincas />,
    monitoreos:    <Monitoreos />,
    categorias:    <Categorias subPage={catSubPage} />,
  }

  return (
    <AdminLayout activePage={activePage} onNavigate={handleNavigate}>
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