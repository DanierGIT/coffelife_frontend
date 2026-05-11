/**
 * Dashboard.jsx
 * Conectado al backend: muestra contadores reales de usuarios, fincas,
 * monitoreos y expertos usando los endpoints del API.
 */

import React, { useState, useEffect } from 'react'
import api from '../../../services/api'
import './Dashboard.css'

const UsersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const FincaIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const MonitoreoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
)

const ExpertoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    <polyline points="16 11 17.5 13 20 10"/>
  </svg>
)

function StatCard({ icon, label, value, note, loading, color }) {
  return (
    <div className="dashboard-card">
      <div className="card-icon-wrap" style={{ background: color }}>
        {icon}
      </div>
      <p className="card-label">{label}</p>
      <p className="card-value">{loading ? '…' : value}</p>
      {note && <p className="card-note">{note}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [stats,   setStats]   = useState({ usuarios: 0, fincas: 0, monitoreos: 0, expertos: 0 })
  const [loading, setLoading] = useState(true)
  const [recent,  setRecent]  = useState([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usuarios, fincas, monitoreos, expertos] = await Promise.allSettled([
          api.get('/usuarios'),
          api.get('/fincas'),
          api.get('/monitoreos'),
          api.get('/expertos'),
        ])

        const count = (r) => {
          if (r.status !== 'fulfilled') return 0
          const d = r.value.data
          return Array.isArray(d) ? d.length : (d?.data?.length ?? 0)
        }

        setStats({
          usuarios:   count(usuarios),
          fincas:     count(fincas),
          monitoreos: count(monitoreos),
          expertos:   count(expertos),
        })

        if (monitoreos.status === 'fulfilled') {
          const arr = Array.isArray(monitoreos.value.data)
            ? monitoreos.value.data
            : (monitoreos.value.data?.data ?? [])
          setRecent(arr.slice(-5).reverse())
        }
      } catch (e) {
        console.error('Dashboard error', e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-subtitle">Bienvenido al panel de administración de CoffeeLife</p>

      <div className="dashboard-cards">
        <StatCard
          icon={<UsersIcon />}
          label="Usuarios"
          value={stats.usuarios}
          loading={loading}
          color="rgba(76, 175, 80, 0.12)"
        />
        <StatCard
          icon={<FincaIcon />}
          label="Fincas"
          value={stats.fincas}
          loading={loading}
          color="rgba(239, 222, 192, 0.6)"
        />
        <StatCard
          icon={<MonitoreoIcon />}
          label="Monitoreos"
          value={stats.monitoreos}
          loading={loading}
          color="rgba(76, 175, 80, 0.12)"
        />
        <StatCard
          icon={<ExpertoIcon />}
          label="Expertos"
          value={stats.expertos}
          loading={loading}
          color="rgba(239, 222, 192, 0.6)"
        />
      </div>

      <div className="dashboard-section">
        <h2 className="section-title">Monitoreos recientes</h2>
        {loading ? (
          <p className="empty-note">Cargando…</p>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <p>No hay monitoreos registrados aún.</p>
          </div>
        ) : (
          <table className="admin-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha monitoreo</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.idMonitoreo}>
                  <td>{m.idMonitoreo}</td>
                  <td>{m.fechaMonitoreo ? new Date(m.fechaMonitoreo).toLocaleDateString('es-CO') : '—'}</td>
                  <td>{m.observaciones || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}