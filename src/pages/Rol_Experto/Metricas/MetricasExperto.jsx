import { useState, useEffect, useMemo } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { BiDroplet, BiPackage, BiMessageDetail, BiTime, BiCheckCircle, BiTrendingUp, BiBarChart, BiLineChart } from 'react-icons/bi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Loading from '../../../components/Loading'
import './MetricasExperto.css'

const getArr = (d) => {
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.data)) return d.data
  return []
}

const ROYA_LEVELS = { crítico: 4, alto: 3, medio: 2, bajo: 1, sin: 0, sano: 0, low: 1, medium: 2, high: 3, critico: 4 }
const ROYA_COLORS = { crítico: '#dc2626', alto: '#f59e0b', medio: '#f97316', bajo: '#22c55e', sin: '#6b7280' }
const ROYA_LABELS = { 0: 'Sin roya', 1: 'Bajo', 2: 'Medio', 3: 'Alto', 4: 'Crítico' }
const FINCA_COLORS = ['#1b5e20', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#be185d', '#65a30d', '#f97316', '#6366f1']
const SEVERITY_BANDS = [
  { min: 0, max: 1, color: '#22c55e', label: 'Bajo' },
  { min: 1, max: 2, color: '#f59e0b', label: 'Medio' },
  { min: 2, max: 3, color: '#f97316', label: 'Alto' },
  { min: 3, max: 4, color: '#dc2626', label: 'Crítico' },
]

const normalizeRoya = (nivel) => {
  if (!nivel) return { value: 0, label: 'Sin roya', color: '#6b7280' }
  const n = nivel.toLowerCase().trim()
  for (const [key, val] of Object.entries(ROYA_LEVELS)) {
    if (n.includes(key)) return { value: val, label: key.charAt(0).toUpperCase() + key.slice(1), color: ROYA_COLORS[key] }
  }
  return { value: 0, label: 'Sin roya', color: '#6b7280' }
}

const extractRoyaFromObs = (obs = '') => {
  const match = obs.match(/\[ROYA:([^\]]+)\]/)
  if (match) return match[1].trim()
  const fallback = obs.match(/Nivel de roya:\s*([^\n]+)/i)
  if (fallback) return fallback[1].trim()
  const severidad = obs.match(/Severidad:\s*(\w+)/i)
  if (severidad) return severidad[1].trim()
  return null
}

const fmtFecha = (raw) => {
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Bogota' })
}

const fmtFechaShort = (raw) => {
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'America/Bogota' })
}

