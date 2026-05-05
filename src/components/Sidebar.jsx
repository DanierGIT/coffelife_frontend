/**
 * Sidebar.jsx
 * ──────────────────────────────────────────────
 * Barra de navegación vertical del panel admin.
 *
 * Props:
 *  - activePage   → nombre de la página activa (string)
 *  - onNavigate   → función que recibe el nombre de la página a mostrar
 *
 * Para agregar o reordenar secciones, edita el array NAV_ITEMS.
 * Cuando una página esté lista, cambia ready: false → ready: true.
 */

import React from 'react'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    ready: true,
  },
  {
    key: 'administrador',
    label: 'Administrador',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    ready: true,
  },
  {
    key: 'perfil',
    label: 'Perfil',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    ready: false,
  },
  {
    key: 'experto',
    label: 'Experto',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    ready: true,
  },
  {
    key: 'campesino',
    label: 'Campesino',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12" />
        <path d="M5 12C5 7 8 4 12 4c4 0 7 3 7 8" />
        <path d="M2 12h20" />
      </svg>
    ),
    ready: false,
  },
  {
    key: 'categorias',
    label: 'Categorías',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    ready: false,
  },
]

export default function Sidebar({ activePage, onNavigate }) {
  const { user, logout } = useAuth()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon"></span>
        <span className="sidebar-logo-text">CoffeeLife</span>
      </div>

      {/* Perfil del admin */}
      <div className="sidebar-profile">
        <div className="sidebar-avatar">
          {(user?.fullName ?? user?.email ?? 'A')[0].toUpperCase()}
        </div>
        <div className="sidebar-profile-info">
          <p className="sidebar-profile-name">{user?.fullName ?? user?.email}</p>
          <p className="sidebar-profile-role">Administrador</p>
        </div>
      </div>

      <hr className="sidebar-divider" />

      {/* Navegación */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`sidebar-nav-item${activePage === item.key ? ' active' : ''}${!item.ready ? ' disabled' : ''}`}
            onClick={() => item.ready && onNavigate(item.key)}
            title={!item.ready ? 'Por implementar' : item.label}
            disabled={!item.ready}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
            {!item.ready && <span className="sidebar-badge">Próximamente</span>}
          </button>
        ))}
      </nav>

      {/* Logout al fondo */}
      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={logout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
