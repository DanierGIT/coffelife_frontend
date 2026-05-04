/**
 * Dashboard.jsx
 * ──────────────────────────────────────────────
 * Página de inicio del panel administrador.
 *
 * TODO: implementar métricas, gráficas y resumen del sistema.
 */

import React from 'react'
import './Dashboard.css'

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-subtitle">Bienvenido al panel de administración de CoffeeLife</p>

      {/* ── Tarjetas de resumen ── */}
      <div className="dashboard-cards">
        <div className="dashboard-card placeholder">
          <span className="card-icon">👥</span>
          <p className="card-label">Usuarios</p>
          <p className="card-value">—</p>
          <p className="card-note">Por implementar</p>
        </div>

        <div className="dashboard-card placeholder">
          <span className="card-icon">☕</span>
          <p className="card-label">Productos</p>
          <p className="card-value">—</p>
          <p className="card-note">Por implementar</p>
        </div>

        <div className="dashboard-card placeholder">
          <span className="card-icon">🛒</span>
          <p className="card-label">Pedidos</p>
          <p className="card-value">—</p>
          <p className="card-note">Por implementar</p>
        </div>

        <div className="dashboard-card placeholder">
          <span className="card-icon">📊</span>
          <p className="card-label">Ingresos</p>
          <p className="card-value">—</p>
          <p className="card-note">Por implementar</p>
        </div>
      </div>

      {/* ── Actividad reciente ── */}
      <div className="dashboard-section">
        <h2 className="section-title">Actividad reciente</h2>
        <div className="empty-state">
          <p>Aquí aparecerán los registros de actividad reciente.</p>
          <p className="empty-note">Conecta esta sección al endpoint correspondiente del backend.</p>
        </div>
      </div>
    </div>
  )
}
