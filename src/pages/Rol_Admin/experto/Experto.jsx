/**
 * Experto.jsx — estilo idéntico a Administrador.jsx
 * Modal emergente para editar. Errores visibles en pantalla.
 */
import { useEffect, useState } from 'react'
import { getExpertos, createExperto, updateExperto } from './api'
import PasswordStrength from '../../../components/PasswordStrength'
import { validatePassword } from '../../../utils/passwordValidator'
import "../Administrador/Administrador.css";

const EMPTY_FORM = {
  nombre: '', apellido: '', correo: '', telefono: '',
  password: '', confirmPassword: '', observaciones: '', activo: true,
}

// ── Modal de edición ─────────────────────────────────────────────────────────
function EditModal({ experto, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:        experto.nombre        || '',
    apellido:      experto.apellido      || '',
    correo:        experto.correo        || '',
    telefono:      experto.telefono      || '',
    observaciones: experto.observaciones || '',
    activo:        Boolean(experto.activo),
    password:      '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === 'activo' ? value === 'true' : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        nombre: form.nombre, apellido: form.apellido,
        correo: form.correo, telefono: form.telefono,
        observaciones: form.observaciones, activo: form.activo,
      }
      if (form.password) payload.password = form.password
      const id = experto.idUsuario || experto.id_usuario || experto.id
      await updateExperto(id, payload)
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
          <h2 className="modal-title">Editar experto</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>Nombre   <input name="nombre"   value={form.nombre}   onChange={handleChange} required /></label>
            <label>Apellido <input name="apellido" value={form.apellido} onChange={handleChange} /></label>
          </div>
          <div className="modal-row">
            <label>Correo   <input name="correo"   type="email" value={form.correo}   onChange={handleChange} required /></label>
            <label>Teléfono <input name="telefono" value={form.telefono} onChange={handleChange} /></label>
          </div>
          <label>
            Contraseña <span className="modal-hint">(dejar vacío para no cambiar)</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} />
            <PasswordStrength password={form.password} />
          </label>
          <label>
            Observaciones
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={2}
              style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14,
                       background:'#fafafa', resize:'vertical', fontFamily:'inherit' }} />
          </label>
          <label>
            Estado
            <select name="activo" value={String(form.activo)} onChange={handleChange}
              style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14, background:'#fafafa' }}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
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
export default function Experto() {
  const [expertos,        setExpertos]        = useState([])
  const [editingExperto,  setEditingExperto]  = useState(null)
  const [form,            setForm]            = useState(EMPTY_FORM)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')
  const [success,         setSuccess]         = useState('')
  const [showCrearModal,  setShowCrearModal]  = useState(false)

  const obtenerExpertos = async () => {
    try {
      const data = await getExpertos()
      setExpertos(Array.isArray(data) ? data : (data?.data ?? []))
    } catch (err) {
      console.error('Error al obtener expertos', err)
    }
  }

  useEffect(() => { obtenerExpertos() }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === 'activo' ? value === 'true' : value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const roleName = 'experto'
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
      await createExperto({
        nombre:        form.nombre,
        apellido:      form.apellido,
        correo:        form.correo,
        telefono:      form.telefono,
        password:      form.password,
        observaciones: form.observaciones,
        activo:        form.activo,
      })
      setForm(EMPTY_FORM)
      setSuccess('Experto creado correctamente.')
      setShowCrearModal(false)
      obtenerExpertos()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear el experto.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActivo = async (exp) => {
    const next = !exp.activo
    const accion = next ? 'activar' : 'desactivar'
    if (!window.confirm(`¿${accion} a ${exp.nombre}?`)) return
    try {
      await updateExperto(exp.idUsuario, { activo: next })
      obtenerExpertos()
    } catch (err) {
      setError(err?.response?.data?.message || `No se pudo ${accion}.`)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Expertos</h1>
        <p>Usuarios expertos del sistema</p>
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
          Agregar experto
        </button>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expertos.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:'1.5rem', color:'#9ca3af' }}>No hay expertos registrados.</td></tr>
            ) : expertos.map((exp, idx) => (
              <tr key={exp.idUsuario || exp.id}>
                <td>{idx + 1}</td>
                <td>{exp.nombre} {exp.apellido}</td>
                <td>{exp.correo}</td>
                <td>{exp.telefono || '—'}</td>
                <td>
                  <span style={{
                    padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600,
                    background: exp.activo ? '#e8f5e9' : '#fce8e8',
                    color:      exp.activo ? '#2e7d32' : '#b91c1c',
                  }}>
                    {exp.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button className="btn-edit" onClick={() => setEditingExperto(exp)}>Editar</button>
                  <button
                    onClick={() => handleToggleActivo(exp)}
                    style={{
                      padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:500,
                      cursor:'pointer', marginRight:0,
                      background: exp.activo ? '#fef3c7' : '#e8f5e9',
                      color:      exp.activo ? '#92400e' : '#2e7d32',
                      border:     exp.activo ? '1px solid #fde68a' : '1px solid #c8e6c9',
                    }}
                  >
                    {exp.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingExperto && (
        <EditModal
          experto={editingExperto}
          onClose={() => setEditingExperto(null)}
          onSaved={obtenerExpertos}
        />
      )}

      {showCrearModal && (
        <div className="modal-overlay" onClick={() => { setShowCrearModal(false); setError(''); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Crear experto</h2>
              <button className="modal-close" onClick={() => { setShowCrearModal(false); setError(''); }}>x</button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="modal-row">
                <label>Nombre   <input name="nombre"   value={form.nombre}   onChange={handleChange} placeholder="Nombre" required /></label>
                <label>Apellido <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" /></label>
              </div>
              <div className="modal-row">
                <label>Correo   <input name="correo"   type="email" value={form.correo}   onChange={handleChange} placeholder="Correo" required /></label>
                <label>Teléfono <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" /></label>
              </div>
              <div style={{ position: 'relative' }}>
                <label>Contraseña <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Contraseña" required /></label>
                <PasswordStrength password={form.password} role="experto" />
              </div>
              <div style={{ position: 'relative' }}>
                <label>Confirmar contraseña <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirmar contraseña" required /></label>
              </div>
              <label>Observaciones <textarea name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Observaciones" style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14, background:'#fafafa', resize:'vertical', fontFamily:'inherit' }} /></label>
              <label>Estado
                <select name="activo" value={String(form.activo)} onChange={handleChange} style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14, background:'#fafafa' }}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>
              {error && <p className="modal-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowCrearModal(false); setError(''); }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creando…' : 'Crear experto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
