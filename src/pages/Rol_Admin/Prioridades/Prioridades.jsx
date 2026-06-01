import { useEffect, useState } from 'react'
import './Prioridades.css'
import api from '../../../services/api'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.prioridades)) return data.prioridades
  return []
}

export default function Prioridades() {
  const [prioridades, setPrioridades] = useState([])
  const [nombre, setNombre] = useState('')
  const [nivelOrden, setNivelOrden] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCrearModal, setShowCrearModal] = useState(false)

  const cargarPrioridades = async () => {
    try {
      setError('')

      const res = await api.get('/categorias/prioridades')
      setPrioridades(getArrayData(res.data))
    } catch {
      try {
        const res = await api.get('/cat_prioridades')
        setPrioridades(getArrayData(res.data))
      } catch (err) {
        setError(err?.response?.data?.message || 'No se pudieron cargar las prioridades.')
      }
    }
  }

  useEffect(() => {
    cargarPrioridades()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!nombre.trim() || !nivelOrden) {
      setError('Completa todos los campos.')
      return
    }

    setLoading(true)

    try {
      await api.post('/cat_prioridades', {
        nombre: nombre.trim(),
        nivel_orden: Number(nivelOrden),
      })

      setNombre('')
      setNivelOrden('')
      setSuccess('Prioridad creada correctamente.')
      setShowCrearModal(false)
      cargarPrioridades()
    } catch (err) {
      const backendMessage = err?.response?.data?.message
      const backendError = err?.response?.data?.error

      if (err?.response?.status === 500) {
        setError(
          backendError
            ? `Error interno del backend: ${backendError}`
            : 'El backend devolvio error 500 al crear la prioridad. La pantalla esta enviando los datos, pero el servidor fallo.'
        )
      } else {
        setError(backendMessage || 'No se pudo crear la prioridad.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmar = window.confirm('Eliminar esta prioridad?')
    if (!confirmar) return

    try {
      setError('')
      setSuccess('')

      await api.delete(`/cat_prioridades/${id}`)
      setSuccess('Prioridad eliminada correctamente.')
      cargarPrioridades()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar la prioridad.')
    }
  }

  return (
    <div className="prioridades-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h1 style={{ margin: 0 }}>Gestion de Prioridades</h1>
        <button
          className="btn-primary"
          onClick={() => setShowCrearModal(true)}
          style={{
            background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar prioridad
        </button>
      </div>

      {error && <p className="modal-error">{error}</p>}
      {success && <p className="finca-success">{success}</p>}

      <div className="tabla-container">
        <table className="tabla-prioridades">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Nivel</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {prioridades.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem' }}>
                  No hay prioridades registradas.
                </td>
              </tr>
            ) : (
              prioridades.map((p, idx) => (
                <tr key={p.idPrioridad}>
                  <td>{idx + 1}</td>
                  <td>{p.nombre}</td>
                  <td>
                    <span className={`badge badge-${p.nivelOrden}`}>
                      {p.nivelOrden || '-'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleDelete(p.idPrioridad)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showCrearModal && (
        <div className="modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Crear prioridad</h2>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="modal-row">
                <label>Nombre
                  <input type="text" placeholder="Nombre prioridad" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </label>
                <label>Nivel
                  <input type="number" placeholder="Nivel" value={nivelOrden} min="1" max="3" onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || ['1', '2', '3'].includes(value)) { setNivelOrden(value) }
                  }} required />
                </label>
              </div>
              {error && <p className="modal-error">{error}</p>}
              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear prioridad'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowCrearModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}