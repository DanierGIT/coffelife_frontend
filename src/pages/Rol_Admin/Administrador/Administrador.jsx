  /**
 * Administrador.jsx
 * CRUD completo conectado a /admins
 * El backend espera: { nombre, apellido, correo, telefono, password }
 */
import { useState, useEffect } from 'react'
import api from '../../../services/api'
import PasswordStrength from '../../../components/PasswordStrength'
import { validatePassword } from '../../../utils/passwordValidator'
import './Administrador.css'

const normalizeRole = (role) =>
  (role ?? '').toString().toLowerCase().trim()

const isAdminRole = (role) => {
  const value = normalizeRole(role?.nombreRol || role?.nombre_rol || role?.nombre || role)
  return value === 'admin' || value === 'administrador'
}

const getAdminRoleId = async () => {
  const res = await api.get('/cat_roles')
  const roles = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
  const adminRole = roles.find(isAdminRole)

  if (!adminRole) {
    throw new Error('No existe un rol admin/administrador en cat_roles.')
  }

  return adminRole.idRol || adminRole.id_rol || adminRole.id
}

function EditModal({ admin, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:   admin.nombre   || '',
    apellido: admin.apellido || '',
    correo:   admin.correo   || '',
    telefono: admin.telefono || '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      await api.put(`/usuarios/${admin.idUsuario}`, payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar administrador</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>Nombre   <input name="nombre"   value={form.nombre}   onChange={handleChange} required /></label>
            <label>Apellido <input name="apellido" value={form.apellido} onChange={handleChange} required /></label>
          </div>
          <label>Correo   <input name="correo"   value={form.correo}   onChange={handleChange} required /></label>
          <label>Teléfono <input name="telefono" value={form.telefono} onChange={handleChange} /></label>
          <label>
            Contraseña <span className="modal-hint">(opcional)</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} />
            <PasswordStrength password={form.password} />
          </label>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Administrador() {
  const [admins,       setAdmins]       = useState([])
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [fetching,     setFetching]     = useState(true)   // ← nuevo: carga inicial
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')
  const [showCrearModal, setShowCrearModal] = useState(false)

  const [form, setForm] = useState({
    nombre: '', apellido: '', correo: '', telefono: '', password: '', confirmPassword: '',
  })

  const getAdmins = async () => {
    setFetching(true)
    setError('')
    try {
      const res = await api.get('/usuarios')
      const lista = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setAdmins(lista.filter((usuario) => isAdminRole(usuario.rol)))
    } catch (err) {
      // Muestra el error real para que puedas depurar
      const msg = err?.response?.data?.message || err?.message || 'Error de red al cargar administradores.'
      setError(msg)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { getAdmins() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const roleName = 'administrador'
    const { isValid, errors: pwErrors } = validatePassword(form.password, roleName)
    if (!isValid) {
      setError(`Contraseña inválida: ${pwErrors.join(', ')}`)
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const idRol = await getAdminRoleId()
      await api.post('/usuarios', { ...form, id_rol: idRol })
      setForm({ nombre: '', apellido: '', correo: '', telefono: '', password: '', confirmPassword: '' })
      setSuccess('Administrador creado correctamente.')
      setShowCrearModal(false)
      getAdmins()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear el administrador.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActivo = async (admin) => {
    const next = !admin.activo
    const accion = next ? 'activar' : 'desactivar'
    if (!window.confirm(`¿${accion} a ${admin.nombre}?`)) return
    try {
      await api.put(`/usuarios/${admin.idUsuario}`, { activo: next })
      getAdmins()
    } catch (err) {
      setError(err?.response?.data?.message || `No se pudo ${accion}.`)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Administradores</h1>
        <p>Usuarios administradores del sistema</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
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
          Agregar administrador
        </button>
      </div>

      <div className="admin-table-card">
        {fetching ? (
          <p style={{ textAlign: 'center', padding: '24px', color: '#666' }}>Cargando administradores…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr><td colSpan={5} className="finca-empty">No hay administradores registrados.</td></tr>
              ) : admins.map((admin) => (
                <tr key={admin.idUsuario}>
                  <td>{admin.nombre} {admin.apellido}</td>
                  <td>{admin.correo}</td>
                  <td>{admin.telefono || '—'}</td>
                  <td>
                    <span style={{
                      padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600,
                      background: admin.activo ? '#e8f5e9' : '#fce8e8',
                      color:      admin.activo ? '#2e7d32' : '#b91c1c',
                    }}>
                      {admin.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => setEditingAdmin(admin)}>Editar</button>
                    <button
                      onClick={() => handleToggleActivo(admin)}
                      style={{
                        padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:500,
                        cursor:'pointer', marginRight:0,
                        background: admin.activo ? '#fef3c7' : '#e8f5e9',
                        color:      admin.activo ? '#92400e' : '#2e7d32',
                        border:     admin.activo ? '1px solid #fde68a' : '1px solid #c8e6c9',
                      }}
                    >
                      {admin.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingAdmin && (
        <EditModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSaved={getAdmins}
        />
      )}

      {showCrearModal && (
        <div className="modal-overlay" onClick={() => { setShowCrearModal(false); setError(''); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Crear administrador</h2>
              <button className="modal-close" onClick={() => { setShowCrearModal(false); setError(''); }}>x</button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="modal-row">
                <label>Nombre   <input name="nombre"   value={form.nombre}   onChange={handleChange} placeholder="Nombre" required /></label>
                <label>Apellido <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required /></label>
              </div>
              <label>Correo   <input name="correo"   value={form.correo}   onChange={handleChange} placeholder="Correo" required /></label>
              <label>Teléfono <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" /></label>
              <div style={{ position: 'relative' }}>
                <label>Contraseña <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Contraseña (mín. 10)" required /></label>
                <PasswordStrength password={form.password} role="administrador" />
              </div>
              <label>Confirmar contraseña <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirmar contraseña" required /></label>
              {error && <p className="modal-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowCrearModal(false); setError(''); }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creando…' : 'Crear administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}