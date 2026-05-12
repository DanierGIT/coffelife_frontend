/**
 * Fincas.jsx
 * El backend espera snake_case y requiere id_usuario obligatorio.
 * POST /fincas  → { id_usuario, nombre_finca, municipio, departamento, latitud, longitud, altitud_msnm, area_hectareas }
 * PUT  /fincas/:id → { nombre_finca, municipio, departamento, latitud, longitud, altitud_msnm, area_hectareas }
 */
import { useState, useEffect } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './Fincas.css'

// ── Modal de edición ─────────────────────────────
function EditModal({ finca, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre_finca:   finca.nombreFinca   || '',
    municipio:      finca.municipio     || '',
    departamento:   finca.departamento  || '',
    latitud:        finca.latitud       || '',
    longitud:       finca.longitud      || '',
    altitud_msnm:   finca.altitudMsnm   || '',
    area_hectareas: finca.areaHectareas || '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.put(`/fincas/${finca.idFinca}`, form)
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
          <h2 className="modal-title">Editar finca</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>Nombre de la finca
              <input name="nombre_finca" value={form.nombre_finca} onChange={handleChange} required />
            </label>
            <label>Municipio
              <input name="municipio" value={form.municipio} onChange={handleChange} required />
            </label>
          </div>
          <label>Departamento
            <input name="departamento" value={form.departamento} onChange={handleChange} required />
          </label>
          <div className="modal-row">
            <label>Latitud
              <input name="latitud" value={form.latitud} onChange={handleChange} placeholder="Ej: 4.7110" />
            </label>
            <label>Longitud
              <input name="longitud" value={form.longitud} onChange={handleChange} placeholder="Ej: -74.0721" />
            </label>
          </div>
          <div className="modal-row">
            <label>Altitud (m.s.n.m.)
              <input name="altitud_msnm" value={form.altitud_msnm} onChange={handleChange} placeholder="Ej: 1800" />
            </label>
            <label>Área (hectáreas)
              <input name="area_hectareas" value={form.area_hectareas} onChange={handleChange} placeholder="Ej: 5.2" />
            </label>
          </div>
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

// ── Componente principal ─────────────────────────
export default function Fincas() {
  const { user } = useAuth()

  const [fincas,       setFincas]       = useState([])
  const [editingFinca, setEditingFinca] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')

  const [form, setForm] = useState({
    nombre_finca:   '',
    municipio:      '',
    departamento:   '',
    latitud:        '',
    longitud:       '',
    altitud_msnm:   '',
    area_hectareas: '',
  })

  const getFincas = async () => {
    try {
      const res = await api('/fincas')
      setFincas(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch {
      setError('No se pudieron cargar las fincas.')
    }
  }

  useEffect(() => { getFincas() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      // El backend requiere id_usuario obligatorio
      await api.post('/fincas', {
        ...form,
        id_usuario: user?.idUsuario,
      })
      setForm({
        nombre_finca: '', municipio: '', departamento: '',
        latitud: '', longitud: '', altitud_msnm: '', area_hectareas: '',
      })
      setSuccess('Finca registrada correctamente.')
      getFincas()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo registrar la finca.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta finca?')) return
    try {
      await api.delete(`/fincas/${id}`)
      getFincas()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar la finca.')
    }
  }

  return (
    <>
      <h1 className="admin-page-title">Fincas</h1>

      <div className="admin-form-card">
        <h2 className="admin-form-title">Registrar nueva finca</h2>
        <form className="finca-form" onSubmit={handleCreate}>
          <div className="finca-form-row">
            <input name="nombre_finca"  value={form.nombre_finca}  onChange={handleChange} placeholder="Nombre de la finca" required />
            <input name="municipio"     value={form.municipio}     onChange={handleChange} placeholder="Municipio"          required />
            <input name="departamento"  value={form.departamento}  onChange={handleChange} placeholder="Departamento"       required />
          </div>
          <div className="finca-form-row">
            <input name="latitud"        value={form.latitud}        onChange={handleChange} placeholder="Latitud (ej: 4.7110)"    />
            <input name="longitud"       value={form.longitud}       onChange={handleChange} placeholder="Longitud (ej: -74.0721)" />
            <input name="altitud_msnm"   value={form.altitud_msnm}   onChange={handleChange} placeholder="Altitud m.s.n.m."        />
            <input name="area_hectareas" value={form.area_hectareas} onChange={handleChange} placeholder="Área (hectáreas)"        />
          </div>
          {error   && <p className="modal-error">{error}</p>}
          {success && <p className="finca-success">{success}</p>}
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar finca'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Nombre</th><th>Municipio</th><th>Departamento</th><th>Altitud</th><th>Área (ha)</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {fincas.length === 0 ? (
              <tr><td colSpan={7} className="finca-empty">No hay fincas registradas aún.</td></tr>
            ) : fincas.map((f) => (
              <tr key={f.idFinca}>
                <td>{f.idFinca}</td>
                <td>{f.nombreFinca}</td>
                <td>{f.municipio}</td>
                <td>{f.departamento}</td>
                <td>{f.altitudMsnm ? `${f.altitudMsnm} m` : '—'}</td>
                <td>{f.areaHectareas ?? '—'}</td>
                <td>
                  <button className="btn-edit"   onClick={() => setEditingFinca(f)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDelete(f.idFinca)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingFinca && (
        <EditModal
          finca={editingFinca}
          onClose={() => setEditingFinca(null)}
          onSaved={getFincas}
        />
      )}
    </>
  )
}
