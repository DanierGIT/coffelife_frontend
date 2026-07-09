import { useState, useEffect, useMemo } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { BiDroplet, BiPackage, BiMessageDetail, BiTime, BiCheckCircle, BiTrendingUp, BiBarChart, BiLineChart } from 'react-icons/bi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
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
        if (fincas.length > 0 && !selectedFincaId) {
          setSelectedFincaId(fincas[0].idFinca)
        }
      } catch (e) {
        console.error('Error cargando fincas:', e)
      } finally {
        setFincasLoading(false)
      }
    }
    cargar()
  }, [])

  // Cargar catálogos y cultivos
  useEffect(() => {
    if (!idFinca) return
    const init = async () => {
      try {
        const [cultivosRes, nivRes, insRes, tratRes, tipRes, priRes] = await Promise.all([
          api.get('/cultivos'),
          api.get('/cat_niveles_roya').catch(() => ({ data: [] })),
          api.get('/insumos').catch(() => ({ data: [] })),
          api.get('/tratamientos').catch(() => ({ data: [] })),
          api.get('/cat_tipos_recomendaciones').catch(() => ({ data: [] })),
          api.get('/cat_prioridades').catch(() => ({ data: [] })),
        ])
        const todos = getArr(cultivosRes.data).filter((c) => Number(c.idFinca) === Number(idFinca))
        setCultivos(todos)
        setNivelesRoya(getArr(nivRes.data))
        setInsumos(getArr(insRes.data))
        setTratamientos(getArr(tratRes.data))
        setTiposRec(getArr(tipRes.data))
        setPrioridades(getArr(priRes.data))

        const sigueSiendoValido = todos.some((c) => Number(c.idCultivo) === Number(selectedCultivo))
        if (todos.length > 0 && (!selectedCultivo || !sigueSiendoValido)) {
          setSelectedCultivo(String(todos[0].idCultivo))
        }
      } catch (e) {
        console.error('Error cargando catálogos:', e)
      }
    }
    init()
  }, [selectedFincaId])

  // Cargar datos cuando cambian filtros
  useEffect(() => {
    if (!idFinca) return
    if (cultivos.length === 0) return
    setLoading(true)
    setError('')

    const fetchData = async () => {
      try {
        const idsCultivo = selectedCultivo && selectedCultivo !== ''
          ? [Number(selectedCultivo)]
          : cultivos.map((c) => Number(c.idCultivo))

        const [monRes, aplRes, recRes] = await Promise.all([
          api.get('/monitoreos', { params: { limit: 500 } }),
          api.get('/aplicaciones_tratamientos', { params: { perPage: 1000 } }),
          api.get('/recomendaciones', { params: { limit: 500 } }),
        ])

        // Filtrar monitoreos por cultivos de esta finca
        const todosMon = getArr(monRes.data).filter((m) =>
          idsCultivo.includes(Number(m.idCultivo ?? m.id_cultivo))
        )
        setMonitoreos(todosMon)

        // Recomendaciones de esos monitoreos
        const idsMon = new Set(todosMon.map((m) => Number(m.idMonitoreo ?? m.id_monitoreo)))
        const todasRecs = getArr(recRes.data).filter((r) =>
          idsMon.has(Number(r.idMonitoreo ?? r.id_monitoreo))
        )
        setRecomendaciones(todasRecs)

        // Aplicaciones: filtrar por ids de tratamiento de las recomendaciones + todas
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
  }, [idFinca, selectedCultivo, cultivos])

  // ─── Datos derivados ──────────────────────────────

  // Evolución de roya
  const royaEvolucion = useMemo(() => {
    return monitoreos
      .filter((m) => m.fechaMonitoreo || m.fecha_monitoreo)
      .sort((a, b) => new Date(a.fechaMonitoreo ?? a.fecha_monitoreo) - new Date(b.fechaMonitoreo ?? b.fecha_monitoreo))
      .map((m) => {
        const nivel = extractRoyaFromObs(m.observaciones || '')
        const { value, label } = normalizeRoya(nivel || m.nivelRoya?.nombre || m.nivel_roya)
        return {
          fecha: fmtFechaShort(m.fechaMonitoreo ?? m.fecha_monitoreo),
          fechaRaw: m.fechaMonitoreo ?? m.fecha_monitoreo,
          nivel: value,
          nivelLabel: label,
          id: m.idMonitoreo ?? m.id_monitoreo,
        }
      })
  }, [monitoreos])

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
            <h1>Métricas{idFinca ? ` de ${fincaActual?.nombre || 'la finca'}` : ''}</h1>
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

      {!idFinca ? (
        fincasDisponibles.length === 0 ? (
          <div className="metrica-empty">No tenés fincas asignadas.</div>
        ) : (
          <div className="metrica-empty">Seleccioná una finca para ver sus métricas.</div>
        )
      ) : loading ? (
        <Loading type="content" text="Calculando métricas..." />
      ) : error ? (
        <div className="metrica-error">{error}</div>
      ) : (
        <>
          {/* KPIs rápidos */}
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