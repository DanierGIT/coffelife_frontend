import { useEffect, useState, useCallback } from 'react'
import { BiCog, BiBell, BiCalendar, BiChevronDown, BiLeaf, BiUser, BiCoffee, BiTrendingUp, BiRightArrow, BiBuildings, BiShow, BiMapPin, BiDroplet, BiBarChart, BiX } from 'react-icons/bi'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../services/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { useNotificaciones, useRefetchGlobal } from '../../../hooks/useNotificaciones'
import './Dashboard.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const ESTADO_COLORS = {
  'Sin roya': '#2e7d32',
  'Bajo': '#fbc02d',
  'Medio': '#f57c00',
  'Con roya': '#d32f2f',
  'Critico': '#6a1b9a',
  'Pendientes': '#fbc02d',
}
const ESTADO_ORDER = ['Sin roya', 'Bajo', 'Medio', 'Con roya', 'Critico', 'Pendientes']

const normKey = (s) => (s ?? '').toString().toLowerCase().replace(/[\s_]+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const splitCamel = (s) => (s ?? '').toString().replace(/([a-z])([A-Z])/g, '$1 $2')

const normalizarNombreEstado = (raw) => {
  const key = normKey(raw)
  const map = {
    sinroya: 'Sin roya',
    sano: 'Sin roya',
    saludable: 'Sin roya',
    healthy: 'Sin roya',
    conroya: 'Con roya',
    roya: 'Con roya',
    enfermo: 'Con roya',
    bajo: 'Bajo',
    low: 'Bajo',
    medio: 'Medio',
    medium: 'Medio',
    moderado: 'Medio',
    critico: 'Critico',
    critica: 'Critico',
    critical: 'Critico',
    alto: 'Critico',
    high: 'Critico',
    pendiente: 'Pendientes',
    pendientes: 'Pendientes',
    pending: 'Pendientes',
  }
  if (map[key]) return map[key]
  // Si el nombre contiene una palabra clave
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  // Capitalizar primera letra
  const cleaned = splitCamel(raw).replace(/_/g, ' ').trim()
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : 'Sin roya'
}

const getColor = (name) => ESTADO_COLORS[normalizarNombreEstado(name)] || '#999'

const getArr = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const unwrap = (data) => {
  if (data === null || data === undefined) return null
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (data && typeof data === 'object') return data
  return null
}

const normalizarEstadosRoya = (data) => {
  const raw = unwrap(data)
  if (!raw) return []

  // Formato 1: array de objetos [{ nombre, cantidad, porcentaje }]
  if (Array.isArray(raw)) {
    return raw
      .filter((e) => e && (e.nombre || e.estado || e.tipo))
      .map((e) => {
        const nombre = normalizarNombreEstado(e.nombre || e.estado || e.tipo)
        return {
          nombre,
          count: Number(e.count ?? e.cantidad ?? e.total ?? e.valor ?? 0),
          pct: Number(e.pct ?? e.porcentaje ?? e.percent ?? 0),
          color: getColor(nombre),
        }
      })
  }

  // Formato 2: objeto con claves como sinRoya, conRoya, bajo, etc.
  const entries = Object.entries(raw).filter(([k]) => k.toLowerCase() !== 'total')
  const totalGeneral = Number(raw.total ?? raw.totalMonitoreos ?? raw.total_monitoreos ?? 0)

  const estados = entries.map(([key, val]) => {
    const nombre = normalizarNombreEstado(key)
    const count = typeof val === 'object'
      ? Number(val.count ?? val.cantidad ?? val.total ?? val.valor ?? 0)
      : Number(val ?? 0)
    return { nombre, count, pct: 0, color: getColor(nombre), key }
  })

  const total = totalGeneral || estados.reduce((s, e) => s + e.count, 0)
  if (total > 0) {
    estados.forEach((e) => { e.pct = (e.count / total) * 100 })
  }
  return estados
}

const normalizarTopFincas = (data) => {
  const arr = getArr(data)
  if (!arr.length) return []
  return arr
    .filter((f) => f && (f.nombre || f.nombreFinca || f.finca))
    .map((f) => ({
      id: f.idFinca ?? f.id_finca ?? f.id ?? 0,
      nombre: f.nombre || f.nombreFinca || f.finca || f.nombre_finca || 'Finca',
      cantidad: Number(f.cantidad ?? f.total ?? f.casos ?? f.count ?? f.monitoreos ?? 0),
      porcentaje: f.porcentaje ?? f.pct ?? f.percent ?? null,
    }))
    .filter((f) => f.cantidad > 0)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)
    .map((f, _, all) => ({
      ...f,
      porcentaje: f.porcentaje ?? (all[0].cantidad ? (f.cantidad / all[0].cantidad) * 100 : 0),
    }))
}

