import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../services/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import './dashboard.css'

const ESTADO_COLORS = {
  Sano: '#2e7d32',
  Bajo: '#fbc02d',
  Medio: '#f57c00',
  Alto: '#d32f2f',
  Critico: '#6a1b9a',
}
const ESTADO_ORDER = ['Sano', 'Bajo', 'Medio', 'Alto', 'Critico']

const normalizeData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (data && typeof data === 'object') {
    const { total, ...rest } = data
    return { total, estados: rest }
  }
  return []
}

const getArr = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

export default function Dashboard({ onNavigate }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  const [kpis, setKpis] = useState(null)
  const [estadosRoya, setEstadosRoya] = useState(null)
  const [tendencia, setTendencia] = useState(null)
  const [actividad, setActividad] = useState([])
  const [monitoreos, setMonitoreos] = useState([])
  const [topFincas, setTopFincas] = useState([])
  const [proximos, setProximos] = useState([])
  const [mapa, setMapa] = useState([])
  const [impacto, setImpacto] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const [
          rKpi, rEst, rTen, rAct, rMon, rTop, rProx, rMap, rImp
        ] = await Promise.all([
          api.get('/dashboard').catch(() => ({ data: null })),
          api.get('/dashboard/monitoreos-por-estado').catch(() => ({ data: null })),
          api.get('/dashboard/tendencia-roya').catch(() => ({ data: null })),
          api.get('/dashboard/actividad-reciente').catch(() => ({ data: [] })),
          api.get('/dashboard/monitoreos-recientes').catch(() => ({ data: [] })),
          api.get('/dashboard/top-fincas-roya').catch(() => ({ data: [] })),
          api.get('/dashboard/proximos-monitoreos').catch(() => ({ data: [] })),
          api.get('/dashboard/mapa-fincas').catch(() => ({ data: [] })),
          api.get('/dashboard/impacto').catch(() => ({ data: null })),
        ])
        setKpis(rKpi.data)
        setEstadosRoya(rEst.data)
        setTendencia(rTen.data)
        setActividad(getArr(rAct.data))
        setMonitoreos(getArr(rMon.data))
        setTopFincas(getArr(rTop.data))
        setProximos(getArr(rProx.data))
        setMapa(getArr(rMap.data))
        setImpacto(rImp.data)
      } catch (e) {
        console.error('Error en dashboard:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const nav = (page) => onNavigate?.(page)

  const userName = user?.nombre || 'Admin'
  const userFull = [user?.nombre, user?.apellido].filter(Boolean).join(' ') || 'Admin Coffee'
  const rawRole = user?.rol?.nombreRol || user?.rol?.nombre_rol || 'administrador'
  const userRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1)

  /* ── Procesar estados de roya para la dona ── */
  const estadosArr = (() => {
    if (!estadosRoya) return []
    const norm = normalizeData(estadosRoya)
    if (Array.isArray(norm)) {
      return norm
        .filter((e) => e)
        .map((e) => ({
          nombre: e.nombre || Object.keys(ESTADO_COLORS).find((k) => k.toLowerCase().includes((e.nombre || '').toLowerCase())) || 'Sano',
          count: e.count ?? e.cantidad ?? 0,
          pct: e.pct ?? e.porcentaje ?? 0,
          color: ESTADO_COLORS[e.nombre] || '#999',
        }))
    }
    if (norm.estados) {
      return Object.entries(norm.estados).map(([key, val]) => {
        const nombre = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
        return {
          nombre: ESTADO_ORDER.find((e) => e.toLowerCase() === key.toLowerCase()) || nombre,
          count: val.count ?? val.cantidad ?? val ?? 0,
          pct: val.pct ?? val.porcentaje ?? 0,
          color: ESTADO_COLORS[ESTADO_ORDER.find((e) => e.toLowerCase() === key.toLowerCase())] || '#999',
        }
      })
    }
    return []
  })()
  const totalMonitoreos = estadosRoya?.total ?? estadosArr.reduce((s, e) => s + e.count, 0)
  const hasEstados = estadosArr.length > 0

  /* ── Procesar mapa ── */
  const hasMapa = mapa.length > 0
  const defaultPins = [
    { top: '30%', left: '20%', tipo: 'Sano' },
    { top: '50%', left: '45%', tipo: 'Bajo' },
    { top: '75%', left: '60%', tipo: 'Alto' },
    { top: '20%', left: '70%', tipo: 'Medio' },
    { top: '60%', left: '15%', tipo: 'Critico' },
  ]
  const mapPins = hasMapa ? mapa : defaultPins

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
          <div className="d-search">
            <span className="d-search-icon">&#128269;</span>
            <input type="text" placeholder="Buscar monitoreos, fincas, usuarios..." />
          </div>
          <div className="d-greeting">
            <h1>&iexcl;Hola, {userName}! &#128075;</h1>
            <p>Aqu&iacute; tienes un resumen completo del estado de tu sistema CoffeeLife.</p>
          </div>
        </div>
        <div className="d-header-right">
          <div className="d-header-actions">
            <button className="d-icon-btn" onClick={() => nav('perfil')} title="Configuraci&oacute;n">&#9881;</button>
            <button className="d-icon-btn d-notif-btn" onClick={() => nav('monitoreos')} title="Notificaciones">
              &#128276; <span className="d-notif-badge">3</span>
            </button>
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
            &#128197; {new Date().toLocaleDateString('es-CO', {
              day: 'numeric', month: 'short', year: 'numeric'
            })} <span className="d-arrow">&#9660;</span>
          </div>
        </div>
      </header>

      {/* ════════ B. KPIS ════════ */}
      <section className="d-kpis">
        {[
          { key: 'fincasActivas', icon: '&#127793;', label: 'Fincas activas', bg: 'kpi-green' },
          { key: 'expertosActivos', icon: '&#128101;', label: 'Expertos activos', bg: 'kpi-orange' },
          { key: 'caficultoresActivos', icon: '&#9749;', label: 'Caficultores activos', bg: 'kpi-brown' },
          { key: 'monitoreosMes', icon: '&#128197;', label: 'Monitoreos este mes', bg: 'kpi-blue' },
        ].map((k) => {
          const d = kpis?.[k.key] || {}
          return (
            <div className="d-kpi-card" key={k.key}>
              <div className={`d-kpi-icon ${k.bg}`} dangerouslySetInnerHTML={{ __html: k.icon }} />
              <div className="d-kpi-body">
                <span className="d-kpi-value">{d.total ?? 0}</span>
                <span className="d-kpi-label">{k.label}</span>
                <span className="d-kpi-trend">&uarr; {d.trend ?? '0%'}</span>
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
                    <Tooltip
                      formatter={(value, name) => [`${value} monitoreos`, name]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
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
              {estadosArr.map((e) => (
                <div key={e.nombre} className="d-legend-item">
                  <span className="d-dot" style={{ background: e.color }} />
                  <span>{e.nombre} <strong>{e.pct.toFixed(1)}% ({e.count})</strong></span>
                </div>
              ))}
            </div>
          </div>
          <button className="d-block-link" onClick={() => nav('monitoreos')}>
            Ver reporte completo &rarr;
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
            Ver m&aacute;s estad&iacute;sticas &rarr;
          </button>
        </div>

        {/* C3 ── Actividad ── */}
        <div className="d-block">
          <h3>Actividad reciente</h3>
          <div className="d-activity-list">
            {actividad.length === 0 && (
              <div className="d-activity-item">
                <span className="d-activity-icon" style={{ background: '#f5f5f5' }}>&#128276;</span>
                <div className="d-activity-body">
                  <h4>Sin actividad reciente</h4>
                  <p>Los eventos aparecer&aacute;n aqu&iacute;.</p>
                </div>
              </div>
            )}
            {actividad.map((a, i) => (
              <div key={a.id ?? i} className="d-activity-item">
                <span className="d-activity-icon">{a.icon ?? '&#128276;'}</span>
                <div className="d-activity-body">
                  <h4>{a.titulo}</h4>
                  <p>{a.detalle}</p>
                </div>
                <span className="d-activity-time">{a.tiempo}</span>
              </div>
            ))}
          </div>
          <button className="d-block-link" onClick={() => nav('monitoreos')}>
            Ver toda la actividad &rarr;
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
                        <span>&#127795;</span> {m.finca}
                      </td>
                      <td>{m.lote}</td>
                      <td className="d-td-date">{m.fecha}</td>
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
                        <button className="d-action-btn" onClick={() => nav('monitoreos')} title="Ver detalle">&#128065;</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button className="d-block-link center" onClick={() => nav('monitoreos')}>
            Ver todos los monitoreos &rarr;
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
              Ver reporte completo &rarr;
            </button>
          </div>

          {/* Próximos */}
          <div className="d-block">
            <h3>Pr&oacute;ximos monitoreos programados</h3>
            <div className="d-prox-list">
              {proximos.length === 0 ? (
                <div className="d-prox-item">
                  <span>&#128197;</span>
                  <span style={{ color: '#999' }}>Sin pr&oacute;ximos monitoreos</span>
                </div>
              ) : proximos.map((p, i) => {
                const etiq = (p.etiqueta || '').toLowerCase()
                return (
                  <div key={i} className="d-prox-item">
                    <div className="d-prox-left">
                      <span>&#128197;</span>
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
              Ver calendario completo &rarr;
            </button>
          </div>

        </div>
      </section>

      {/* ════════ E. BLOQUE DE CIERRE ════════ */}
      <section className="d-footer">

        {/* E1 ── Mapa ── */}
        <div className="d-block">
          <h3>Mapa de fincas</h3>
          <div className="d-map-container">
            <div className="d-map">
              {mapPins.map((pin, i) => {
                const tipo = pin.tipo || pin.estado || 'Sano'
                const pinColor = ESTADO_COLORS[tipo] || '#999'
                return (
                  <div
                    key={i}
                    className="d-map-pin"
                    style={{ top: pin.top, left: pin.left, color: pinColor }}
                    title={pin.nombreFinca || pin.nombre || tipo}
                  >
                    &#128205;
                  </div>
                )
              })}
            </div>
            <div className="d-map-legend">
              {ESTADO_ORDER.map((e) => (
                <div key={e} className="d-map-legend-item">
                  <span className="d-map-dot" style={{ background: ESTADO_COLORS[e] }} />
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* E2 ── Impacto ── */}
        <div className="d-block">
          <h3>Impacto del sistema</h3>
          <div className="d-impact-grid">
            {[
              { icon: '&#127811;', value: impacto?.reduccionPerdida ?? '0%', desc: 'Reducci&oacute;n de p&eacute;rdida en cultivos' },
              { icon: '&#128167;', value: impacto?.ahorroFungicidas ?? '0%', desc: 'Ahorro en uso de fungicidas' },
              { icon: '&#128200;', value: impacto?.incrementoProductividad ?? '0%', desc: 'Incremento en la productividad' },
              { icon: '&#127794;', value: impacto?.hectareasProtegidas ?? 0, desc: 'Hect&aacute;reas protegidas este mes' },
            ].map((item, i) => (
              <div key={i} className="d-impact-item">
                <span className="d-impact-icon" dangerouslySetInnerHTML={{ __html: item.icon }} />
                <div className="d-impact-body">
                  <span className="d-impact-value">{item.value}</span>
                  <span className="d-impact-desc" dangerouslySetInnerHTML={{ __html: item.desc }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

    </div>
  )
}
