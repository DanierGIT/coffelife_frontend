import { useEffect, useState, useMemo } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import {
  BiBuildings, BiUser, BiGroup, BiListUl, BiCog, BiDroplet,
  BiCalendar, BiRightArrowAlt, BiCheckCircle, BiXCircle, BiTime,
  BiMap, BiTrendingUp, BiGrid, BiShow,
} from 'react-icons/bi'
import CoffeePriceCard from '../../../components/CoffeePriceCard'
import Loading from '../../../components/Loading'
import './Dashboard.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const safeDate = (val) => {
  if (!val) return null
  const d = String(val).includes('T') ? new Date(val) : new Date(val + 'T12:00:00')
  return isNaN(d) ? null : d
}

const fmtFecha = (val) => {
  const d = safeDate(val)
  return d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '—'
}

const NIVELES_VALIDOS = ['Sano', 'Bajo', 'Medio', 'Alto', 'Crítico']

// ─── EXTRACCIÓN DE NIVEL DE ROYA ─────────────────────────────────────────────
// Soporta TODOS los formatos que puede devolver el backend AdonisJS de CoffeeLife:
//   - nivelRoya: { idNivel, nombreNivel }      (relación cargada)
//   - idNivelRoya: number                       (solo ID)
//   - nivel_roya: string                        (snake_case)
//   - resultadoIA / diagnostico / resultado     (texto directo)
//   - estado: "Sin roya" / "Con roya"           (estado del monitoreo)

const MAPA_ID_NIVEL = { 1: 'Sano', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Crítico' }

const extraerNivel = (obj, nivelMap = {}) => {
  if (!obj) return ''

  // 1. Relación nivelRoya cargada (AdonisJS belongsTo)
  const nrObj = obj.nivelRoya ?? obj.nivel_roya_obj
  if (nrObj && typeof nrObj === 'object') {
    const nombre = nrObj.nombreNivel ?? nrObj.nombre_nivel ?? nrObj.nombre ?? nrObj.name
    if (nombre) {
      const n = nombre.trim()
      const cap = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()
      if (NIVELES_VALIDOS.includes(cap)) return cap
    }
    const idNv = nrObj.idNivel ?? nrObj.id_nivel ?? nrObj.id
    if (idNv != null) {
      const val = MAPA_ID_NIVEL[Number(idNv)] ?? nivelMap[Number(idNv)]
      if (val) return val
    }
  }

  // 2. Campos de texto directo
  const textCandidates = [
    obj.resultadoIA,
    obj.resultado_ia,
    obj.diagnostico,
    obj.nivel_roya,
    obj.resultado,
    obj.nivel,
    typeof obj.nivelRoya === 'string' ? obj.nivelRoya : null,
  ]
  for (const raw of textCandidates) {
    if (!raw || typeof raw !== 'string') continue
    const cap = raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1).toLowerCase()
    if (NIVELES_VALIDOS.includes(cap)) return cap
    // "sin roya" → Sano
    if (raw.toLowerCase().includes('sin roya')) return 'Sano'
  }

  // 3. ID numérico directo
  const idNivel = obj.idNivelRoya ?? obj.id_nivel_roya
  if (idNivel != null) {
    const val = MAPA_ID_NIVEL[Number(idNivel)] ?? nivelMap[Number(idNivel)]
    if (val) return val
  }

  // 4. Estado del monitoreo como fallback
  if (obj.estado) {
    if (obj.estado === 'Sin roya') return 'Sano'
    if (obj.estado === 'Con roya') return 'Alto' // señal de roya pero sin nivel exacto
  }

  return ''
}