const esMonitoreoConRoya = (m) => {
  if (!m) return false
  const resultado = String(m.resultadoIA ?? m.resultado ?? m.observaciones ?? m.diagnostico ?? '').toLowerCase()
  const estado = String(m.estado ?? m.estado_monitoreo ?? m.estadoMonitoreo ?? '').toLowerCase()
  const severidad = String(m.severidad ?? m.nivelRoya ?? m.nivel_roya ?? m.gravedad ?? '').toLowerCase()
  const tieneRoya = m.tieneRoya ?? m.tiene_roya ?? m.conRoya ?? m.con_roya ?? null

  if (tieneRoya === true || tieneRoya === 1 || tieneRoya === '1') return true
  if (tieneRoya === false || tieneRoya === 0 || tieneRoya === '0') return false

  const palabrasRoya = ['roya', 'con roya', 'critico', 'critica', 'alto', 'medio', 'moderado', 'bajo', 'infeccion', 'enfermo']
  if (palabrasRoya.some((p) => resultado.includes(p) || estado.includes(p) || severidad.includes(p))) return true

  return false
}

const extraerNombreFinca = (m, mapaFincas = {}) => {
  if (!m) return null

  // Si finca es string, usarlo directamente
  if (typeof m.finca === 'string' && m.finca.trim()) return m.finca.trim()
  if (typeof m.nombreFinca === 'string' && m.nombreFinca.trim()) return m.nombreFinca.trim()

  // Buscar en objeto finca
  const fincaObj = m.finca || m.cultivo?.finca || m.cultivo || {}
  const nombre =
    fincaObj.nombreFinca ||
    fincaObj.nombre_finca ||
    fincaObj.nombre ||
    m.nombre_finca ||
    null

  if (nombre) return nombre

  // Buscar en mapa de fincas por id
  const id = Number(fincaObj.idFinca ?? fincaObj.id_finca ?? m.idFinca ?? m.id_finca ?? fincaObj.id ?? m.id)
  if (id && mapaFincas[id]) return mapaFincas[id]

  return null
}

const calcularTopFincasRoya = (monitoreos, mapaFincas = {}) => {
  const conteo = {}
  monitoreos.forEach((m) => {
    if (!esMonitoreoConRoya(m)) return

    const fincaObj = m.finca || m.cultivo?.finca || m.cultivo || {}
    const id = Number(fincaObj.idFinca ?? fincaObj.id_finca ?? m.idFinca ?? m.id_finca ?? fincaObj.id ?? m.id ?? 0)
    const nombreReal = extraerNombreFinca(m, mapaFincas)
    const nombre = nombreReal || (id ? `Finca #${id}` : 'Finca sin identificar')

    if (!conteo[id]) conteo[id] = { id, nombre, cantidad: 0 }
    conteo[id].cantidad += 1
  })

  const lista = Object.values(conteo)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)

  if (!lista.length) return []
  const max = lista[0].cantidad
  return lista.map((f) => ({
    ...f,
    porcentaje: max ? (f.cantidad / max) * 100 : 0,
  }))
}

