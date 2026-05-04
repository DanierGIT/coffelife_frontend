import { useState, useEffect } from "react";
import api from "../../services/api";
import "./Administrador.css";

// ── Modal ─────────────────────────────
function EditModal({ admin, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: admin.nombre || "",
    apellido: admin.apellido || "",
    correo: admin.correo || "",
    telefono: admin.telefono || "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.put(`/admins/${admin.idUsuario}`, form);
      onSaved();
      onClose();
    } catch (err) {
      setError("No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2 className="modal-title">Editar administrador</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>

          <div className="modal-row">
            <label>
              Nombre
              <input name="nombre" value={form.nombre} onChange={handleChange} required />
            </label>

            <label>
              Apellido
              <input name="apellido" value={form.apellido} onChange={handleChange} required />
            </label>
          </div>

          <label>
            Correo
            <input name="correo" value={form.correo} onChange={handleChange} required />
          </label>

          <label>
            Teléfono
            <input name="telefono" value={form.telefono} onChange={handleChange} />
          </label>

          <label>
            Contraseña <span className="modal-hint">(opcional)</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} />
          </label>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────
export default function Administrador() {
  const [admins, setAdmins] = useState([]);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    password: "",
  });

  const getAdmins = async () => {
    const res = await api.get("/admins");
    setAdmins(res.data);
  };

  useEffect(() => {
    getAdmins();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post("/admins", form);

    setForm({
      nombre: "",
      apellido: "",
      correo: "",
      telefono: "",
      password: "",
    });

    getAdmins();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar administrador?")) return;
    await api.delete(`/admins/${id}`);
    getAdmins();
  };

  return (
    <>
      <h1 className="admin-page-title">Administradores</h1>

      {/* ─── Formulario ─── */}
      <div className="admin-form-card">
        <h2 className="admin-form-title">Crear administrador</h2>

        <form className="admin-form" onSubmit={handleCreate}>
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required />
          <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required />
          <input name="correo" value={form.correo} onChange={handleChange} placeholder="Correo" required />
          <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" />
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Contraseña" required />

          <div className="admin-form-actions">
            <button type="submit" className="btn-primary">Crear</button>
          </div>
        </form>
      </div>

      {/* ─── Tabla ─── */}
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
            {admins.map((admin) => (
              <tr key={admin.idUsuario}>
                <td>{admin.nombre} {admin.apellido}</td>
                <td>{admin.correo}</td>
                <td>{admin.telefono || "-"}</td>
                <td>
                  <button className="btn-edit" onClick={() => setEditingAdmin(admin)}>
                    Editar
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(admin.idUsuario)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Modal ─── */}
      {editingAdmin && (
        <EditModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSaved={getAdmins}
        />
      )}
    </>
  );
}