const timeAgo = (raw) => {
  if (!raw) return ''
  const d = new Date(raw)
  const now = new Date()
  const diff = Math.floor((now - d) / 60000)
  if (diff < 1) return 'Ahora'
  if (diff < 60) return `Hace ${diff} min`
  const hrs = Math.floor(diff / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `Hace ${days}d`
  return fmtFecha(raw)
}

const RoyaTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="roya-tooltip">
      <div className="roya-tooltip-header">{label}</div>
      <div className="roya-tooltip-body">
        {payload.map((entry, i) => (
          <div key={i} className="roya-tooltip-row">
            <span className="roya-tooltip-dot" style={{ background: entry.color }} />
            <span className="roya-tooltip-name">{entry.name}</span>
            <span className="roya-tooltip-value" style={{ color: entry.color }}>{ROYA_LABELS[entry.value] || entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MetricasExperto({ finca, onNavigate }) {
  const { user } = useAuth()
  const [fincasDisponibles, setFincasDisponibles] = useState([])
  const [selectedFincaId, setSelectedFincaId] = useState(finca?.idFinca ?? '')
  const [fincasLoading, setFincasLoading] = useState(true)
  const [cultivos, setCultivos] = useState([])
  const [selectedCultivo, setSelectedCultivo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Datos crudos
  const [monitoreos, setMonitoreos] = useState([])
  const [aplicaciones, setAplicaciones] = useState([])
  const [recomendaciones, setRecomendaciones] = useState([])
  const [nivelesRoya, setNivelesRoya] = useState([])
  const [insumos, setInsumos] = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [tiposRec, setTiposRec] = useState([])
  const [prioridades, setPrioridades] = useState([])
  const [todosCultivos, setTodosCultivos] = useState([])

  const fincaActual = fincasDisponibles.find((f) => Number(f.idFinca) === Number(selectedFincaId)) || finca
  const idFinca = fincaActual?.idFinca

  const getArrayData = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.data)) return data.data
    return []
  }

  // Cargar fincas del experto
  useEffect(() => {
    const cargar = async () => {
      try {
        const expertoId = user?.idUsuario ?? user?.id
        const asigRes = await api.get('/asignaciones_expertos', { params: { limit: 1000 } })
        const asignaciones = getArrayData(asigRes.data).filter(
          (a) => Number(a.idExperto ?? a.id_experto) === Number(expertoId)
        )
        const fincas = asignaciones.map((a) => {
          const f = a.finca || {}
          return {
            idFinca: f.idFinca || a.idFinca,
            nombre: f.nombreFinca || f.nombre || `Finca #${f.idFinca || a.idFinca || '-'}`,
            municipio: f.municipio || '-',
            departamento: f.departamento || '-',
          }
        }).filter((f) => f.idFinca)
        setFincasDisponibles(fincas)
      } catch (e) {
        console.error('Error cargando fincas:', e)
      } finally {
        setFincasLoading(false)
      }
    }
    cargar()
  }, [])

  // Cargar catálogos globales y todos los cultivos (una sola vez)
  useEffect(() => {
    Promise.all([
      api.get('/cat_niveles_roya').catch(() => ({ data: [] })),
      api.get('/insumos').catch(() => ({ data: [] })),
      api.get('/tratamientos').catch(() => ({ data: [] })),
      api.get('/cat_tipos_recomendaciones').catch(() => ({ data: [] })),
      api.get('/cat_prioridades').catch(() => ({ data: [] })),
      api.get('/cultivos').catch(() => ({ data: [] })),
    ]).then(([nivRes, insRes, tratRes, tipRes, priRes, cultRes]) => {
      setNivelesRoya(getArr(nivRes.data))
      setInsumos(getArr(insRes.data))
      setTratamientos(getArr(tratRes.data))
      setTiposRec(getArr(tipRes.data))
      setPrioridades(getArr(priRes.data))
      setTodosCultivos(getArr(cultRes.data))
    }).catch((e) => console.error('Error cargando catálogos:', e))
  }, [])

  // Cargar cultivos según finca seleccionada
  useEffect(() => {
    if (!idFinca) {
      setCultivos([])
      setSelectedCultivo('')
      return
    }
    if (todosCultivos.length === 0) return
    const filtrados = todosCultivos.filter((c) => Number(c.idFinca) === Number(idFinca))
    setCultivos(filtrados)
    const sigueSiendoValido = filtrados.some((c) => Number(c.idCultivo) === Number(selectedCultivo))
    if (filtrados.length > 0 && (!selectedCultivo || !sigueSiendoValido)) {
      setSelectedCultivo(String(filtrados[0].idCultivo))
    }
  }, [selectedFincaId, todosCultivos])

  // Cargar datos cuando cambian filtros
  useEffect(() => {
    setLoading(true)
    setError('')

    const fetchData = async () => {
      try {
        let idsCultivo
        if (idFinca) {
          if (cultivos.length === 0) { setLoading(false); return }
          idsCultivo = selectedCultivo && selectedCultivo !== ''
            ? [Number(selectedCultivo)]
            : cultivos.map((c) => Number(c.idCultivo))
        } else {
          idsCultivo = todosCultivos
            .filter((c) => fincasDisponibles.some((f) => Number(f.idFinca) === Number(c.idFinca)))
            .map((c) => Number(c.idCultivo))
        }

        const [monRes, aplRes, recRes] = await Promise.all([
          api.get('/monitoreos', { params: { limit: 500 } }),
          api.get('/aplicaciones_tratamientos', { params: { perPage: 1000 } }),
          api.get('/recomendaciones', { params: { limit: 500 } }),
        ])

        const todosMon = getArr(monRes.data).filter((m) =>
          idsCultivo.includes(Number(m.idCultivo ?? m.id_cultivo))
        )
        setMonitoreos(todosMon)

        const idsMon = new Set(todosMon.map((m) => Number(m.idMonitoreo ?? m.id_monitoreo)))
        const todasRecs = getArr(recRes.data).filter((r) =>
          idsMon.has(Number(r.idMonitoreo ?? r.id_monitoreo))
        )
        setRecomendaciones(todasRecs)

        const todasApl = getArr(aplRes.data)
        setAplicaciones(todasApl)
      } catch (e) {
        setError('Error al cargar métricas.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [idFinca, selectedCultivo, cultivos, fincasDisponibles])

  // ─── Datos derivados ──────────────────────────────

  // Evolución de roya
  const royaEvolucion = useMemo(() => {
    return monitoreos
      .filter((m) => m.fechaMonitoreo || m.fecha_monitoreo)
      .sort((a, b) => new Date(a.fechaMonitoreo ?? a.fecha_monitoreo) - new Date(b.fechaMonitoreo ?? b.fecha_monitoreo))
      .map((m) => {
        const nivel = extractRoyaFromObs(m.observaciones || '')
        const { value, label } = normalizeRoya(nivel || m.nivelRoya?.nombre || m.nivel_roya)
        const cult = todosCultivos.find((c) => Number(c.idCultivo) === Number(m.idCultivo ?? m.id_cultivo))
        const finca = fincasDisponibles.find((f) => Number(f.idFinca) === Number(cult?.idFinca))
        return {
          fecha: fmtFechaShort(m.fechaMonitoreo ?? m.fecha_monitoreo),
          fechaRaw: m.fechaMonitoreo ?? m.fecha_monitoreo,
          nivel: value,
          nivelLabel: label,
          id: m.idMonitoreo ?? m.id_monitoreo,
          fincaId: finca?.idFinca,
          fincaNombre: finca?.nombre || 'Desconocida',
        }
      })
  }, [monitoreos, todosCultivos, fincasDisponibles])

  // Datos para small multiples (un mini-chart por finca)
  const royaPorFincaArray = useMemo(() => {
    return fincasDisponibles
      .map((f) => ({
        id: f.idFinca,
        nombre: f.nombre,
        color: FINCA_COLORS[fincasDisponibles.indexOf(f) % FINCA_COLORS.length],
        data: royaEvolucion.filter((r) => Number(r.fincaId) === Number(f.idFinca)),
      }))
      .filter((f) => f.data.length > 0)
  }, [royaEvolucion, fincasDisponibles])

  // Seguimiento de tratamientos
  const seguimientoTrat = useMemo(() => {
    const idsMon = new Set(monitoreos.map((m) => Number(m.idMonitoreo ?? m.id_monitoreo)))
    const idsTratDeRecs = new Set(
      recomendaciones
        .map((r) => Number(r.idTratamiento ?? r.id_tratamiento))
        .filter(Boolean)
    )

    const unicas = new Map()
    for (const a of aplicaciones) {
      const idTrat = Number(a.idTratamiento ?? a.id_tratamiento)
      if (!idsTratDeRecs.has(idTrat) && !idsMon.has(Number(a.idMonitoreo ?? a.id_monitoreo))) continue
      const key = a.idAplicacion ?? a.id_aplicacion
      if (key && !unicas.has(key)) unicas.set(key, a)
    }
    return Array.from(unicas.values())
      .sort((a, b) => new Date(b.fechaRegistro || b.fecha_reistro) - new Date(a.fechaRegistro || a.fecha_reistro))
      .map((a) => {
        const idTrat = Number(a.idTratamiento ?? a.id_tratamiento)
        const rec = recomendaciones.find((r) => Number(r.idTratamiento ?? r.id_tratamiento) === idTrat)
        const tratamiento = tratamientos.find((t) => Number(t.idTratamiento ?? t.id_tratamiento) === idTrat)
        const insumo = insumos.find((i) => Number(i.idInsumo ?? i.id_insumo) === Number(a.idInsumo ?? a.id_insumo))
        // Parsear dosis/frecuencia/duracion desde observacion pipe-delimitado
        const obsTexto = a.observacion || a.observaciones || ''
        const pipeMatch = obsTexto.match(/^\[([^|]*)(?:\|([^|]*))?(?:\|([^|]*))?(?:\|([^|]*))?\]/)
        const fromPipe = pipeMatch ? {
          dosis: pipeMatch[2] || '',
          frecuencia: pipeMatch[3] || '',
          duracion: pipeMatch[4] || '',
        } : {}
        return {
          id: a.idAplicacion ?? a.id_aplicacion,
          fecha: a.fechaRegistro || a.fecha_reistro || a.fecha_aplicacion,
          producto: insumo?.nombre || a.insumo?.nombre || a.nombreInsumo || tratamiento?.nombre || '—',
          dosis: fromPipe.dosis || a.dosis || tratamiento?.dosis || '—',
          frecuencia: fromPipe.frecuencia || a.frecuencia || tratamiento?.frecuencia || '—',
          duracion: fromPipe.duracion || a.duracion || tratamiento?.duracion || '—',
          observacion: obsTexto,
          esRecomendado: !!rec,
        }
      })
  }, [aplicaciones, recomendaciones, tratamientos, insumos, monitoreos])

  // Cumplimiento de recomendaciones
  const cumplimiento = useMemo(() => {
    const total = recomendaciones.length
    const idsTratRec = new Set(
      recomendaciones
        .map((r) => Number(r.idTratamiento ?? r.id_tratamiento))
        .filter(Boolean)
    )
    const aplicadas = aplicaciones.filter((a) =>
      idsTratRec.has(Number(a.idTratamiento ?? a.id_tratamiento))
    )
    const unicas = new Set(aplicadas.map((a) => Number(a.idTratamiento ?? a.id_tratamiento)))
    const cumplidas = unicas.size
    const pendientes = idsTratRec.size - cumplidas
    const sinTratamiento = recomendaciones.filter((r) => !r.idTratamiento && !r.id_tratamiento).length

    return { total, cumplidas, pendientes: Math.max(0, pendientes), sinTratamiento }
  }, [recomendaciones, aplicaciones])

  // Timeline unificada
  const timeline = useMemo(() => {
    const items = []
    monitoreos.forEach((m) => {
      const nivel = extractRoyaFromObs(m.observaciones || '')
      const { label } = normalizeRoya(nivel || m.nivelRoya?.nombre || m.nivel_roya)
      items.push({
        fecha: m.fechaMonitoreo ?? m.fecha_monitoreo,
        tipo: 'monitoreo',
        descripcion: `Monitoreo — Roya: ${label}`,
        id: m.idMonitoreo ?? m.id_monitoreo,
        icon: 'droplet',
      })
    })
    seguimientoTrat.forEach((a) => {
      items.push({
        fecha: a.fecha,
        tipo: 'tratamiento',
        descripcion: `Aplicación: ${a.producto}${a.dosis !== '—' ? ` (${a.dosis})` : ''}`,
        id: a.id,
        icon: 'package',
      })
    })
    recomendaciones.forEach((r) => {
      const tipo = tiposRec.find((t) => Number(t.idTipo ?? t.id_tipo) === Number(r.idTipo ?? r.id_tipo))
      items.push({
        fecha: r.fechaRegistro || r.fecha_reistro || r.fecha_limite,
        tipo: 'recomendacion',
        descripcion: `Recomendación: ${tipo?.nombreTipo || tipo?.nombre || 'General'}`,
        id: r.idRecomendacion ?? r.id_recomendacion,
        icon: 'message',
      })
    })
    return items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [monitoreos, seguimientoTrat, recomendaciones, tiposRec])

  const totalMonitoreos = monitoreos.length
  const totalAplicaciones = seguimientoTrat.length

  if (fincasLoading) return <Loading type="content" text="Cargando fincas..." />

  return (
    <div className="metricas-page">
      {/* Header */}
      <div className="metricas-header">
        <div className="metricas-header-left">
          <BiTrendingUp size={22} />
          <div>
            <h1>Métricas{idFinca ? ` de ${fincaActual?.nombre || 'la finca'}` : ' generales'}</h1>
            <p>Evolución, tratamientos y cumplimiento</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="metricas-filtros">
        <div className="metricas-filtro-group">
          <label>Finca</label>
          <select value={selectedFincaId} onChange={(e) => setSelectedFincaId(e.target.value)}>
            <option value="">Seleccionar finca...</option>
            {fincasDisponibles.map((f) => (
              <option key={f.idFinca} value={f.idFinca}>{f.nombre}</option>
            ))}
          </select>
        </div>
        {idFinca && (
          <div className="metricas-filtro-group">
            <label>Cultivo</label>
            <select value={selectedCultivo} onChange={(e) => setSelectedCultivo(e.target.value)}>
              <option value="">Todos los cultivos</option>
              {cultivos.map((c) => (
                <option key={c.idCultivo} value={c.idCultivo}>{c.nombreCultivo || c.nombre_cultivo || '—'}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {fincasDisponibles.length === 0 ? (
        <div className="metrica-empty">No tenés fincas asignadas.</div>
      ) : loading ? (
        <Loading type="content" text="Calculando métricas..." />
      ) : error ? (
        <div className="metrica-error">{error}</div>
      ) : (
        <>
          {/* Resumen del experto (solo vista general) */}
          {!idFinca && (
            <div className="metrica-resumen-experto">
              <div className="metrica-re-header">
                <BiTrendingUp size={20} />
                <h3>Resumen del Experto</h3>
              </div>
              <div className="metrica-re-grid">
                <div className="metrica-re-item">
                  <span className="metrica-re-num">{fincasDisponibles.length}</span>
                  <span className="metrica-re-label">Fincas asignadas</span>
                </div>
                <div className="metrica-re-item">
                  <span className="metrica-re-num">{totalMonitoreos}</span>
                  <span className="metrica-re-label">Monitoreos realizados</span>
                </div>
                <div className="metrica-re-item">
                  <span className="metrica-re-num">{totalAplicaciones}</span>
                  <span className="metrica-re-label">Tratamientos aplicados</span>
                </div>
                <div className="metrica-re-item">
                  <span className="metrica-re-num">{cumplimiento.total}</span>
                  <span className="metrica-re-label">Recomendaciones generadas</span>
                </div>
                <div className="metrica-re-item">
                  <span className="metrica-re-num">{cumplimiento.cumplidas}</span>
                  <span className="metrica-re-label">Recomendaciones cumplidas</span>
                </div>
                <div className="metrica-re-item">
                  <span className="metrica-re-num">{cumplimiento.total > 0 ? Math.round((cumplimiento.cumplidas / cumplimiento.total) * 100) : 0}%</span>
                  <span className="metrica-re-label">Tasa de cumplimiento</span>
                </div>
              </div>
            </div>
          )}

          {/* KPIs rápidos (solo cuando hay finca seleccionada) */}
          {idFinca && (
            <div className="metricas-kpis">
              <div className="metrica-kpi">
                <BiDroplet size={20} />
                <div><strong>{totalMonitoreos}</strong><span>Monitoreos</span></div>
              </div>
              <div className="metrica-kpi">
                <BiPackage size={20} />
                <div><strong>{totalAplicaciones}</strong><span>Aplicaciones</span></div>
              </div>
              <div className="metrica-kpi">
                <BiMessageDetail size={20} />
                <div><strong>{cumplimiento.total}</strong><span>Recomendaciones</span></div>
              </div>
              <div className="metrica-kpi">
                <BiCheckCircle size={20} />
                <div><strong>{cumplimiento.cumplidas}</strong><span>Cumplidas</span></div>
              </div>
            </div>
          )}

          <div className="metricas-grid">
            {/* Evolución de Roya */}
            <div className="metrica-card metrica-card--chart">
              <div className="metrica-card-header">
                <BiLineChart size={18} />
                <h3>Evolución de Roya</h3>
              </div>
              <div className="metrica-card-body">
                {royaEvolucion.length === 0 ? (
                  <div className="metrica-empty-chart">Sin monitoreos en el período</div>
                ) : !idFinca ? (
                  <div className="roya-mini-grid">
                    {royaPorFincaArray.map((f) => (
                      <div key={f.id} className="roya-mini-card">
                        <div className="roya-mini-header">
                          <span className="roya-mini-dot" style={{ background: f.color }} />
                          <span className="roya-mini-name">{f.nombre}</span>
                          <span className="roya-mini-count">{f.data.length} monitoreos</span>
                        </div>
                        <ResponsiveContainer width="100%" height={130}>
                          <LineChart data={f.data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="fecha" tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e2e8f0" tickLine={false} axisLine={false} />
                            <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => (ROYA_LABELS[v] || '').substring(0, 4)} />
                            <Tooltip content={<RoyaTooltip />} cursor={{ stroke: '#94a3b8', strokeDasharray: '2 2' }} />
                            <Line type="monotone" dataKey="nivel" stroke={f.color} strokeWidth={2} dot={{ r: 2.5, strokeWidth: 1, stroke: '#fff' }} activeDot={{ r: 5, strokeWidth: 1.5, stroke: '#fff' }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={royaEvolucion}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tickFormatter={(v) => ROYA_LABELS[v] || ''} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <Tooltip
                        formatter={(value) => [ROYA_LABELS[value] || value, 'Nivel de roya']}
                        labelFormatter={(label) => `Fecha: ${label}`}
                      />
                      <Line type="monotone" dataKey="nivel" stroke="#1b5e20" strokeWidth={2} dot={{ r: 4, fill: '#1b5e20' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Cumplimiento de Recomendaciones */}
            <div className="metrica-card metrica-card--chart">
              <div className="metrica-card-header">
                <BiBarChart size={18} />
                <h3>Cumplimiento de Recomendaciones</h3>
              </div>
              <div className="metrica-card-body">
                {cumplimiento.total === 0 ? (
                  <div className="metrica-empty-chart">Sin recomendaciones</div>
                ) : (
                  <div className="metrica-cumplimiento">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Cumplidas', value: cumplimiento.cumplidas, color: '#22c55e' },
                            { name: 'Pendientes', value: cumplimiento.pendientes, color: '#f59e0b' },
                            { name: 'Sin tratamiento', value: cumplimiento.sinTratamiento, color: '#9ca3af' },
                          ].filter((d) => d.value > 0)}
                          cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}
                          dataKey="value"
                        >
                          {(cumplimiento.total > 0 ? [
                            { name: 'Cumplidas', value: cumplimiento.cumplidas, color: '#22c55e' },
                            { name: 'Pendientes', value: cumplimiento.pendientes, color: '#f59e0b' },
                            { name: 'Sin tratamiento', value: cumplimiento.sinTratamiento, color: '#9ca3af' },
                          ].filter((d) => d.value > 0) : []).map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="metrica-cumplimiento-leyenda">
                      <div className="metrica-leyenda-item">
                        <span className="metrica-leyenda-dot" style={{ background: '#22c55e' }} />
                        <span>Cumplidas: {cumplimiento.cumplidas}</span>
                      </div>
                      <div className="metrica-leyenda-item">
                        <span className="metrica-leyenda-dot" style={{ background: '#f59e0b' }} />
                        <span>Pendientes: {cumplimiento.pendientes}</span>
                      </div>
                      <div className="metrica-leyenda-item">
                        <span className="metrica-leyenda-dot" style={{ background: '#9ca3af' }} />
                        <span>Sin tratamiento: {cumplimiento.sinTratamiento}</span>
                      </div>
                      <div className="metrica-leyenda-total">
                        Total: {cumplimiento.total} recomendaciones
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seguimiento de Tratamientos */}
            <div className="metrica-card metrica-card--full">
              <div className="metrica-card-header">
                <BiPackage size={18} />
                <h3>Seguimiento de Tratamientos</h3>
                <span className="metrica-badge">{seguimientoTrat.length} aplicaciones</span>
              </div>
              <div className="metrica-card-body metrica-card-body--table">
                {seguimientoTrat.length === 0 ? (
                  <div className="metrica-empty-chart">Sin aplicaciones registradas</div>
                ) : (
                  <div className="metrica-table-scroll">
                    <table className="metrica-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Producto</th>
                          <th>Dosis</th>
                          <th>Frecuencia</th>
                          <th>Duración</th>
                          <th>Origen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seguimientoTrat.slice(0, 50).map((a) => (
                          <tr key={a.id}>
                            <td>{fmtFecha(a.fecha)}</td>
                            <td className="metrica-td-producto">{a.producto}</td>
                            <td>{a.dosis}</td>
                            <td>{a.frecuencia}</td>
                            <td>{a.duracion}</td>
                            <td>
                              <span className={`metrica-origen ${a.esRecomendado ? 'metrica-origen--rec' : 'metrica-origen--dir'}`}>
                                {a.esRecomendado ? 'Recomendado' : 'Directo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Línea de tiempo */}
            <div className="metrica-card metrica-card--full">
              <div className="metrica-card-header">
                <BiTime size={18} />
                <h3>Línea de tiempo</h3>
                <span className="metrica-badge">{timeline.length} eventos</span>
              </div>
              <div className="metrica-card-body">
                {timeline.length === 0 ? (
                  <div className="metrica-empty-chart">Sin actividad registrada</div>
                ) : (
                  <div className="metrica-timeline">
                    {timeline.slice(0, 30).map((item) => (
                      <div key={`${item.tipo}-${item.id}`} className={`metrica-tl-item metrica-tl-item--${item.tipo}`}>
                        <div className="metrica-tl-icon">
                          {item.icon === 'droplet' ? <BiDroplet size={14} /> :
                           item.icon === 'package' ? <BiPackage size={14} /> :
                           <BiMessageDetail size={14} />}
                        </div>
                        <div className="metrica-tl-content">
                          <span className="metrica-tl-desc">{item.descripcion}</span>
                          <span className="metrica-tl-date">{timeAgo(item.fecha)}{item.fecha ? ` · ${fmtFecha(item.fecha)}` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}