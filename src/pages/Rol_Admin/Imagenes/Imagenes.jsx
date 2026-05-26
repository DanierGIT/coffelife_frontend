import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './Imagenes.css'

const fmt = (val) => (val ? new Date(val).toLocaleDateString('es-CO') : '—')

const labelMonitoreo = (m) => {
  if (!m) return '—'
  const fecha = m.fechaMonitoreo ? new Date(m.fechaMonitoreo).toLocaleDateString('es-CO') : '?'
  const cultivo = m.cultivo?.nombreCultivo || `Cultivo #${m.idCultivo}`
  return `${fecha} — ${cultivo}`
}

function EditModal({ imagen, monitoreos, onClose, onSaved }) {
  const [form, setForm] = useState({
    ruta_imagen:  imagen.rutaImagen  || '',
    id_monitoreo: imagen.idMonitoreo || '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.put(`/imagenes/${imagen.idImagen}`, form)
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
          <h2 className="modal-title">Editar imagen</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>Monitoreo
            <select name="id_monitoreo" value={form.id_monitoreo} onChange={handleChange} required>
              <option value="">Selecciona un monitoreo</option>
              {monitoreos.map((m) => (
                <option key={m.idMonitoreo} value={m.idMonitoreo}>
                  {labelMonitoreo(m)}
                </option>
              ))}
            </select>
          </label>
          <label>Ruta de imagen
            <input name="ruta_imagen" type="text" value={form.ruta_imagen} onChange={handleChange} placeholder="Ej: /uploads/foto.jpg" required />
          </label>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Imagenes() {
  const [imagenes,      setImagenes]      = useState([])
  const [monitoreos,    setMonitoreos]    = useState([])
  const [editingImagen, setEditingImagen] = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')

  const [form, setForm] = useState({
    id_monitoreo: '',
    ruta_imagen:  '',
  })

  const getImagenes = async () => {
    try {
      const res = await api.get('/imagenes')
      setImagenes(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch {
      setError('No se pudieron cargar las imágenes.')
    }
  }

  const getMonitoreos = async () => {
    try {
      const res = await api.get('/monitoreos')
      setMonitoreos(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    getImagenes()
    getMonitoreos()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/imagenes', form)
      setForm({ id_monitoreo: '', ruta_imagen: '' })
      setSuccess('Imagen registrada correctamente.')
      getImagenes()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo registrar la imagen.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return
    try {
      await api.delete(`/imagenes/${id}`)
      setSuccess('Imagen eliminada.')
      getImagenes()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar.')
    }
  }

  return (
    <div>
      <h1 className="admin-page-title">Imágenes</h1>

      <div className="admin-form-card">
        <h2 className="admin-form-title">Registrar nueva imagen</h2>
        <form onSubmit={handleCreate}>
          <div className="monitoreo-form-row">
            <label className="monitoreo-label">Monitoreo
              <select className="monitoreo-input" name="id_monitoreo" value={form.id_monitoreo} onChange={handleChange} required>
                <option value="">Selecciona un monitoreo</option>
                {monitoreos.map((m) => (
                  <option key={m.idMonitoreo} value={m.idMonitoreo}>
                    {labelMonitoreo(m)}
                  </option>
                ))}
              </select>
            </label>
            <label className="monitoreo-label">Ruta de imagen
              <input className="monitoreo-input" name="ruta_imagen" type="text" value={form.ruta_imagen} onChange={handleChange} placeholder="Ej: /uploads/foto.jpg" required />
            </label>
          </div>
          {error   && <p className="monitoreo-error">{error}</p>}
          {success && <p className="monitoreo-success">{success}</p>}
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : '+ Registrar imagen'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ruta imagen</th>
              <th>Monitoreo</th>
              <th>Fecha registro</th>
              <th>Última actualización</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {imagenes.length === 0 ? (
              <tr><td colSpan={6} className="imagenes-empty">📷 No hay imágenes registradas aún.</td></tr>
            ) : imagenes.map((img, idx) => (
              <tr key={img.idImagen}>
                <td>{idx + 1}</td>
                <td>{img.rutaImagen}</td>
                <td>{labelMonitoreo(img.monitoreo)}</td>
                <td>{fmt(img.fechaRegistro)}</td>
                <td>{fmt(img.fechaActualizacion)}</td>
                <td>
                  <button className="btn-edit"   onClick={() => setEditingImagen(img)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDelete(img.idImagen)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingImagen && (
        <EditModal
          imagen={editingImagen}
          monitoreos={monitoreos}
          onClose={() => setEditingImagen(null)}
          onSaved={getImagenes}
        />
      )}
    </div>
  )
}