// ─── Tendencia semana actual vs semana anterior ───────────────────────────────
const calcWeekTrend = (items, ...dateFields) => {
  const now = new Date()
  const startThisWeek = new Date(now)
  startThisWeek.setDate(now.getDate() - now.getDay())
  startThisWeek.setHours(0, 0, 0, 0)
  const startLastWeek = new Date(startThisWeek)
  startLastWeek.setDate(startLastWeek.getDate() - 7)

  const getDate = (item) => {
    for (const f of dateFields) {
      const d = safeDate(item[f])
      if (d) return d
    }
    return null
  }

  const thisWeek = items.filter(i => { const d = getDate(i); return d && d >= startThisWeek }).length
  const lastWeek = items.filter(i => { const d = getDate(i); return d && d >= startLastWeek && d < startThisWeek }).length

  if (lastWeek === 0) return thisWeek > 0 ? '+100%' : '0%'
  const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

const toISODate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const fmtDateRange = (start, end) => {
  const opts = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('es-CO', opts)} - ${end.toLocaleDateString('es-CO', opts)}, ${end.getFullYear()}`
}

const getWeekRange = () => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  return { start: startOfWeek, end: endOfWeek }
}

const quickLinks = [
  { icon: <BiListUl size={20} />, label: 'Gestión de Fincas', desc: 'Administrar fincas registradas', color: '#eef6e9', page: 'fincas' },
  { icon: <BiDroplet size={20} />, label: 'Insumos agrícolas', desc: 'Gestiona fertilizantes y más', color: '#eef6e9', page: 'insumos' },
  { icon: <BiCog size={20} />, label: 'Configura tus categorías', desc: 'Categorías y parámetros', color: '#eef6e9', page: 'categorias' },
]

// ─── DONUT CHART ──────────────────────────────────────────────────────────────
// Muestra TODOS los monitoreos (sin filtro de fecha) clasificados por nivel de roya.
// Cruza monitoreos con análisis IA para obtener el nivel exacto.
// Si un monitoreo no tiene análisis, usa el estado del monitoreo como fallback.

function DonutChart({ allMonitoreos, allAnalisis, nivelRoyaMap }) {
  const colores = {
    'Sano': '#22c55e',
    'Bajo': '#eab308',
    'Medio': '#f97316',
    'Alto': '#ef4444',
    'Crítico': '#7c3aed',
  }

  // Construir mapa: idMonitoreo → análisis (para cruzar datos)
  const analisisPorMonitoreo = useMemo(() => {
    const map = {}
    allAnalisis.forEach(a => {
      const idMon = a.idMonitoreo ?? a.id_monitoreo
      if (idMon != null) {
        // Guardar el más reciente si hay varios
        if (!map[idMon] || (a.idAnalisis ?? 0) > (map[idMon].idAnalisis ?? 0)) {
          map[idMon] = a
        }
      }
    })
    return map
  }, [allAnalisis])

  const conteo = useMemo(() => {
    const c = {}
    NIVELES_VALIDOS.forEach(n => { c[n] = 0 })

    allMonitoreos.forEach(mon => {
      const idMon = mon.idMonitoreo ?? mon.id_monitoreo
      // Prioridad: análisis IA cruzado → luego campos del propio monitoreo
      const analisis = idMon != null ? analisisPorMonitoreo[idMon] : null
      const nivel = extraerNivel(analisis || mon, nivelRoyaMap)
        || extraerNivel(mon, nivelRoyaMap)
        || 'Sano' // fallback: si no hay dato, asumir Sano

      if (c[nivel] !== undefined) c[nivel]++
    })
    return c
  }, [allMonitoreos, analisisPorMonitoreo, nivelRoyaMap])

  const total = Object.values(conteo).reduce((a, b) => a + b, 0)
  const hasData = total > 0

  const segments = NIVELES_VALIDOS.map(n => ({
    label: n,
    pct: total > 0 ? Math.round((conteo[n] / total) * 100) : 0,
    color: colores[n],
    count: conteo[n],
  }))

  const size = 220, sw = 28, r = (size - sw) / 2, circ = 2 * Math.PI * r
  let accum = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {!hasData ? (
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
          ) : (
            segments.filter(s => s.count > 0).map((s, i) => {
              const len = (s.count / total) * circ
              const dashOffset = circ / 4 - accum // empezar desde arriba
              accum += len
              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={sw}
                  strokeDasharray={`${len} ${circ - len}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              )
            })
          )}
        </svg>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginTop: '4px' }}>Total</span>
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '0 8px' }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '6px 10px', borderRadius: '10px',
            background: s.count > 0 ? s.color + '12' : '#f9fafb',
            border: `1px solid ${s.count > 0 ? s.color + '30' : '#f3f4f6'}`,
          }}>
            <span style={{
              width: 12, height: 12, borderRadius: '3px',
              background: s.color, display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{ flex: 1, fontSize: '13px', color: '#374151', fontWeight: 500 }}>{s.label}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: s.count > 0 ? s.color : '#d1d5db' }}>
              {s.count}
            </span>
            <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '38px', textAlign: 'right' }}>
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── LINE CHART ───────────────────────────────────────────────────────────────
function LineChart({ monitoreos }) {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const estados = ['Sin roya', 'Con roya', 'Pendiente']
  const colores = { 'Sin roya': '#22c55e', 'Con roya': '#ef4444', 'Pendiente': '#eab308' }

  const hoy = new Date()
  const ult7 = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const label = dayNames[d.getDay()]
    const counts = { 'Sin roya': 0, 'Con roya': 0, 'Pendiente': 0 }

    monitoreos.forEach(m => {
      const fd = safeDate(m.fechaMonitoreo ?? m.fecha_monitoreo)
      if (fd) {
        const mKey = `${fd.getFullYear()}-${fd.getMonth()}-${fd.getDate()}`
        if (mKey === key) {
          const est = m.estado || 'Pendiente'
          if (counts[est] !== undefined) counts[est]++
        }
      }
    })
    ult7.push({ label, ...counts })
  }

  const maxVal = Math.max(1, ...ult7.flatMap(d => [d['Sin roya'], d['Con roya'], d['Pendiente']]))
  const w = 550, h = 220, padL = 35, padR = 25, padT = 25, padB = 35
  const drawW = w - padL - padR, drawH = h - padT - padB
  const toX = (i) => padL + (i / 6) * drawW
  const toY = (v) => padT + drawH - (v / maxVal) * drawH
  const yTicks = [0, Math.round(maxVal / 2), maxVal]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        {estados.map((e) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: colores[e], display: 'inline-block' }} />
            <span style={{ color: '#6b7280' }}>{e}</span>
          </div>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
        {yTicks.map((v, idx) => (
          <g key={idx}>
            <line x1={padL} y1={toY(v)} x2={w - padR} y2={toY(v)} stroke="#f3f4f6" strokeWidth={1.2} />
            <text x={padL - 10} y={toY(v) + 3} textAnchor="end" fontSize="11" fontWeight="500" fill="#9ca3af">{v}</text>
          </g>
        ))}
        {estados.map((e) => {
          const pts = ult7.map((d, i) => `${toX(i)},${toY(d[e])}`).join(' ')
          return (
            <g key={e}>
              <polyline points={pts} fill="none" stroke={colores[e]} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {ult7.map((d, i) => (
                <circle key={i} cx={toX(i)} cy={toY(d[e])} r={6} fill={colores[e]} stroke="#ffffff" strokeWidth={2.5}
                  style={{ cursor: 'pointer', filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.2))' }}>
                  <title>{`${e}: ${d[e]} monitoreos`}</title>
                </circle>
              ))}
            </g>
          )
        })}
        {ult7.map((d, i) => (
          <text key={i} x={toX(i)} y={h - 10} textAnchor="middle" fontSize="11" fontWeight="500" fill="#9ca3af">{d.label}</text>
        ))}
      </svg>
    </div>
  )
}

