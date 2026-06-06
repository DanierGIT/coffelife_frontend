import React, { useEffect, useState, useMemo } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { BiBuildings, BiUser, BiGroup, BiTime } from 'react-icons/bi'
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
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`dashboard-card${onClick ? ' clickable' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

function LeafPattern() {
  const leaves = useMemo(() => {
    return Array.from({length:20}, () => ({
      x: 20 + Math.random() * 1160,
      delay: Math.random() * 8,
      dur: 6 + Math.random() * 4,
      size: 0.3 + Math.random() * 0.5,
    }))
  }, [])
  return (
    <svg className="db-leaves" viewBox="0 0 1200 300" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <g id="lf">
          <path d="M0,20 C6,14 14,6 14,-4 C14,-14 6,-20 0,-22 C-6,-20 -14,-14 -14,-4 C-14,6 -6,14 0,20Z" fill="rgba(46,125,50,0.35)"/>
          <path d="M0,20 L0,-22" stroke="rgba(46,125,50,0.25)" strokeWidth="0.8"/>
          <path d="M0,10 L-6,4" stroke="rgba(46,125,50,0.15)" strokeWidth="0.5"/>
          <path d="M0,2 L-6,-4" stroke="rgba(46,125,50,0.15)" strokeWidth="0.5"/>
          <path d="M0,-6 L-5,-10" stroke="rgba(46,125,50,0.15)" strokeWidth="0.5"/>
          <path d="M0,10 L6,4" stroke="rgba(46,125,50,0.15)" strokeWidth="0.5"/>
          <path d="M0,2 L6,-4" stroke="rgba(46,125,50,0.15)" strokeWidth="0.5"/>
          <path d="M0,-6 L5,-10" stroke="rgba(46,125,50,0.15)" strokeWidth="0.5"/>
        </g>
      </defs>
      {leaves.map((leaf, i) => (
        <g key={i} className="db-falling-leaf" style={{'--x': `${leaf.x}px`, '--s': leaf.size, '--d': leaf.dur, animationDelay: `${leaf.delay}s`}}>
          <use href="#lf" />
        </g>
      ))}
    </svg>
  )
}

export default function Dashboard() {
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
        <LeafPattern />
        <div className="welcome-avatar">
          {user?.fotoPerfil ? (
            <img src={user.fotoPerfil} alt="avatar" className="welcome-avatar-img" />
          ) : (
            <BiUser size={32} />
          )}
        </div>
        <h1 className="dashboard-title">{greeting}, {user?.nombre || 'Admin'}</h1>
        <p className="dashboard-subtitle">Panel de monitoreo agrícola — CoffeeLife</p>
        <p className="dashboard-date"><BiTime size={14} /> {dateStr}</p>
        <div className="stats-summary">
          <span className="stat-pill"><BiBuildings size={14} /> {stats.fincas} fincas</span>
          <span className="stat-pill"><BiGroup size={14} /> {stats.expertosActivos} expertos activos</span>
        </div>
        <p className="admin-context">
          Gestión de Fincas · Monitoreo de Cultivos · Recomendaciones Técnicas ·
          Catálogos del Sistema · Administración de Usuarios · Expertos y Cafeteros · Tratamientos
        </p>
      </div>

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
      </div>
    </div>
  )
}