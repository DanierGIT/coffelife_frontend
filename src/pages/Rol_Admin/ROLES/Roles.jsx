/**
 * Roles.jsx — estilo idéntico a Administrador.jsx
 * Modal emergente para editar, igual que Admin y Expertos.
 * Backend espera: { nombre_rol, descripcion }
 */
import { useState, useEffect } from 'react'
import api from '../../../services/api'
// Reutilizamos el CSS de Administrador para coherencia visual
import '../Administrador/Administrador.css'
import '../Usuarios/Usuarios.css'
import { BiPlus, BiEdit, BiTrash } from 'react-icons/bi'

// ── Modal editar ─────────────────────────────────────────────────────────────
function EditModal({ rol, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:      rol.nombreRol  || rol.nombre_rol  || rol.nombre || '',
    descripcion: rol.descripcion || '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('El nombre del rol es obligatorio.')
    setError('')
    setLoading(true)
    try {
      const id = rol.idRol || rol.id
      await api.put(`/cat_roles/${id}`, form)
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
          <h2 className="modal-title">Editar rol</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Nombre del rol
            <input name="nombre" value={form.nombre} onChange={handleChange} required />
          </label>
          <label>
            Descripción
            <input name="descripcion" value={form.descripcion} onChange={handleChange} />
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

// ── Componente principal ─────────────────────────────────────────────────────
export default function Roles() {
  const [roles,       setRoles]       = useState([])
  const [editingRol,  setEditingRol]  = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [showCrearModal, setShowCrearModal] = useState(false)

  const cargarRoles = async () => {
    try {
      const res  = await api.get('/cat_roles')
      const data = res.data
      setRoles(Array.isArray(data) ? data : (data?.data ?? data?.roles ?? []))
    } catch {
      setError('Error al cargar roles.')
    }
  }

  useEffect(() => { cargarRoles() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('El nombre del rol es obligatorio.')
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await api.post('/cat_roles', form)
      setForm({ nombre: '', descripcion: '' })
      setSuccess('Rol creado correctamente.')
      setShowCrearModal(false)
      cargarRoles()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear el rol.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (rol) => {
    const id = rol.idRol || rol.id
    if (!id || !window.confirm(`¿Eliminar el rol "${rol.nombreRol || rol.nombre_rol}"?`)) return
    try {
      await api.delete(`/cat_roles/${id}`)
      cargarRoles()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar el rol.')
    }
  }

  return (
    <>
      {/* ── Header de sección: Roles ── */}
      <div className="section-header-card">
        <div className="section-header-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <circle cx="12" cy="11" r="2" />
            <path d="M12 13v3" />
          </svg>
        </div>
        <div className="section-header-text">
          <span className="section-header-badge">Administrador</span>
          <h1 className="section-header-title">Roles de Usuario</h1>
          <p className="section-header-description">
            Configuración y gestión de los perfiles de acceso en CoffeeLife. Define las jerarquías y los niveles de permisos del sistema para diferenciar las funciones operativas de administradores, expertos agrícolas y productores cafeteros.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
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
          <BiPlus size={18} />
          Agregar rol
        </button>
      </div>

      {/* ── Tabla ── */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Nombre del rol</th><th>Descripción</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign:'center', padding:'1.5rem', color:'#9ca3af' }}>No hay roles registrados.</td></tr>
            ) : roles.map((rol, idx) => (
              <tr key={rol.idRol || rol.id}>
                <td>{idx + 1}</td>
                <td>{rol.nombreRol || rol.nombre_rol || rol.nombre}</td>
                <td>{rol.descripcion || '—'}</td>
                <td>
                  <div className="td-actions">
                    <button
                      className="btn-icon btn-icon-editar"
                      onClick={() => setEditingRol(rol)}
                      title="Editar rol"
                    >
                      <BiEdit size={16} />
                    </button>
                    <button
                      className="btn-icon btn-icon-eliminar"
                      onClick={() => handleDelete(rol)}
                      title="Eliminar rol"
                    >
                      <BiTrash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCrearModal && (
        <div className="modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Crear nuevo rol</h2>
            <form className="modal-form" onSubmit={handleCreate}>
              <label>
                Nombre del rol
                <input name="nombre" value={form.nombre} onChange={handleChange} required />
              </label>
              <label>
                Descripción
                <input name="descripcion" value={form.descripcion} onChange={handleChange} />
              </label>
              {error && <p className="modal-error">{error}</p>}
              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear rol'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowCrearModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRol && (
        <EditModal
          rol={editingRol}
          onClose={() => setEditingRol(null)}
          onSaved={cargarRoles}
        />
      )}
    </>
  )
}