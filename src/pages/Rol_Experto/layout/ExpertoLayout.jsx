import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import './ExpertoLayout.css'
import AnimatedLogo from '../../../components/AnimatedLogo'
import Loading from '../../../components/Loading'
import '../../../components/cargando.css'
import api from '../../../services/api'
import { BiGrid, BiTargetLock, BiChevronDown, BiUser, BiLogOut, BiBell } from 'react-icons/bi'

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
        <Loading type="content" text="Cargando fincas asignadas..." />
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

const BACK_CONFIG = {
  cultivos:          { page: 'dashboard',           label: 'Volver' },
  detalle_cultivo:   { page: 'cultivos',            label: 'Volver' },
  monitoreos:        { page: 'dashboard',           label: 'Volver' },
  tratamientos:      { page: 'dashboard',           label: 'Volver' },
  recomendaciones:   { page: 'dashboard',           label: 'Volver' },
  historial:         { page: 'dashboard',           label: 'Volver' },
  productores:       { page: 'dashboard',           label: 'Volver' },
  reportes:          { page: 'dashboard',           label: 'Volver' },
  escaner:           { page: 'dashboard',           label: 'Volver' },
  mapa:              { page: 'dashboard',           label: 'Volver' },
  perfil:            { page: 'dashboard',           label: 'Volver' },
  'configurar-experto': { page: 'perfil',           label: 'Volver' },
}

