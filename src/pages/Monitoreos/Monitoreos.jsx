import { useState, useEffect } from 'react'
import api from '../../services/api'
import './Monitoreos.css'

const fmt = (val) => (val ? new Date(val).toLocaleDateString('es-CO') : '—')

// ── Modal de edición ──────────────────────────────────────────────────────────
function EditModal({ monitoreo, onClose, onSaved }) {
  const [form, setForm] = useState({
    id_cultivo:      monitoreo.idCultivo      || monitoreo.id_cultivo      || '',
    id_experto:      monitoreo.idExperto       || monitoreo.id_experto       || '',
    fecha_monitoreo: (monitoreo.fechaMonitoreo || monitoreo.fecha_monitoreo || '').slice(0, 10),
    observaciones:   monitoreo.observaciones  || '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const id = monitoreo.idMonitoreo || monitoreo.id_monitoreo
      await api.put(`/monitoreos/${id}`, form)
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
          <h2 className="modal-title">Editar monitoreo</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>ID Cultivo
              <input name="id_cultivo" type="number" value={form.id_cultivo} onChange={handleChange} required />
            </label>
            <label>ID Experto
              <input name="id_experto" type="number" value={form.id_experto} onChange={handleChange} required />
            </label>
          </div>
          <label>Fecha de monitoreo
            <input name="fecha_monitoreo" type="date" value={form.fecha_monitoreo} onChange={handleChange} required />
          </label>
          <label>Observaciones
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={4} />
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

// ── Componente principal ──────────────────────────────────────────────────────
export default function Monitoreos() {
  const [monitoreos,       setMonitoreos]       = useState([])
  const [editingMonitoreo, setEditingMonitoreo] = useState(null)
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')
  const [success,          setSuccess]          = useState('')

  const [form, setForm] = useState({
    id_cultivo:      '',
    id_experto:      '',
    fecha_monitoreo: '',
    observaciones:   '',
  })

  const getMonitoreos = async () => {
    try {
      const res = await api.get('/monitoreos')
      setMonitoreos(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch {
      setError('No se pudieron cargar los monitoreos.')
    }
  }

  useEffect(() => { getMonitoreos() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/monitoreos', form)
      setForm({ id_cultivo: '', id_experto: '', fecha_monitoreo: '', observaciones: '' })
      setSuccess('Monitoreo registrado correctamente.')
      getMonitoreos()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo registrar el monitoreo.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este monitoreo?')) return
    try {
      await api.delete(`/monitoreos/${id}`)
      setSuccess('Monitoreo eliminado.')
      getMonitoreos()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar.')
    }
  }

  return (
    <>
      <h1 className="admin-page-title">Monitoreos</h1>

      <div className="admin-form-card">
        <h2 className="admin-form-title">Registrar nuevo monitoreo</h2>
        <form className="monitoreo-form" onSubmit={handleCreate}>
          <div className="monitoreo-form-row">
            <label className="monitoreo-label">ID Cultivo
              <input name="id_cultivo" type="number" value={form.id_cultivo} onChange={handleChange} placeholder="Ej: 1" required />
            </label>
            <label className="monitoreo-label">ID Experto
              <input name="id_experto" type="number" value={form.id_experto} onChange={handleChange} placeholder="Ej: 3" required />
            </label>
            <label className="monitoreo-label">Fecha de monitoreo
              <input name="fecha_monitoreo" type="date" value={form.fecha_monitoreo} onChange={handleChange} required />
            </label>
          </div>
          <label className="monitoreo-label monitoreo-label--full">Observaciones
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} placeholder="Describe las condiciones del cultivo..." />
          </label>
          {error   && <p className="monitoreo-error">{error}</p>}
          {success && <p className="monitoreo-success">{success}</p>}
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : '+ Registrar monitoreo'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Cultivo</th><th>Experto</th><th>Fecha monitoreo</th>
              <th>Observaciones</th><th>Registrado</th><th>Actualizado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {monitoreos.length === 0 ? (
              <tr><td colSpan={8} className="monitoreo-empty">🌱 No hay monitoreos registrados aún.</td></tr>
            ) : monitoreos.map((m) => {
              const id = m.idMonitoreo ?? m.id_monitoreo
              return (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{m.idCultivo           ?? m.id_cultivo}</td>
                  <td>{m.idExperto            ?? m.id_experto}</td>
                  <td>{fmt(m.fechaMonitoreo   ?? m.fecha_monitoreo)}</td>
                  <td className="monitoreo-obs">{m.observaciones || '—'}</td>
                  <td>{fmt(m.fechaRegistro      ?? m.fecha_registro)}</td>
                  <td>{fmt(m.fechaActualizacion ?? m.fecha_actualizacion)}</td>
                  <td>
                    <button className="btn-edit"   onClick={() => setEditingMonitoreo(m)}>Editar</button>
                    <button className="btn-delete" onClick={() => handleDelete(id)}>Eliminar</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editingMonitoreo && (
        <EditModal
          monitoreo={editingMonitoreo}
          onClose={() => setEditingMonitoreo(null)}
          onSaved={getMonitoreos}
        />
      )}
    </>
  )
}