const clasificarFincasPorEstado = (monitoreos, fincasMap = {}) => {
  const fincas = {}

  // Inicializar todas las fincas conocidas como Pendientes
  Object.entries(fincasMap).forEach(([id, nombre]) => {
    fincas[id] = { id: Number(id), nombre, estado: 'Pendientes', monitoreos: 0, ultimaFecha: null }
  })

  monitoreos.forEach((m) => {
    const fincaObj = m.finca || m.cultivo?.finca || m.cultivo || {}
    const id = Number(fincaObj.idFinca ?? fincaObj.id_finca ?? m.idFinca ?? m.id_finca ?? fincaObj.id ?? m.id ?? 0)
    if (!id) return

    if (!fincas[id]) {
      fincas[id] = { id, nombre: extraerNombreFinca(m, fincasMap) || `Finca #${id}`, estado: 'Sin roya', monitoreos: 0, ultimaFecha: null }
    }

    fincas[id].monitoreos += 1
    const fecha = m.fechaMonitoreo ?? m.fecha ?? m.fecha_monitoreo
    if (fecha && (!fincas[id].ultimaFecha || new Date(fecha) > new Date(fincas[id].ultimaFecha))) {
      fincas[id].ultimaFecha = fecha
    }

    if (esMonitoreoConRoya(m)) {
      fincas[id].estado = 'Con roya'
    }
  })

  return Object.values(fincas).sort((a, b) => {
    const orden = { 'Con roya': 0, 'Pendientes': 1, 'Sin roya': 2 }
    return orden[a.estado] - orden[b.estado] || b.monitoreos - a.monitoreos
  })
}

