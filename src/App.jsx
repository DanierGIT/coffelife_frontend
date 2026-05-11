import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'

// ── Auth ──
import Login    from './Auth/Login'
import Register from './Auth/Register'

// ── Rol_Admin ──
import Dashboard       from './pages/Rol_Admin/Dashboard/Dashboard'
import Administrador   from './pages/Rol_Admin/Administrador/Administrador'
import Experto         from './pages/Rol_Admin/experto/Experto'
import Roles           from './pages/Rol_Admin/ROLES/Roles'
import MiPerfil        from './pages/Rol_Admin/Perfi/Miperfil'
import Cafetero        from './pages/Rol_Admin/cafetero/Cafetero'
import Fincas          from './pages/Rol_Admin/Fincas/Fincas'
import Monitoreos      from './pages/Rol_Admin/Monitoreos/Monitoreos'
import Categorias      from './pages/Rol_Admin/Categorias/Categorias/Categorias'
import Usuarios        from './pages/Rol_Admin/Usuarios/Usuarios'
import Prioridades     from './pages/Rol_Admin/Prioridades/Prioridades'
import AnalisisIA      from './pages/Rol_Admin/AnalisisIA/AnalisisIA'
import Recomendaciones from './pages/Rol_Admin/Recomendaciones/Recomendaciones'
import Imagenes        from './pages/Rol_Admin/Imagenes/Imagenes'
import Tratamientos    from './pages/Rol_Admin/Tratamientos/Tratamientos'
import Aplicacion      from './pages/Rol_Admin/AplicacionTratamientos/Aplicacion'
import Cultivos        from './pages/Rol_Admin/Cultivos/Cultivos'

function AppContent() {
  const { user, loading } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')
  const [catSubPage, setCatSubPage] = useState('cultivo')
  const [authPage,   setAuthPage]   = useState('login')

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
    dashboard:       <Dashboard />,
    administrador:   <Administrador />,
    experto:         <Experto />,
    roles:           <Roles />,
    perfil:          <MiPerfil />,
    cafetero:        <Cafetero />,
    fincas:          <Fincas />,
    monitoreos:      <Monitoreos />,
    categorias:      <Categorias subPage={catSubPage} />,
    usuarios:        <Usuarios />,
    prioridades:     <Prioridades />,
    analisisIA:      <AnalisisIA />,
    recomendaciones: <Recomendaciones />,
    imagenes:        <Imagenes />,
    tratamientos:    <Tratamientos />,
    aplicacion:      <Aplicacion />,
    cultivos:        <Cultivos />,
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