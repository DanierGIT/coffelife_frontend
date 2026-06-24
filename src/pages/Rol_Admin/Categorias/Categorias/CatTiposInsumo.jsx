import { useEffect, useState } from 'react'
import api from '../../../../services/api'
import { BiEdit } from 'react-icons/bi'
import ToggleSwitch from '../../../../components/ToggleSwitch'
import Loading from '../../../../components/Loading'
import '../../Usuarios/Usuarios.css'
import './Formulario.css'

const STORAGE_KEY = 'cat_tipos_insumo_toggles'

const getLocalToggles = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

const normalizeActivo = (val) => val === true || val === 1

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

export default function CatTiposInsumo() {
  const [tipos, setTipos] = useState([])
  const [form, setForm] = useState({ nombre: '' })
  const [editingRow, setEditingRow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarTipos = async () => {
    setFetching(true)
    setError('')
    try {
      const res = await api.get('/cat_tipos_insumos')
      const data = getArrayData(res.data)
      const localToggles = getLocalToggles()
      const merged = data.map(item => {
        const id = item.idTipoInsumo
        return {
          ...item,
          activo: id in localToggles ? localToggles[id] : normalizeActivo(item.activo)
        }
      })
      setTipos(merged)
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar tipos de insumo.')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { cargarTipos() }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/cat_tipos_insumos', { nombre: form.nombre.trim() })
      setForm({ nombre: '' })
      setSuccess('Tipo de insumo creado correctamente.')
      cargarTipos()
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al crear tipo de insumo.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActivo = async (item) => {
    const newActivo = !item.activo
    setTipos(prev => prev.map(e => e.idTipoInsumo === item.idTipoInsumo ? { ...e, activo: newActivo } : e))
    try {
      const toggles = getLocalToggles()
      toggles[item.idTipoInsumo] = newActivo
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles))
      await api.put(`/cat_tipos_insumos/${item.idTipoInsumo}`, { activo: newActivo ? 1 : 0 })
    } catch (err) {
      setTipos(prev => prev.map(e => e.idTipoInsumo === item.idTipoInsumo ? { ...e, activo: item.activo } : e))
      setError(err?.response?.data?.message || 'No se pudo cambiar el estado.')
    }
  }

  return (
    <div className="crud-container">
      <div className="crud-form-card">
        <h2>Tipos de Insumo</h2>
        <form className="crud-form" onSubmit={handleCreate}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre del tipo de insumo"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? <Loading type="inline" text="Creando..." /> : 'Crear'}
          </button>
        </form>
        {error && <p style={{ color: '#c53030', marginTop: 10, fontSize: 13 }}>{error}</p>}
        {success && <p style={{ color: '#2e7d32', marginTop: 10, fontSize: 13 }}>{success}</p>}
      </div>

      <div className="crud-table-card">
        {fetching ? (
          <Loading type="content" text="Cargando..." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tipos.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                    Sin registros aún.
                  </td>
                </tr>
              ) : (
                tipos.map((tipo, idx) => (
                  <tr key={tipo.idTipoInsumo}>
                    <td>{idx + 1}</td>
                    <td>{tipo.nombre}</td>
                    <td>
                      <div className="td-actions">
                        <button
                          type="button"
                          className="btn-icon btn-icon-editar"
                          onClick={() => setEditingRow(tipo)}
                          title="Editar"
                        >
                          <BiEdit size={16} />
                        </button>
                        <ToggleSwitch
                          active={tipo.activo !== false}
                          onClick={() => handleToggleActivo(tipo)}
                          title={tipo.activo === false ? 'Activar' : 'Desactivar'}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {editingRow && (
        <EditModal
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSaved={cargarTipos}
        />
      )}
    </div>
  )
}

function EditModal({ row, onClose, onSaved }) {
  const [form, setForm] = useState({ nombre: row.nombre || '' })
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
      await api.put(`/cat_tipos_insumos/${row.idTipoInsumo}`, { nombre: form.nombre.trim() })
      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar.')
    } finally {
      setLoading(false)
    }
  }

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="cat-modal-overlay" onClick={handleOverlay}>
      <div className="cat-modal-box">
        <div className="cat-modal-header">
          <h3 className="cat-modal-title">Editar tipo de insumo</h3>
          <button className="cat-modal-close" onClick={onClose}>x</button>
        </div>
        <form className="cat-modal-form" onSubmit={handleSubmit}>
          <label className="cat-modal-label">
            Nombre
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="cat-modal-input"
              required
            />
          </label>
          {error && <p className="cat-modal-error">{error}</p>}
          <div className="cat-modal-actions">
            <button type="button" className="cat-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="cat-btn-save" disabled={loading}>
              {loading ? <Loading type="inline" text="Guardando..." /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
