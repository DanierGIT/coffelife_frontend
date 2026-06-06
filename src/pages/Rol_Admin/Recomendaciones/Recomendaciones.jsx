import { useEffect, useState, useMemo } from 'react'
import api from '../../../services/api'
import './Recomendaciones.css'
import '../Administrador/Administrador.css'
import { BiShow, BiArrowBack, BiSearch } from 'react-icons/bi'

const fmt = (val) => (val ? new Date(val).toLocaleDateString('es-CO') : '—')
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
              {loading ? 'Guardando...' : 'Guardar'}
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
      const lastA = Math.max(...a[1].map((r) => new Date(r.fechaRecomendacion || r.fecha_recomendacion || 0)))
      const lastB = Math.max(...b[1].map((r) => new Date(r.fechaRecomendacion || r.fecha_recomendacion || 0)))
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
            const finca = fincaMap[fincaId]
            const lastDate = Math.max(...recs.map((r) => new Date(r.fechaRecomendacion || r.fecha_recomendacion || 0)))
            return (
              <div key={fincaId} className="rec-finca-item">
                <div className="rec-finca-info">
                  <span className="rec-finca-nombre">{finca?.nombreFinca || 'Finca #' + fincaId}</span>
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
function FincaRecsModal({ recomendaciones, finca, onBack, onVerDetalle, onEditar }) {
  const sorted = useMemo(() => {
    return [...recomendaciones].sort((a, b) => {
      const fechaA = new Date(a.fechaRecomendacion || a.fecha_recomendacion || 0)
      const fechaB = new Date(b.fechaRecomendacion || b.fecha_recomendacion || 0)
      return fechaB - fechaA
    })
  }, [recomendaciones])

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
          ) : sorted.map((r) => {
            const tipos = r.tipo?.nombreTipo
            const prioridad = r.prioridad?.nombre || r.idPrioridad
            return (
              <div key={r.idRecomendacion} className="rec-list-item">
                <div className="rec-list-header">
                  <span className="rec-list-tipo">{tipos || '—'}</span>
                  <span className={`rec-list-status ${r.activo === false ? 'inactivo' : 'activo'}`}>
                    {r.activo === false ? 'Inactivo' : 'Activo'}
                  </span>
                </div>
                <p className="rec-list-desc">{r.descripcion}</p>
                <div className="rec-list-footer">
                  <span className="rec-list-fecha">{fmt(r.fechaRecomendacion || r.fecha_recomendacion)}</span>
                  <span className="rec-list-prioridad">{prioridad || ''}</span>
                </div>
                <div className="rec-list-acciones">
                  <button className="btn-icon btn-icon-ver" onClick={() => onVerDetalle(r)} title="Ver detalle">
                    <BiShow size={16} />
                  </button>
                </div>
              </div>
            )
          })}
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
function RecDetalleModal({ recomendacion, monitoreoMap, onBack }) {
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
            <span className="detalle-value">{(monitoreoMap[recomendacion.idMonitoreo]?.cultivo?.nombreCultivo) || '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Experto</span>
            <span className="detalle-value">
              {recomendacion.experto ? `${recomendacion.experto.nombre || ''} ${recomendacion.experto.apellido || ''}`.trim() : '—'}
            </span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Tipo</span>
            <span className="detalle-value">{recomendacion.tipo?.nombreTipo || '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Prioridad</span>
            <span className="detalle-value">{recomendacion.prioridad?.nombre || recomendacion.idPrioridad || '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Estado</span>
            <span className="detalle-value">{recomendacion.activo === false ? 'Inactivo' : 'Activo'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Fecha de recomendación</span>
            <span className="detalle-value">{fmt(recomendacion.fechaRecomendacion || recomendacion.fecha_recomendacion)}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Fecha límite</span>
            <span className="detalle-value">{fmt(recomendacion.fechaLimite || recomendacion.fecha_limite) || '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Descripción</span>
            <span className="detalle-value">{recomendacion.descripcion || '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Registrado</span>
            <span className="detalle-value">{fmtDatetime(recomendacion.fechaRegistro || recomendacion.fecha_registro)}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Actualizado</span>
            <span className="detalle-value">{fmtDatetime(recomendacion.fechaActualizacion || recomendacion.fecha_actualizacion)}</span>
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPrioridad, setFilterPrioridad] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fincaMap = useMemo(() => {
    const map = {}
    fincas.forEach((f) => { map[f.idFinca] = f })
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
      const id = r.experto?.idUsuario || r.idExpertoEmisor
      if (!id) return
      if (!map[id]) map[id] = { experto: r.experto, recs: [] }
      map[id].recs.push(r)
    })
    return Object.values(map)
  }, [recomendaciones])

  const filteredExpertos = useMemo(() => {
    let data = expertoRecs
    if (filterPrioridad) {
      data = data
        .map(({ experto, recs }) => ({
          experto,
          recs: recs.filter((r) => {
            const id = r.prioridad?.idPrioridad ?? r.idPrioridad
            return String(id) === filterPrioridad
          })
        }))
        .filter(({ recs }) => recs.length > 0)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      data = data.filter(({ experto }) => {
        const nombre = experto ? `${experto.nombre || ''} ${experto.apellido || ''}`.trim() : ''
        return nombre.toLowerCase().includes(term)
      })
    }
    return data
  }, [expertoRecs, searchTerm, filterPrioridad])

  const totalPages = Math.max(1, Math.ceil(filteredExpertos.length / ITEMS_PER_PAGE))
  const paginatedExpertos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredExpertos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredExpertos, currentPage])

  const fincaRecs = useMemo(() => {
    if (!selectedExperto || !selectedFincaId) return []
    const entry = expertoRecs.find((e) => {
      const id = e.experto?.idUsuario || e.recs[0]?.idExpertoEmisor
      return id === (selectedExperto?.idUsuario || selectedExperto?.idExpertoEmisor)
    })
    if (!entry) return []
    return entry.recs.filter((r) => {
      const mono = monitoreoMap[r.idMonitoreo]
      return String(mono?.cultivo?.idFinca) === String(selectedFincaId)
    })
  }, [selectedExperto, selectedFincaId, expertoRecs])

  const getRecomendaciones = async () => {
    try {
      const res = await api.get('/recomendaciones')
      setRecomendaciones(getArrayData(res.data))
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar las recomendaciones.')
    }
  }

  const getCatalogos = async () => {
    try {
      const [monitoreosRes, tiposRes, expertosRes, fincasRes] = await Promise.all([
        api.get('/monitoreos'),
        api.get('/cat_tipos_recomendaciones'),
        api.get('/expertos'),
        api.get('/fincas?limit=1000'),
      ])

      setMonitoreos(getArrayData(monitoreosRes.data))
      setTipos(getArrayData(tiposRes.data))
      setExpertos(getArrayData(expertosRes.data))
      setFincas(getArrayData(fincasRes.data))

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
    getCatalogos()
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

  return (
    <>
     <div className="module-header">
  <div className="module-header-icon">
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6" />
      <path d="M12 18h.01" />
    </svg>
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
          <div className="filter-group">
            <select
              value={filterPrioridad}
              onChange={(e) => { setFilterPrioridad(e.target.value); setCurrentPage(1) }}
            >
              <option value="">Todas las prioridades</option>
              {prioridades.map((p) => (
                <option key={p.idPrioridad} value={p.idPrioridad}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
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
            ) : paginatedExpertos.map(({ experto, recs }) => {
              const id = experto?.idUsuario || recs[0]?.idExpertoEmisor
              const nombre = experto ? `${experto.nombre || ''} ${experto.apellido || ''}`.trim() : '—'
              const ultima = Math.max(...recs.map((r) => new Date(r.fechaRecomendacion || r.fecha_recomendacion || 0)))
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
                      onClick={() => {
                        setSelectedExperto(experto || { idUsuario: id })
                        setSelectedFincaId(null)
                        setDetailRecomendacion(null)
                      }}
                    >
                      <BiShow size={14} />
                      Ver detalles
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

      {selectedExperto && !selectedFincaId && !detailRecomendacion && (
        <ExpertoFincasModal
          recomendaciones={
            expertoRecs.find((e) => {
              const id = e.experto?.idUsuario || e.recs[0]?.idExpertoEmisor
              return id === (selectedExperto?.idUsuario || selectedExperto?.idExpertoEmisor)
            })?.recs || []
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
          onEditar={(r) => setEditingRec(r)}
        />
      )}

      {detailRecomendacion && (
        <RecDetalleModal
          recomendacion={detailRecomendacion}
          monitoreoMap={monitoreoMap}
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
