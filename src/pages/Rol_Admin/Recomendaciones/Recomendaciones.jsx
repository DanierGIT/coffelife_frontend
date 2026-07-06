import { useEffect, useState, useMemo, useRef } from 'react'
import api from '../../../services/api'
import './Recomendaciones.css'
import '../Administrador/Administrador.css'
import '../Usuarios/Usuarios.css'
import { BiShow, BiArrowBack, BiSearch, BiChat } from 'react-icons/bi'
import Loading from '../../../components/Loading'

const _date = (r) => { const d = r.fechaRegistro || r.fecha_registro || r.fechaLimite || r.fecha_limite; return d ? new Date(d).getTime() : -Infinity }
const fmt = (val) => {
  if (!val) return '—'
  const d = new Date(val)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO')
}
const fmtDatetime = (val) => {
  if (!val) return '—'
  const d = new Date(val)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const normalizeDate = (value) => {
  if (!value) return ''
  return value.toString().slice(0, 10)
}

// ── Modal de edición ──────────────────────────────────────────────────────────
function EditModal({ recomendacion, onClose, onSaved, monitoreos, tipos, expertos, prioridades }) {
  const [form, setForm] = useState({
    id_monitoreo: recomendacion.idMonitoreo || '',
    id_tipo: recomendacion.idTipo || '',
    id_experto_emisor: recomendacion.idExpertoEmisor || '',
    descripcion: recomendacion.descripcion || '',
    fecha_limite: normalizeDate(recomendacion.fechaLimite),
    id_prioridad: recomendacion.idPrioridad || '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.put(`/recomendaciones/${recomendacion.idRecomendacion}`, {
        id_monitoreo: Number(form.id_monitoreo),
        id_tipo: form.id_tipo ? Number(form.id_tipo) : null,
        id_experto_emisor: form.id_experto_emisor ? Number(form.id_experto_emisor) : null,
        id_prioridad: form.id_prioridad ? Number(form.id_prioridad) : null,
        descripcion: form.descripcion,
        fecha_limite: form.fecha_limite || null,
      })

      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar los cambios.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar recomendacion</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>
              Monitoreo
              <select name="id_monitoreo" value={form.id_monitoreo} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                {monitoreos.map((m) => (
                  <option key={m.idMonitoreo} value={m.idMonitoreo}>
                    #{m.idMonitoreo} - {normalizeDate(m.fechaMonitoreo)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tipo de recomendacion
              <select name="id_tipo" value={form.id_tipo} onChange={handleChange}>
                <option value="">Seleccionar...</option>
                {tipos.map((t) => (
                  <option key={t.idTipo} value={t.idTipo}>
                    {t.nombreTipo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-row">
            <label>
              Experto emisor
              <select name="id_experto_emisor" value={form.id_experto_emisor} onChange={handleChange}>
                <option value="">Seleccionar...</option>
                {expertos.map((u) => (
                  <option key={u.idUsuario} value={u.idUsuario}>
                    {u.nombre} {u.apellido || ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Prioridad
              <select name="id_prioridad" value={form.id_prioridad} onChange={handleChange}>
                <option value="">Seleccionar...</option>
                {prioridades.map((p) => (
                  <option key={p.idPrioridad} value={p.idPrioridad}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Descripcion
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} required rows={3} />
          </label>

          <label>
            Fecha limite
            <input type="date" name="fecha_limite" value={form.fecha_limite} onChange={handleChange} />
          </label>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loading type="inline" text="Guardando..." /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal: fincas de un experto ───────────────────────────────────────────────
function ExpertoFincasModal({ recomendaciones, fincaMap, monitoreoMap, onBack, onVerFinca }) {
  const fincaGroups = useMemo(() => {
    const map = {}
    recomendaciones.forEach((r) => {
      const mono = monitoreoMap[r.idMonitoreo]
      const fincaId = mono?.cultivo?.idFinca
      if (!fincaId) return
      if (!map[fincaId]) map[fincaId] = []
      map[fincaId].push(r)
    })
    return Object.entries(map).sort((a, b) => {
      const lastA = Math.max(...a[1].map((r) => _date(r)))
      const lastB = Math.max(...b[1].map((r) => _date(r)))
      return lastB - lastA
    })
  }, [recomendaciones])

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Fincas recomendadas</h2>
          <button className="modal-close" onClick={onBack}>✕</button>
        </div>
        <div className="rec-finca-list">
          {fincaGroups.length === 0 ? (
            <p className="rec-list-empty">No hay recomendaciones para este experto.</p>
          ) : fincaGroups.map(([fincaId, recs]) => {
            const finca = fincaMap[String(fincaId)]
            const lastDate = Math.max(...recs.map((r) => _date(r)))
            return (
              <div key={fincaId} className="rec-finca-item">
                <div className="rec-finca-info">
                  <span className="rec-finca-nombre">{finca?.nombreFinca || <span className="rec-list-placeholder">(Sin nombre)</span>}</span>
                  <span className="rec-finca-ultima">Última recomendación: {fmt(lastDate)}</span>
                </div>
                <button
                  className="btn-icon btn-icon-ver"
                  onClick={() => onVerFinca(fincaId)}
                  title="Ver recomendaciones"
                >
                  <BiShow size={16} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Modal: recomendaciones de una finca (por un experto) ──────────────────────
function FincaRecsModal({ recomendaciones, finca, onBack, onVerDetalle }) {
  const sorted = useMemo(() =>
    [...recomendaciones].sort((a, b) => _date(b) - _date(a))
  , [recomendaciones])
  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            Recomendaciones — {finca?.nombreFinca || 'Finca'}
          </h2>
          <button className="modal-close" onClick={onBack}>✕</button>
        </div>
        <div className="rec-list">
          {sorted.length === 0 ? (
            <p className="rec-list-empty">No hay recomendaciones para esta finca.</p>
          ) : sorted.map((r) => (
              <div key={r.idRecomendacion} className="rec-list-item">
                <div className="rec-list-header">
                  <span className="rec-list-prioridad">Prioridad: {typeof r.prioridad === 'string' ? r.prioridad : r.prioridad?.nombre || '—'}</span>
                  <span className="rec-list-fecha">{fmt(_date(r))}</span>
                  <button className="btn-icon btn-icon-ver" onClick={() => onVerDetalle(r)} title="Ver detalle">
                    <BiShow size={16} />
                  </button>
                </div>
                <p className="rec-list-desc">{r.descripcion || <span className="rec-list-placeholder">(Sin descripción)</span>}</p>
              </div>
          ))}
        </div>
        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button className="btn-secondary" onClick={onBack}>
            <BiArrowBack size={14} style={{ marginRight: 6 }} />
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: detalle de una recomendación ───────────────────────────────────────
function RecDetalleModal({ recomendacion, monitoreoMap, prioridades, onBack }) {
  const getPrioridadNombre = () => {
    if (typeof recomendacion.prioridad === 'string') return recomendacion.prioridad
    if (recomendacion.prioridad?.nombre) return recomendacion.prioridad.nombre
    const found = prioridades?.find((p) => Number(p.idPrioridad || p.id) === Number(recomendacion.idPrioridad))
    return found?.nombre || null
  }

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Detalle de la recomendación</h2>
          <button className="modal-close" onClick={onBack}>✕</button>
        </div>
        <div className="detalle-grid">
          <div className="detalle-item">
            <span className="detalle-label">Cultivo</span>
            <span className="detalle-value">
              {(monitoreoMap[recomendacion.idMonitoreo]?.cultivo?.nombreCultivo)
                ? <span>{monitoreoMap[recomendacion.idMonitoreo].cultivo.nombreCultivo}</span>
                : <span className="rec-list-placeholder">(Sin cultivo)</span>}
            </span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Experto</span>
            <span className="detalle-value">
              {recomendacion.experto
                ? <span>{typeof recomendacion.experto === 'string' ? recomendacion.experto : `${recomendacion.experto.nombre || ''} ${recomendacion.experto.apellido || ''}`.trim()}</span>
                : <span className="rec-list-placeholder">(Sin experto)</span>}
            </span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Prioridad</span>
            <span className="detalle-value">
              {getPrioridadNombre()
                ? <span>{getPrioridadNombre()}</span>
                : <span className="rec-list-placeholder">(Sin prioridad)</span>}
            </span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Descripción</span>
            <span className="detalle-value">
              {recomendacion.descripcion
                ? <span>{recomendacion.descripcion}</span>
                : <span className="rec-list-placeholder">(Sin descripción)</span>}
            </span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Fecha límite</span>
            <span className="detalle-value">
              {(recomendacion.fechaLimite || recomendacion.fecha_limite)
                ? <span>{fmt(recomendacion.fechaLimite || recomendacion.fecha_limite)}</span>
                : <span className="rec-list-placeholder">(Sin fecha límite)</span>}
            </span>
          </div>

        </div>
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="btn-secondary" onClick={onBack}>
            <BiArrowBack size={14} style={{ marginRight: 6 }} />
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Recomendaciones() {
  const [recomendaciones, setRecomendaciones] = useState([])
  const [monitoreos, setMonitoreos] = useState([])
  const [tipos, setTipos] = useState([])
  const [expertos, setExpertos] = useState([])
  const [prioridades, setPrioridades] = useState([])
  const [fincas, setFincas] = useState([])
  const [editingRec, setEditingRec] = useState(null)
  const [selectedExperto, setSelectedExperto] = useState(null)
  const [selectedFincaId, setSelectedFincaId] = useState(null)
  const [detailRecomendacion, setDetailRecomendacion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingCatalogs, setLoadingCatalogs] = useState(false)
  const catalogsLoaded = useRef(false)
  const ITEMS_PER_PAGE = 10

  const fincaMap = useMemo(() => {
    const map = {}
    fincas.forEach((f) => { map[String(f.idFinca)] = f })
    return map
  }, [fincas])

  const monitoreoMap = useMemo(() => {
    const map = {}
    monitoreos.forEach((m) => { map[m.idMonitoreo] = m })
    return map
  }, [monitoreos])

  const expertoRecs = useMemo(() => {
    const map = {}
    recomendaciones.forEach((r) => {
      let id = r.id_experto_emisor ?? r.idExpertoEmisor
      let nombre = typeof r.experto === 'string' ? r.experto : (r.experto ? `${r.experto.nombre || ''} ${r.experto.apellido || ''}`.trim() : '')
      if (!id) id = 'sin-experto-' + (nombre || 'anónimo')
      if (!map[id]) {
        const [n, a = ''] = (nombre || 'Sin asignar').split(/\s+(.+)/)
        map[id] = { _id: id, experto: { nombre: n, apellido: a }, recs: [] }
      }
      map[id].recs.push(r)
    })
    return Object.values(map)
  }, [recomendaciones])

  const filteredExpertos = useMemo(() => {
    let data = expertoRecs
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      data = data.filter(({ experto }) => {
        const nombre = experto ? `${experto.nombre || ''} ${experto.apellido || ''}`.trim() : ''
        return nombre.toLowerCase().includes(term)
      })
    }
    return data
  }, [expertoRecs, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredExpertos.length / ITEMS_PER_PAGE))
  const paginatedExpertos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredExpertos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredExpertos, currentPage])

  const fincaRecs = useMemo(() => {
    if (!selectedExperto || !selectedFincaId) return []
    const entry = expertoRecs.find((e) => e._id === selectedExperto?._id)
    if (!entry) return []
    return entry.recs.filter((r) => {
      const mono = monitoreoMap[r.idMonitoreo]
      return String(mono?.cultivo?.idFinca) === String(selectedFincaId)
    })
  }, [selectedExperto, selectedFincaId, expertoRecs])

  const getRecomendaciones = async () => {
    setLoading(true)
    try {
      const res = await api.get('/recomendaciones?limit=1000')
      const raw = getArrayData(res.data)
      const norm = raw.map((r) => ({
        ...r,
        idRecomendacion: r.idRecomendacion ?? r.id_recomendacion,
        idMonitoreo: r.idMonitoreo ?? r.id_monitoreo,
        idExpertoEmisor: r.idExpertoEmisor ?? r.id_experto_emisor,
        fechaRegistro: r.fechaRegistro ?? r.fecha_registro,
        fechaLimite: r.fechaLimite ?? r.fecha_limite,
        idTipo: r.idTipo ?? r.id_tipo,
        idPrioridad: r.idPrioridad ?? r.id_prioridad,
      }))
      setRecomendaciones(norm)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar las recomendaciones.')
    } finally {
      setLoading(false)
    }
  }

  const loadCatalogos = async () => {
    if (catalogsLoaded.current) return
    catalogsLoaded.current = true
    try {
      const [monitoreosRes, tiposRes, expertosRes, fincasRes] = await Promise.all([
        api.get('/monitoreos?limit=1000'),
        api.get('/cat_tipos_recomendaciones'),
        api.get('/expertos'),
        api.get('/fincas?limit=1000'),
      ])

      setMonitoreos(getArrayData(monitoreosRes.data).map((m) => ({
        ...m,
        idMonitoreo: m.idMonitoreo ?? m.id_monitoreo,
        fechaMonitoreo: m.fechaMonitoreo ?? m.fecha_monitoreo,
        cultivo: m.cultivo ? {
          ...m.cultivo,
          idFinca: m.cultivo.idFinca ?? m.cultivo.id_finca,
          nombreCultivo: m.cultivo.nombreCultivo ?? m.cultivo.nombre_cultivo,
        } : undefined,
      })))
      setTipos(getArrayData(tiposRes.data))
      setExpertos(getArrayData(expertosRes.data))
      setFincas(getArrayData(fincasRes.data).map((f) => ({
        ...f,
        idFinca: f.idFinca ?? f.id_finca,
        nombreFinca: f.nombreFinca ?? f.nombre_finca,
      })))

      try {
        const prioridadesRes = await api.get('/categorias/prioridades')
        setPrioridades(getArrayData(prioridadesRes.data))
      } catch {
        const prioridadesRes = await api.get('/cat_prioridades')
        setPrioridades(getArrayData(prioridadesRes.data))
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar los catalogos.')
    }
  }

  useEffect(() => {
    getRecomendaciones()
  }, [])

  const getTipoNombre = (recomendacion) => {
    if (recomendacion.tipo?.nombreTipo) return recomendacion.tipo.nombreTipo
    const tipo = tipos.find((item) => Number(item.idTipo) === Number(recomendacion.idTipo))
    return tipo?.nombreTipo || recomendacion.idTipo || '-'
  }

  const getPrioridadNombre = (recomendacion) => {
    const prioridad = prioridades.find((item) => Number(item.idPrioridad) === Number(recomendacion.idPrioridad))
    return prioridad?.nombre || recomendacion.idPrioridad || '-'
  }

  const handleToggleActivo = async (rec) => {
    const nuevoActivo = rec.activo === undefined || rec.activo === null ? false : !rec.activo
    try {
      await api.put(`/recomendaciones/${rec.idRecomendacion}`, { activo: nuevoActivo })
      setRecomendaciones((prev) =>
        prev.map((r) =>
          r.idRecomendacion === rec.idRecomendacion ? { ...r, activo: nuevoActivo } : r
        )
      )
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo cambiar el estado.')
    }
  }

  const activo = (rec) => rec.activo !== undefined && rec.activo !== null ? rec.activo : true

  const handleCerrarExperto = () => {
    setSelectedExperto(null)
    setSelectedFincaId(null)
    setDetailRecomendacion(null)
  }

  const handleCerrarFinca = () => {
    setSelectedFincaId(null)
    setDetailRecomendacion(null)
  }

  if (loading) return <Loading type="content" text="Cargando..." />

  return (
    <>
     <div className="module-header">
  <div className="module-header-icon">
    <BiChat size={28} />
  </div>

  <div className="module-header-content">

    <span className="module-header-badge">
      ASISTENCIA TÉCNICA
    </span>

    <h1>
      Recomendaciones
    </h1>

    <p>
      Gestiona las recomendaciones generadas a partir de los monitoreos
      realizados en los cultivos. Desde aquí puedes consultar sugerencias
      técnicas, establecer prioridades, definir fechas límite y realizar
      seguimiento a las acciones recomendadas para mejorar la producción
      y la salud de los cafetales.
    </p>

  </div>
</div>
      <div className="admin-table-card">
        <div className="table-toolbar">
          <div className="search-bar">
            <BiSearch size={16} />
            <input
              placeholder="Buscar experto..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            />
          </div>
        </div>
        <div className="tabla-header">
          <h2>Lista de Recomendaciones</h2>
          <span className="contador">{recomendaciones.length} recomendacione{recomendaciones.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Experto</th>
              <th>Recomendaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpertos.length === 0 ? (
              <tr>
                <td colSpan={3} className="finca-empty">
                  {searchTerm ? 'No se encontraron expertos con ese criterio' : 'No hay recomendaciones registradas aun.'}
                </td>
              </tr>
            ) : paginatedExpertos.map(({ _id, experto, recs }) => {
              const id = _id
              const nombre = experto ? `${experto.nombre || ''} ${experto.apellido || ''}`.trim() : 'Sin asignar'
              const ultima = Math.max(...recs.map((r) => _date(r)))
              return (
                <tr key={id}>
                  <td>
                    <span className="rec-exp-nombre">{nombre}</span>
                  </td>
                  <td>
                    <span className="rec-exp-count">{recs.length} recomendac{recs.length !== 1 ? 'iones' : 'ión'}</span>
                    <span className="rec-exp-ultima">Última: {fmt(ultima)}</span>
                  </td>
                  <td>
                    <button
                      className="btn-rec-ver"
                      onClick={async () => {
                        setLoadingCatalogs(true)
                        await loadCatalogos()
                        setSelectedExperto({ ...experto, _id })
                        setSelectedFincaId(null)
                        setDetailRecomendacion(null)
                        setLoadingCatalogs(false)
                      }}
                    >
                      <BiShow size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>

      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Anterior</button>
          {Array.from({ length: totalPages }, (_, i) => {
            const page = i + 1
            return (
              <button key={page} className={currentPage === page ? 'active' : ''} onClick={() => setCurrentPage(page)}>
                {page}
              </button>
            )
          })}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Siguiente</button>
          <span className="pagination-info">{filteredExpertos.length} registros</span>
        </div>
      )}

      {loadingCatalogs && <Loading type="overlay" text="Cargando datos de recomendaciones..." />}

      {selectedExperto && !selectedFincaId && !detailRecomendacion && (
        <ExpertoFincasModal
          recomendaciones={
            expertoRecs.find((e) => e._id === selectedExperto?._id)?.recs || []
          }
          fincaMap={fincaMap}
          monitoreoMap={monitoreoMap}
          onBack={handleCerrarExperto}
          onVerFinca={(fincaId) => setSelectedFincaId(fincaId)}
        />
      )}

      {selectedFincaId && !detailRecomendacion && (
        <FincaRecsModal
          recomendaciones={fincaRecs}
          finca={fincaMap[selectedFincaId]}
          onBack={handleCerrarFinca}
          onVerDetalle={(r) => setDetailRecomendacion(r)}
        />
      )}

      {detailRecomendacion && (
        <RecDetalleModal
          recomendacion={detailRecomendacion}
          monitoreoMap={monitoreoMap}
          prioridades={prioridades}
          onBack={() => setDetailRecomendacion(null)}
        />
      )}

      {editingRec && (
        <EditModal
          recomendacion={editingRec}
          onClose={() => setEditingRec(null)}
          onSaved={getRecomendaciones}
          monitoreos={monitoreos}
          tipos={tipos}
          expertos={expertos}
          prioridades={prioridades}
        />
      )}
    </>
  )
}

//jhon
