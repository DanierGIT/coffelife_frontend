/**
 * Administrador.jsx
 * ──────────────────────────────────────────────
 * CRUD de administradores. Se conecta al backend
 * en /administradores vía el servicio api.js.
 *
 * Endpoints usados:
 *  GET    /administradores
 *  POST   /administradores
 *  PUT    /administradores/:id
 *  DELETE /administradores/:id
 */

import { useState, useEffect } from "react"
import api from "../../services/api"
import "./Administrador.css"

// ── Modal de edición ─────────────────────────────────────────────────────────
function EditModal({ admin, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:   admin.nombre   || "",
    apellido: admin.apellido || "",
    correo:   admin.correo   || "",
    telefono: admin.telefono || "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api.put(`/administradores/${admin.idUsuario}`, form)
      onSaved()   // recarga la tabla
      onClose()   // cierra el modal
    } catch (err) {
      setError("No se pudo guardar. Intenta de nuevo.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Cerrar con Escape
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
          <h2 className="modal-title">✏️ Editar administrador</h2>
          <button className="modal-close" onClick={onClose} title="Cerrar">✕</button>
        </div>

        {/* Formulario */}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>Nombre
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Nombre"
                required
              />
            </label>
            <label>Apellido
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                placeholder="Apellido"
                required
              />
            </label>
          </div>

          <label>Correo
            <input
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required
            />
          </label>

          <label>Teléfono
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="Teléfono"
            />
          </label>

          <label>
            Nueva contraseña
            <span className="modal-hint">(dejar en blanco para no cambiarla)</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </label>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
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
export default function Administrador() {
  const [admins, setAdmins]         = useState([])
  const [editingAdmin, setEditingAdmin] = useState(null) // admin seleccionado para editar
  const [form, setForm] = useState({
    nombre: "", apellido: "", correo: "", telefono: "", password: "",
  })

  // ── Cargar lista ──
  const getAdmins = async () => {
    try {
      const res = await api.get("/administradores")
      setAdmins(res.data)
    } catch (error) {
      console.error("Error al obtener administradores:", error)
    }
  }

  useEffect(() => { getAdmins() }, [])

  // ── Crear nuevo administrador ──
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post("/administradores", form)
      setForm({ nombre: "", apellido: "", correo: "", telefono: "", password: "" })
      getAdmins()
    } catch (error) {
      console.error("Error al crear administrador:", error)
    }
  }

  // ── Eliminar ──
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este administrador?")) return
    try {
      await api.delete(`/administradores/${id}`)
      getAdmins()
    } catch (error) {
      console.error("Error al eliminar administrador:", error)
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Administradores</h1>

      {/* ── Formulario de creación ── */}
      <div className="admin-form-card">
        <h2 className="admin-form-title">➕ Nuevo administrador</h2>
        <form className="admin-form" onSubmit={handleCreate}>
          <input name="nombre"   value={form.nombre}   onChange={handleChange} placeholder="Nombre"     required />
          <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido"   required />
          <input name="correo"   value={form.correo}   onChange={handleChange} placeholder="Correo"     type="email" required />
          <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" />
          <input name="password" value={form.password} onChange={handleChange} placeholder="Contraseña" type="password" required />
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "#9ca3af", padding: "24px" }}>
                  No hay administradores registrados.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.idUsuario}>
                  <td>{admin.nombre} {admin.apellido}</td>
                  <td>{admin.correo}</td>
                  <td>{admin.telefono || "—"}</td>
                  <td>
                    <button className="btn-edit"   onClick={() => setEditingAdmin(admin)}>Editar</button>
                    <button className="btn-delete" onClick={() => handleDelete(admin.idUsuario)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal de edición (solo se monta cuando hay un admin seleccionado) ── */}
      {editingAdmin && (
        <EditModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSaved={getAdmins}
        />
      )}
    </div>
  )
}
