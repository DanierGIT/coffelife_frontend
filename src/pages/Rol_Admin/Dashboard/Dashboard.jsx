import React, { useEffect, useState, useMemo } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { BiBuildings, BiUser, BiGroup, BiTime, BiListUl, BiCog } from 'react-icons/bi'
import CoffeePriceCard from '../../../components/CoffeePriceCard'
import './Dashboard.css'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const FincaIcon = () => <BiBuildings size={22} />

function AnimatedValue({ value, loading }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (loading || value === 0) {
      setDisplay(value)
      return
    }
    let start = 0
    const duration = 800
    const step = Math.max(1, Math.ceil(value / 30))
    const interval = setInterval(() => {
      start += step
      if (start >= value) {
        setDisplay(value)
        clearInterval(interval)
      } else {
        setDisplay(start)
      }
    }, duration / 30)
    return () => clearInterval(interval)
  }, [value, loading])

  return <>{loading ? '...' : display}</>
}

function StatCard({ icon, label, value, note, color, progress, progressLabel, onClick, loading }) {
  return (
    <div
      className={`dashboard-card${onClick ? ' clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="card-icon-wrap" style={{ background: color }}>
        {icon}
      </div>
      <p className="card-label">{label}</p>
      <p className="card-value">
        <AnimatedValue value={value} loading={loading} />
      </p>
      {note && <p className="card-note">{note}</p>}
      {progress !== undefined && (
        <div className="card-progress-bar">
          <div className="card-progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
      {progressLabel && <p className="card-progress-label">{progressLabel}</p>}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatDate() {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

const quickLinks = [
  { icon: <BiListUl size={20} />, label: 'Gestión de Fincas', desc: 'Administrar fincas registradas', color: '#e8f5e9', page: 'fincas' },
  { icon: <BiCog size={20} />, label: 'Configura tus categorías', desc: 'Categorías y parámetros', color: '#e8f5e9', page: 'categorias' },
]

export default function Dashboard({ onNavigate }) {
  const { user } = useAuth()
  const greeting = useMemo(getGreeting, [])
  const dateStr = useMemo(formatDate, [])
  const [stats, setStats] = useState({
    fincas: 0,
    fincasConUbicacion: 0,
    expertosActivos: 0,
    expertosInactivos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [dashboardRes, fincasRes, expertosRes] = await Promise.allSettled([
          api.get('/dashboard'),
          api.get('/fincas'),
          api.get('/expertos'),
        ])

        if (dashboardRes.status === 'rejected') throw dashboardRes.reason

        const resumen = dashboardRes.value.data?.resumen || {}
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

        setStats({
          fincas: Number(resumen.totalFincas || 0),
          fincasConUbicacion,
          expertosActivos,
          expertosInactivos,
        })
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
      <div className="dashboard-header">
        <div className="dh-left">
          <div className="welcome-avatar">
            {user?.fotoPerfil ? (
              <img src={user.fotoPerfil} alt="avatar" className="welcome-avatar-img" />
            ) : (
              <BiUser size={28} />
            )}
          </div>
          <div>
            <h1 className="dashboard-title">{greeting}, {user?.nombre || 'Admin'}</h1>
            <p className="dashboard-subtitle">Panel de monitoreo agrícola — CoffeeLife</p>
          </div>
        </div>
        <div className="dh-right">
          <p className="dashboard-date"><BiTime size={14} /> {dateStr}</p>
          <div className="stats-summary">
            <span className="stat-pill"><BiBuildings size={14} /> {stats.fincas} fincas</span>
            <span className="stat-pill"><BiGroup size={14} /> {stats.expertosActivos} expertos activos</span>
          </div>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <p className="admin-context">
        Gestión de Fincas · Monitoreo de Cultivos · Recomendaciones Técnicas ·
        Catálogos del Sistema · Administración de Usuarios · Expertos y Cafeteros · Tratamientos
      </p>

      <div className="dashboard-cards">
        <StatCard
          icon={<FincaIcon />}
          label="Fincas activas"
          value={stats.fincas}
          note={`${stats.fincasConUbicacion} con ubicacion registrada`}
          loading={loading}
          color="rgba(239, 222, 192, 0.6)"
          progress={stats.fincas ? (stats.fincasConUbicacion / stats.fincas) * 100 : 0}
          progressLabel={`${Math.round((stats.fincasConUbicacion / Math.max(1, stats.fincas)) * 100)}% geolocalizadas`}
        />
        <StatCard
          icon={<BiGroup size={22} />}
          label="Expertos activos"
          value={stats.expertosActivos}
          loading={loading}
          color="rgba(76, 175, 80, 0.12)"
          note={`${stats.expertosInactivos} inactivos`}
        />
        <CoffeePriceCard />
      </div>

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