export default function Dashboard({ onNavigate }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const uid = user?.idUsuario ?? user?.id
  useNotificaciones(uid)
  const refetchKey = useRefetchGlobal()
  const [vistos, setVistos] = useState(() => {
    try {
      const saved = localStorage.getItem('dash_vistos')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

  const [kpis, setKpis] = useState(null)
  const [estadosRoya, setEstadosRoya] = useState(null)
  const [tendencia, setTendencia] = useState(null)
  const [actividad, setActividad] = useState([])
  const [monitoreos, setMonitoreos] = useState([])
  const [monitoreosCrudos, setMonitoreosCrudos] = useState([])
  const [fincasMap, setFincasMap] = useState({})
  const [topFincas, setTopFincas] = useState([])
  const [proximos, setProximos] = useState([])
  const [mapa, setMapa] = useState([])
  const [impacto, setImpacto] = useState(null)
  const [clock, setClock] = useState('')
  const [showReporteModal, setShowReporteModal] = useState(false)

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Bogota' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    localStorage.setItem('dash_vistos', JSON.stringify([...vistos]))
  }, [vistos])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.d-notif-wrapper')) setShowNotifDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [
        rKpi, rEst, rTen, rAct, rMon, rMonAll, rTop, rProx, rMap, rImp, rFincas
      ] = await Promise.all([
        api.get('/dashboard').catch(() => ({ data: null })),
        api.get('/dashboard/monitoreos-por-estado').catch(() => ({ data: null })),
        api.get('/dashboard/tendencia-roya').catch(() => ({ data: null })),
        api.get('/dashboard/actividad-reciente').catch(() => ({ data: [] })),
        api.get('/dashboard/monitoreos-recientes').catch(() => ({ data: [] })),
        api.get('/monitoreos', { params: { limit: 200 } }).catch(() => ({ data: [] })),
        api.get('/dashboard/top-fincas-roya').catch(() => ({ data: [] })),
        api.get('/dashboard/proximos-monitoreos').catch(() => ({ data: [] })),
        api.get('/dashboard/mapa-fincas').catch(() => ({ data: [] })),
        api.get('/dashboard/impacto').catch(() => ({ data: null })),
        api.get('/fincas').catch(() => ({ data: [] })),
      ])
      console.log('DEBUG /dashboard/monitoreos-por-estado:', rEst.data)
      console.log('DEBUG /dashboard/top-fincas-roya:', rTop.data)

      setKpis(rKpi.data)
      setEstadosRoya(normalizarEstadosRoya(rEst.data))
      setTendencia(rTen.data)
      setActividad(getArr(rAct.data))
      const a = getArr(rMonAll.data)
      const b = getArr(rMon.data)
      setMonitoreosCrudos(a)
      setMonitoreos(b.length > 0 ? b : a.map((m) => ({
        finca: m.finca?.nombreFinca || m.cultivo?.nombreFinca || m.nombreFinca || '—',
        lote: m.cultivo?.nombreCultivo || m.lote || '—',
        fecha: m.fechaMonitoreo ?? m.fecha ?? m.fecha_monitoreo,
        resultado: m.resultadoIA ?? m.resultado ?? m.observaciones ?? '',
        experto: m.usuario ? `${m.usuario.nombre || ''} ${m.usuario.apellido || ''}`.trim() : (m.experto || '—'),
        estado: m.estado ?? m.estado_monitoreo ?? 'Pendiente',
      })))
      const mapaData = getArr(rMap.data)
      const mapaFincas = {}

      // Primero llenar con /fincas (más completo)
      getArr(rFincas.data).forEach((f) => {
        const id = Number(f.idFinca ?? f.id)
        const nombre = f.nombreFinca || f.nombre_finca || f.nombre
        if (id && nombre) mapaFincas[id] = nombre
      })

      // Complementar con /dashboard/mapa-fincas
      mapaData.forEach((f) => {
        const id = Number(f.idFinca ?? f.id)
        if (id && f.nombreFinca && !mapaFincas[id]) mapaFincas[id] = f.nombreFinca
      })

      setFincasMap(mapaFincas)

      const topEndpoint = normalizarTopFincas(rTop.data)
      const topCalculado = calcularTopFincasRoya(a, mapaFincas)
      const topFinal = topEndpoint.length > 0 ? topEndpoint : topCalculado
      console.log('DEBUG top fincas (endpoint/calculado):', { endpoint: topEndpoint, calculado: topCalculado, final: topFinal })
      setTopFincas(topFinal)
      setProximos(getArr(rProx.data))
      setMapa(mapaData)
      setImpacto(rImp.data)
    } catch (e) {
      console.error('Error en dashboard:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData, refetchKey])

  const nav = (page) => onNavigate?.(page)

  const getId = (m) => m.idMonitoreo ?? m.id_monitoreo ?? m.id
  const noVistos = monitoreos.filter((m) => !vistos.has(getId(m)))
  const notifCount = noVistos.length

  const fmtFecha = (raw) => {
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

  const userName = user?.nombre || 'Admin'
  const userFull = [user?.nombre, user?.apellido].filter(Boolean).join(' ') || 'Admin Coffee'
  const rawRole = user?.rol?.nombreRol || user?.rol?.nombre_rol || 'administrador'
  const userRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1)

  /* ── Procesar estados de roya para la dona ── */
  const estadosArr = (estadosRoya || [])
    .filter((e) => e && e.count > 0)
    .sort((a, b) => ESTADO_ORDER.indexOf(a.nombre) - ESTADO_ORDER.indexOf(b.nombre))
  const totalMonitoreos = estadosArr.reduce((s, e) => s + e.count, 0)
  const hasEstados = estadosArr.length > 0

  /* ── Procesar mapa ── */
  const mapaFiltrado = mapa.filter((f) => f.latitud && f.longitud)

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner" />
        <p>Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">

      {/* ════════ A. HEADER ════════ */}
      <header className="d-header">
        <div className="d-header-left">

          <div className="d-greeting">
            <h1>Bienvenido de nuevo, {userName}</h1>
            <p>Aqu&iacute; tienes un resumen completo del estado de tu sistema CoffeeLife.</p>
          </div>
        </div>
        <div className="d-header-right">
          <div className="d-header-actions">
            <button className="d-icon-btn" onClick={() => nav('perfil')} title="Configuraci&oacute;n"><BiCog size={20} /></button>
            <div className="d-notif-wrapper" style={{ position: 'relative' }}>
              <button className="d-icon-btn d-notif-btn" onClick={() => setShowNotifDropdown(!showNotifDropdown)} title="Notificaciones">
                <BiBell size={20} /> {notifCount > 0 && <span className="d-notif-badge">{notifCount}</span>}
              </button>
              {showNotifDropdown && (
                <div className="d-notif-dropdown">
                  <div className="d-notif-header">
                    Últimos monitoreos
                    {notifCount > 0 && (
                      <button className="d-mark-read-btn" onClick={() => setVistos(new Set(monitoreos.map((m) => getId(m))))}>
                        Marcar todas leídas
                      </button>
                    )}
                  </div>
                  {monitoreos.length === 0 ? (
                    <div className="d-notif-empty">Sin monitoreos recientes</div>
                  ) : (
                    noVistos.slice(0, 10).map((m, i) => {
                      const mid = getId(m)
                      const experto = m.experto || 'Experto'
                      const finca = m.finca || `#${mid}`
                      return (
                        <div key={mid ?? i} className="d-notif-item" onClick={() => { setVistos((prev) => new Set([...prev, mid])); nav('monitoreos') }}>
                          <div className="d-notif-text">
                            <strong>{experto}</strong> hizo monitoreo en la finca <strong>{finca}</strong>
                          </div>
                          <div className="d-notif-time">{fmtFecha(m.fecha)}</div>
                        </div>
                      )
                    })
                  )}
                  {notifCount === 0 && monitoreos.length > 0 && (
                    <div className="d-notif-empty">Todas las notificaciones vistas</div>
                  )}
                </div>
              )}
            </div>
            <div className="d-user-profile" onClick={() => nav('perfil')}>
              <div className="d-avatar">
                {user?.fotoPerfil ? (
                  <img src={user.fotoPerfil} alt="" className="d-avatar-img" />
                ) : (
                  userFull.charAt(0).toUpperCase()
                )}
              </div>
              <div className="d-user-info">
                <span className="d-user-name">{userFull}</span>
                <span className="d-user-role">{userRole}</span>
              </div>
            </div>
          </div>
          <div className="d-date-picker">
            <BiCalendar size={14} /> {new Date().toLocaleDateString('es-CO', {
              day: 'numeric', month: 'short', year: 'numeric'
            })} <span className="d-clock">{clock}</span>
          </div>
        </div>
      </header>

      {/* ════════ B. KPIS ════════ */}
      <section className="d-kpis">
        {[
          { key: 'fincasActivas', icon: <BiBuildings size={22} />, label: 'Fincas activas', bg: 'kpi-green' },
          { key: 'expertosActivos', icon: <BiUser size={22} />, label: 'Expertos activos', bg: 'kpi-orange' },
          { key: 'cafeterosActivos', icon: <BiCoffee size={22} />, label: 'Caficultores activos', bg: 'kpi-brown' },
          { key: 'monitoreosEsteMes', icon: <BiCalendar size={22} />, label: 'Monitoreos este mes', bg: 'kpi-blue' },
        ].map((k) => {
          const d = kpis?.[k.key] || {}
          return (
            <div className="d-kpi-card" key={k.key}>
              <div className={`d-kpi-icon ${k.bg}`}>{k.icon}</div>
              <div className="d-kpi-body">
                <span className="d-kpi-value">{d.total ?? 0}</span>
                <span className="d-kpi-label">{k.label}</span>
                <span className="d-kpi-trend"><BiTrendingUp size={12} /> {d.variacionPorcentual ?? d.trend ?? '0%'}</span>
              </div>
            </div>
          )
        })}
      </section>

      {/* ════════ C. BLOQUE CENTRAL (3 COLUMNAS) ════════ */}
      <section className="d-central">

        {/* C1 ── Dona ── */}
        <div className="d-block">
          <h3>Monitoreo por estado</h3>
          <div className="d-dona-wrapper">
            <div className="d-dona">
              {hasEstados ? (
                <div className="dona-chart-side">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={estadosArr}
                        dataKey="count"
                        nameKey="nombre"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        stroke="none"
                      >
                        {estadosArr.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name) => [`${value} monitoreos`, name]}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="dona-total-badge">
                    <span className="dona-total-num">{totalMonitoreos}</span>
                    <span className="dona-total-label">Total</span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#999' }}>0</span>
                  <span style={{ fontSize: 12, color: '#999' }}>Total</span>
                </div>
              )}
            </div>
            <div className="d-dona-legend">
              {!hasEstados && (
                <div className="d-legend-item">
                  <span className="d-dot" style={{ background: '#ccc' }} />
                  <span>Sin datos</span>
                </div>
              )}
              {estadosArr.map((e) => {
                const pct = totalMonitoreos > 0 ? (e.count / totalMonitoreos) * 100 : e.pct
                return (
                  <div key={e.nombre} className="d-legend-item">
                    <span className="d-dot" style={{ background: e.color }} />
                    <span>{e.nombre} <strong>{pct.toFixed(1)}% ({e.count})</strong></span>
                  </div>
                )
              })}
            </div>
          </div>
          <button className="d-block-link" onClick={() => setShowReporteModal(true)}>
            Ver reporte completo <BiRightArrow size={12} />
          </button>
        </div>

        {/* C2 ── Líneas ── */}
        <div className="d-block">
          <h3>Tendencia de roya (&uacute;ltimos 7 d&iacute;as)</h3>
          <div className="d-line-chart">
            <div className="d-line-indicators">
              <span className="d-line-dot" style={{ color: '#2e7d32' }}>&#9679; Sin roya</span>
              <span className="d-line-dot" style={{ color: '#d32f2f' }}>&#9679; Con roya</span>
              <span className="d-line-dot" style={{ color: '#f57c00' }}>&#9679; Pendientes</span>
            </div>
            <svg viewBox="0 0 400 150" className="d-svg">
              <line x1="0" y1="30" x2="400" y2="30" stroke="#f0f0f0" />
              <line x1="0" y1="70" x2="400" y2="70" stroke="#f0f0f0" />
              <line x1="0" y1="110" x2="400" y2="110" stroke="#f0f0f0" />
              <path d="M 20 80 Q 80 50, 140 70 T 260 40 T 380 70" fill="none" stroke="#2e7d32" strokeWidth="3" />
              <path d="M 20 120 Q 80 110, 140 120 T 260 100 T 380 115" fill="none" stroke="#d32f2f" strokeWidth="3" />
              <path d="M 20 140 Q 80 135, 140 130 T 260 132 T 380 138" fill="none" stroke="#f57c00" strokeWidth="3" />
            </svg>
            <div className="d-line-days">
              {tendencia?.dias?.map((d, i) => <span key={i}>{d?.diaSemana || d?.fecha || d}</span>) ?? (
                <><span>Lun</span><span>Mar</span><span>Mi&eacute;</span><span>Jue</span><span>Vie</span><span>S&aacute;b</span><span>Dom</span></>
              )}
            </div>
          </div>
          <button className="d-block-link" onClick={() => nav('monitoreos')}>
            Ver más estadísticas <BiRightArrow size={12} />
          </button>
        </div>

        {/* C3 ── Actividad ── */}
        <div className="d-block">
          <h3>Actividad reciente</h3>
          <div className="d-activity-list">
            {actividad.length === 0 && (
              <div className="d-activity-item">
                <span className="d-activity-icon" style={{ background: '#f5f5f5' }}><BiBell size={16} /></span>
                <div className="d-activity-body">
                  <h4>Sin actividad reciente</h4>
                  <p>Los eventos aparecer&aacute;n aqu&iacute;.</p>
                </div>
              </div>
            )}
            {actividad.map((a, i) => (
              <div key={a.id ?? i} className="d-activity-item">
                <span className="d-activity-icon">{a.icon ? <span dangerouslySetInnerHTML={{ __html: a.icon }} /> : <BiBell size={16} />}</span>
                <div className="d-activity-body">
                  <h4>{a.titulo}</h4>
                  <p>{a.detalle}</p>
                </div>
                <span className="d-activity-time">{a.tiempo}</span>
              </div>
            ))}
          </div>
          <button className="d-block-link" onClick={() => nav('monitoreos')}>
            Ver toda la actividad <BiRightArrow size={12} />
          </button>
        </div>
      </section>

      {/* ════════ D. BLOQUE INFERIOR (2 COLUMNAS) ════════ */}
      <section className="d-bottom">

        {/* D1 ── Tabla ── */}
        <div className="d-block d-block-wide">
          <h3>Monitoreos recientes</h3>
          <div className="d-table-wrap">
            <table className="d-table">
              <thead>
                <tr>
                  <th>FINCA</th>
                  <th>LOTE</th>
                  <th>FECHA</th>
                  <th>RESULTADO IA</th>
                  <th>EXPERTO</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {monitoreos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="d-table-empty">No hay monitoreos recientes</td>
                  </tr>
                ) : monitoreos.map((m, i) => {
                  const resultado = m.resultado || ''
                  const isSano = resultado.toLowerCase().includes('sin') || resultado.toLowerCase().includes('sano')
                  return (
                    <tr key={m.id ?? i}>
                      <td className="d-td-finca">
                        <BiBuildings size={16} /> {m.finca}
                      </td>
                      <td>{m.lote}</td>
                      <td className="d-td-date">{fmtFecha(m.fecha)}</td>
                      <td>
                        <span className={`d-badge ${isSano ? 'd-badge-green' : 'd-badge-red'}`}>
                          {resultado}
                        </span>
                      </td>
                      <td>{m.experto}</td>
                      <td>
                        <span className={`d-badge ${
                          (m.estado || '').toLowerCase().includes('revisado') ? 'd-badge-green' :
                          (m.estado || '').toLowerCase().includes('tratamiento') ? 'd-badge-blue' : 'd-badge-orange'
                        }`}>
                          {m.estado}
                        </span>
                      </td>
                      <td>
                        <button className="d-action-btn" onClick={() => nav('monitoreos')} title="Ver detalle"><BiShow size={14} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button className="d-block-link center" onClick={() => nav('monitoreos')}>
            Ver todos los monitoreos <BiRightArrow size={12} />
          </button>
        </div>

        {/* D2 ── Sidebar ── */}
        <div className="d-side-stack">

          {/* Top 5 */}
          <div className="d-block">
            <h3>Top 5 fincas con m&aacute;s roya</h3>
            <div className="d-top-list">
              {topFincas.length === 0 ? (
                <div className="d-top-row"><span style={{ color: '#999' }}>Sin datos</span></div>
              ) : topFincas.map((f, i) => (
                <div key={i} className="d-top-row">
                  <span className="d-top-name">{f.nombre}</span>
                  <div className="d-progress-track">
                    <div className="d-progress-fill" style={{ width: `${f.porcentaje ?? (f.cantidad * 5)}%` }} />
                  </div>
                  <span className="d-top-count">{f.cantidad}</span>
                </div>
              ))}
            </div>
            <button className="d-block-link" onClick={() => nav('fincas')}>
              Ver reporte completo <BiRightArrow size={12} />
            </button>
          </div>

          {/* Próximos */}
          <div className="d-block">
            <h3>Pr&oacute;ximos monitoreos programados</h3>
            <div className="d-prox-list">
              {proximos.length === 0 ? (
                <div className="d-prox-item">
                  <BiCalendar size={16} />
                  <span style={{ color: '#999' }}>Sin pr&oacute;ximos monitoreos</span>
                </div>
              ) : proximos.map((p, i) => {
                const etiq = (p.etiqueta || '').toLowerCase()
                return (
                  <div key={i} className="d-prox-item">
                    <div className="d-prox-left">
                      <BiCalendar size={16} />
                      <div className="d-prox-info">
                        <h4>{p.finca}</h4>
                        <p>{p.fecha}</p>
                      </div>
                    </div>
                    <span className={`d-tag ${etiq === 'hoy' ? 'd-tag-green' : etiq === 'mañana' || etiq === 'manana' ? 'd-tag-orange' : 'd-tag-gray'}`}>
                      {p.etiqueta}
                    </span>
                  </div>
                )
              })}
            </div>
            <button className="d-block-link" onClick={() => nav('monitoreos')}>
              Ver calendario completo <BiRightArrow size={12} />
            </button>
          </div>

        </div>
      </section>

      {/* ════════ E. BLOQUE DE CIERRE ════════ */}
      <section className="d-footer">

        {/* E1 ── Mapa ── */}
        <div className="d-block">
          <h3>Mapa de fincas</h3>
          <div className="map-wrapper" style={{ height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
            {mapaFiltrado.length > 0 ? (
              <MapContainer
                center={[mapaFiltrado[0].latitud, mapaFiltrado[0].longitud]}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                {mapaFiltrado.map((f) => (
                  <Marker
                    key={f.idFinca}
                    position={[parseFloat(f.latitud), parseFloat(f.longitud)]}
                  >
                    <Tooltip direction="top" offset={[0, -10]} permanent={false}>
                      <div className="map-tooltip-content">
                        <strong>{f.nombreFinca}</strong><br />
                        Estado: {f.estado || '—'}{f.severidad ? ` · Severidad: ${f.severidad}` : ''}
                      </div>
                    </Tooltip>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                Sin datos de ubicación
              </div>
            )}
          </div>
        </div>

        {/* E2 ── Impacto ── */}
        <div className="d-block">
          <h3>Impacto del sistema</h3>
          <div className="d-impact-grid">
            {[
              { icon: <BiLeaf size={20} />, value: impacto?.reduccionPerdida ?? '0%', desc: 'Reducción de pérdida en cultivos' },
              { icon: <BiDroplet size={20} />, value: impacto?.ahorroFungicidas ?? '0%', desc: 'Ahorro en uso de fungicidas' },
              { icon: <BiBarChart size={20} />, value: impacto?.incrementoProductividad ?? '0%', desc: 'Incremento en la productividad' },
              { icon: <BiBuildings size={20} />, value: impacto?.hectareasProtegidas ?? 0, desc: 'Hectáreas protegidas este mes' },
            ].map((item, i) => (
              <div key={i} className="d-impact-item">
                <span className="d-impact-icon">{item.icon}</span>
                <div className="d-impact-body">
                  <span className="d-impact-value">{item.value}</span>
                  <span className="d-impact-desc">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* MODAL REPORTE DE ESTADOS */}
      {showReporteModal && (
        <div className="d-modal-overlay" onClick={() => setShowReporteModal(false)}>
          <div className="d-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="d-modal-header">
              <h3>Reporte de fincas por estado</h3>
              <button className="d-modal-close" onClick={() => setShowReporteModal(false)}><BiX size={20} /></button>
            </div>
            <div className="d-modal-body">
              {(() => {
                const filas = clasificarFincasPorEstado(monitoreosCrudos, fincasMap)
                if (filas.length === 0) {
                  return <div className="d-modal-empty">No hay fincas para clasificar.</div>
                }
                return (
                  <div className="d-modal-table-wrap">
                    <table className="d-modal-table">
                      <thead>
                        <tr>
                          <th>FINCA</th>
                          <th>ESTADO</th>
                          <th>MONITOREOS</th>
                          <th>ÚLTIMO MONITOREO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filas.map((f) => (
                          <tr key={f.id}>
                            <td className="d-modal-finca">{f.nombre}</td>
                            <td>
                              <span className={`d-modal-estado d-modal-estado--${f.estado.toLowerCase().replace(/\s+/g, '-')}`}>
                                {f.estado}
                              </span>
                            </td>
                            <td>{f.monitoreos}</td>
                            <td>{f.ultimaFecha ? fmtFecha(f.ultimaFecha) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
