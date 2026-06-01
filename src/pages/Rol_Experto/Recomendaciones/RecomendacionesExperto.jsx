import { useEffect, useState } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './RecomendacionesExperto.css'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const normalizeDate = (value) => {
  if (!value) return ''
  return value.toString().slice(0, 10)
}

// ─────────────────────────────────────────────
// MODAL EDITAR
// ─────────────────────────────────────────────
function EditModal({ recomendacion, onClose, onSaved, tipos, prioridades, expertoId, fincasAsignadas, cultivos, monitoreos }) {
  const [fincaSeleccionada, setFincaSeleccionada] = useState(() => {
    const monitoreo = monitoreos.find((m) => Number(m.idMonitoreo) === Number(recomendacion.idMonitoreo))
    if (!monitoreo) return ''
    const cultivo = cultivos.find((c) => Number(c.idCultivo) === Number(monitoreo.idCultivo))
    return cultivo?.idFinca?.toString() || ''
  })

  const [cultivoSeleccionado, setCultivoSeleccionado] = useState(() => {
    const monitoreo = monitoreos.find((m) => Number(m.idMonitoreo) === Number(recomendacion.idMonitoreo))
    return monitoreo?.idCultivo?.toString() || ''
  })

  const [form, setForm] = useState({
    id_monitoreo: recomendacion.idMonitoreo || '',
    id_tipo:      recomendacion.idTipo      || '',
    descripcion:  recomendacion.descripcion || '',
    fecha_limite: normalizeDate(recomendacion.fechaLimite),
    id_prioridad: recomendacion.idPrioridad || '',
  })

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const cultivosDeFinca     = fincaSeleccionada   ? cultivos.filter((c)   => Number(c.idFinca)   === Number(fincaSeleccionada))   : []
  const monitoreosDeCultivo = cultivoSeleccionado ? monitoreos.filter((m) => Number(m.idCultivo) === Number(cultivoSeleccionado)) : []

  const handleFincaChange = (e) => {
    setFincaSeleccionada(e.target.value)
    setCultivoSeleccionado('')
    setForm((f) => ({ ...f, id_monitoreo: '' }))
  }

  const handleCultivoChange = (e) => {
    setCultivoSeleccionado(e.target.value)
    setForm((f) => ({ ...f, id_monitoreo: '' }))
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.put(`/recomendaciones/${recomendacion.idRecomendacion}`, {
        id_monitoreo:      Number(form.id_monitoreo),
        id_tipo:           form.id_tipo      ? Number(form.id_tipo)      : null,
        id_experto_emisor: expertoId         ? Number(expertoId)         : null,
        id_prioridad:      form.id_prioridad ? Number(form.id_prioridad) : null,
        descripcion:       form.descripcion,
        fecha_limite:      form.fecha_limite || null,
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
          <h2 className="modal-title">Editar recomendación</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>
              Finca
              <select value={fincaSeleccionada} onChange={handleFincaChange} required>
                <option value="">Seleccionar finca...</option>
                {fincasAsignadas.map((f) => (
                  <option key={f.idFinca} value={f.idFinca}>{f.nombreFinca}</option>
                ))}
              </select>
            </label>

            <label>
              Cultivo
              <select value={cultivoSeleccionado} onChange={handleCultivoChange} disabled={!fincaSeleccionada} required>
                <option value="">Seleccionar cultivo...</option>
                {cultivosDeFinca.map((c) => (
                  <option key={c.idCultivo} value={c.idCultivo}>{c.nombreCultivo}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-row">
            <label>
              Monitoreo
              <select name="id_monitoreo" value={form.id_monitoreo} onChange={handleChange} disabled={!cultivoSeleccionado} required>
                <option value="">Seleccionar monitoreo...</option>
                {monitoreosDeCultivo.map((m) => (
                  <option key={m.idMonitoreo} value={m.idMonitoreo}>
                    #{m.idMonitoreo} — {normalizeDate(m.fechaMonitoreo)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tipo de recomendación
              <select name="id_tipo" value={form.id_tipo} onChange={handleChange}>
                <option value="">Seleccionar...</option>
                {tipos.map((t) => (
                  <option key={t.idTipo} value={t.idTipo}>{t.nombreTipo}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-row">
            <label>
              Prioridad
              <select name="id_prioridad" value={form.id_prioridad} onChange={handleChange}>
                <option value="">Seleccionar...</option>
                {prioridades.map((p) => (
                  <option key={p.idPrioridad} value={p.idPrioridad}>{p.nombre}</option>
                ))}
              </select>
            </label>

            <label>
              Fecha límite
              <input type="date" name="fecha_limite" value={form.fecha_limite} onChange={handleChange} />
            </label>
          </div>

          <label>
            Descripción
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} required rows={3} />
          </label>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function RecomendacionesExperto() {
  const { user } = useAuth()

  // Ajusta según cómo tu AuthContext guarda el id:
  // user?.idUsuario | user?.id | user?.usuario?.idUsuario
  const expertoId = user?.idUsuario ?? user?.id ?? null

  // ── Datos ──
  const [fincasAsignadas, setFincasAsignadas] = useState([])
  const [cultivos,        setCultivos]        = useState([])
  const [monitoreos,      setMonitoreos]      = useState([])
  const [tipos,           setTipos]           = useState([])
  const [prioridades,     setPrioridades]     = useState([])
  const [recomendaciones, setRecomendaciones] = useState([])
  const [editingRec,      setEditingRec]      = useState(null)

  // ── Filtros cascada formulario ──
  const [fincaSeleccionada,   setFincaSeleccionada]   = useState('')
  const [cultivoSeleccionado, setCultivoSeleccionado] = useState('')

  // ── Formulario nuevo ──
  const [form, setForm] = useState({
    id_monitoreo: '',
    id_tipo:      '',
    descripcion:  '',
    fecha_limite: '',
    id_prioridad: '',
  })

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  // ── Opciones filtradas en cascada ──
  const cultivosDeFinca     = fincaSeleccionada   ? cultivos.filter((c)   => Number(c.idFinca)   === Number(fincaSeleccionada))   : []
  const monitoreosDeCultivo = cultivoSeleccionado ? monitoreos.filter((m) => Number(m.idCultivo) === Number(cultivoSeleccionado)) : []

  // ─────────────────────────────────────────────
  // HELPERS TABLA — resuelve finca y cultivo
  // desde el estado local sin necesitar el backend
  // ─────────────────────────────────────────────
  const getTipoNombre = (r) => {
    if (r.tipo?.nombreTipo) return r.tipo.nombreTipo
    const t = tipos.find((t) => Number(t.idTipo) === Number(r.idTipo))
    return t?.nombreTipo || '-'
  }

  const getPrioridadNombre = (r) => {
    const p = prioridades.find((p) => Number(p.idPrioridad) === Number(r.idPrioridad))
    return p?.nombre || '-'
  }

  const getCultivoDeRec = (r) => {
    const monitoreo = monitoreos.find((m) => Number(m.idMonitoreo) === Number(r.idMonitoreo))
    if (!monitoreo) return '—'
    const cultivo = cultivos.find((c) => Number(c.idCultivo) === Number(monitoreo.idCultivo))
    return cultivo?.nombreCultivo || '—'
  }

  const getFincaDeRec = (r) => {
    const monitoreo = monitoreos.find((m) => Number(m.idMonitoreo) === Number(r.idMonitoreo))
    if (!monitoreo) return '—'
    const cultivo = cultivos.find((c) => Number(c.idCultivo) === Number(monitoreo.idCultivo))
    if (!cultivo) return '—'
    const finca = fincasAsignadas.find((f) => Number(f.idFinca) === Number(cultivo.idFinca))
    return finca?.nombreFinca || '—'
  }

  // ─────────────────────────────────────────────
  // CARGA INICIAL
  // ─────────────────────────────────────────────
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
      const [asignacionesRes, cultivosRes, monitoreosRes, tiposRes] = await Promise.all([
        api.get('/asignaciones_expertos'),
        api.get('/cultivos'),
        api.get('/monitoreos'),
        api.get('/cat_tipos_recomendaciones'),
      ])

      // Filtra solo las fincas asignadas a este experto
      const todasAsignaciones = getArrayData(asignacionesRes.data)
      const misAsignaciones   = todasAsignaciones.filter(
        (a) => Number(a.idExperto) === Number(expertoId)
      )
      const misFincas = misAsignaciones.map((a) => a.finca).filter(Boolean)

      setFincasAsignadas(misFincas)
      setCultivos(getArrayData(cultivosRes.data))
      setMonitoreos(getArrayData(monitoreosRes.data))
      setTipos(getArrayData(tiposRes.data))

      // Prioridades — intenta dos rutas posibles
      try {
        const res = await api.get('/categorias/prioridades')
        setPrioridades(getArrayData(res.data))
      } catch {
        const res = await api.get('/cat_prioridades')
        setPrioridades(getArrayData(res.data))
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar los catálogos.')
    }
  }

  useEffect(() => {
    if (expertoId) {
      getRecomendaciones()
      getCatalogos()
    }
  }, [expertoId])

  // ─────────────────────────────────────────────
  // HANDLERS FORMULARIO
  // ─────────────────────────────────────────────
  const handleFincaChange = (e) => {
    setFincaSeleccionada(e.target.value)
    setCultivoSeleccionado('')
    setForm((f) => ({ ...f, id_monitoreo: '' }))
  }

  const handleCultivoChange = (e) => {
    setCultivoSeleccionado(e.target.value)
    setForm((f) => ({ ...f, id_monitoreo: '' }))
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/recomendaciones', {
        id_monitoreo:      Number(form.id_monitoreo),
        id_tipo:           form.id_tipo      ? Number(form.id_tipo)      : null,
        id_experto_emisor: expertoId         ? Number(expertoId)         : null,
        id_prioridad:      form.id_prioridad ? Number(form.id_prioridad) : null,
        descripcion:       form.descripcion,
        fecha_limite:      form.fecha_limite || null,
      })

      setForm({ id_monitoreo: '', id_tipo: '', descripcion: '', fecha_limite: '', id_prioridad: '' })
      setSuccess('Recomendación registrada correctamente.')
      getRecomendaciones()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo registrar la recomendación.')
    } finally {
      setLoading(false)
    }
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

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <>
      <h1 className="admin-page-title">Recomendaciones</h1>

      {/* ── FORMULARIO NUEVO ── */}
      <div className="admin-form-card">
        <h2 className="admin-form-title">Registrar nueva recomendación</h2>

        <form className="rec-form" onSubmit={handleCreate}>

          {/* Fila 1 — Cascada: Finca asignada → Cultivo → Monitoreo */}
          <div className="rec-form-row">
            <select value={fincaSeleccionada} onChange={handleFincaChange} required>
              <option value="">Seleccionar finca...</option>
              {fincasAsignadas.map((f) => (
                <option key={f.idFinca} value={f.idFinca}>{f.nombreFinca}</option>
              ))}
            </select>

            <select value={cultivoSeleccionado} onChange={handleCultivoChange} disabled={!fincaSeleccionada} required>
              <option value="">Seleccionar cultivo...</option>
              {cultivosDeFinca.map((c) => (
                <option key={c.idCultivo} value={c.idCultivo}>{c.nombreCultivo}</option>
              ))}
            </select>

            <select name="id_monitoreo" value={form.id_monitoreo} onChange={handleChange} disabled={!cultivoSeleccionado} required>
              <option value="">Seleccionar monitoreo...</option>
              {monitoreosDeCultivo.map((m) => (
                <option key={m.idMonitoreo} value={m.idMonitoreo}>
                  #{m.idMonitoreo} — {normalizeDate(m.fechaMonitoreo)}
                </option>
              ))}
            </select>
          </div>

          {/* Fila 2 — Tipo, Prioridad, Fecha */}
          <div className="rec-form-row">
            <select name="id_tipo" value={form.id_tipo} onChange={handleChange}>
              <option value="">Tipo de recomendación...</option>
              {tipos.map((t) => (
                <option key={t.idTipo} value={t.idTipo}>{t.nombreTipo}</option>
              ))}
            </select>

            <select name="id_prioridad" value={form.id_prioridad} onChange={handleChange}>
              <option value="">Prioridad...</option>
              {prioridades.map((p) => (
                <option key={p.idPrioridad} value={p.idPrioridad}>{p.nombre}</option>
              ))}
            </select>

            <input type="date" name="fecha_limite" value={form.fecha_limite} onChange={handleChange} />
          </div>

          {/* Descripción */}
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Descripción de la recomendación..."
            required
            rows={3}
          />

          {error   && <p className="modal-error">{error}</p>}
          {success && <p className="rec-success">{success}</p>}

          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar recomendación'}
            </button>
          </div>
        </form>
      </div>

      {/* ── TABLA ── */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Finca</th>
              <th>Cultivo</th>
              <th>Monitoreo</th>
              <th>Tipo</th>
              <th>Prioridad</th>
              <th>Descripción</th>
              <th>Fecha límite</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recomendaciones.length === 0 ? (
              <tr>
                <td colSpan={9} className="finca-empty">
                  No hay recomendaciones registradas aún.
                </td>
              </tr>
            ) : (
              recomendaciones.map((r) => (
                <tr key={r.idRecomendacion}>
                  <td>{r.idRecomendacion}</td>
                  <td>{getFincaDeRec(r)}</td>
                  <td>{getCultivoDeRec(r)}</td>
                  <td>#{r.idMonitoreo} — {normalizeDate(r.monitoreo?.fechaMonitoreo)}</td>
                  <td>{getTipoNombre(r)}</td>
                  <td>{getPrioridadNombre(r)}</td>
                  <td>{r.descripcion}</td>
                  <td>{normalizeDate(r.fechaLimite) || '-'}</td>
                  <td>
                    <button className="btn-edit"   onClick={() => setEditingRec(r)}>Editar</button>
                    <button
                      className={`btn-toggle ${activo(r) ? 'toggle-on' : 'toggle-off'}`}
                      onClick={() => handleToggleActivo(r)}
                      title={activo(r) ? 'Desactivar' : 'Activar'}
                    >
                      {activo(r) ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL EDITAR ── */}
      {editingRec && (
        <EditModal
          recomendacion={editingRec}
          onClose={() => setEditingRec(null)}
          onSaved={getRecomendaciones}
          tipos={tipos}
          prioridades={prioridades}
          expertoId={expertoId}
          fincasAsignadas={fincasAsignadas}
          cultivos={cultivos}
          monitoreos={monitoreos}
        />
      )}
    </>
  )
}
