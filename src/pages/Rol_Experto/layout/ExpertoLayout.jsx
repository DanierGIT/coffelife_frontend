import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import './ExpertoLayout.css'
import AnimatedLogo from '../../../components/AnimatedLogo'
import api from '../../../services/api'
import { BiGrid, BiTargetLock, BiChevronDown, BiUser, BiLogOut } from 'react-icons/bi'

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Mis fincas asignadas',
    icon: <BiGrid size={18} />,
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
        <BiTargetLock size={14} />
        Acciones
        <BiChevronDown className={`chevron${open ? ' rotated' : ''}`} size={12} />
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

function FincasTable({ user, onAction }) {
  const [fincas, setFincas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const idExperto = user?.idUsuario || user?.id

  useEffect(() => {
    const cargarFincasAsignadas = async () => {
      setLoading(true)
      setError('')

      try {
        const res = await api.get('/asignaciones_expertos')
        const asignaciones = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])

        const propias = asignaciones.filter((asignacion) => {
          return Number(asignacion.idExperto) === Number(idExperto)
        })

        const fincasAsignadas = propias
          .map((asignacion) => {
            const finca = asignacion.finca || {}

            return {
              id: finca.idFinca || asignacion.idFinca,
              idFinca: finca.idFinca || asignacion.idFinca,
              nombre: finca.nombreFinca || 'Finca sin nombre',
              municipio: finca.municipio || '-',
              departamento: finca.departamento || '-',
              altitud: finca.altitudMsnm || null,
              area: finca.areaHectareas || null,
              fechaAsignada: asignacion.fechaAsignada,
              asignacion,
            }
          })
          .filter((finca) => finca.idFinca)

        setFincas(fincasAsignadas)
      } catch (err) {
        if (err?.response?.status === 403) {
          setError('Tu usuario experto no tiene permiso para consultar asignaciones. Revisa la ruta GET /asignaciones_expertos en backend.')
        } else {
          setError(err?.response?.data?.message || 'No se pudieron cargar las fincas asignadas.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (idExperto) cargarFincasAsignadas()
  }, [idExperto])

  if (loading) {
    return (
      <div className="fincas-table-card">
        <p className="fincas-empty-state">Cargando fincas asignadas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fincas-table-card">
        <p className="fincas-error-state">{error}</p>
      </div>
    )
  }

  return (
    <div className="fincas-table-card">
      <table className="fincas-table">
        <thead>
          <tr>
            <th>Nombre de finca</th>
            <th>Ubicacion</th>
            <th>Datos</th>
            <th>Fecha asignada</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {fincas.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <p className="fincas-empty-state">Aun no tienes fincas asignadas.</p>
              </td>
            </tr>
          ) : (
            fincas.map((finca) => (
              <tr key={finca.idFinca}>
                <td className="td-name">{finca.nombre}</td>
                <td>{finca.municipio}, {finca.departamento}</td>
                <td>
                  {finca.altitud ? `${finca.altitud} m.s.n.m.` : '-'}
                  {finca.area ? ` / ${finca.area} ha` : ''}
                </td>
                <td>{finca.fechaAsignada || '-'}</td>
                <td>
                  <ActionsDropdown finca={finca} onAction={onAction} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function ExpertoLayout({ activePage, onNavigate, children }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const initials = ((user?.nombre?.[0] ?? '') + (user?.apellido?.[0] ?? '')).toUpperCase() ||
                   (user?.correo?.[0] ?? 'E').toUpperCase()

  const displayName = user?.nombre
    ? `${user.nombre} ${user.apellido ?? ''}`.trim()
    : (user?.correo ?? 'Experto')

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePerfil = () => {
    onNavigate('perfil')
    setMenuOpen(false)
  }

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
  }

  const handleFincaAction = (actionKey, finca) => {
    onNavigate(actionKey, finca)
  }

  return (
    <div className="experto-layout">

      {/* ── NAVBAR ── */}
      <nav className="experto-navbar">
        <div className="experto-navbar-logo">
          <AnimatedLogo size="md" showText={false} />
          <div className="experto-navbar-logo-texts">
            <span className="experto-logo-name">Coffe<span>Life</span></span>
            <span className="experto-logo-badge">EXPERTO</span>
          </div>
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

        <div className="experto-navbar-user" ref={menuRef}>
          <div
            className={`experto-user-info${activePage === 'perfil' ? ' active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            title="Opciones de usuario"
          >
            <div className="experto-avatar">
              {user?.fotoPerfil
                ? <img src={user.fotoPerfil} alt="Foto" className="experto-avatar-img" />
                : initials
              }
            </div>
            <div className="experto-user-text">
              <p className="experto-user-name">{displayName}</p>
              <p className="experto-user-role">Experto Agrónomo</p>
            </div>
            <BiChevronDown className={`experto-chevron${menuOpen ? ' open' : ''}`} size={14} />
          </div>

          {menuOpen && (
            <div className="experto-dropdown">
              <button className="experto-dropdown-item" onClick={handlePerfil}>
                <BiUser size={15} />
                Mi perfil
              </button>
              <div className="experto-dropdown-divider" />
              <button className="experto-dropdown-item danger" onClick={handleLogout}>
                <BiLogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── CONTENIDO ── */}
      <main className="experto-main">
        {children}
      </main>

    </div>
  )
}