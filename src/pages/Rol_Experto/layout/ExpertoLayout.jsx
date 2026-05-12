import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import './ExpertoLayout.css'

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    key: 'fincas',
    label: 'Fincas asignadas',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
    ),
  },
  {
    key: 'duenos',
    label: 'Dueños asignados',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
]

const FINCA_ACTIONS = [
  { key: 'escaner',         label: 'Escáner IA',      group: 1 },
  { key: 'monitoreos',      label: 'Monitoreos',       group: 1 },
  { key: 'mapa',            label: 'Mapa de riesgo',   group: 1 },
  { key: 'tratamientos',    label: 'Tratamientos',     group: 2 },
  { key: 'recomendaciones', label: 'Recomendaciones',  group: 2 },
  { key: 'historial',       label: 'Historial',        group: 2 },
  { key: 'reportes',        label: 'Reportes',         group: 3 },
]

function ActionsDropdown({ finca, onAction }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const groups = [...new Set(FINCA_ACTIONS.map(a => a.group))]

  return (
    <div className="actions-wrap" ref={ref}>
      <button
        className={`actions-btn${open ? ' open' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        </svg>
        Acciones
        <svg className={`chevron${open ? ' rotated' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="actions-dropdown">
          <p className="actions-dropdown-label">Herramientas</p>
          {groups.map((g, gi) => (
            <div key={g}>
              {gi > 0 && <div className="actions-divider" />}
              {FINCA_ACTIONS.filter(a => a.group === g).map(action => (
                <button
                  key={action.key}
                  className="actions-dropdown-item"
                  onClick={() => { onAction(action.key, finca); setOpen(false) }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FincasTable({ onAction }) {
  // Reemplaza esto con tus datos reales / fetch
  const fincas = [
    { id: 1, nombre: 'El Paraíso',    dueno: 'Andrés Martínez', estado: 'activa'    },
    { id: 2, nombre: 'La Esperanza',  dueno: 'Gloria Ríos',     estado: 'revision'  },
    { id: 3, nombre: 'San Isidro',    dueno: 'Luis Pedraza',    estado: 'inactiva'  },
  ]

  const estadoLabel = { activa: 'Activa', revision: 'En revisión', inactiva: 'Inactiva' }
  const estadoClass = { activa: 'badge-active', revision: 'badge-warning', inactiva: 'badge-inactive' }

  return (
    <div className="fincas-table-card">
      <table className="fincas-table">
        <thead>
          <tr>
            <th>Nombre de finca</th>
            <th>Dueño de finca</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {fincas.map(f => (
            <tr key={f.id}>
              <td className="td-name">{f.nombre}</td>
              <td>{f.dueno}</td>
              <td>
                <span className={`estado-badge ${estadoClass[f.estado]}`}>
                  <span className="badge-dot" />
                  {estadoLabel[f.estado]}
                </span>
              </td>
              <td>
                <ActionsDropdown finca={f} onAction={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ExpertoLayout({ activePage, onNavigate, children }) {
  const { user, logout } = useAuth()

  const initials = ((user?.nombre?.[0] ?? '') + (user?.apellido?.[0] ?? '')).toUpperCase() ||
                   (user?.correo?.[0] ?? 'E').toUpperCase()

  const displayName = user?.nombre
    ? `${user.nombre} ${user.apellido ?? ''}`.trim()
    : (user?.correo ?? 'Experto')

  const handleFincaAction = (actionKey, finca) => {
    // Navega pasando también la finca seleccionada si la necesitas
    onNavigate(actionKey, finca)
  }

  return (
    <div className="experto-layout">

      {/* ── NAVBAR ── */}
      <nav className="experto-navbar">
        <div className="experto-navbar-logo">
          <img src="/src/assets/logo.jpg" alt="CoffeeLife" className="experto-logo-img" />
          <span className="experto-logo-badge">EXPERTO</span>
        </div>

        <div className="experto-navbar-items">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`experto-nav-btn${activePage === item.key ? ' active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="experto-navbar-user">
          <div className="experto-user-info">
            <div className="experto-avatar">{initials}</div>
            <div className="experto-user-text">
              <p className="experto-user-name">{displayName}</p>
              <p className="experto-user-role">Experto Agrónomo</p>
            </div>
          </div>
          <button className="experto-logout-btn" onClick={logout} title="Cerrar sesión">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* ── CONTENIDO ── */}
      <main className="experto-main">
        {activePage === 'fincas' ? (
          <div className="fincas-page">
            <div className="fincas-page-header">
              <h1 className="fincas-title">Fincas asignadas</h1>
              <p className="fincas-subtitle">Gestiona las fincas bajo tu supervisión</p>
            </div>
            <FincasTable onAction={handleFincaAction} />
          </div>
        ) : (
          children
        )}
      </main>

    </div>
  )
}