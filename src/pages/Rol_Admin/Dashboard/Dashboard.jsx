import React, { useEffect, useState } from 'react'
import api from '../../../services/api'
import './Dashboard.css'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)

const getDateValue = (value) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const getLastSixMonths = () => {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return {
      key: getMonthKey(date),
      label: date.toLocaleDateString('es-CO', { month: 'short' }),
    }
  })
}

const UsersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const FincaIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const MonitoreoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

const ExpertoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    <polyline points="16 11 17.5 13 20 10" />
  </svg>
)

function StatCard({ icon, label, value, note, loading, color }) {
  return (
    <div className="dashboard-card">
      <div className="card-icon-wrap" style={{ background: color }}>
        {icon}
      </div>
      <p className="card-label">{label}</p>
      <p className="card-value">{loading ? '...' : value}</p>
      {note && <p className="card-note">{note}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    usuarios: 0,
    activos: 0,
    fincas: 0,
    fincasConUbicacion: 0,
    cultivos: 0,
    monitoreos: 0,
    monitoreosMes: 0,
    analisis: 0,
    recomendaciones: 0,
    recomendacionesPendientes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recent, setRecent] = useState([])
  const [monthly, setMonthly] = useState([])
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [dashboardRes, monitoreosRes, recomendacionesRes, fincasRes, usuariosRes] = await Promise.allSettled([
          api.get('/dashboard'),
          api.get('/monitoreos'),
          api.get('/recomendaciones'),
          api.get('/fincas'),
          api.get('/usuarios'),
        ])

        if (dashboardRes.status === 'rejected') throw dashboardRes.reason

        const resumen = dashboardRes.value.data?.resumen || {}
        const monitoreos = monitoreosRes.status === 'fulfilled' ? getArrayData(monitoreosRes.value.data) : []
        const recomendaciones = recomendacionesRes.status === 'fulfilled' ? getArrayData(recomendacionesRes.value.data) : []
        const fincas = fincasRes.status === 'fulfilled' ? getArrayData(fincasRes.value.data) : []
        const usuarios = usuariosRes.status === 'fulfilled' ? getArrayData(usuariosRes.value.data) : []

        const now = new Date()
        const monthStart = startOfMonth(now)
        const monitoreosMes = monitoreos.filter((m) => {
          const fecha = getDateValue(m.fechaMonitoreo || m.fecha_monitoreo)
          return fecha && fecha >= monthStart
        }).length

        const recomendacionesPendientes = recomendaciones.filter((r) => {
          const estado = (r.estado || r.estadoRecomendacion || r.aplicada || '').toString().toLowerCase()
          return !estado.includes('aplic') && !estado.includes('finaliz') && !estado.includes('cerrad')
        }).length

        const fincasConUbicacion = fincas.filter((f) => f.latitud && f.longitud).length

        const months = getLastSixMonths()
        const monthlyCounts = months.map((month) => ({
          ...month,
          total: monitoreos.filter((m) => {
            const fecha = getDateValue(m.fechaMonitoreo || m.fecha_monitoreo)
            return fecha && getMonthKey(fecha) === month.key
          }).length,
        }))

        const maxMonthly = Math.max(1, ...monthlyCounts.map((m) => m.total))
        setMonthly(monthlyCounts.map((m) => ({ ...m, pct: Math.max(6, Math.round((m.total / maxMonthly) * 100)) })))

        const vencidas = recomendaciones.filter((r) => {
          const fecha = getDateValue(r.fechaLimite || r.fecha_limite)
          return fecha && fecha < now
        }).length

        const inactivos = usuarios.filter((u) => u.activo === false || u.activo === 0).length
        const sinUbicacion = Math.max(0, fincas.length - fincasConUbicacion)
        const nextAlerts = []

        if (vencidas > 0) nextAlerts.push({ label: 'Recomendaciones vencidas', value: vencidas, tone: 'danger' })
        if (recomendacionesPendientes > 0) nextAlerts.push({ label: 'Recomendaciones pendientes', value: recomendacionesPendientes, tone: 'warning' })
        if (inactivos > 0) nextAlerts.push({ label: 'Usuarios inactivos', value: inactivos, tone: 'muted' })
        if (sinUbicacion > 0) nextAlerts.push({ label: 'Fincas sin coordenadas', value: sinUbicacion, tone: 'warning' })
        setAlerts(nextAlerts)

        setStats({
          usuarios: Number(resumen.totalUsuarios || 0),
          activos: Number(resumen.usuariosActivos || 0),
          fincas: Number(resumen.totalFincas || 0),
          fincasConUbicacion,
          cultivos: Number(resumen.totalCultivos || 0),
          monitoreos: Number(resumen.totalMonitoreos || 0),
          monitoreosMes,
          analisis: Number(resumen.totalAnalisis || 0),
          recomendaciones: Number(resumen.totalRecomendaciones || 0),
          recomendacionesPendientes,
        })

        setRecent(Array.isArray(dashboardRes.value.data?.ultimosMonitoreos) ? dashboardRes.value.data.ultimosMonitoreos : [])
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
          icon={<UsersIcon />}
          label="Usuarios"
          value={stats.usuarios}
          note={`${stats.activos} activos`}
          loading={loading}
          color="rgba(76, 175, 80, 0.12)"
        />
        <StatCard
          icon={<FincaIcon />}
          label="Fincas activas"
          value={stats.fincas}
          note={`${stats.fincasConUbicacion} con ubicacion`}
          loading={loading}
          color="rgba(239, 222, 192, 0.6)"
        />
        <StatCard
          icon={<MonitoreoIcon />}
          label="Cultivos"
          value={stats.cultivos}
          loading={loading}
          color="rgba(76, 175, 80, 0.12)"
        />
        <StatCard
          icon={<MonitoreoIcon />}
          label="Monitoreos"
          value={stats.monitoreos}
          note={`${stats.monitoreosMes} este mes`}
          loading={loading}
          color="rgba(239, 222, 192, 0.6)"
        />
        <StatCard
          icon={<ExpertoIcon />}
          label="Analisis IA"
          value={stats.analisis}
          loading={loading}
          color="rgba(76, 175, 80, 0.12)"
        />
        <StatCard
          icon={<ExpertoIcon />}
          label="Recomendaciones"
          value={stats.recomendaciones}
          note={`${stats.recomendacionesPendientes} pendientes`}
          loading={loading}
          color="rgba(239, 222, 192, 0.6)"
        />
      </div>

      <div className="dashboard-flow">
        <div className="dashboard-section">
          <h2 className="section-title">Monitoreos por mes</h2>
          {loading ? (
            <p className="empty-note">Cargando...</p>
          ) : monthly.length === 0 ? (
            <p className="empty-note">Sin datos para graficar.</p>
          ) : (
            <div className="monthly-chart" aria-label="Monitoreos de los ultimos seis meses">
              {monthly.map((month) => (
                <div className="monthly-bar-item" key={month.key}>
                  <div className="monthly-bar-track">
                    <div className="monthly-bar-fill" style={{ height: `${month.pct}%` }} />
                  </div>
                  <strong>{month.total}</strong>
                  <span>{month.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">Alertas del sistema</h2>
          {loading ? (
            <p className="empty-note">Cargando...</p>
          ) : alerts.length === 0 ? (
            <div className="empty-state compact">
              <p>No hay alertas operativas.</p>
            </div>
          ) : (
            <div className="dashboard-alert-list">
              {alerts.map((alert) => (
                <div className={`dashboard-alert-item ${alert.tone}`} key={alert.label}>
                  <span>{alert.label}</span>
                  <strong>{alert.value}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="section-title">Monitoreos recientes</h2>
        {loading ? (
          <p className="empty-note">Cargando...</p>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <p>No hay monitoreos registrados aun.</p>
          </div>
        ) : (
          <table className="admin-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha monitoreo</th>
                <th>Cultivo</th>
                <th>Experto</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((m, idx) => (
                <tr key={m.idMonitoreo}>
                  <td>{idx + 1}</td>
                  <td>{m.fechaMonitoreo ? new Date(m.fechaMonitoreo).toLocaleDateString('es-CO') : '-'}</td>
                  <td>{m.cultivo?.nombreCultivo || `Cultivo #${m.idCultivo || '-'}`}</td>
                  <td>{m.experto ? `${m.experto.nombre || ''} ${m.experto.apellido || ''}`.trim() : '-'}</td>
                  <td>{m.observaciones || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}