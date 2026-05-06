/**
 * Dashboard.jsx
 * Conectado al backend: muestra contadores reales de usuarios, fincas,
 * monitoreos y expertos usando los endpoints del API.
 */

import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import './Dashboard.css'

function StatCard({ icon, label, value, note, loading }) {
  return (
    <div className="dashboard-card">
      <span className="card-icon">{icon}</span>
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
          usuarios:  count(usuarios),
          fincas:    count(fincas),
          monitoreos: count(monitoreos),
          expertos:  count(expertos),
        })

        // Últimos 5 monitoreos para actividad reciente
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
        <StatCard icon="👥" label="Usuarios"   value={stats.usuarios}   loading={loading} />
        <StatCard icon="🏡" label="Fincas"     value={stats.fincas}     loading={loading} />
        <StatCard icon="🔬" label="Monitoreos" value={stats.monitoreos} loading={loading} />
        <StatCard icon="🧑‍🔬" label="Expertos"   value={stats.expertos}   loading={loading} />
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
