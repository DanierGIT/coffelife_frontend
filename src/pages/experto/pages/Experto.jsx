/**
 * Experto.jsx — estilo idéntico a Administrador.jsx
 * Modal emergente para editar. Errores visibles en pantalla.
 */
import { useEffect, useState } from 'react'
import { getExpertos, createExperto, updateExperto, deleteExperto } from './api'
// Reutilizamos el CSS de Administrador para coherencia visual
import '../../Administrador/Administrador.css'

const EMPTY_FORM = {
  nombre: '', apellido: '', correo: '', telefono: '',
  password: '', observaciones: '', activo: true,
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
      obtenerExpertos()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear el experto.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (exp) => {
    const id = exp.idUsuario || exp.id_usuario || exp.id
    if (!id || !window.confirm(`¿Eliminar a ${exp.nombre}?`)) return
    try {
      await deleteExperto(id)
      obtenerExpertos()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar el experto.')
    }
  }

  return (
    <>
      <h1 className="admin-page-title">Expertos</h1>

      {/* ── Formulario crear ── */}
      <div className="admin-form-card">
        <h2 className="admin-form-title">Registrar nuevo experto</h2>
        <form onSubmit={handleCreate}>
          <div className="admin-form">
            <input name="nombre"   value={form.nombre}   onChange={handleChange} placeholder="Nombre *"     required />
            <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido"              />
            <input name="correo"   value={form.correo}   onChange={handleChange} placeholder="Correo *"     required />
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono"              />
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Contraseña *" required />
            <select name="activo" value={String(form.activo)} onChange={handleChange}
              style={{ flex:1, minWidth:140, padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db',
                       fontSize:14, background:'#fafafa', color:'#111827' }}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
          {error   && <p className="modal-error"   style={{ marginTop:10 }}>{error}</p>}
          {success && <p style={{ marginTop:10, color:'#2e7d32', fontSize:13 }}>✅ {success}</p>}
          <div className="admin-form-actions" style={{ marginTop:14 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar experto'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Tabla ── */}
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
            ) : expertos.map((exp) => (
              <tr key={exp.idUsuario || exp.id}>
                <td>{exp.idUsuario || exp.id}</td>
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
                  <button className="btn-edit"   onClick={() => setEditingExperto(exp)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDelete(exp)}>Eliminar</button>
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
    </>
  )
}
