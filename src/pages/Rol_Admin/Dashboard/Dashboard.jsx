import { useEffect, useState } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { BiBuildings, BiUser, BiGroup, BiListUl, BiCog, BiDroplet, BiCalendar } from 'react-icons/bi'
import CoffeePriceCard from '../../../components/CoffeePriceCard'
import Loading from '../../../components/Loading'
import './Dashboard.css'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const quickLinks = [
  { icon: <BiListUl size={20} />, label: 'Gestión de Fincas', desc: 'Administrar fincas registradas', color: '#eef6e9', page: 'fincas' },
  { icon: <BiDroplet size={20} />, label: 'Insumos agrícolas', desc: 'Gestiona fertilizantes y más', color: '#eef6e9', page: 'insumos' },
  { icon: <BiCog size={20} />, label: 'Configura tus categorías', desc: 'Categorías y parámetros', color: '#eef6e9', page: 'categorias' },
]

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const safeDate = (val) => {
  if (!val) return null
  const d = val.includes('T') ? new Date(val) : new Date(val + 'T12:00:00')
  return isNaN(d) ? null : d
}

const fmtFecha = (val) => {
  const d = safeDate(val)
  return d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '—'
}

function BarChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.val), 1)
  const total = data.reduce((s, d) => s + d.val, 0)

  const barW = 40
  const gap = 24
  const chartH = 210
  const padLeft = 38
  const padRight = 16
  const padTop = 32
  const padBottom = 32
  const w = padLeft + data.length * (barW + gap) - gap + padRight
  const drawH = chartH - padTop - padBottom

  const yTicks = []
  const tickCount = 4
  for (let i = 0; i <= tickCount; i++) {
    yTicks.push(Math.round((maxVal / tickCount) * i))
  }

  return (
    <div className="db-chart-container">
      <div className="db-chart-total">{total} monitoreo{total !== 1 ? 's' : ''} en total</div>
      <svg width="100%" viewBox={`0 0 ${Math.max(w, 300)} ${chartH}`} style={{ display: 'block' }}>
        {/* Líneas de referencia horizontal y etiquetas del eje Y */}
        {yTicks.map((tick, i) => {
          const y = chartH - padBottom - (tick / maxVal) * drawH
          return (
            <g key={i}>
              <line x1={padLeft - 6} y1={y} x2={padLeft + data.length * (barW + gap) - gap + 4} y2={y}
                stroke={i === 0 ? '#d1d5db' : '#f0f0f0'} strokeWidth={i === 0 ? 1.5 : 1} />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af" fontFamily="Lato, sans-serif">
                {tick}
              </text>
            </g>
          )
        })}
        {/* Barras */}
        {data.map((d, i) => {
          const barH = maxVal > 0 ? (d.val / maxVal) * drawH : 0
          const x = padLeft + i * (barW + gap)
          const y = chartH - padBottom - barH
          return (
            <g key={i}>
              <title>{d.label}: {d.val} monitoreo{d.val !== 1 ? 's' : ''}</title>
              {/* Barra */}
              <rect x={x} y={y} width={barW} height={Math.max(barH, 0)} rx={5} ry={5}
                fill={barH > 0 ? '#2e7d32' : '#f3f4f6'} opacity={barH > 0 ? 0.88 : 1}
                style={{ transition: 'opacity 0.25s' }}
                onMouseEnter={(e) => e.target.setAttribute('opacity', '1')}
                onMouseLeave={(e) => e.target.setAttribute('opacity', barH > 0 ? '0.88' : '1')} />
              {/* Valor encima */}
              {barH > 0 && (
                <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill="#2e7d32" fontFamily="Lato, sans-serif">
                  {d.val}
                </text>
              )}
              {/* Etiqueta del mes */}
              <text x={x + barW / 2} y={chartH - 8} textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="Lato, sans-serif" fontWeight="500">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function UltimosMonitoreos({ monitoreos, fincaMap }) {
  if (!monitoreos.length) {
    return <p className="db-empty">No hay monitoreos registrados.</p>
  }
  return (
    <div className="db-table-wrap">
      <table className="db-table">
        <thead>
          <tr>
            <th>Finca</th>
            <th>Cultivo</th>
            <th>Fecha</th>
            <th>Experto</th>
          </tr>
        </thead>
        <tbody>
          {monitoreos.slice(0, 5).map((m) => {
            const finca = fincaMap[m.cultivo?.idFinca]
            const expNombre = m.usuario ? `${m.usuario.nombre || ''} ${m.usuario.apellido || ''}`.trim() : '—'
            return (
              <tr key={m.idMonitoreo ?? m.id_monitoreo}>
                <td className="db-td-finca">{finca?.nombreFinca || '—'}</td>
                <td>{m.cultivo?.nombreCultivo || '—'}</td>
                <td className="db-td-fecha">
                  <BiCalendar size={12} />
                  {fmtFecha(m.fechaMonitoreo ?? m.fecha_monitoreo)}
                </td>
                <td>{expNombre}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Dashboard({ onNavigate }) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    fincas: 0,
    fincasConUbicacion: 0,
    expertosActivos: 0,
    expertosInactivos: 0,
    cafeterosActivos: 0,
    monEsteMes: 0,
  })
  const [chartData, setChartData] = useState([])
  const [latestMonitoreos, setLatestMonitoreos] = useState([])
  const [fincaMap, setFincaMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError('')
      try {
        const [fincasRes, expertosRes, cafeterosRes, monitoreosRes] = await Promise.allSettled([
          api.get('/fincas'),
          api.get('/expertos'),
          api.get('/cafeteros'),
          api.get('/monitoreos'),
        ])

        // Fincas
        const fincas = fincasRes.status === 'fulfilled' ? getArrayData(fincasRes.value.data) : []
        const fincasConUbicacion = fincas.filter((f) => f.latitud && f.longitud).length
        const fMap = {}
        fincas.forEach((f) => { fMap[f.idFinca] = f })
        setFincaMap(fMap)

        // Expertos
        const expertosData = expertosRes.status === 'fulfilled' ? getArrayData(expertosRes.value.data) : []
        const expertosActivos = expertosData.filter((e) => {
          const a = e.activo
          return a === undefined || a === null || a === true || a === 1 || a === '1' || a === 'true'
        }).length
        const expertosInactivos = expertosData.length - expertosActivos

        // Cafeteros
        const cafeterosData = cafeterosRes.status === 'fulfilled' ? getArrayData(cafeterosRes.value.data) : []
        const cafeterosActivos = cafeterosData.filter((e) => {
          const a = e.activo
          return a === undefined || a === null || a === true || a === 1 || a === '1' || a === 'true'
        }).length

        // Monitoreos
        const todosMonitoreos = monitoreosRes.status === 'fulfilled' ? getArrayData(monitoreosRes.value.data) : []
        const ahora = new Date()

        // Agrupar por mes (últimos 6)
        const mesesArr = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
          mesesArr.push({ label: MONTHS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() })
        }
        const mesesMap = mesesArr.map((m) => ({
          ...m,
          val: todosMonitoreos.filter((mon) => {
            const f = mon.fechaMonitoreo ?? mon.fecha_monitoreo
            const fd = safeDate(f)
            return fd && fd.getMonth() === m.month && fd.getFullYear() === m.year
          }).length,
        }))
        setChartData(mesesMap)

        // Últimos 5 monitoreos
        const sorted = [...todosMonitoreos].sort((a, b) => {
          const fa = safeDate(a.fechaMonitoreo ?? a.fecha_monitoreo)
          const fb = safeDate(b.fechaMonitoreo ?? b.fecha_monitoreo)
          if (!fa && !fb) return 0
          if (!fa) return 1
          if (!fb) return -1
          return fb - fa
        })
        setLatestMonitoreos(sorted.slice(0, 5))

        // Monitoreos este mes
        const monEsteMes = todosMonitoreos.filter((mon) => {
          const fd = safeDate(mon.fechaMonitoreo ?? mon.fecha_monitoreo)
          return fd && fd.getMonth() === ahora.getMonth() && fd.getFullYear() === ahora.getFullYear()
        }).length

        setStats({
          fincas: fincas.length,
          fincasConUbicacion,
          expertosActivos,
          expertosInactivos,
          cafeterosActivos,
          monEsteMes,
        })
      } catch (err) {
        setError('No se pudieron cargar los datos del dashboard.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <div className="dashboard">
      {loading && <Loading type="overlay" text="Cargando dashboard..." />}

      <div className="welcome-banner-text animate-left">
        <div className="welcome-banner-row">
          <div className="welcome-avatar-sm">
            {user?.fotoPerfil ? (
              <img src={user.fotoPerfil} alt="avatar" className="welcome-avatar-img-sm" />
            ) : (
              <BiUser size={20} />
            )}
          </div>
          <div>
            <h1 className="welcome-main-title">¡Hola, {user?.nombre || 'Admin'}!</h1>
            <p className="welcome-subtitle">Panel de monitoreo agrícola — CoffeeLife</p>
          </div>
        </div>
      </div>

      {/* ─── KPIs ─── */}
      <div className="header-kpi-cards-wrapper">
        <div className="kpi-card-item">
          <div className="kpi-icon-container fincas-kpi">
            <BiBuildings size={20} />
          </div>
          <div className="kpi-data-text">
            <span className="kpi-number-val">{loading ? '...' : stats.fincas}</span>
            <span className="kpi-label-name">Fincas activas</span>
          </div>
        </div>
        <div className="kpi-card-item">
          <div className="kpi-icon-container expertos-kpi">
            <BiGroup size={20} />
          </div>
          <div className="kpi-data-text">
            <span className="kpi-number-val">{loading ? '...' : stats.expertosActivos}</span>
            <span className="kpi-label-name">Expertos activos</span>
          </div>
        </div>
        <div className="kpi-card-item">
          <div className="kpi-icon-container" style={{ background: '#fef3e2', color: '#d97706' }}>
            <BiUser size={20} />
          </div>
          <div className="kpi-data-text">
            <span className="kpi-number-val">{loading ? '...' : stats.cafeterosActivos}</span>
            <span className="kpi-label-name">Cafeteros activos</span>
          </div>
        </div>
        <div className="kpi-card-item">
          <div className="kpi-icon-container" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <BiCalendar size={20} />
          </div>
          <div className="kpi-data-text">
            <span className="kpi-number-val">{loading ? '...' : stats.monEsteMes ?? 0}</span>
            <span className="kpi-label-name">Monitoreos este mes</span>
          </div>
        </div>
        <CoffeePriceCard />
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {/* ─── Gráfica + Últimos monitoreos ─── */}
      <div className="db-row-duo">
        <div className="db-chart-section">
          <h2 className="db-section-title">Monitoreos por mes</h2>
          <div className="db-chart-card">
            <BarChart data={chartData} />
          </div>
        </div>

        <div className="db-recent-section">
          <h2 className="db-section-title">Últimos monitoreos</h2>
          <UltimosMonitoreos monitoreos={latestMonitoreos} fincaMap={fincaMap} />
        </div>
      </div>

      {/* ─── Accesos rápidos ─── */}
      <div className="db-quick-section">
        <h2 className="db-section-title">Accesos rápidos</h2>
        <div className="db-quick-grid">
          {quickLinks.map((link, idx) => (
            <div key={idx} className={`db-quick-card delay-${idx + 1}`} onClick={() => onNavigate?.(link.page)} role="button" tabIndex={0}>
              <div className="db-quick-icon" style={{ background: link.color }}>
                {link.icon}
              </div>
              <div>
                <p className="db-quick-label">{link.label}</p>
                <p className="db-quick-desc">{link.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
