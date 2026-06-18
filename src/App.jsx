import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import 'leaflet/dist/leaflet.css'

// ── Auth ──
import Landing  from './Auth/Landing'
import Login    from './Auth/Login'
import Register from './Auth/Register'
import RecuperarContrasena from './Auth/RecuperarContrasena'
// ── Rol_Admin ──
import Dashboard       from './pages/Rol_Admin/Dashboard/Dashboard'
import Administrador   from './pages/Rol_Admin/Administrador/Administrador'
import Experto         from './pages/Rol_Admin/experto/Experto'
import Roles           from './pages/Rol_Admin/ROLES/Roles'
import MiPerfil        from './pages/Rol_Admin/Perfi/Miperfil'
import ConfigurarCuenta from './pages/Rol_Admin/Perfi/ConfigurarCuenta'
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
import ConfigurarExperto     from './pages/Rol_Experto/Perfil/ConfigurarExperto'
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

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':       return <Dashboard onNavigate={handleNavigate} />;
      case 'administrador':   return <Administrador />;
      case 'experto':         return <Experto />;
      case 'roles':           return <Roles />;
      case 'perfil':          return <MiPerfil onNavigate={handleNavigate} />;
      case 'configurar':      return <ConfigurarCuenta onNavigate={handleNavigate} />;
      case 'cafetero':        return <Cafetero />;
      case 'fincas':          return <Fincas />;
      case 'monitoreos':      return <Monitoreos />;
      case 'categorias':      return <Categorias subPage={catSubPage} />;
      case 'usuarios':        return <Usuarios />;
      // case 'prioridades':     return <Prioridades />;
      // case 'analisisIA':      return <AnalisisIA />;
      case 'recomendaciones': return <Recomendaciones />;
      // case 'imagenes':        return <Imagenes />;
      case 'tratamientos':    return <Tratamientos />;
      case 'aplicacion':      return <Aplicacion />;
      case 'cultivos':        return <Cultivos />;
      default:                return <Dashboard />;
    }
  }

  return (
    <AdminLayout activePage={activePage} onNavigate={handleNavigate}>
      {renderPage()}
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
      case 'perfil':               return <PerfilExperto onNavigate={handleNavigate} />
      case 'configurar-experto':   return <ConfigurarExperto onNavigate={handleNavigate} />
      default:                     return <DashboardExperto />
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
  const [authPage, setAuthPage] = useState('landing')

  // Navegación con History API para que el botón "atrás" del navegador funcione
  useEffect(() => {
    window.history.replaceState({ authPage: 'landing' }, '')
  }, [])

  useEffect(() => {
    const onPopState = (e) => {
      if (e.state?.authPage) setAuthPage(e.state.authPage)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const goTo = (page) => {
    window.history.pushState({ authPage: page }, '')
    setAuthPage(page)
  }

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontSize:'20px', fontWeight:'bold' }}>
        Cargando...
      </div>
    )
  }

  if (!user) {
    if (authPage === 'landing')
      return <Landing onGoLogin={() => goTo('login')} onGoRegister={() => goTo('register')} />

    if (authPage === 'register') return <Register onGoLogin={() => goTo('login')} onGoLanding={() => goTo('landing')} />

 if (authPage === 'recuperar') {
      return <RecuperarContrasena onIrAlLogin={() => goTo('login')} />
    }

    return (
      <Login
        onGoRegister={() => goTo('register')}
        onGoRecuperar={() => goTo('recuperar')}
        onGoLanding={() => goTo('landing')}
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