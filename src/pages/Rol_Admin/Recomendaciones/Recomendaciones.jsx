import { useEffect, useState } from 'react'
import api from '../../../services/api'
import './Recomendaciones.css'
import '../Administrador/Administrador.css'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const normalizeDate = (value) => {
  if (!value) return ''
  return value.toString().slice(0, 10)
}

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

export default function Recomendaciones() {
  const [recomendaciones, setRecomendaciones] = useState([])
  const [monitoreos, setMonitoreos] = useState([])
  const [tipos, setTipos] = useState([])
  const [expertos, setExpertos] = useState([])
  const [prioridades, setPrioridades] = useState([])
  const [editingRec, setEditingRec] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
      const [monitoreosRes, tiposRes, expertosRes] = await Promise.all([
        api.get('/monitoreos'),
        api.get('/cat_tipos_recomendaciones'),
        api.get('/expertos'),
      ])

      setMonitoreos(getArrayData(monitoreosRes.data))
      setTipos(getArrayData(tiposRes.data))
      setExpertos(getArrayData(expertosRes.data))

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

  return (
    <>
      <div className="page-header">
        <h1>Recomendaciones</h1>
        <p>Recomendaciones para cultivos</p>
      </div>
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tipo</th>
              <th>Experto</th>
              <th>Prioridad</th>
              <th>Descripcion</th>
              <th>Fecha limite</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {recomendaciones.length === 0 ? (
              <tr>
                <td colSpan={7} className="finca-empty">
                  No hay recomendaciones registradas aun.
                </td>
              </tr>
            ) : (
              recomendaciones.map((r) => (
                <tr key={r.idRecomendacion}>
                  <td>{r.idRecomendacion}</td>
                  <td>{getTipoNombre(r)}</td>
                  <td>{r.experto ? `${r.experto.nombre} ${r.experto.apellido || ''}`.trim() : '—'}</td>
                  <td>{getPrioridadNombre(r)}</td>
                  <td>{r.descripcion}</td>
                  <td>{normalizeDate(r.fechaLimite) || '-'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => setEditingRec(r)}>
                      Editar
                    </button>

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