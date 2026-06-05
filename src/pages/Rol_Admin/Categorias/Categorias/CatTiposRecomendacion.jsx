
import { useEffect, useState } from 'react'
import api from '../../../../services/api'
import '../../Administrador/Administrador.css'
import './Formulario.css'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

export default function CatTiposRecomendacion() {
  const [tipos, setTipos] = useState([])
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
  })
  const [editingRow, setEditingRow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarTipos = async () => {
    setFetching(true)
    setError('')

    try {
      const res = await api.get('/cat_tipos_recomendaciones')
      setTipos(getArrayData(res.data))
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar tipos de recomendacion.')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    cargarTipos()
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
      await api.post('/cat_tipo_recomendacion', {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
      })

      setForm({
        nombre: '',
        descripcion: '',
      })

      setSuccess('Tipo de recomendacion creado correctamente.')
      cargarTipos()
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al crear tipo de recomendacion.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActivo = async (item) => {
    const nextState = item.activo === undefined ? false : !item.activo
    const accion = nextState ? 'activar' : 'desactivar'
    if (!window.confirm(`¿${accion} este tipo de recomendacion?`)) return

    setError('')
    setSuccess('')

    try {
      await api.put(`/cat_tipos_recomendacion/${item.idTipo}`, { activo: nextState })
      setSuccess(`Tipo de recomendacion ${accion}do correctamente.`)
      cargarTipos()
    } catch (err) {
      setError(err?.response?.data?.message || `No se pudo ${accion}.`)
    }
  }

 return (
  <>
    {/* ── Encabezado Catálogo Agrícola ── */}
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
      backgroundColor: '#f0f7ed',
      border: '1px solid #c8e6c0',
      borderRadius: '10px',
      padding: '16px 20px',
      marginBottom: '24px',
    }}>
      <div style={{
        flexShrink: 0,
        width: '40px',
        height: '40px',
        backgroundColor: '#2e7d32',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>

      <div>
        <span style={{
          display: 'inline-block',
          backgroundColor: '#2e7d32',
          color: 'white',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '2px 8px',
          borderRadius: '4px',
          marginBottom: '6px',
        }}>
          Catálogo Agrícola
        </span>
        <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#1b5e20' }}>
          Tipos de Recomendación
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#4a7c59', lineHeight: 1.5 }}>
          Administra los diferentes tipos de recomendaciones del sistema. Desde aquí puedes crear, editar, activar o desactivar tipos que facilitan la clasificación de las recomendaciones registradas.
        </p>
      </div>
    </div>

    {/* ── Contenido original ── */}
    <div className="crud-container">
      <div className="crud-form-card">
        <h2>Tipos de Recomendación</h2>

        <form className="crud-form" onSubmit={handleCreate}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre Tipo"
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

        {error && (
          <p style={{ color: '#c53030', marginTop: 10, fontSize: 13 }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{ color: '#2e7d32', marginTop: 10, fontSize: 13 }}>
            {success}
          </p>
        )}
      </div>

      <div className="crud-table-card">
        {fetching ? (
          <p style={{ textAlign: 'center', padding: 24, color: '#666' }}>
            Cargando...
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Tipo</th>
                <th>Descripcion</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {tipos.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                    Sin registros aun.
                  </td>
                </tr>
              ) : (
                tipos.map((tipo, idx) => (
                  <tr key={tipo.idTipo}>
                    <td>{idx + 1}</td>
                    <td>{tipo.nombreTipo}</td>
                    <td>{tipo.descripcion || '-'}</td>
                    <td className="actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => setEditingRow(tipo)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className={tipo.activo === false ? 'edit-btn' : 'delete-btn'}
                        onClick={() => handleToggleActivo(tipo)}
                      >
                        {tipo.activo === false ? 'Activar' : 'Desactivar'}
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
          onSaved={cargarTipos}
        />
      )}
    </div>
  </>
)
}

function EditModal({ row, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: row.nombreTipo || '',
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
      await api.put(`/cat_tipo_recomendacion/${row.idTipo}`, {
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
          <h3 className="cat-modal-title">Editar tipo de recomendacion</h3>
          <button className="cat-modal-close" onClick={onClose}>x</button>
        </div>

        <form className="cat-modal-form" onSubmit={handleSubmit}>
          <label className="cat-modal-label">
            Nombre Tipo
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