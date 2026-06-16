import { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import { BiShow, BiEdit, BiCheckCircle, BiXCircle } from "react-icons/bi";
import PasswordStrength from "../../../components/PasswordStrength";
import { validatePassword, PASSWORD_RULES } from "../../../utils/passwordValidator";
import Loading from "../../../components/Loading";
import "./Usuarios.css";
import "../Administrador/Administrador.css";

function DetalleUsuarioModal({ usuario, onClose }) {
  if (!usuario) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title">Detalle del usuario</h2>
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

function EditUsuarioModal({ usuario, roles, onClose, onSaved }) {
  const [form, setForm] = useState({
    id_rol: usuario.id_rol || "",
    nombre: usuario.nombre || "",
    apellido: usuario.apellido || "",
    correo: usuario.correo || "",
    telefono: usuario.telefono || "",
    password: "",
    observaciones: usuario.observaciones || "",
    activo: usuario.activo,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getRoleNameById = (id) => {
    const found = roles.find((r) => r.idRol === Number(id));
    return found?.nombreRol || "cafetero";
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      await api.put(`/usuarios/${usuario.idUsuario}`, payload);
      setSuccess("Usuario actualizado correctamente.");
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo actualizar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 className="modal-title">Editar usuario</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="usuario-form" style={{ padding: '16px 28px 24px' }}>
          <div className="usuario-form-row">
            <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required />
            <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required />
            <input name="correo" value={form.correo} onChange={handleChange} placeholder="Correo" required />
          </div>
          <div className="usuario-form-row">
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" />
            <div style={{ position: 'relative' }}>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Nueva contraseña (dejar vacío para mantener)" />
              {form.password && <PasswordStrength password={form.password} role={getRoleNameById(form.id_rol)} />}
            </div>
            <select name="id_rol" value={form.id_rol} onChange={handleChange} required>
              <option value="">Seleccionar rol...</option>
              {roles.map((r) => (
                <option key={r.idRol} value={r.idRol}>{r.nombreRol}</option>
              ))}
            </select>
          </div>
          <input name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Observaciones (opcional)" />
          <label className="checkbox-label">
            <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
            Usuario activo
          </label>
          {error && <p className="modal-error">{error}</p>}
          {success && <p className="rec-success">{success}</p>}
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loading type="inline" text="Guardando..." /> : "Guardar cambios"}
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
  const rolesLoaded = useRef(false);

  const loadRoles = async () => {
    if (rolesLoaded.current) return
    rolesLoaded.current = true
    try {
      const r = await api.get("/cat_roles")
      setRoles(r.data.data || r.data)
    } catch (err) {
      console.error(err)
    }
  }

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
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
    setPageLoading(true)
    try {
      const res = await api.get("/usuarios");
      setUsuarios(res.data.data || res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setPageLoading(false)
    }
  };

  useEffect(() => {
    getUsuarios();
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

  const handleToggleActivo = async (usuario) => {
    try {
      await api.put(`/usuarios/${usuario.idUsuario}`, {
        ...usuario,
        activo: !usuario.activo,
        password: undefined,
      });
      getUsuarios();
    } catch (err) {
      console.error(err);
    }
  };

  const roleTables = ['administrador', 'experto', 'cafetero']
  const normalizeRole = (r) => (r?.nombreRol || r?.nombre_rol || r?.nombre || r || '').toLowerCase().trim()
  const getUsersByRole = (roleName) => usuarios.filter((u) => normalizeRole(u.rol) === roleName)

  const [detalleUsuario, setDetalleUsuario] = useState(null)
  const [editingUsuario, setEditingUsuario] = useState(null)

  if (pageLoading) return <Loading type="content" text="Cargando..." />

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
                ? <Loading type="inline" text="Registrando..." />
                : "Registrar usuario"}
            </button>
          </div>
        </form>
      </div>

      {roleTables.map((roleName) => {
        const users = getUsersByRole(roleName)
        return (
          <div key={roleName} className="admin-table-card">
            <h3 className="admin-table-title" style={{ textTransform: 'capitalize' }}>{roleName}s</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="finca-empty">No hay {roleName}s registrados.</td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <tr key={u.idUsuario} className={u.activo ? '' : 'fila-inactiva'}>
                      <td>{idx + 1}</td>
                      <td>{u.nombre} {u.apellido}</td>
                      <td>
                        <span
                          className={`usuario-status ${u.activo ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleActivo(u)}
                          title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="td-actions">
                          <button
                            className="btn-icon btn-icon-ver"
                            onClick={() => setDetalleUsuario(u)}
                            title="Ver detalle"
                          >
                            <BiShow size={16} />
                          </button>
                          <button
                            className="btn-icon btn-icon-editar"
                            onClick={() => { loadRoles(); setEditingUsuario(u) }}
                            title="Editar usuario"
                          >
                            <BiEdit size={16} />
                          </button>
                          <button
                            className={`btn-icon ${u.activo ? 'btn-icon-desactivar' : 'btn-icon-activar'}`}
                            onClick={() => handleToggleActivo(u)}
                            title={u.activo ? 'Desactivar' : 'Activar'}
                          >
                            {u.activo ? <BiXCircle size={16} /> : <BiCheckCircle size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      })}

      {detalleUsuario && (
        <DetalleUsuarioModal
          usuario={detalleUsuario}
          onClose={() => setDetalleUsuario(null)}
        />
      )}

      {editingUsuario && (
        <EditUsuarioModal
          usuario={editingUsuario}
          roles={roles}
          onClose={() => setEditingUsuario(null)}
          onSaved={getUsuarios}
        />
      )}
    </>
  );
}
