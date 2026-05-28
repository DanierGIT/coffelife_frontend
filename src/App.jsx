import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import 'leaflet/dist/leaflet.css'

// ── Auth ──
import Login    from './Auth/Login'
import Register from './Auth/Register'
import RecuperarContrasena from './Auth/RecuperarContrasena'
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
// import Prioridades     from './pages/Rol_Admin/Prioridades/Prioridades'
// import AnalisisIA      from './pages/Rol_Admin/AnalisisIA/AnalisisIA'
import Recomendaciones from './pages/Rol_Admin/Recomendaciones/Recomendaciones'
// import Imagenes        from './pages/Rol_Admin/Imagenes/Imagenes'
import Tratamientos    from './pages/Rol_Admin/Tratamientos/Tratamientos'
import Aplicacion      from './pages/Rol_Admin/AplicacionTratamientos/Aplicacion'
import Cultivos        from './pages/Rol_Admin/Cultivos/Cultivos'

// ── Rol_Experto ──
import ExpertoLayout         from './pages/Rol_Experto/layout/ExpertoLayout'
import DashboardExperto      from './pages/Rol_Experto/Dashboard/DashboardExperto'
import EscanerIA             from './pages/Rol_Experto/EscanerIA/EscanerIA'
import MonitoreosExperto     from './pages/Rol_Experto/Monitoreos/MonitoreosExperto'
import MapaRiesgo            from './pages/Rol_Experto/MapaRiesgo/MapaRiesgo'
import TratamientosExperto   from './pages/Rol_Experto/Tratamientos/TratamientosExperto'
import RecomendacionesExperto from './pages/Rol_Experto/Recomendaciones/RecomendacionesExperto'
import HistorialExperto      from './pages/Rol_Experto/Historial/HistorialExperto'
import ProductoresExperto    from './pages/Rol_Experto/Productores/ProductoresExperto'
import ReportesExperto       from './pages/Rol_Experto/Reportes/ReportesExperto'
import PerfilExperto         from './pages/Rol_Experto/Perfil/PerfilExperto'
import CultivosExperto       from './pages/Rol_Experto/Cultivos/CultivosExperto'
import DetalleCultivoExperto from './pages/Rol_Experto/DetalleCultivo/DetalleCultivoExperto'

const normalizeRole = (role) => {
  const value = (role ?? '').toString().toLowerCase().trim()
  const aliases = {
    administrador: 'admin',
    caficultor: 'cafetero',
    productor: 'cafetero',
  }
  return aliases[value] || value
}

// ─────────────────────────────────────────────
// Vista Admin
// ─────────────────────────────────────────────
function AdminApp() {
  const [activePage, setActivePage] = useState('dashboard')
  const [catSubPage, setCatSubPage] = useState('cultivo')

  const handleNavigate = (page, sub) => {
    setActivePage(page)
    if (sub) setCatSubPage(sub)
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
    // prioridades:     <Prioridades />,
    // analisisIA:      <AnalisisIA />,
    recomendaciones: <Recomendaciones />,
    // imagenes:        <Imagenes />,
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

// ─────────────────────────────────────────────
// Vista Experto
// ─────────────────────────────────────────────
function ExpertoApp() {
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedFinca, setSelectedFinca] = useState(null)
  const [selectedCultivo, setSelectedCultivo] = useState(null)

  const handleNavigate = (page, data) => {
    setActivePage(page)
    if (page === 'detalle_cultivo') {
      setSelectedCultivo(data || null)
    } else {
      setSelectedFinca(data || null)
    }
  }

  const renderPage = () => {
    const p = { onNavigate: handleNavigate, finca: selectedFinca, cultivo: selectedCultivo }
    switch (activePage) {
      case 'dashboard':       return <DashboardExperto onNavigate={handleNavigate} />
      case 'escaner':         return <EscanerIA {...p} />
      case 'monitoreos':      return <MonitoreosExperto {...p} />
      case 'mapa':            return <MapaRiesgo {...p} />
      case 'tratamientos':    return <TratamientosExperto {...p} />
      case 'recomendaciones': return <RecomendacionesExperto {...p} />
      case 'historial':       return <HistorialExperto {...p} />
      case 'cultivos':        return <CultivosExperto {...p} />
      case 'detalle_cultivo': return <DetalleCultivoExperto {...p} />
      case 'productores':     return <ProductoresExperto />
      case 'reportes':        return <ReportesExperto {...p} />
      case 'perfil':          return <PerfilExperto />
      default:                return <DashboardExperto />
    }
  }

  return (
    <ExpertoLayout
      activePage={activePage}
      onNavigate={handleNavigate}
      selectedFinca={selectedFinca}
    >
      {renderPage()}
    </ExpertoLayout>
  )
}

// ─────────────────────────────────────────────
// Root con routing por rol
// ─────────────────────────────────────────────
function AppContent() {
  const { user, loading } = useAuth()
  const [authPage, setAuthPage] = useState('login')

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontSize:'20px', fontWeight:'bold' }}>
        Cargando...
      </div>
    )
  }

  if (!user) {
    if (authPage === 'register') return <Register onGoLogin={() => setAuthPage('login')} />

 if (authPage === 'recuperar') { //  NUEVO
      return <RecuperarContrasena onIrAlLogin={() => setAuthPage('login')} />
    }

    return (
      <Login
        onGoRegister={() => setAuthPage('register')}
        onGoRecuperar={() => setAuthPage('recuperar')} // 👈 NUEVO
      />
    )
  }


  // Routing por rol
  // Routing por rol
    const nombreRol = normalizeRole(user?.rol?.nombreRol ?? user?.rol?.nombre_rol ?? user?.rol)
    if (nombreRol === 'experto') return <ExpertoApp />
    return <AdminApp />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}