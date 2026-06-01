import { useEffect, useState } from 'react'
import api from '../../../../services/api'
import './Formulario.css'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

export default function CatEstadosAnalisis() {
  const [estados, setEstados] = useState([])
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
  })
  const [editingRow, setEditingRow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarEstados = async () => {
    setFetching(true)
    setError('')

    try {
      const res = await api.get('/cat_estados_analisis')
      setEstados(getArrayData(res.data))
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar estados de analisis.')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    cargarEstados()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/cat_estados_analisis', {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
      })

      setForm({
        nombre: '',
        descripcion: '',
      })

      setSuccess('Estado de analisis creado correctamente.')
      cargarEstados()
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al crear estado de analisis.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActivo = async (item) => {
    const nextState = item.activo === undefined ? false : !item.activo
    const accion = nextState ? 'activar' : 'desactivar'
    if (!window.confirm(`¿${accion} este estado de analisis?`)) return

    setError('')
    setSuccess('')

    try {
      await api.put(`/cat_estados_analisis/${item.idEstado}`, { activo: nextState })
      setSuccess(`Estado de analisis ${accion}do correctamente.`)
      cargarEstados()
    } catch (err) {
      setError(err?.response?.data?.message || `No se pudo ${accion}.`)
    }
  }

  return (
    <div className="crud-container">
      <div className="crud-form-card">
        <h2>Estados de Analisis</h2>

        <form className="crud-form" onSubmit={handleCreate}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre Estado"
            value={form.nombre}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="descripcion"
            placeholder="Descripcion"
            value={form.descripcion}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear'}
          </button>
        </form>

        {error && <p style={{ color: '#c53030', marginTop: 10, fontSize: 13 }}>{error}</p>}
        {success && <p style={{ color: '#2e7d32', marginTop: 10, fontSize: 13 }}>{success}</p>}
      </div>

      <div className="crud-table-card">
        {fetching ? (
          <p style={{ textAlign: 'center', padding: 24, color: '#666' }}>Cargando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Estado</th>
                <th>Descripcion</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {estados.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                    Sin registros aun.
                  </td>
                </tr>
              ) : (
                estados.map((estado, idx) => (
                  <tr key={estado.idEstado}>
                    <td>{idx + 1}</td>
                    <td>{estado.nombreEstado}</td>
                    <td>{estado.descripcion || '-'}</td>
                    <td className="actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => setEditingRow(estado)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className={estado.activo === false ? 'edit-btn' : 'delete-btn'}
                        onClick={() => handleToggleActivo(estado)}
                      >
                        {estado.activo === false ? 'Activar' : 'Desactivar'}
                      </button>
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
          onSaved={cargarEstados}
        />
      )}
    </div>
  )
}

function EditModal({ row, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: row.nombreEstado || '',
    descripcion: row.descripcion || '',
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
      await api.put(`/cat_estados_analisis/${row.idEstado}`, {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
      })

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
          <h3 className="cat-modal-title">Editar estado de analisis</h3>
          <button className="cat-modal-close" onClick={onClose}>x</button>
        </div>

        <form className="cat-modal-form" onSubmit={handleSubmit}>
          <label className="cat-modal-label">
            Nombre Estado
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="cat-modal-input"
              required
            />
          </label>

          <label className="cat-modal-label">
            Descripcion
            <input
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="cat-modal-input"
              required
            />
          </label>

          {error && <p className="cat-modal-error">{error}</p>}

          <div className="cat-modal-actions">
            <button type="button" className="cat-btn-cancel" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="cat-btn-save" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}