export default function ExpertoLayout({ activePage, onNavigate, selectedFinca, children }) {
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

  // Notificaciones
  const idExperto = user?.idUsuario ?? user?.id
  const [fincasAsignadas, setFincasAsignadas] = useState([])
  const [monitoreos, setMonitoreos] = useState([])
  const [nuevasAsignaciones, setNuevasAsignaciones] = useState([])
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [vistos, setVistos] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('exp_notif_vistos') || '[]')) }
    catch { return new Set() }
  })

  useEffect(() => {
    localStorage.setItem('exp_notif_vistos', JSON.stringify([...vistos]))
  }, [vistos])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.exp-notif-wrapper')) setShowNotifDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getArrayData = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.data)) return data.data
    return []
  }

  const notifGetId = (n) => {
    if (n.tipo === 'asignacion') return `asig-${n.idFinca}`
    return n.id ?? n.idMonitoreo ?? n.id_monitoreo
  }

  const notifFmtFecha = (raw) => {
    if (!raw) return ''
    const d = new Date(raw)
    const opts = { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }
    const co = new Intl.DateTimeFormat('es-CO', opts).format(d)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Ahora'
    if (diffMin < 60) return `Hace ${diffMin} min`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `Hace ${diffHr}h`
    return co
  }

  const fetchNotificaciones = useCallback(async () => {
    if (!idExperto) return
    try {
      const [asigRes, monRes] = await Promise.all([
        api.get('/asignaciones_expertos', { params: { limit: 1000 } }),
        api.get('/monitoreos', { params: { limit: 50 } }),
      ])

      const asignaciones = getArrayData(asigRes.data).filter(
        (a) => Number(a.idExperto) === Number(idExperto)
      )
      const fincasActuales = asignaciones.map((a) => ({
        idFinca: Number(a.idFinca),
        nombre: a.finca?.nombreFinca || `Finca #${a.idFinca}`,
        fechaAsignada: a.fechaAsignada,
      }))

      // Detectar nuevas asignaciones (solo si ya teníamos un listado previo)
      const idsPrevios = new Set(fincasAsignadas.map((f) => f.idFinca))
      const nuevas = fincasActuales.filter((f) => !idsPrevios.has(f.idFinca))
      if (nuevas.length > 0 && fincasAsignadas.length > 0) {
        setNuevasAsignaciones((prev) => {
          const existentes = new Set(prev.map((n) => n.idFinca))
          const realmenteNuevas = nuevas.filter((n) => !existentes.has(n.idFinca))
          return [...prev, ...realmenteNuevas]
        })
      }
      setFincasAsignadas(fincasActuales)

      // Filtrar monitoreos solo de fincas asignadas a este experto
      const idsAsignadas = new Set(fincasActuales.map((f) => f.idFinca))
      const monData = getArrayData(monRes.data)
      const monFiltrados = monData
        .map((m) => {
          const finca = m.finca || m.cultivo || {}
          return {
            tipo: 'monitoreo',
            id: m.idMonitoreo ?? m.id_monitoreo ?? m.id,
            idFinca: Number(finca.idFinca ?? finca.id_finca ?? m.idFinca ?? m.id_finca),
            finca: finca.nombreFinca || finca.nombre_finca || m.finca || `Finca #${finca.idFinca || m.idFinca || '-'}`,
            experto: m.usuario ? `${m.usuario.nombre || ''} ${m.usuario.apellido || ''}`.trim() : (m.experto || 'Experto'),
            fecha: m.fechaMonitoreo ?? m.fecha ?? m.fecha_monitoreo,
            origenMovil: m.origenMovil || m.origen_movil || m.dispositivo === 'movil',
          }
        })
        .filter((m) => idsAsignadas.has(m.idFinca))

      setMonitoreos(monFiltrados)
    } catch {
      // silencioso
    }
  }, [idExperto, fincasAsignadas])

  useEffect(() => {
    fetchNotificaciones()
    const id = setInterval(fetchNotificaciones, 30000)
    return () => clearInterval(id)
  }, [fetchNotificaciones])

  const notificaciones = [
    ...nuevasAsignaciones.map((a) => ({ ...a, tipo: 'asignacion' })),
    ...monitoreos,
  ]
  const noVistos = notificaciones.filter((n) => !vistos.has(notifGetId(n)))
  const notifCount = noVistos.length

  const marcarLeida = (n) => {
    setVistos((prev) => new Set([...prev, notifGetId(n)]))
  }

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

        <div className="exp-notif-wrapper" style={{ position: 'relative' }}>
          <button className="exp-notif-btn" onClick={() => setShowNotifDropdown(!showNotifDropdown)} title="Notificaciones">
            <BiBell size={20} /> {notifCount > 0 && <span className="exp-notif-badge">{notifCount}</span>}
          </button>
          {showNotifDropdown && (
            <div className="exp-notif-dropdown">
              <div className="exp-notif-header">
                Notificaciones
                {notifCount > 0 && (
                  <button className="exp-mark-read-btn" onClick={() => setVistos(new Set(notificaciones.map((n) => notifGetId(n))))}>
                    Marcar todas leídas
                  </button>
                )}
              </div>
              {notificaciones.length === 0 ? (
                <div className="exp-notif-empty">Sin notificaciones recientes</div>
              ) : (
                noVistos.slice(0, 10).map((n, i) => {
                  const nid = notifGetId(n)
                  const esAsignacion = n.tipo === 'asignacion'
                  return (
                    <div
                      key={nid ?? i}
                      className={`exp-notif-item${esAsignacion ? ' exp-notif-asignacion' : ''}`}
                      onClick={() => {
                        marcarLeida(n)
                        onNavigate(esAsignacion ? 'dashboard' : 'monitoreos')
                      }}
                    >
                      <div className="exp-notif-text">
                        {esAsignacion ? (
                          <><strong>Te asignaron</strong> la finca <strong>{n.nombre}</strong></>
                        ) : (
                          <><strong>{n.experto || 'Experto'}</strong> hizo monitoreo en la finca <strong>{n.finca}</strong></>
                        )}
                      </div>
                      <div className="exp-notif-time">
                        {esAsignacion ? 'Nueva asignación' : (n.origenMovil ? 'Desde app móvil' : 'Monitoreo')}
                        {' · '}
                        {notifFmtFecha(n.fecha)}
                      </div>
                    </div>
                  )
                })
              )}
              {notifCount === 0 && notificaciones.length > 0 && (
                <div className="exp-notif-empty">Todas las notificaciones vistas</div>
              )}
            </div>
          )}
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

      {/* ── BARRA DE VOLVER (excepto dashboard) ── */}
      {activePage !== 'dashboard' && (() => {
        const cfg = BACK_CONFIG[activePage]
        if (!cfg) return null
        const data = activePage === 'detalle_cultivo' ? selectedFinca : undefined
        return (
          <div className="back-bar">
            <button className="back-btn" onClick={() => onNavigate(cfg.page, data)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              {cfg.label}
            </button>
          </div>
        )
      })()}

      {/* ── CONTENIDO ── */}
      <main className={`experto-main${activePage === 'detalle_cultivo' ? ' experto-main--full' : ''}`}>
        {children}
      </main>

    </div>
  )
}