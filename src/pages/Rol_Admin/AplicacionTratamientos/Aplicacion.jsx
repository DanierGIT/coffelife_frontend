import { useState, useEffect } from "react";
import "./aplicacion.css";
import api from "../../../services/api";

export default function Aplicacion() {

  const [idTratamiento,  setIdTratamiento]  = useState("");
  const [dosis,          setDosis]          = useState("");
  const [frecuencia,     setFrecuencia]     = useState("");
  const [observaciones,  setObservaciones]  = useState("");
  const [idUsuario,      setIdUsuario]      = useState("");

  const [aplicaciones,   setAplicaciones]   = useState([]);
  const [tratamientos,   setTratamientos]   = useState([]);
  const [usuarios,       setUsuarios]       = useState([]);
  const [cargando,       setCargando]       = useState(false);
  const [error,          setError]          = useState("");
  const [exito,          setExito]          = useState("");
  const [modalAbierto,   setModalAbierto]   = useState(false);
  const [idEditar,       setIdEditar]       = useState(null);

  // ── Estado del formulario del modal ──
  const [formModal, setFormModal] = useState({
    idTratamiento: "", dosis: "", frecuencia: "", observaciones: "", idUsuario: ""
  });

  useEffect(() => {
    cargarAplicaciones();
    api.get("/tratamientos")
      .then((r) => setTratamientos(Array.isArray(r.data) ? r.data : r.data.data || []))
      .catch(console.error);
    api.get("/usuarios")
      .then((r) => setUsuarios(Array.isArray(r.data) ? r.data : r.data.data || []))
      .catch(console.error);
  }, []);

  const cargarAplicaciones = async () => {
    try {
      const res = await api.get("/aplicaciones_tratamientos");
      const data = res.data;
      setAplicaciones(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setError("Error al cargar aplicaciones");
    }
  };

  // ── CREAR ──
  const guardar = async () => {
    if (!idTratamiento || !idUsuario || !dosis.trim()) {
      setError("Tratamiento, usuario y dosis son obligatorios");
      return;
    }
    setCargando(true);
    setError("");
    setExito("");
    try {
      await api.post("/aplicaciones_tratamientos", {
        id_tratamiento: Number(idTratamiento),
        dosis:          dosis.trim(),
        frecuencia:     frecuencia.trim(),
        observaciones:  observaciones.trim(),
        id_usuario:     Number(idUsuario),
      });
      setExito("Aplicación registrada correctamente");
      limpiarFormulario();
      await cargarAplicaciones();
    } catch (e) {
      setError(e.response?.data?.message || "Error al guardar");
    } finally {
      setCargando(false);
    }
  };

  // ── ABRIR MODAL EDICIÓN ──
  const abrirEditar = (a) => {
    setIdEditar(a.idAplicacion);
    setFormModal({
      idTratamiento: a.idTratamiento || "",
      dosis:         a.dosis || "",
      frecuencia:    a.frecuencia || "",
      observaciones: a.observaciones || "",
      idUsuario:     a.idUsuario || "",
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setIdEditar(null);
    setFormModal({ idTratamiento: "", dosis: "", frecuencia: "", observaciones: "", idUsuario: "" });
  };

  // ── ACTUALIZAR ──
  const actualizar = async () => {
    if (!formModal.idTratamiento || !formModal.idUsuario || !formModal.dosis.trim()) {
      setError("Tratamiento, usuario y dosis son obligatorios");
      return;
    }
    setCargando(true);
    try {
      await api.put(`/aplicaciones_tratamientos/${idEditar}`, {
        id_tratamiento: Number(formModal.idTratamiento),
        dosis:          formModal.dosis.trim(),
        frecuencia:     formModal.frecuencia.trim(),
        observaciones:  formModal.observaciones.trim(),
        id_usuario:     Number(formModal.idUsuario),
      });
      cerrarModal();
      await cargarAplicaciones();
    } catch (e) {
      setError(e.response?.data?.message || "Error al actualizar");
    } finally {
      setCargando(false);
    }
  };

  // ── ELIMINAR ──
  const eliminar = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta aplicación?")) return;
    try {
      await api.delete(`/aplicaciones_tratamientos/${id}`);
      await cargarAplicaciones();
    } catch (e) {
      setError("Error al eliminar");
    }
  };

  const limpiarFormulario = () => {
    setIdTratamiento(""); setDosis(""); setFrecuencia("");
    setObservaciones(""); setIdUsuario("");
    setError("");
  };

  return (
    <div className="rl-container">
      <h1 className="rl-title">Aplicación de Tratamientos</h1>

      {/* ── FORMULARIO CREAR ── */}
      <div className="rl-card">
        <p className="rl-label">Nueva Aplicación</p>

        <div className="rl-form" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div className="rl-field">
            <label>Tratamiento</label>
            <select value={idTratamiento} onChange={(e) => setIdTratamiento(e.target.value)}>
              <option value="">Seleccionar tratamiento...</option>
              {tratamientos.map((t) => (
                <option key={t.idTratamiento} value={t.idTratamiento}>{t.nombre}</option>
              ))}
            </select>
          </div>

          <div className="rl-field">
            <label>Usuario</label>
            <select value={idUsuario} onChange={(e) => setIdUsuario(e.target.value)}>
              <option value="">Seleccionar usuario...</option>
              {usuarios.map((u) => (
                <option key={u.idUsuario ?? u.id} value={u.idUsuario ?? u.id}>
                  {u.nombre ?? u.correo} {u.apellido ?? ""}
                </option>
              ))}
            </select>
          </div>

          <div className="rl-field">
            <label>Dosis</label>
            <input type="text" placeholder="Ej: 20ml" value={dosis}
              onChange={(e) => setDosis(e.target.value)} />
          </div>

          <div className="rl-field">
            <label>Frecuencia</label>
            <input type="text" placeholder="Ej: Cada 7 días" value={frecuencia}
              onChange={(e) => setFrecuencia(e.target.value)} />
          </div>

          <div className="rl-field" style={{ gridColumn: "1 / -1" }}>
            <label>Observaciones</label>
            <textarea placeholder="Observaciones opcionales" value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)} />
          </div>
        </div>

        <div className="rl-actions">
          <button className="rl-btn" onClick={guardar} disabled={cargando}>
            {cargando ? "Guardando..." : "Guardar"}
          </button>
        </div>

        {error && <p className="rl-error">{error}</p>}
        {exito && (
          <p style={{
            marginTop: "16px", padding: "12px", borderRadius: "10px",
            background: "#e8f5e9", color: "#2e7d32", fontSize: "14px",
            fontWeight: 500, border: "1px solid #c8e6c9"
          }}>{exito}</p>
        )}
      </div>

      {/* ── TABLA ── */}
      <div className="rl-card">
        <p className="rl-label">Aplicaciones Registradas</p>
        <div style={{ overflowX: "auto" }}>
          <table className="rl-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tratamiento</th>
                <th>Dosis</th>
                <th>Frecuencia</th>
                <th>Observaciones</th>
                <th>Fecha Registro</th>
                <th>Fecha Actualización</th>
                <th>Usuario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {aplicaciones.length === 0 ? (
                <tr>
                  <td colSpan="9" className="rl-empty">No hay aplicaciones registradas</td>
                </tr>
              ) : (
                aplicaciones.map((a) => (
                  <tr key={a.idAplicacion}>
                    <td>{a.idAplicacion}</td>
                    <td>{a.tratamiento?.nombre ?? `#${a.idTratamiento}`}</td>
                    <td>{a.dosis}</td>
                    <td>{a.frecuencia || "—"}</td>
                    <td>{a.observaciones || "—"}</td>
                    <td>{a.fechaRegistro ? new Date(a.fechaRegistro).toLocaleDateString() : "—"}</td>
                    <td>{a.fechaActualizacion ? new Date(a.fechaActualizacion).toLocaleDateString() : "—"}</td>
                    <td>{a.usuario?.nombre ?? `#${a.idUsuario}`}</td>
                    <td className="acciones">
                      <button className="btn-editar" onClick={() => abrirEditar(a)}>
                        Editar
                      </button>
                      <button className="btn-eliminar" onClick={() => eliminar(a.idAplicacion)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL EDICIÓN ── */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h3 className="modal-title">Editar Aplicación</h3>
              <button className="modal-close" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-form">
              <label>
                Tratamiento
                <select
                  value={formModal.idTratamiento}
                  onChange={(e) => setFormModal({ ...formModal, idTratamiento: e.target.value })}
                >
                  <option value="">Seleccionar tratamiento...</option>
                  {tratamientos.map((t) => (
                    <option key={t.idTratamiento} value={t.idTratamiento}>{t.nombre}</option>
                  ))}
                </select>
              </label>

              <label>
                Usuario
                <select
                  value={formModal.idUsuario}
                  onChange={(e) => setFormModal({ ...formModal, idUsuario: e.target.value })}
                >
                  <option value="">Seleccionar usuario...</option>
                  {usuarios.map((u) => (
                    <option key={u.idUsuario ?? u.id} value={u.idUsuario ?? u.id}>
                      {u.nombre ?? u.correo} {u.apellido ?? ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Dosis
                <input type="text" placeholder="Ej: 20ml" value={formModal.dosis}
                  onChange={(e) => setFormModal({ ...formModal, dosis: e.target.value })} />
              </label>

              <label>
                Frecuencia
                <input type="text" placeholder="Ej: Cada 7 días" value={formModal.frecuencia}
                  onChange={(e) => setFormModal({ ...formModal, frecuencia: e.target.value })} />
              </label>

              <label>
                Observaciones
                <textarea placeholder="Observaciones opcionales" value={formModal.observaciones}
                  onChange={(e) => setFormModal({ ...formModal, observaciones: e.target.value })} />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-cancelar" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-guardar" onClick={actualizar} disabled={cargando}>
                {cargando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}