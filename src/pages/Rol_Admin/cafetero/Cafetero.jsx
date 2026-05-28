/**
 * Cafetero.jsx
 * CRUD de cafeteros conectado al backend via api centralizado (axios).
 * Endpoints: GET/POST/PUT/DELETE /cafeteros
 */

import { useState, useEffect } from "react"
import api from "../../../services/api"
import PasswordStrength from "../../../components/PasswordStrength"
import { validatePassword } from "../../../utils/passwordValidator"
import "./styles/cafeteros.css"
import "../Administrador/Administrador.css"

// ── Modal de edición ─────────────────────────────────────────────────────────
function EditModal({ cafetero, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:        cafetero.nombre        || "",
    apellido:      cafetero.apellido      || "",
    correo:        cafetero.correo        || "",
    telefono:      cafetero.telefono      || "",
    password:      "",
    observaciones: cafetero.observaciones || "",
    activo:        cafetero.activo ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === "activo" ? value === "true" : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      await api.put(`/cafeteros/${cafetero.idUsuario}`, payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo guardar. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar cafetero</h2>
          <button className="modal-close" onClick={onClose} title="Cerrar">✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>Nombre
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required />
            </label>
            <label>Apellido
              <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required />
            </label>
          </div>

          <label>Correo
            <input name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="correo@ejemplo.com" required />
          </label>

          <label>Teléfono
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" />
          </label>

          <label>Observaciones
            <input name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Observaciones" />
          </label>

          <label>Estado
            <select name="activo" value={String(form.activo)} onChange={handleChange}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>

          <label>
            Nueva contraseña
            <span className="modal-hint"> (dejar en blanco para no cambiarla)</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
            <PasswordStrength password={form.password} />
          </label>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Cafetero() {
  const [cafeteros,       setCafeteros] = useState([])
  const [editingCafetero, setEditing]   = useState(null)
  const [loading,         setLoading]   = useState(false)
  const [error,           setError]     = useState("")
  const [success,         setSuccess]   = useState("")
  const [showCrearModal,  setShowCrearModal] = useState(false)

  const [form, setForm] = useState({
    nombre: "", apellido: "", correo: "", telefono: "",
    password: "", confirmPassword: "", observaciones: "", activo: true,
  })

  const getCafeteros = async () => {
    try {
      const res = await api.get("/cafeteros")
      setCafeteros(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch (err) {
      setError("No se pudieron cargar los cafeteros.")
      console.error("Error al obtener cafeteros:", err)
    }
  }

  useEffect(() => { getCafeteros() }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === "activo" ? value === "true" : value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const roleName = "cafetero"
    const { isValid, errors: pwErrors } = validatePassword(form.password, roleName)
    if (!isValid) {
      setError(`Contraseña inválida: ${pwErrors.join(", ")}`)
      return
    }
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setLoading(true)
    try {
      await api.post("/cafeteros", form)
      setForm({ nombre: "", apellido: "", correo: "", telefono: "", password: "", confirmPassword: "", observaciones: "", activo: true })
      setSuccess("Cafetero creado correctamente.")
      setShowCrearModal(false)
      getCafeteros()
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo crear el cafetero.")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActivo = async (cafetero) => {
    const next = !cafetero.activo
    const accion = next ? "activar" : "desactivar"
    if (!window.confirm(`¿${accion} a ${cafetero.nombre}?`)) return
    try {
      await api.put(`/cafeteros/${cafetero.idUsuario}`, { activo: next })
      getCafeteros()
    } catch (err) {
      setError(err?.response?.data?.message || `No se pudo ${accion}.`)
    }
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Cafeteros</h1>
        <p>Usuarios cafeteros del sistema</p>
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
          Agregar cafetero
        </button>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cafeteros.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#9ca3af", padding: "24px" }}>
                  No hay cafeteros registrados.
                </td>
              </tr>
            ) : (
              cafeteros.map((c) => (
                <tr key={c.idUsuario}>
                  <td>{c.nombre} {c.apellido}</td>
                  <td>{c.correo}</td>
                  <td>{c.telefono || "—"}</td>
                  <td>
                    <span className={c.activo ? "badge-active" : "badge-inactive"}>
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => setEditing(c)}>Editar</button>
                    <button
                      onClick={() => handleToggleActivo(c)}
                      style={{
                        padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:500,
                        cursor:'pointer', marginRight:0,
                        background: c.activo ? '#fef3c7' : '#e8f5e9',
                        color:      c.activo ? '#92400e' : '#2e7d32',
                        border:     c.activo ? '1px solid #fde68a' : '1px solid #c8e6c9',
                      }}
                    >
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingCafetero && (
        <EditModal
          cafetero={editingCafetero}
          onClose={() => setEditing(null)}
          onSaved={getCafeteros}
        />
      )}

      {showCrearModal && (
        <div className="modal-overlay" onClick={() => { setShowCrearModal(false); setError(''); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Crear cafetero</h2>
              <button className="modal-close" onClick={() => { setShowCrearModal(false); setError(''); }}>x</button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="modal-row">
                <label>Nombre   <input name="nombre"   value={form.nombre}   onChange={handleChange} placeholder="Nombre" required /></label>
                <label>Apellido <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required /></label>
              </div>
              <label>Correo   <input name="correo"   type="email" value={form.correo}   onChange={handleChange} placeholder="Correo" required /></label>
              <label>Teléfono <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" /></label>
              <label>Observaciones <textarea name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Observaciones" style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14, background:'#fafafa', resize:'vertical', fontFamily:'inherit', width:'100%' }} /></label>
              <label>Estado
                <select name="activo" value={String(form.activo)} onChange={handleChange} style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14, background:'#fafafa' }}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>
              <div style={{ position: 'relative' }}>
                <label>Contraseña <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Contraseña (mín. 6)" required /></label>
                <PasswordStrength password={form.password} role="cafetero" />
              </div>
              <div style={{ position: 'relative' }}>
                <label>Confirmar contraseña <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirmar contraseña" required /></label>
              </div>
              {error && <p className="modal-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowCrearModal(false); setError(''); }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creando…' : 'Crear cafetero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
