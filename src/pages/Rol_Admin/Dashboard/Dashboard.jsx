import React, { useEffect, useState } from 'react'
import api from '../../../services/api'
import './Dashboard.css'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const FincaIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)


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

export default function Dashboard() {
  const [stats, setStats] = useState({
    fincas: 0,
    fincasConUbicacion: 0,
    cultivos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

      useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [dashboardRes, fincasRes] = await Promise.allSettled([
          api.get('/dashboard'),
          api.get('/fincas'),
        ])

        if (dashboardRes.status === 'rejected') throw dashboardRes.reason

        const resumen = dashboardRes.value.data?.resumen || {}
        const fincas = fincasRes.status === 'fulfilled' ? getArrayData(fincasRes.value.data) : []
        const fincasConUbicacion = fincas.filter((f) => f.latitud && f.longitud).length

        setStats({
          fincas: Number(resumen.totalFincas || 0),
          fincasConUbicacion,
          cultivos: Number(resumen.totalCultivos || 0),
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
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-subtitle">Flujo general de administracion de CoffeeLife</p>

      {error && <p className="dashboard-error">{error}</p>}

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
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a9 9 0 0 1 9 9c0 5-9 13-9 13S3 16 3 11a9 9 0 0 1 9-9z"/>
              <circle cx="12" cy="11" r="3"/>
            </svg>
          }
          label="Cultivos"
          value={stats.cultivos}
          loading={loading}
          color="rgba(76, 175, 80, 0.12)"
        />
      </div>


    </div>
  )
}