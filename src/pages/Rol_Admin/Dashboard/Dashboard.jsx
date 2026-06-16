import { useEffect, useState } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { BiBuildings, BiUser, BiGroup, BiListUl, BiCog } from 'react-icons/bi'
import CoffeePriceCard from '../../../components/CoffeePriceCard'
import Loading from '../../../components/Loading'
import './Dashboard.css'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const quickLinks = [
  { icon: <BiListUl size={20} />, label: 'Gestión de Fincas', desc: 'Administrar fincas registradas', color: '#e8f5e9', page: 'fincas' },
  { icon: <BiCog size={20} />, label: 'Configura tus categorías', desc: 'Categorías y parámetros', color: '#e8f5e9', page: 'categorias' },
]

export default function Dashboard({ onNavigate }) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    fincas: 0,
    fincasConUbicacion: 0,
    expertosActivos: 0,
    expertosInactivos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSecondaryStats = async () => {
    try {
      const [fincasRes, expertosRes] = await Promise.allSettled([
        api.get('/fincas'),
        api.get('/expertos'),
      ])

      const fincas = fincasRes.status === 'fulfilled' ? getArrayData(fincasRes.value.data) : []
      const fincasConUbicacion = fincas.filter((f) => f.latitud && f.longitud).length

      const expertosData = expertosRes.status === 'fulfilled'
        ? (Array.isArray(expertosRes.value.data) ? expertosRes.value.data : (expertosRes.value.data?.data ?? []))
        : []
      const expertosActivos = expertosData.filter((e) => {
        const a = e.activo
        return a === undefined || a === null || a === true || a === 1 || a === '1' || a === 'true'
      }).length
      const expertosInactivos = expertosData.length - expertosActivos

      setStats(prev => ({ ...prev, fincasConUbicacion, expertosActivos, expertosInactivos }))
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const res = await api.get('/dashboard')
        const resumen = res.data?.resumen || {}
        setStats(prev => ({ ...prev, fincas: Number(resumen.totalFincas || 0) }))

        fetchSecondaryStats()
      } catch (err) {
        setError(err?.response?.data?.message || 'No se pudo cargar el dashboard.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  return (
    <div className="dashboard">
      {loading && <Loading type="overlay" text="Cargando dashboard..." />}
      <div className="welcome-banner-text animate-left">
        <div className="welcome-banner-row">
          <div className="welcome-avatar-sm">
            {user?.fotoPerfil ? (
              <img src={user.fotoPerfil} alt="avatar" className="welcome-avatar-img-sm" />
            ) : (
              <BiUser size={20} />
            )}
          </div>
          <div>
            <h1 className="welcome-main-title">¡Hola, {user?.nombre || 'Admin'}!</h1>
            <p className="welcome-subtitle">Panel de monitoreo agrícola — CoffeeLife</p>
          </div>
        </div>
      </div>

      <div className="header-kpi-cards-wrapper">
        <div className="kpi-card-item">
          <div className="kpi-icon-container fincas-kpi">
            <BiBuildings size={20} />
          </div>
          <div className="kpi-data-text">
            <span className="kpi-number-val">{loading ? '...' : stats.fincas}</span>
            <span className="kpi-label-name">Fincas activas</span>
          </div>
        </div>
        <div className="kpi-card-item">
          <div className="kpi-icon-container expertos-kpi">
            <BiGroup size={20} />
          </div>
          <div className="kpi-data-text">
            <span className="kpi-number-val">{loading ? '...' : stats.expertosActivos}</span>
            <span className="kpi-label-name">Expertos activos</span>
          </div>
        </div>
        <CoffeePriceCard />
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <p className="admin-context">
        Gestión de Fincas · Monitoreo de Cultivos · Recomendaciones Técnicas ·
        Catálogos del Sistema · Administración de Usuarios · Expertos y Cafeteros · Tratamientos
      </p>

      <div className="db-quick-section">
        <h2 className="db-section-title">Accesos rápidos</h2>
        <div className="db-quick-grid">
          {quickLinks.map((link, idx) => (
            <div key={idx} className={`db-quick-card delay-${idx + 1}`} onClick={() => onNavigate?.(link.page)} role="button" tabIndex={0}>
              <div className="db-quick-icon" style={{ background: link.color }}>
                {link.icon}
              </div>
              <div>
                <p className="db-quick-label">{link.label}</p>
                <p className="db-quick-desc">{link.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
