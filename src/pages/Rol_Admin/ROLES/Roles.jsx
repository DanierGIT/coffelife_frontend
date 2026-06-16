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
import { BiPlus, BiEdit } from 'react-icons/bi'
import ToggleSwitch from '../../../components/ToggleSwitch'

// ── Helpers para toggle activo (backend no persiste siempre) ─────────────────
const STORAGE_KEY = 'roles_toggles'
const getLocalToggles = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
const normalizeActivo = (val) => val === true || val === 1

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
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.roles ?? [])
      const localToggles = getLocalToggles()
      const merged = data.map(item => {
        const id = item.idRol || item.id
        return {
          ...item,
          activo: id in localToggles ? localToggles[id] : normalizeActivo(item.activo)
        }
      })
      setRoles(merged)
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

  const handleToggleActivo = async (id, newActivo) => {
    setRoles((prev) =>
      prev.map((r) => ((r.idRol || r.id) === id ? { ...r, activo: newActivo } : r))
    )
    try {
      const toggles = getLocalToggles()
      toggles[id] = newActivo
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles))
      await api.put(`/cat_roles/${id}`, { activo: newActivo ? 1 : 0 })
    } catch (err) {
      setRoles((prev) =>
        prev.map((r) => ((r.idRol || r.id) === id ? { ...r, activo: !newActivo } : r))
      )
      setError(err?.response?.data?.message || 'No se pudo cambiar el estado del rol.')
    }
  }

  return (
    <>
      {/* ── Header de sección: Roles ── */}
      <div className="section-header-card" style={{ position: 'relative' }}>
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
        <button
          className="btn-primary"
          onClick={() => setShowCrearModal(true)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
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
              <th>#</th><th>Nombre del rol</th><th>Descripción</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign:'center', padding:'1.5rem', color:'#9ca3af' }}>No hay roles registrados.</td></tr>
            ) : roles.map((rol, idx) => (
              <tr key={rol.idRol || rol.id}>
                <td>{idx + 1}</td>
                <td>{rol.nombreRol || rol.nombre_rol || rol.nombre}</td>
                <td>{rol.descripcion || <span className="rec-list-placeholder">(Sin descripción)</span>}</td>
                <td>
                  <span className={`estado-badge ${rol.activo !== false ? 'badge-active' : 'badge-inactive'}`}>
                    <span className="badge-dot" />
                    {rol.activo !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="td-actions">
                    <button
                      className="btn-icon btn-icon-editar"
                      onClick={() => setEditingRol(rol)}
                      title="Editar rol"
                    >
                      <BiEdit size={16} />
                    </button>
                    <ToggleSwitch
                      active={rol.activo !== false}
                      onClick={(e, next) => handleToggleActivo(rol.idRol || rol.id, next)}
                      title={rol.activo === false ? 'Activar rol' : 'Desactivar rol'}
                    />
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