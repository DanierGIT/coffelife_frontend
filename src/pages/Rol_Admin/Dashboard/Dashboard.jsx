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

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// ─── EXTRACCIÓN DE NIVEL DE ROYA DESDE MÚLTIPLES FORMATOS ────────────────────
// El backend puede devolver el nivel en distintos campos según la versión

const MAPA_ID_NIVEL = { 1: 'Sano', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Crítico' }

const extraerNivel = (obj, nivelMap) => {
  if (!obj) return ''
  const candidatos = [
    obj.resultadoIA,
    obj.diagnostico,
    obj.nivel_roya,
    typeof obj.nivelRoya === 'string' ? obj.nivelRoya : null,
    obj.nivelRoya?.nombre,
    obj.nivelRoya?.nombreNivel,
    obj.nivelRoya?.nombre_nivel,
  ]
  const raw = candidatos.find(v => v && typeof v === 'string' && v.trim().length > 0) || ''

  // Intentar nombre directo
  if (raw) {
    const nivel = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase().trim()
    const niveles = ['Sano', 'Bajo', 'Medio', 'Alto', 'Crítico']
    if (niveles.includes(nivel)) return nivel
  }

  // Intentar por idNivelRoya (número FK) usando el mapa de la API
  const id = obj.idNivelRoya ?? obj.id_nivel_roya ?? obj.nivelRoya?.idNivel
  if (id != null) {
    const val = Number(id)
    const nombre = nivelMap?.[val] || MAPA_ID_NIVEL[val]
    if (nombre) return nombre
  }

  return ''
}

function getNivelRoya(m, nivelMap) { return extraerNivel(m, nivelMap) }

// Calcula el porcentaje de cambio entre semana actual y semana anterior
// para una lista de items que tienen fecha (campo dateField)
const calcWeekTrend = (items, dateField) => {
  const now = new Date()
  const startThisWeek = new Date(now)
  startThisWeek.setDate(now.getDate() - now.getDay())
  startThisWeek.setHours(0, 0, 0, 0)

  const startLastWeek = new Date(startThisWeek)
  startLastWeek.setDate(startLastWeek.getDate() - 7)
  const endLastWeek = new Date(startThisWeek)

  const thisWeek = items.filter((item) => {
    const d = safeDate(item[dateField])
    return d && d >= startThisWeek
  }).length

  const lastWeek = items.filter((item) => {
    const d = safeDate(item[dateField])
    return d && d >= startLastWeek && d < endLastWeek
  }).length

  if (lastWeek === 0) return thisWeek > 0 ? '+100%' : '0%'
  const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

const toISODate = (d) => {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const fmtDateRange = (start, end) => {
  const opts = { day: 'numeric', month: 'short' }
  const s = start.toLocaleDateString('es-CO', opts)
  const e = end.toLocaleDateString('es-CO', opts)
  return `${s} - ${e}, ${end.getFullYear()}`
}

const getWeekRange = () => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  return { start: startOfWeek, end: endOfWeek }
}

const quickLinks = [
  { icon: <BiListUl size={20} />, label: 'Gestión de Fincas', desc: 'Administrar fincas registradas', color: '#eef6e9', page: 'fincas' },
  { icon: <BiDroplet size={20} />, label: 'Insumos agrícolas', desc: 'Gestiona fertilizantes y más', color: '#eef6e9', page: 'insumos' },
  { icon: <BiCog size={20} />, label: 'Configura tus categorías', desc: 'Categorías y parámetros', color: '#eef6e9', page: 'categorias' },
]

// ─── Subcomponentes ───────────────────────────────────────────────────────────

// ─── DONUT CHART PROFESIONAL CON COLORES COFFEELIFE ──────────────────────────

function DonutChart({ monitoreos, analisis, nivelRoyaMap }) {
  const niveles = ['Sano', 'Bajo', 'Medio', 'Alto', 'Crítico']
  const colores = {
    'Sano': '#22c55e',
    'Bajo': '#eab308',
    'Medio': '#f97316',
    'Alto': '#ef4444',
    'Crítico': '#7c3aed',
  }

  const conteo = {}
  niveles.forEach(n => { conteo[n] = 0 })

  // Combinar TODOS los items de ambas fuentes
  const todos = [...analisis, ...monitoreos]
  const vistos = new Set()
  todos.forEach(item => {
    // Evitar duplicados (mismo idAnalisis o idMonitoreo)
    const id = item.idAnalisis ?? item.idMonitoreo ?? item.id_monitoreo
    if (id && vistos.has(id)) return
    if (id) vistos.add(id)

    const nivel = extraerNivel(item, nivelRoyaMap)
    if (nivel && conteo[nivel] !== undefined) conteo[nivel]++
  })

  const total = Object.values(conteo).reduce((a, b) => a + b, 0)
  const hasData = niveles.some(n => conteo[n] > 0)

  const segments = niveles.map(n => ({
    label: n,
    pct: total > 0 ? Math.round((conteo[n] / total) * 100) : 0,
    color: colores[n],
    count: conteo[n],
  }))

  const size = 220, sw = 24, r = (size - sw) / 2, circ = 2 * Math.PI * r
  let accum = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {!hasData ? (
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
          ) : (
            segments.filter(s => s.count > 0).map((s, i) => {
              const len = (s.pct / 100) * circ
              const offset = -accum
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
                  strokeDashoffset={offset}
                  strokeLinecap="round"
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
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginTop: '4px' }}>
            Monitoreos
          </span>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px 16px', width: '100%', padding: '0 10px',
      }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px',
            background: s.count > 0 ? '#f9fafb' : 'transparent',
            padding: '6px 8px', borderRadius: '8px',
            border: s.count > 0 ? '1px solid #f3f4f6' : '1px solid transparent',
          }}>
            <span style={{
              width: 11, height: 11, borderRadius: '50%',
              background: s.color, display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{
              color: '#4b5563', display: 'flex',
              justifyContent: 'space-between', width: '100%',
            }}>
              <span>{s.label}</span>
              <strong style={{ color: '#1f2937' }}>{s.count} ({s.pct}%)</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LineChart({ monitoreos }) {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const estados = ['Sin roya', 'Con roya', 'Pendiente']
  const colores = { 'Sin roya': '#22c55e', 'Con roya': '#ef4444', 'Pendiente': '#eab308' }

  // Calcular dinámicamente los últimos 7 días de atrás hacia adelante (terminando hoy)
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

  // Encontrar el valor máximo absoluto para escalar correctamente el eje Y
  const maxVal = Math.max(1, ...ult7.flatMap(d => [d['Sin roya'], d['Con roya'], d['Pendiente']]))
  
  // Ajuste de proporciones del contenedor SVG
  const w = 550, h = 220, padL = 35, padR = 25, padT = 25, padB = 35
  const drawW = w - padL - padR, drawH = h - padT - padB
  const toX = (i) => padL + (i / 6) * drawW
  const toY = (v) => padT + drawH - (v / maxVal) * drawH

  // Generar las líneas horizontales de referencia del eje Y (0, Mitad, Máximo)
  const yTicks = [0, Math.round(maxVal / 2), maxVal]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
      {/* ─── LEYENDAS SUPERIORES ESTILIZADAS ─── */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', marginBottom: '4px' }}>
        {estados.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: colores[e], display: 'inline-block' }} />
            <span style={{ color: '#6b7280' }}>{e}</span>
          </div>
        ))}
      </div>

      {/* ─── CONTENEDOR DEL GRAFICO VECTORIAL (SVG) ─── */}
      <div style={{ width: '100%' }}>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
          {/* Líneas de cuadrícula horizontales sutiles */}
          {yTicks.map((v, idx) => (
            <g key={idx}>
              <line 
                x1={padL} 
                y1={toY(v)} 
                x2={w - padR} 
                y2={toY(v)} 
                stroke="#f3f4f6" 
                strokeWidth={1.2} 
              />
              <text 
                x={padL - 10} 
                y={toY(v) + 3} 
                textAnchor="end" 
                fontSize="11" 
                fontWeight="500"
                fill="#9ca3af"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Renderizado de Polilíneas y Círculos de datos por cada Estado */}
          {estados.map((e, si) => {
            const pts = ult7.map((d, i) => `${toX(i)},${toY(d[e])}`).join(' ')
            return (
              <g key={si}>
                {/* Línea de tendencia */}
                <polyline 
                  points={pts} 
                  fill="none" 
                  stroke={colores[e]} 
                  strokeWidth={2.5} 
                  strokeLinejoin="round" 
                  strokeLinecap="round" 
                />
                {/* Círculos con tamaño máximo y bordes limpios */}
                {ult7.map((d, i) => {
                  const cx = toX(i)
                  const cy = toY(d[e])
                  return (
                    <circle 
                      key={i} 
                      cx={cx} 
                      cy={cy} 
                      r={7.5} /* Nodos gigantes y muy visibles */
                      fill={colores[e]} 
                      stroke="#ffffff" 
                      strokeWidth={3} /* Borde grueso para separar la línea del fondo perfectamente */
                      style={{ 
                        cursor: 'pointer', 
                        filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.25))',
                      }}
                    >
                      <title>{`${e}: ${d[e]} monitoreos`}</title>
                    </circle>
                  )
                })}
              </g>
            )
          })}

          {/* Etiquetas del Eje X (Días de la semana) */}
          {ult7.map((d, i) => (
            <text 
              key={i} 
              x={toX(i)} 
              y={h - 10} 
              textAnchor="middle" 
              fontSize="11" 
              fontWeight="500"
              fill="#9ca3af"
            >
              {d.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}
function RecentActivity({ monitoreos, fincaMap, nivelRoyaMap }) {
  const timeAgo = (dateStr) => {
    const d = safeDate(dateStr)
    if (!d) return ''
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Hace ${hrs} h`
    const days = Math.floor(hrs / 24)
    return `Hace ${days} día${days > 1 ? 's' : ''}`
  }

  const items = monitoreos.slice(0, 5).map(m => {
    const finca = m.cultivo?.idFinca ? fincaMap[m.cultivo.idFinca] : null
    const nombre = finca?.nombreFinca || m.cultivo?.nombreCultivo || 'Sin asignar'
    const nivel = getNivelRoya(m, nivelRoyaMap)
    const time = timeAgo(m.fechaMonitoreo ?? m.fecha_monitoreo)
    const colores = { 'Sano': '#22c55e', 'Bajo': '#eab308', 'Medio': '#f97316', 'Alto': '#ef4444', 'Crítico': '#7c3aed' }
    const color = colores[nivel] || '#6b7280'
    const icon = nivel === 'Sano' ? <BiCheckCircle size={16} /> : nivel === 'Crítico' || nivel === 'Alto' ? <BiXCircle size={16} /> : <BiDroplet size={16} />
    const label = nivel ? `Nivel "${nivel}" en ${nombre}` : `Monitoreo registrado en ${nombre}`
    return { icon, color, text: label, time }
  })

  if (!items.length) {
    return <p style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '13px' }}>Sin actividad reciente.</p>
  }

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

function MonitoreosTable({ monitoreos, fincaMap, onNavigate, nivelRoyaMap }) {
  const getEstadoBadge = (estado) => {
    const map = { 'Sin roya': '#22c55e', 'Con roya': '#ef4444', 'Pendiente': '#eab308', 'Revisado': '#3b82f6' }
    const color = map[estado] || '#6b7280'
    return (
      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: color + '22', color }}>
        {estado}
      </span>
    )
  }

  const getRoyaBadge = (val) => {
    if (!val || val === '—') return <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
    const colors = { 'Sano': '#22c55e', 'Bajo': '#eab308', 'Medio': '#f97316', 'Alto': '#ef4444', 'Crítico': '#7c3aed' }
    const color = colors[val] || '#6b7280'
    return (
      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: color + '22', color }}>
        {val}
      </span>
    )
  }

  if (!monitoreos.length) {
    return <p style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>No hay monitoreos registrados.</p>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            {['#', 'Finca', 'Lote', 'Fecha', 'Resultado IA', 'Experto', 'Estado', 'Acciones'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9ca3af' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monitoreos.slice(0, 6).map((m, idx) => {
            const finca = fincaMap[m.cultivo?.idFinca]
            const expNombre = m.usuario ? `${m.usuario.nombre || ''} ${m.usuario.apellido || ''}`.trim() : '—'
            const estado = m.estado || 'Pendiente'
            const resultado = getNivelRoya(m, nivelRoyaMap) || '—'
            return (
              <tr key={m.idMonitoreo ?? m.id_monitoreo ?? idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', color: '#9ca3af', fontSize: '12px' }}>{idx + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1f2937' }}>{finca?.nombreFinca || '—'}</td>
                <td style={{ padding: '10px 12px', color: '#374151' }}>{m.cultivo?.nombreCultivo || '—'}</td>
                <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: '12px' }}>{fmtFecha(m.fechaMonitoreo ?? m.fecha_monitoreo)}</td>
                <td style={{ padding: '10px 12px' }}>{getRoyaBadge(resultado)}</td>
                <td style={{ padding: '10px 12px', color: '#374151', fontSize: '12px' }}>{expNombre}</td>
                <td style={{ padding: '10px 12px' }}>{getEstadoBadge(estado)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => onNavigate?.('monitoreos')} style={{ background: 'none', border: 'none', color: '#2e7d32', cursor: 'pointer', padding: '4px', borderRadius: '6px' }} title="Ver detalle">
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

function TopRoyaCultivos({ monitoreos, analisis, nivelRoyaMap }) {
  const nivelesRoya = ['Bajo', 'Medio', 'Alto', 'Crítico']
  const todos = [...analisis, ...monitoreos]
  const porCultivo = {}

  todos.forEach(item => {
    const nombre = item.nombreCultivo ?? item.cultivo?.nombreCultivo
    if (!nombre) return
    if (!porCultivo[nombre]) porCultivo[nombre] = { total: 0, conRoya: 0 }
    porCultivo[nombre].total++
    const nivel = extraerNivel(item, nivelRoyaMap)
    if (nivelesRoya.includes(nivel)) porCultivo[nombre].conRoya++
  })

  const items = Object.entries(porCultivo)
    .map(([nombre, data]) => ({
      name: nombre,
      pct: data.total > 0 ? Math.round((data.conRoya / data.total) * 100) : 0,
    }))
    .filter(i => i.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)

  if (!items.length) {
    return <p style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '13px' }}>Sin datos de roya registrados.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#374151' }}>{item.name}</span>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>{item.pct}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${item.pct}%`, height: '100%', background: '#ef4444', borderRadius: '999px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function UpcomingMonitoreos({ monitoreos, fincaMap }) {
  const ahora = new Date()
  const proximos = monitoreos
    .map(m => ({ ...m, fecha: safeDate(m.fechaMonitoreo ?? m.fecha_monitoreo) }))
    .filter(m => m.fecha && m.fecha >= ahora)
    .sort((a, b) => a.fecha - b.fecha)
    .slice(0, 5)

  const badgeInfo = (fecha) => {
    const diff = fecha.getTime() - ahora.getTime()
    const dias = Math.ceil(diff / 86400000)
    if (dias === 0) return { label: 'Hoy', color: '#22c55e' }
    if (dias === 1) return { label: 'Mañana', color: '#eab308' }
    return { label: `${dias} días`, color: '#6b7280' }
  }

  if (!proximos.length) {
    return <p style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '13px' }}>No hay monitoreos programados.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {proximos.map((m, i) => {
        const finca = m.cultivo?.idFinca ? fincaMap[m.cultivo.idFinca] : null
        const badge = badgeInfo(m.fecha)
        return (
          <div key={m.idMonitoreo ?? i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>{finca?.nombreFinca || m.cultivo?.nombreCultivo || 'Sin asignar'}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                {m.fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: badge.color + '22', color: badge.color }}>
              {badge.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function DashboardMap({ fincaMap }) {
  const fincasConCoords = Object.values(fincaMap).filter(f => f.latitud && f.longitud)
  const hasData = fincasConCoords.length > 0

  const avgLat = hasData
    ? fincasConCoords.reduce((s, f) => s + parseFloat(f.latitud), 0) / fincasConCoords.length
    : 4.57
  const avgLng = hasData
    ? fincasConCoords.reduce((s, f) => s + parseFloat(f.longitud), 0) / fincasConCoords.length
    : -74.29

  return (
    <div>
      <MapContainer
        center={[avgLat, avgLng]}
        zoom={hasData ? 8 : 6}
        style={{ height: '260px', width: '100%', borderRadius: '12px', zIndex: 0 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {hasData && fincasConCoords.map(f => (
          <Marker key={f.idFinca} position={[parseFloat(f.latitud), parseFloat(f.longitud)]}>
            <Tooltip direction="top" offset={[0, -10]} permanent={false}>
              <strong>{f.nombreFinca}</strong><br />
              {f.municipio ? `${f.municipio}, ${f.departamento || ''}` : ''}<br />
              {f.totalCultivos ? `Cultivos: ${f.totalCultivos}` : ''}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      {!hasData && (
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
          No hay fincas con coordenadas registradas.
        </p>
      )}
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Sin roya
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} /> Con roya
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#eab308', display: 'inline-block' }} /> Pendientes
        </div>
      </div>
    </div>
  )
}

function ImpactMetrics({ stats, monitoreos, fincas, analisis, nivelRoyaMap }) {
  const fuente = [...analisis, ...monitoreos]
  const idSet = new Set()
  const unicos = fuente.filter(i => {
    const id = i.idAnalisis ?? i.idMonitoreo ?? i.id_monitoreo
    if (!id || idSet.has(id)) return false
    idSet.add(id)
    return true
  })
  const totalFuente = unicos.length || 1
  const sinRoya = unicos.filter(i => extraerNivel(i, nivelRoyaMap) === 'Sano').length
  const pctSinRoya = Math.round((sinRoya / totalFuente) * 100)

  const fincasConMon = new Set(
    monitoreos.filter(m => m.cultivo?.idFinca).map(m => m.cultivo.idFinca)
  ).size
  const pctCobertura = fincas.length > 0 ? Math.round((fincasConMon / fincas.length) * 100) : 0

  const metrics = [
    { icon: <BiTrendingUp size={20} />, color: '#22c55e', value: `${pctSinRoya}%`, label: 'Sin roya detectada' },
    { icon: <BiDroplet size={20} />, color: '#3b82f6', value: `${pctCobertura}%`, label: 'Cobertura de monitoreo en fincas' },
    { icon: <BiGrid size={20} />, color: '#eab308', value: `${totalFuente}`, label: 'Registros analizados en total' },
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

// ─── Componente principal ─────────────────────────────────────────────────────

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
  const [trends, setTrends] = useState({
    fincas: '0%',
    expertos: '0%',
    cafeteros: '0%',
    monitoreos: '0%',
  })
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
    try {
      return fmtDateRange(new Date(fechaInicio + 'T12:00:00'), new Date(fechaFin + 'T12:00:00'))
    } catch { return 'Filtrar por fecha' }
  }, [fechaInicio, fechaFin])

  // Datos filtrados por rango de fechas
  const filteredMonitoreos = useMemo(() => {
    if (!fechaInicio || !fechaFin) return allMonitoreos
    const from = new Date(fechaInicio + 'T00:00:00')
    const to = new Date(fechaFin + 'T23:59:59')
    return allMonitoreos.filter(m => {
      const d = safeDate(m.fechaMonitoreo ?? m.fecha_monitoreo)
      return d && d >= from && d <= to
    })
  }, [allMonitoreos, fechaInicio, fechaFin])

  const filteredAnalisis = useMemo(() => {
    if (!fechaInicio || !fechaFin) return allAnalisis
    const from = new Date(fechaInicio + 'T00:00:00')
    const to = new Date(fechaFin + 'T23:59:59')
    return allAnalisis.filter(a => {
      const d = safeDate(a.fechaAnalisis ?? a.fecha_analisis ?? a.fechaMonitoreo ?? a.fecha_monitoreo)
      return d && d >= from && d <= to
    })
  }, [allAnalisis, fechaInicio, fechaFin])

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

        // ── Mapa niveles roya (idNivel → nombreNivel) ──
        const nivelesData = nivelesRes.status === 'fulfilled' ? getArrayData(nivelesRes.value.data) : []
        const nvMap = {}
        nivelesData.forEach(n => { nvMap[n.idNivel] = n.nombreNivel })
        setNivelRoyaMap(nvMap)

        // ── Fincas ──
        const fincas = fincasRes.status === 'fulfilled' ? getArrayData(fincasRes.value.data) : []
        const fincasConUbicacion = fincas.filter(f => f.latitud && f.longitud).length
        const fMap = {}
        fincas.forEach(f => { fMap[f.idFinca] = f })
        setFincaMap(fMap)
        setAllFincas(fincas)

        // ── Expertos ──
        const expertosData = expertosRes.status === 'fulfilled' ? getArrayData(expertosRes.value.data) : []
        const isActivo = (e) => {
          const a = e.activo
          return a === undefined || a === null || a === true || a === 1 || a === '1' || a === 'true'
        }
        const expertosActivos = expertosData.filter(isActivo).length
        const expertosInactivos = expertosData.length - expertosActivos

        // ── Cafeteros ──
        const cafeterosData = cafeterosRes.status === 'fulfilled' ? getArrayData(cafeterosRes.value.data) : []
        const cafeterosActivos = cafeterosData.filter(isActivo).length

        // ── Monitoreos ──
        const todosMonitoreos = monitoreosRes.status === 'fulfilled' ? getArrayData(monitoreosRes.value.data) : []
        setAllMonitoreos(todosMonitoreos)

        // ── Análisis IA (contienen el nivel de roya real) ──
        const analisisData = analisisRes.status === 'fulfilled' ? getArrayData(analisisRes.value.data) : []
        setAllAnalisis(analisisData)

        const ahora = new Date()

        // Monitoreos este mes
        const monEsteMes = todosMonitoreos.filter(mon => {
          const fd = safeDate(mon.fechaMonitoreo ?? mon.fecha_monitoreo)
          return fd && fd.getMonth() === ahora.getMonth() && fd.getFullYear() === ahora.getFullYear()
        }).length

        // ── Stats ──
        setStats({
          fincas: fincas.length,
          fincasConUbicacion,
          expertosActivos,
          expertosInactivos,
          cafeterosActivos,
          monEsteMes,
        })

        // ── Trends calculados con datos reales ──
        // Fincas: compara fincas creadas esta semana vs semana anterior
        const fincasTrend = calcWeekTrend(fincas, 'createdAt') || calcWeekTrend(fincas, 'created_at') || calcWeekTrend(fincas, 'fechaCreacion')
        // Expertos activos: no tenemos fecha de activación → comparamos por fecha de registro
        const expertosTrend = calcWeekTrend(expertosData, 'createdAt') || calcWeekTrend(expertosData, 'created_at')
        const cafeterosTrend = calcWeekTrend(cafeterosData, 'createdAt') || calcWeekTrend(cafeterosData, 'created_at')
        const monitoreosTrend = calcWeekTrend(todosMonitoreos, 'fechaMonitoreo') || calcWeekTrend(todosMonitoreos, 'fecha_monitoreo')

        setTrends({
          fincas: fincasTrend || 'N/A',
          expertos: expertosTrend || 'N/A',
          cafeteros: cafeterosTrend || 'N/A',
          monitoreos: monitoreosTrend || 'N/A',
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
    {
      icon: <BiBuildings size={22} />,
      color: '#2e7d32', bg: '#eef6e9',
      label: 'Fincas activas',
      val: loading ? '...' : stats.fincas,
      trend: trends.fincas,
    },
    {
      icon: <BiGroup size={22} />,
      color: '#2e7d32', bg: '#e8f5e9',
      label: 'Expertos activos',
      val: loading ? '...' : stats.expertosActivos,
      trend: trends.expertos,
    },
    {
      icon: <BiUser size={22} />,
      color: '#d97706', bg: '#fef3e2',
      label: 'Cafeteros activos',
      val: loading ? '...' : stats.cafeterosActivos,
      trend: trends.cafeteros,
    },
    {
      icon: <BiCalendar size={22} />,
      color: '#0369a1', bg: '#e0f2fe',
      label: 'Monitoreos este mes',
      val: loading ? '...' : stats.monEsteMes,
      trend: trends.monitoreos,
    },
  ]

  const getTrendColor = (trend) => {
    if (!trend || trend === 'N/A') return '#9ca3af'
    return trend.startsWith('-') ? '#ef4444' : '#22c55e'
  }

  const getTrendIcon = (trend) => {
    if (!trend || trend === 'N/A') return '—'
    return trend.startsWith('-') ? '↓' : '↑'
  }

  return (
    <div className="dashboard">
      {loading && <Loading type="overlay" text="Cargando dashboard..." />}

      {/* ═══════ 1. BANNER DE BIENVENIDA ═══════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="welcome-avatar-sm">
            {user?.fotoPerfil ? (
              <img src={user.fotoPerfil} alt="avatar" className="welcome-avatar-img-sm" />
            ) : (
              <BiUser size={20} />
            )}
          </div>
          <div>
            <h1 className="welcome-main-title" style={{ margin: 0 }}>
              ¡Hola, {user?.nombre || 'Admin'}!
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Aquí tienes un resumen completo del estado de tu sistema CoffeeLife.
            </p>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowDatePicker(!showDatePicker)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', fontSize: '13px', color: '#374151', cursor: 'pointer', userSelect: 'none' }}
          >
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

      {/* ═══════ 2. KPI CARDS ═══════ */}
      <div className="header-kpi-cards-wrapper" style={{ gap: '16px' }}>
        {kpiCards.map((kpi, i) => (
          <div key={i} style={{ background: '#fff', padding: '20px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px', flex: 1, border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: kpi.bg, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {kpi.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1b5e20', lineHeight: 1.1 }}>{kpi.val}</span>
                <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500, marginTop: '2px' }}>{kpi.label}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: getTrendColor(kpi.trend), fontWeight: 600 }}>
              <span>{getTrendIcon(kpi.trend)}</span>
              <span>{kpi.trend}</span>
              {kpi.trend !== 'N/A' && (
                <span style={{ color: '#9ca3af', fontWeight: 400 }}>vs semana anterior</span>
              )}
            </div>
          </div>
        ))}
        <CoffeePriceCard />
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {/* ═══════ 3. TRES COLUMNAS ═══════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>Niveles de roya en cultivos</h2>
          <DonutChart monitoreos={filteredMonitoreos} analisis={filteredAnalisis} nivelRoyaMap={nivelRoyaMap} />
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button onClick={() => onNavigate?.('monitoreos')} style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Ver reporte completo <BiRightArrowAlt size={14} />
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>Tendencia de roya (últimos 7 días)</h2>
          <LineChart monitoreos={filteredMonitoreos} />
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button onClick={() => onNavigate?.('monitoreos')} style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Ver más estadísticas <BiRightArrowAlt size={14} />
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>Actividad reciente</h2>
          <RecentActivity monitoreos={filteredMonitoreos} fincaMap={fincaMap} />
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button onClick={() => onNavigate?.('monitoreos')} style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Ver toda la actividad <BiRightArrowAlt size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ 4. TABLA + PANELES LATERALES ═══════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>Monitoreos recientes</h2>
          <MonitoreosTable monitoreos={[...filteredMonitoreos].sort((a, b) => {
            const fa = safeDate(a.fechaMonitoreo ?? a.fecha_monitoreo)
            const fb = safeDate(b.fechaMonitoreo ?? b.fecha_monitoreo)
            if (!fa && !fb) return 0; if (!fa) return 1; if (!fb) return -1
            return fb - fa
          }).slice(0, 6)} fincaMap={fincaMap} onNavigate={onNavigate} />
          <div style={{ textAlign: 'right', marginTop: '12px' }}>
            <button onClick={() => onNavigate?.('monitoreos')} style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Ver todos los monitoreos <BiRightArrowAlt size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BiTrendingUp size={16} style={{ color: '#ef4444' }} /> Top 5 cultivos con más roya
            </h2>
            <TopRoyaCultivos monitoreos={filteredMonitoreos} analisis={filteredAnalisis} nivelRoyaMap={nivelRoyaMap} />
            <div style={{ textAlign: 'right', marginTop: '12px' }}>
              <button onClick={() => onNavigate?.('monitoreos')} style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Ver reporte completo <BiRightArrowAlt size={14} />
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>Próximos monitoreos programados</h2>
            <UpcomingMonitoreos monitoreos={filteredMonitoreos} fincaMap={fincaMap} />
            <div style={{ textAlign: 'right', marginTop: '12px' }}>
              <button onClick={() => onNavigate?.('monitoreos')} style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Ver calendario completo <BiRightArrowAlt size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ 5. SECCIÓN INFERIOR ═══════ */}
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
          <ImpactMetrics stats={stats} monitoreos={filteredMonitoreos} fincas={allFincas} analisis={filteredAnalisis} nivelRoyaMap={nivelRoyaMap} />
        </div>
      </div>

      {/* ═══════ 6. ACCESOS RÁPIDOS ═══════ */}
      <div className="db-quick-section">
        <h2 className="db-section-title">Accesos rápidos</h2>
        <div className="db-quick-grid">
          {quickLinks.map((link, idx) => (
            <div
              key={idx}
              className={`db-quick-card delay-${idx + 1}`}
              onClick={() => onNavigate?.(link.page)}
              role="button"
              tabIndex={0}
            >
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