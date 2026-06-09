import { useState, useEffect } from 'react'
import api from '../../../services/api'
import PasswordStrength from '../../../components/PasswordStrength'
import { validatePassword } from '../../../utils/passwordValidator'
import { BiPlus, BiShow, BiEdit, BiCheckCircle, BiXCircle } from 'react-icons/bi'
import './Administrador.css'
import '../Usuarios/Usuarios.css'

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

function DetalleUsuarioModal({ usuario, onClose }) {
  if (!usuario) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title">Detalle del administrador</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="detalle-usuario-body">
          <div className="detalle-row">
            <span className="detalle-label">Nombre</span>
            <span className="detalle-value">{usuario.nombre} {usuario.apellido}</span>
          </div>
          <div className="detalle-row">
            <span className="detalle-label">Correo</span>
            <span className="detalle-value">{usuario.correo || '—'}</span>
          </div>
          <div className="detalle-row">
            <span className="detalle-label">Teléfono</span>
            <span className="detalle-value">{usuario.telefono || '—'}</span>
          </div>
          <div className="detalle-row">
            <span className="detalle-label">Rol</span>
            <span className="detalle-value">{usuario.rol?.nombreRol || '—'}</span>
          </div>
          <div className="detalle-row">
            <span className="detalle-label">Estado</span>
            <span className={`detalle-value ${usuario.activo ? 'text-green' : 'text-red'}`}>
              {usuario.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {usuario.observaciones && (
            <div className="detalle-row">
              <span className="detalle-label">Observaciones</span>
              <span className="detalle-value">{usuario.observaciones}</span>
            </div>
          )}
          {usuario.fechaRegistro && (
            <div className="detalle-row">
              <span className="detalle-label">Fecha registro</span>
              <span className="detalle-value">{new Date(usuario.fechaRegistro).toLocaleDateString('es-CO')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
  const [detalleAdmin, setDetalleAdmin] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [fetching,     setFetching]     = useState(true)
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
      console.log('[DEBUG] Usuarios desde API:', lista.length, 'items')
      console.log('[DEBUG] Roles de cada usuario:', lista.map((u) => ({ nombre: u.nombre, email: u.correo, rol: u.rol, isAdmin: isAdminRole(u.rol) })))
      setAdmins(lista.filter((usuario) => isAdminRole(usuario.rol)))
    } catch (err) {
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
    try {
      await api.put(`/usuarios/${admin.idUsuario}`, { activo: !admin.activo })
      getAdmins()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo cambiar el estado.')
    }
  }

  return (
    <>
      <div className="section-header-card">
        <div className="section-header-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <path d="M16 3.5a4 4 0 0 1 0 7" />
            <path d="M20 20c0-3-1.8-5.5-4-6.5" />
          </svg>
        </div>
        <div className="section-header-text">
          <span className="section-header-badge">Administrador</span>
          <h1 className="section-header-title">Administradores</h1>
          <p className="section-header-description">
            Gestiona los usuarios con rol de Administrador dentro del sistema. Desde aquí puedes registrar nuevos administradores, editar su información personal y activar o desactivar su acceso a la plataforma CoffeeLife.
          </p>
        </div>
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
          <BiPlus size={18} />
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
                <th>#</th><th>Nombre</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr><td colSpan={4} className="finca-empty">No hay administradores registrados.</td></tr>
              ) : admins.map((admin, idx) => (
                <tr key={admin.idUsuario} className={admin.activo ? '' : 'fila-inactiva'}>
                  <td>{idx + 1}</td>
                  <td>{admin.nombre} {admin.apellido}</td>
                  <td>
                    <span
                      className={`usuario-status ${admin.activo ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleActivo(admin)}
                      title={admin.activo ? 'Desactivar administrador' : 'Activar administrador'}
                    >
                      {admin.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button
                        className="btn-icon btn-icon-ver"
                        onClick={() => setDetalleAdmin(admin)}
                        title="Ver detalle"
                      >
                        <BiShow size={16} />
                      </button>
                      <button
                        className="btn-icon btn-icon-editar"
                        onClick={() => setEditingAdmin(admin)}
                        title="Editar administrador"
                      >
                        <BiEdit size={16} />
                      </button>
                      <button
                        className={`btn-icon ${admin.activo ? 'btn-icon-desactivar' : 'btn-icon-activar'}`}
                        onClick={() => handleToggleActivo(admin)}
                        title={admin.activo ? 'Desactivar' : 'Activar'}
                      >
                        {admin.activo ? <BiXCircle size={16} /> : <BiCheckCircle size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detalleAdmin && (
        <DetalleUsuarioModal
          usuario={detalleAdmin}
          onClose={() => setDetalleAdmin(null)}
        />
      )}

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
