import { useState, useEffect } from 'react'
import { getData, createData, updateData, deleteData } from './api'
import './Formulario.css'

// Convierte camelCase → snake_case para el payload del backend
function toSnake(str) {
  return str.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
}

// ── Modal de edición ──
function EditModal({ fields, idField, row, onClose, onSaved, endpoint }) {
  const [form,    setForm]    = useState({ ...row })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload = {}
    fields.forEach(f => {
      if (!f.readOnly) payload[toSnake(f.name)] = form[f.name]
    })
    try {
      await updateData(endpoint, row[idField], payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar.')
    } finally {
      setLoading(false)
    }
  }

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose() }

  return (
    <div className="cat-modal-overlay" onClick={handleOverlay}>
      <div className="cat-modal-box">
        <div className="cat-modal-header">
          <h3 className="cat-modal-title">Editar registro</h3>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="cat-modal-form" onSubmit={handleSubmit}>
          {fields.filter(f => !f.readOnly).map(f => (
            <label key={f.name} className="cat-modal-label">
              {f.label}
              <input
                name={f.name}
                value={form[f.name] || ''}
                onChange={handleChange}
                className="cat-modal-input"
                required
              />
            </label>
          ))}
          {error && <p className="cat-modal-error">{error}</p>}
          <div className="cat-modal-actions">
            <button type="button" className="cat-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="cat-btn-save" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ──
const Formulario = ({ title, fields, endpoint, idField }) => {
  const [data,       setData]       = useState([])
  const [formData,   setFormData]   = useState({})
  const [editingRow, setEditingRow] = useState(null)
  const [fetching,   setFetching]   = useState(true)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  const getId = (row) => row[idField]

  const fetchData = async () => {
    setFetching(true)
    setError('')
    try {
      const res = await getData(endpoint)
      setData(Array.isArray(res) ? res : (res?.data ?? []))
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar datos.')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { fetchData() }, [endpoint])

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const payload = {}
      fields.filter(f => !f.readOnly).forEach(f => {
        payload[toSnake(f.name)] = formData[f.name]
      })
      await createData(endpoint, payload)
      setSuccess('Registro creado correctamente.')
      setFormData({})
      fetchData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al crear.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActivo = async (item) => {
    const nextState = item.activo === undefined ? false : !item.activo
    const accion = nextState ? 'activar' : 'desactivar'
    if (!window.confirm(`¿${accion} este registro?`)) return
    setError('')
    setSuccess('')
    try {
      await updateData(endpoint, item[idField], { activo: nextState })
      setSuccess(`Registro ${accion}do correctamente.`)
      fetchData()
    } catch (err) {
      setError(err?.response?.data?.message || `No se pudo ${accion}.`)
    }
  }

  return (
    <div className="crud-container">

      {/* ── FORMULARIO CREAR ── */}
      <div className="crud-form-card">
        <h2>{title}</h2>
        <form className="crud-form" onSubmit={handleSubmit}>
          {fields.filter(f => !f.readOnly).map(f => (
            <input
              key={f.name}
              type="text"
              name={f.name}
              placeholder={f.label}
              value={formData[f.name] || ''}
              onChange={handleChange}
              required
            />
          ))}
          <button type="submit" disabled={loading}>
            {loading ? 'Creando…' : 'Crear'}
          </button>
        </form>
        {error   && <p style={{ color: '#c53030', marginTop: 10, fontSize: 13 }}>{error}</p>}
        {success && <p style={{ color: '#2e7d32', marginTop: 10, fontSize: 13 }}>{success}</p>}
      </div>

      {/* ── TABLA ── */}
      <div className="crud-table-card">
        {fetching ? (
          <p style={{ textAlign: 'center', padding: 24, color: '#666' }}>Cargando…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                {fields.slice(1).map(f => <th key={f.name}>{f.label}</th>)}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 1}
                    style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                    Sin registros aún.
                  </td>
                </tr>
              ) : data.map((row, idx) => (
                <tr key={getId(row)}>
                  <td>{idx + 1}</td>
                  {fields.slice(1).map(f => <td key={f.name}>{row[f.name] ?? '—'}</td>)}
                  <td className="actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => setEditingRow(row)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={row.activo === false ? 'edit-btn' : 'delete-btn'}
                      onClick={() => handleToggleActivo(row)}
                    >
                      {row.activo === false ? 'Activar' : 'Desactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL EDITAR ── */}
      {editingRow && (
        <EditModal
          fields={fields}
          idField={idField}
          row={editingRow}
          endpoint={endpoint}
          onClose={() => setEditingRow(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}

export default Formulario