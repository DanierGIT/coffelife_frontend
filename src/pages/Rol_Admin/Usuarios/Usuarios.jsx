import { useState, useEffect } from "react";
import api from "../../../services/api";
import PasswordStrength from "../../../components/PasswordStrength";
import { validatePassword, PASSWORD_RULES } from "../../../utils/passwordValidator";
import "./Usuarios.css";
import "../Administrador/Administrador.css";

function EditModal({ usuario, onClose, onSaved, roles }) {
  const [form, setForm] = useState({
    id_rol: usuario.id_rol || usuario.idRol || usuario.rol?.idRol || "",
    nombre: usuario.nombre || "",
    apellido: usuario.apellido || "",
    correo: usuario.correo || "",
    telefono: usuario.telefono || "",
    observaciones: usuario.observaciones || "",
    activo: usuario.activo ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox"
        ? e.target.checked
        : e.target.value;

    setForm({
      ...form,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await api.put(`/usuarios/${usuario.idUsuario}`, form);

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar los cambios.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            Editar usuario
          </h2>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={handleSubmit}
        >
          <div className="modal-row">
            <label>
              Nombre
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Apellido
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                required
             />
          </label>
        </div>

          <label>
            Correo
            <input
              name="correo"
              value={form.correo}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Teléfono
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
            />
          </label>

          <label>
            Rol
            <select
              name="id_rol"
              value={form.id_rol}
              onChange={handleChange}
              required
            >
              <option value="">
                Seleccionar rol...
              </option>

              {roles.map((r) => (
                <option
                  key={r.idRol}
                  value={r.idRol}
                >
                  {r.nombreRol}
                </option>
              ))}
            </select>
          </label>

          <label>
            Observaciones
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows={2}
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="activo"
              checked={form.activo}
              onChange={handleChange}
            />
            Usuario activo
          </label>

          {error && (
            <p className="modal-error">{error}</p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading
                ? "Guardando..."
                : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequisitosPassword({ roleName }) {
  const rule = PASSWORD_RULES[(roleName || 'cafetero').toLowerCase().trim()] || PASSWORD_RULES.cafetero
  const items = [
    rule.minLength && `Mínimo ${rule.minLength} caracteres`,
    rule.requireUppercase && 'Al menos una mayúscula',
    rule.requireLowercase && 'Al menos una minúscula',
    rule.requireDigit && 'Al menos un número',
    rule.requireSpecial && 'Al menos un carácter especial',
  ].filter(Boolean)

  return (
    <div style={{ fontSize: 11, color: '#666', marginTop: 4, lineHeight: 1.5 }}>
      Requisitos para <strong>{rule.label}</strong>:
      <ul style={{ margin: '2px 0 0', paddingLeft: 16 }}>
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  )
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editingUsuario, setEditingUsuario] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    id_rol: "",
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    password: "",
    observaciones: "",
    activo: true,
  });

  const getUsuarios = async () => {
    try {
      const res = await api.get("/usuarios");
      setUsuarios(res.data.data || res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los usuarios.");
    }
  };

  useEffect(() => {
    getUsuarios();

    api
      .get("/cat_roles")
      .then((r) =>
        setRoles(r.data.data || r.data)
      )
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox"
        ? e.target.checked
        : e.target.value;

    setForm({
      ...form,
      [e.target.name]: value,
    });
  };

  const getRoleNameById = (id) => {
    const found = roles.find((r) => r.idRol === Number(id));
    return found?.nombreRol || "cafetero";
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const roleName = getRoleNameById(form.id_rol);
    const { isValid, errors: pwErrors } = validatePassword(form.password, roleName);
    if (!isValid) {
      setError(`Contraseña inválida para rol ${roleName}: ${pwErrors.join(", ")}`);
      return;
    }

    setLoading(true);

    try {
      await api.post("/usuarios", form);

      setForm({
        id_rol: "",
        nombre: "",
        apellido: "",
        correo: "",
        telefono: "",
        password: "",
        observaciones: "",
        activo: true,
      });

      setSuccess("Usuario creado correctamente.");

      getUsuarios();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "No se pudo crear el usuario."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este usuario?"))
      return;

    try {
      await api.delete(`/usuarios/${id}`);
      getUsuarios();
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el usuario.");
    }
  };

  const handleToggleActivo = async (usuario) => {
    const nextActivo = !usuario.activo;
    const accion = nextActivo ? "activar" : "desactivar";

    if (!window.confirm(`Deseas ${accion} a ${usuario.nombre}?`))
      return;

    try {
      await api.put(`/usuarios/${usuario.idUsuario}`, {
        activo: nextActivo,
      });
      getUsuarios();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el estado del usuario.");
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Usuarios</h1>
        <p>Gestión de usuarios del sistema</p>
      </div>

      <div className="admin-form-card">
        <h2 className="admin-form-title">
          Registrar nuevo usuario
        </h2>

        <form
          className="usuario-form"
          onSubmit={handleCreate}
        >
          <div className="usuario-form-row">
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre"
              required
            />

            <input
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              placeholder="Apellido"
              required
            />

            <input
              name="correo"
              value={form.correo}
              onChange={handleChange}
              placeholder="Correo"
              required
            />
          </div>

          <div className="usuario-form-row">
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="Teléfono"
            />

            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={`Contraseña (mín. ${PASSWORD_RULES[getRoleNameById(form.id_rol)]?.minLength || 6})`}
                required
              />
              <PasswordStrength password={form.password} role={getRoleNameById(form.id_rol)} />
            </div>

            {form.id_rol && (
              <RequisitosPassword roleName={getRoleNameById(form.id_rol)} />
            )}

            <select
              name="id_rol"
              value={form.id_rol}
              onChange={handleChange}
              required
            >
              <option value="">
                Seleccionar rol...
              </option>

              {roles.map((r) => (
                <option
                  key={r.idRol}
                  value={r.idRol}
                >
                  {r.nombreRol}
                </option>
              ))}
            </select>
          </div>

          <input
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            placeholder="Observaciones (opcional)"
          />

          {error && (
            <p className="modal-error">{error}</p>
          )}

          {success && (
            <p className="rec-success">{success}</p>
          )}

          <div className="admin-form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading
                ? "Registrando..."
                : "Registrar usuario"}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="finca-empty"
                >
                  No hay usuarios registrados aún.
                </td>
              </tr>
            ) : (
              usuarios.map((u, idx) => (
                <tr key={u.idUsuario}>
                  <td>{idx + 1}</td>

                  <td>
                    {u.nombre} {u.apellido}
                  </td>

                  <td>{u.correo}</td>

                  <td>
                     {u.telefono || "—"}
                  </td>

                  <td>
                    {u.rol?.nombreRol || "—"}
                  </td>

                  <td>
                    <button
                      type="button"
                      className={`usuario-status ${u.activo ? "active" : "inactive"}`}
                      onClick={() => handleToggleActivo(u)}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>

                  <td>
                    <button
                      className="btn-edit"
                      onClick={() =>
                        setEditingUsuario(u)
                      }
                    >
                      Editar
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() =>
                        handleDelete(u.idUsuario)
                      }
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingUsuario && (
        <EditModal
          usuario={editingUsuario}
          onClose={() =>
            setEditingUsuario(null)
          }
          onSaved={getUsuarios}
          roles={roles}
        />
      )}
    </>
  );
}
