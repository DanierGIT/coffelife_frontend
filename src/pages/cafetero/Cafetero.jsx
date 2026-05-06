/**
 * Cafetero.jsx
 * ──────────────────────────────────────────────
 * CRUD de cafeteros. Se conecta al backend
 * en /cafeteros vía fetch directo.
 *
 * Endpoints usados:
 *  GET    /cafeteros
 *  POST   /cafeteros
 *  PUT    /cafeteros/:id
 *  DELETE /cafeteros/:id
 */

import { useState, useEffect } from "react"
import "./styles/cafeteros.css"

const BASE_URL = "http://localhost:3333/cafeteros"

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
  const [error, setError]     = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === "activo" ? value === "true" : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${BASE_URL}/${cafetero.idUsuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Error al actualizar")
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || "No se pudo guardar. Intenta de nuevo.")
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
        {/* Cabecera */}
        <div className="modal-header">
          <h2 className="modal-title">✏️ Editar cafetero</h2>
          <button className="modal-close" onClick={onClose} title="Cerrar">✕</button>
        </div>

        {/* Formulario */}
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
            <select name="activo" value={form.activo} onChange={handleChange}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>

          <label>
            Nueva contraseña
            <span className="modal-hint">(dejar en blanco para no cambiarla)</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
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
  const [cafeteros, setCafeteros]       = useState([])
  const [editingCafetero, setEditing]   = useState(null)
  const [form, setForm] = useState({
    nombre: "", apellido: "", correo: "", telefono: "", password: "", observaciones: "", activo: true,
  })

  // ── Cargar lista ──
  const getCafeteros = async () => {
    try {
      const res  = await fetch(BASE_URL)
      const data = await res.json()
      setCafeteros(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error al obtener cafeteros:", err)
    }
  }

  useEffect(() => { getCafeteros() }, [])

  // ── Crear ──
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === "activo" ? value === "true" : value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const res  = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message || "Error al crear"); return }
      setForm({ nombre: "", apellido: "", correo: "", telefono: "", password: "", observaciones: "", activo: true })
      getCafeteros()
    } catch (err) {
      console.error("Error al crear cafetero:", err)
    }
  }

  // ── Eliminar ──
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cafetero?")) return
    try {
      await fetch(`${BASE_URL}/${id}`, { method: "DELETE" })
      getCafeteros()
    } catch (err) {
      console.error("Error al eliminar cafetero:", err)
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Cafeteros</h1>

      {/* ── Formulario de creación ── */}
      <div className="admin-form-card">
        <h2 className="admin-form-title">➕ Nuevo cafetero</h2>
        <form className="admin-form" onSubmit={handleCreate}>
          <input name="nombre"        value={form.nombre}        onChange={handleChange} placeholder="Nombre"       required />
          <input name="apellido"      value={form.apellido}      onChange={handleChange} placeholder="Apellido"     required />
          <input name="correo"        value={form.correo}        onChange={handleChange} placeholder="Correo"       type="email" required />
          <input name="telefono"      value={form.telefono}      onChange={handleChange} placeholder="Teléfono" />
          <input name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Observaciones" />
          <input name="password"      value={form.password}      onChange={handleChange} placeholder="Contraseña"   type="password" required />
          <select name="activo" value={form.activo} onChange={handleChange} className="admin-form-select">
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary">Crear</button>
          </div>
        </form>
      </div>

      {/* ── Tabla ── */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Acciones</th>
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
                    <button className="btn-edit"   onClick={() => setEditing(c)}>Editar</button>
                    <button className="btn-delete" onClick={() => handleDelete(c.idUsuario)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal de edición ── */}
      {editingCafetero && (
        <EditModal
          cafetero={editingCafetero}
          onClose={() => setEditing(null)}
          onSaved={getCafeteros}
        />
      )}
    </div>
  )
}