// ─── ACTIVIDAD RECIENTE ───────────────────────────────────────────────────────
function RecentActivity({ monitoreos, fincaMap, nivelRoyaMap, analisisPorMonitoreo }) {
  const timeAgo = (dateStr) => {
    const d = safeDate(dateStr)
    if (!d) return ''
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Hace ${hrs} h`
    return `Hace ${Math.floor(hrs / 24)} día${Math.floor(hrs / 24) > 1 ? 's' : ''}`
  }

  const items = [...monitoreos]
    .sort((a, b) => {
      const da = safeDate(a.fechaMonitoreo ?? a.fecha_monitoreo)
      const db = safeDate(b.fechaMonitoreo ?? b.fecha_monitoreo)
      return (db ?? 0) - (da ?? 0)
    })
    .slice(0, 5)
    .map(m => {
      const idMon = m.idMonitoreo ?? m.id_monitoreo
      const analisis = idMon != null ? analisisPorMonitoreo[idMon] : null
      const finca = m.cultivo?.idFinca ? fincaMap[m.cultivo.idFinca] : null
      const nombre = finca?.nombreFinca || m.cultivo?.nombreCultivo || 'Sin asignar'
      const nivel = extraerNivel(analisis || m, nivelRoyaMap) || extraerNivel(m, nivelRoyaMap)
      const time = timeAgo(m.fechaMonitoreo ?? m.fecha_monitoreo)
      const colorMap = { 'Sano': '#22c55e', 'Bajo': '#eab308', 'Medio': '#f97316', 'Alto': '#ef4444', 'Crítico': '#7c3aed' }
      const color = colorMap[nivel] || '#6b7280'
      const icon = nivel === 'Sano' ? <BiCheckCircle size={16} /> : (nivel === 'Crítico' || nivel === 'Alto') ? <BiXCircle size={16} /> : <BiDroplet size={16} />
      const label = nivel ? `Nivel "${nivel}" detectado en ${nombre}` : `Monitoreo registrado en ${nombre}`
      return { icon, color, text: label, time }
    })

  if (!items.length) return <p style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '13px' }}>Sin actividad reciente.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{ color: item.color, marginTop: 2 }}>{item.icon}</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.4 }}>{item.text}</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BiTime size={11} /> {item.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── TABLA MONITOREOS ─────────────────────────────────────────────────────────
function MonitoreosTable({ monitoreos, fincaMap, onNavigate, nivelRoyaMap, analisisPorMonitoreo }) {
  const getBadge = (val, colorMap, defaultColor = '#6b7280') => {
    if (!val || val === '—') return <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
    const color = colorMap[val] || defaultColor
    return (
      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: color + '22', color }}>
        {val}
      </span>
    )
  }

  const estadoColors = { 'Sin roya': '#22c55e', 'Con roya': '#ef4444', 'Pendiente': '#eab308', 'Revisado': '#3b82f6', 'Tratamiento enviado': '#8b5cf6' }
  const nivelColors = { 'Sano': '#22c55e', 'Bajo': '#eab308', 'Medio': '#f97316', 'Alto': '#ef4444', 'Crítico': '#7c3aed' }

  if (!monitoreos.length) return <p style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>No hay monitoreos registrados.</p>

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            {['#', 'Finca', 'Lote', 'Fecha', 'Resultado IA', 'Experto', 'Estado', 'Ver'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9ca3af' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monitoreos.slice(0, 6).map((m, idx) => {
            const idMon = m.idMonitoreo ?? m.id_monitoreo
            const analisis = idMon != null ? analisisPorMonitoreo[idMon] : null
            const finca = fincaMap[m.cultivo?.idFinca]
            const expNombre = m.usuario ? `${m.usuario.nombre || ''} ${m.usuario.apellido || ''}`.trim() : '—'
            const estado = m.estado || 'Pendiente'
            const resultado = extraerNivel(analisis || m, nivelRoyaMap) || extraerNivel(m, nivelRoyaMap) || '—'
            return (
              <tr key={idMon ?? idx} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ padding: '10px 12px', color: '#9ca3af', fontSize: '12px' }}>{idx + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1f2937' }}>{finca?.nombreFinca || '—'}</td>
                <td style={{ padding: '10px 12px', color: '#374151' }}>{m.cultivo?.nombreCultivo || '—'}</td>
                <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: '12px' }}>{fmtFecha(m.fechaMonitoreo ?? m.fecha_monitoreo)}</td>
                <td style={{ padding: '10px 12px' }}>{getBadge(resultado, nivelColors)}</td>
                <td style={{ padding: '10px 12px', color: '#374151', fontSize: '12px' }}>{expNombre || '—'}</td>
                <td style={{ padding: '10px 12px' }}>{getBadge(estado, estadoColors)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => onNavigate?.('monitoreos')}
                    style={{ background: 'none', border: 'none', color: '#2e7d32', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
                    <BiShow size={16} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── TOP CULTIVOS CON MÁS ROYA ────────────────────────────────────────────────
function TopRoyaCultivos({ monitoreos, analisisPorMonitoreo, nivelRoyaMap }) {
  const nivelesConRoya = ['Bajo', 'Medio', 'Alto', 'Crítico']
  const porCultivo = {}

  monitoreos.forEach(m => {
    const nombre = m.cultivo?.nombreCultivo || m.nombreCultivo
    if (!nombre) return
    const idMon = m.idMonitoreo ?? m.id_monitoreo
    const analisis = idMon != null ? analisisPorMonitoreo[idMon] : null
    const nivel = extraerNivel(analisis || m, nivelRoyaMap) || extraerNivel(m, nivelRoyaMap)
    if (!porCultivo[nombre]) porCultivo[nombre] = { total: 0, conRoya: 0 }
    porCultivo[nombre].total++
    if (nivelesConRoya.includes(nivel)) porCultivo[nombre].conRoya++
  })

  const items = Object.entries(porCultivo)
    .map(([nombre, d]) => ({ name: nombre, pct: d.total > 0 ? Math.round((d.conRoya / d.total) * 100) : 0, count: d.conRoya }))
    .filter(i => i.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)

  if (!items.length) return <p style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '13px' }}>Sin datos de roya registrados.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#374151' }}>{item.name}</span>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>{item.pct}% ({item.count})</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${item.pct}%`, height: '100%', background: `linear-gradient(to right, #f97316, #ef4444)`, borderRadius: '999px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ÚLTIMOS MONITOREOS ───────────────────────────────────────────────────────
function UltimosMonitoreos({ monitoreos, fincaMap }) {
  const ahora = new Date()
  const recientes = [...monitoreos]
    .map(m => ({ ...m, fecha: safeDate(m.fechaMonitoreo ?? m.fecha_monitoreo) }))
    .filter(m => m.fecha)
    .sort((a, b) => b.fecha - a.fecha)
    .slice(0, 5)

  const timeAgo = (fecha) => {
    const dias = Math.floor((ahora - fecha) / 86400000)
    if (dias === 0) return 'Hoy'
    if (dias === 1) return 'Ayer'
    return `Hace ${dias} días`
  }

  if (!recientes.length) return <p style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '13px' }}>No hay monitoreos.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {recientes.map((m, i) => {
        const finca = m.cultivo?.idFinca ? fincaMap[m.cultivo.idFinca] : null
        return (
          <div key={m.idMonitoreo ?? i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>{finca?.nombreFinca || m.cultivo?.nombreCultivo || 'Sin asignar'}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                {m.fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: '#f3f4f6', color: '#6b7280' }}>
              {timeAgo(m.fecha)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── MAPA ─────────────────────────────────────────────────────────────────────
function DashboardMap({ fincaMap }) {
  const fincasConCoords = Object.values(fincaMap).filter(f => f.latitud && f.longitud)
  const hasData = fincasConCoords.length > 0
  const avgLat = hasData ? fincasConCoords.reduce((s, f) => s + parseFloat(f.latitud), 0) / fincasConCoords.length : 4.57
  const avgLng = hasData ? fincasConCoords.reduce((s, f) => s + parseFloat(f.longitud), 0) / fincasConCoords.length : -74.29

  return (
    <div>
      <MapContainer center={[avgLat, avgLng]} zoom={hasData ? 8 : 6}
        style={{ height: '260px', width: '100%', borderRadius: '12px', zIndex: 0 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {hasData && fincasConCoords.map(f => (
          <Marker key={f.idFinca} position={[parseFloat(f.latitud), parseFloat(f.longitud)]}>
            <Tooltip direction="top" offset={[0, -10]} permanent={false}>
              <strong>{f.nombreFinca}</strong><br />
              {f.municipio ? `${f.municipio}, ${f.departamento || ''}` : ''}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      {!hasData && <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>No hay fincas con coordenadas.</p>}
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '12px' }}>
        {[['#22c55e', 'Sin roya'], ['#ef4444', 'Con roya'], ['#eab308', 'Pendientes']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: c, display: 'inline-block' }} /> {l}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MÉTRICAS DE IMPACTO ──────────────────────────────────────────────────────
function ImpactMetrics({ stats, allMonitoreos, allFincas, allAnalisis, nivelRoyaMap, analisisPorMonitoreo }) {
  const totalMon = allMonitoreos.length || 1
  const sinRoya = allMonitoreos.filter(m => {
    const idMon = m.idMonitoreo ?? m.id_monitoreo
    const analisis = idMon != null ? analisisPorMonitoreo[idMon] : null
    return (extraerNivel(analisis || m, nivelRoyaMap) || extraerNivel(m, nivelRoyaMap)) === 'Sano'
  }).length
  const pctSinRoya = Math.round((sinRoya / totalMon) * 100)

  const fincasConMon = new Set(allMonitoreos.filter(m => m.cultivo?.idFinca).map(m => m.cultivo.idFinca)).size
  const pctCobertura = allFincas.length > 0 ? Math.round((fincasConMon / allFincas.length) * 100) : 0

  const metrics = [
    { icon: <BiTrendingUp size={20} />, color: '#22c55e', value: `${pctSinRoya}%`, label: 'Cultivos sin roya detectada' },
    { icon: <BiDroplet size={20} />, color: '#3b82f6', value: `${pctCobertura}%`, label: 'Cobertura de monitoreo en fincas' },
    { icon: <BiGrid size={20} />, color: '#eab308', value: allAnalisis.length, label: 'Análisis de IA realizados' },
    { icon: <BiMap size={20} />, color: '#2e7d32', value: stats.fincasConUbicacion ?? 0, label: 'Fincas con ubicación registrada' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {metrics.map((m, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '18px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: m.color + '22', color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
            {m.icon}
          </div>
          <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1f2937' }}>{m.value}</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>{m.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function Dashboard({ onNavigate }) {
  const { user } = useAuth()

  const [stats, setStats] = useState({
    fincas: 0, fincasConUbicacion: 0,
    expertosActivos: 0, cafeterosActivos: 0, monEsteMes: 0,
  })
  const [trends, setTrends] = useState({ fincas: '0%', expertos: '0%', cafeteros: '0%', monitoreos: '0%' })
  const [allMonitoreos, setAllMonitoreos] = useState([])
  const [allAnalisis, setAllAnalisis] = useState([])
  const [allFincas, setAllFincas] = useState([])
  const [fincaMap, setFincaMap] = useState({})
  const [nivelRoyaMap, setNivelRoyaMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const defaultRange = useMemo(() => getWeekRange(), [])
  const [fechaInicio, setFechaInicio] = useState(toISODate(defaultRange.start))
  const [fechaFin, setFechaFin] = useState(toISODate(defaultRange.end))
  const [showDatePicker, setShowDatePicker] = useState(false)

  const dateRangeLabel = useMemo(() => {
    try { return fmtDateRange(new Date(fechaInicio + 'T12:00:00'), new Date(fechaFin + 'T12:00:00')) }
    catch { return 'Filtrar por fecha' }
  }, [fechaInicio, fechaFin])

  // Mapa analisis por monitoreo (usado en múltiples subcomponentes)
  const analisisPorMonitoreo = useMemo(() => {
    const map = {}
    allAnalisis.forEach(a => {
      const idMon = a.idMonitoreo ?? a.id_monitoreo
      if (idMon != null) {
        if (!map[idMon] || (a.idAnalisis ?? 0) > (map[idMon]?.idAnalisis ?? 0)) {
          map[idMon] = a
        }
      }
    })
    return map
  }, [allAnalisis])

  // Monitoreos filtrados por rango de fechas (para gráficas y tabla)
  const filteredMonitoreos = useMemo(() => {
    if (!fechaInicio || !fechaFin) return allMonitoreos
    const from = new Date(fechaInicio + 'T00:00:00')
    const to = new Date(fechaFin + 'T23:59:59')
    return allMonitoreos.filter(m => {
      const d = safeDate(m.fechaMonitoreo ?? m.fecha_monitoreo)
      return d && d >= from && d <= to
    })
  }, [allMonitoreos, fechaInicio, fechaFin])

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError('')
      try {
        const [fincasRes, expertosRes, cafeterosRes, monitoreosRes, analisisRes, nivelesRes] = await Promise.allSettled([
          api.get('/fincas'),
          api.get('/expertos'),
          api.get('/cafeteros'),
          api.get('/monitoreos'),
          api.get('/analisis_ia'),
          api.get('/cat_niveles_roya'),
        ])

        // Niveles roya
        const nivelesData = nivelesRes.status === 'fulfilled' ? getArrayData(nivelesRes.value.data) : []
        const nvMap = {}
        nivelesData.forEach(n => {
          const id = n.idNivel ?? n.id_nivel ?? n.id
          const nombre = n.nombreNivel ?? n.nombre_nivel ?? n.nombre
          if (id != null && nombre) nvMap[Number(id)] = nombre
        })
        setNivelRoyaMap(nvMap)

        // Fincas
        const fincas = fincasRes.status === 'fulfilled' ? getArrayData(fincasRes.value.data) : []
        const fMap = {}
        fincas.forEach(f => { fMap[f.idFinca ?? f.id] = f })
        setFincaMap(fMap)
        setAllFincas(fincas)

        // Expertos
        const expertosData = expertosRes.status === 'fulfilled' ? getArrayData(expertosRes.value.data) : []
        const isActivo = (e) => {
          const a = e.activo
          return a === undefined || a === null || a === true || a === 1 || a === '1' || a === 'true'
        }

        // Cafeteros
        const cafeterosData = cafeterosRes.status === 'fulfilled' ? getArrayData(cafeterosRes.value.data) : []

        // Monitoreos
        const todosMonitoreos = monitoreosRes.status === 'fulfilled' ? getArrayData(monitoreosRes.value.data) : []
        setAllMonitoreos(todosMonitoreos)

        // Análisis IA
        const analisisData = analisisRes.status === 'fulfilled' ? getArrayData(analisisRes.value.data) : []
        setAllAnalisis(analisisData)

        const ahora = new Date()
        const monEsteMes = todosMonitoreos.filter(mon => {
          const fd = safeDate(mon.fechaMonitoreo ?? mon.fecha_monitoreo)
          return fd && fd.getMonth() === ahora.getMonth() && fd.getFullYear() === ahora.getFullYear()
        }).length

        setStats({
          fincas: fincas.length,
          fincasConUbicacion: fincas.filter(f => f.latitud && f.longitud).length,
          expertosActivos: expertosData.filter(isActivo).length,
          cafeterosActivos: cafeterosData.filter(isActivo).length,
          monEsteMes,
        })

        setTrends({
          fincas: calcWeekTrend(fincas, 'createdAt', 'created_at', 'fechaCreacion'),
          expertos: calcWeekTrend(expertosData, 'createdAt', 'created_at'),
          cafeteros: calcWeekTrend(cafeterosData, 'createdAt', 'created_at'),
          monitoreos: calcWeekTrend(todosMonitoreos, 'fechaMonitoreo', 'fecha_monitoreo'),
        })
      } catch (err) {
        console.error('Dashboard error:', err)
        setError('No se pudieron cargar los datos del dashboard.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const kpiCards = [
    { icon: <BiBuildings size={22} />, color: '#2e7d32', bg: '#eef6e9', label: 'Fincas activas', val: loading ? '...' : stats.fincas, trend: trends.fincas },
    { icon: <BiGroup size={22} />, color: '#2e7d32', bg: '#e8f5e9', label: 'Expertos activos', val: loading ? '...' : stats.expertosActivos, trend: trends.expertos },
    { icon: <BiUser size={22} />, color: '#d97706', bg: '#fef3e2', label: 'Cafeteros activos', val: loading ? '...' : stats.cafeterosActivos, trend: trends.cafeteros },
    { icon: <BiCalendar size={22} />, color: '#0369a1', bg: '#e0f2fe', label: 'Monitoreos este mes', val: loading ? '...' : stats.monEsteMes, trend: trends.monitoreos },
  ]

  const getTrendColor = (t) => !t || t === 'N/A' ? '#9ca3af' : t.startsWith('-') ? '#ef4444' : '#22c55e'
  const getTrendIcon = (t) => !t || t === 'N/A' ? '—' : t.startsWith('-') ? '↓' : '↑'

  // Monitoreos ordenados por fecha desc para la tabla
  const sortedMonitoreos = useMemo(() => [...filteredMonitoreos].sort((a, b) => {
    const fa = safeDate(a.fechaMonitoreo ?? a.fecha_monitoreo)
    const fb = safeDate(b.fechaMonitoreo ?? b.fecha_monitoreo)
    if (!fa && !fb) return 0; if (!fa) return 1; if (!fb) return -1
    return fb - fa
  }), [filteredMonitoreos])

  return (
    <div className="dashboard">
      {loading && <Loading type="overlay" text="Cargando dashboard..." />}

      {/* ═══ 1. BANNER BIENVENIDA ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="welcome-avatar-sm">
            {user?.fotoPerfil
              ? <img src={user.fotoPerfil} alt="avatar" className="welcome-avatar-img-sm" />
              : <BiUser size={20} />}
          </div>
          <div>
            <h1 className="welcome-main-title" style={{ margin: 0 }}>
              ¡Hola, {user?.nombre || 'Admin'}! 👋
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Aquí tienes un resumen completo del estado de tu sistema CoffeeLife.
            </p>
          </div>
        </div>

        {/* Selector de rango de fechas */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setShowDatePicker(!showDatePicker)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', fontSize: '13px', color: '#374151', cursor: 'pointer', userSelect: 'none' }}>
            <BiCalendar size={16} />
            <span>{dateRangeLabel}</span>
          </div>
          {showDatePicker && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, display: 'flex', gap: '12px', alignItems: 'end' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Desde
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }} />
              </label>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Hasta
                <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }} />
              </label>
              <button onClick={() => { const r = getWeekRange(); setFechaInicio(toISODate(r.start)); setFechaFin(toISODate(r.end)) }}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', fontSize: '12px', cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}>
                Esta semana
              </button>
              <button onClick={() => setShowDatePicker(false)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#2e7d32', fontSize: '12px', cursor: 'pointer', color: '#fff', whiteSpace: 'nowrap' }}>
                Aplicar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ 2. KPI CARDS ═══ */}
      <div className="header-kpi-cards-wrapper" style={{ gap: '16px' }}>
        {kpiCards.map((kpi, i) => (
          <div key={i} style={{ background: '#fff', padding: '20px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px', flex: 1, border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: kpi.bg, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {kpi.icon}
              </div>
              <div>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1b5e20', lineHeight: 1.1, display: 'block' }}>{kpi.val}</span>
                <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500, marginTop: '2px', display: 'block' }}>{kpi.label}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: getTrendColor(kpi.trend), fontWeight: 600 }}>
              <span>{getTrendIcon(kpi.trend)}</span>
              <span>{kpi.trend}</span>
              {kpi.trend !== 'N/A' && kpi.trend !== '0%' && (
                <span style={{ color: '#9ca3af', fontWeight: 400 }}>vs semana anterior</span>
              )}
            </div>
          </div>
        ))}
        <CoffeePriceCard />
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {/* ═══ 3. GRÁFICAS: DONUT | LINE | ACTIVIDAD ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>

        {/* DONUT — usa allMonitoreos (TODOS, sin filtro de fecha) */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>Monitoreos por estado de roya</h2>
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#9ca3af' }}>Total acumulado · todos los cultivos</p>
          <DonutChart
            allMonitoreos={allMonitoreos}
            allAnalisis={allAnalisis}
            nivelRoyaMap={nivelRoyaMap}
          />
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button onClick={() => onNavigate?.('monitoreos')}
              style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Ver reporte completo <BiRightArrowAlt size={14} />
            </button>
          </div>
        </div>

        {/* LINE CHART — usa filteredMonitoreos */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>Tendencia de roya (últimos 7 días)</h2>
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#9ca3af' }}>Por estado de monitoreo</p>
          <LineChart monitoreos={filteredMonitoreos} />
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button onClick={() => onNavigate?.('monitoreos')}
              style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Ver más estadísticas <BiRightArrowAlt size={14} />
            </button>
          </div>
        </div>

        {/* ACTIVIDAD RECIENTE */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>Actividad reciente</h2>
          <RecentActivity
            monitoreos={allMonitoreos}
            fincaMap={fincaMap}
            nivelRoyaMap={nivelRoyaMap}
            analisisPorMonitoreo={analisisPorMonitoreo}
          />
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button onClick={() => onNavigate?.('monitoreos')}
              style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Ver toda la actividad <BiRightArrowAlt size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 4. TABLA + PANELES LATERALES ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>Monitoreos recientes</h2>
          <MonitoreosTable
            monitoreos={sortedMonitoreos}
            fincaMap={fincaMap}
            onNavigate={onNavigate}
            nivelRoyaMap={nivelRoyaMap}
            analisisPorMonitoreo={analisisPorMonitoreo}
          />
          <div style={{ textAlign: 'right', marginTop: '12px' }}>
            <button onClick={() => onNavigate?.('monitoreos')}
              style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Ver todos los monitoreos <BiRightArrowAlt size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BiTrendingUp size={16} style={{ color: '#ef4444' }} /> Top 5 cultivos con más roya
            </h2>
            <TopRoyaCultivos
              monitoreos={allMonitoreos}
              analisisPorMonitoreo={analisisPorMonitoreo}
              nivelRoyaMap={nivelRoyaMap}
            />
            <div style={{ textAlign: 'right', marginTop: '12px' }}>
              <button onClick={() => onNavigate?.('monitoreos')}
                style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Ver reporte completo <BiRightArrowAlt size={14} />
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>Últimos monitoreos registrados</h2>
            <UltimosMonitoreos monitoreos={allMonitoreos} fincaMap={fincaMap} />
            <div style={{ textAlign: 'right', marginTop: '12px' }}>
              <button onClick={() => onNavigate?.('monitoreos')}
                style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Ver todos <BiRightArrowAlt size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 5. MAPA + MÉTRICAS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <div style={{ borderRadius: '16px', padding: '20px', background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BiMap size={18} color="#2e7d32" /> Mapa de fincas
            </p>
            <span style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '3px 10px', borderRadius: '12px' }}>
              {Object.keys(fincaMap).length} registradas
            </span>
          </div>
          <DashboardMap fincaMap={fincaMap} />
        </div>

        <div>
          <ImpactMetrics
            stats={stats}
            allMonitoreos={allMonitoreos}
            allFincas={allFincas}
            allAnalisis={allAnalisis}
            nivelRoyaMap={nivelRoyaMap}
            analisisPorMonitoreo={analisisPorMonitoreo}
          />
        </div>
      </div>

      {/* ═══ 6. ACCESOS RÁPIDOS ═══ */}
      <div className="db-quick-section">
        <h2 className="db-section-title">Accesos rápidos</h2>
        <div className="db-quick-grid">
          {quickLinks.map((link, idx) => (
            <div key={idx} className={`db-quick-card delay-${idx + 1}`}
              onClick={() => onNavigate?.(link.page)} role="button" tabIndex={0}>
              <div className="db-quick-icon" style={{ background: link.color }}>{link.icon}</div>
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