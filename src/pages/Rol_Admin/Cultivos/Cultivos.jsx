import { useState, useEffect } from "react";
import "./cultivos.css";
import api from "../../../services/api";
import "../Administrador/Administrador.css";

export default function Cultivos() {

  const [nombreCultivo, setNombreCultivo] = useState("");
  const [tipoCultivo,   setTipoCultivo]   = useState("");
  const [idFinca,       setIdFinca]       = useState("");
  const [idEstado,      setIdEstado]      = useState("");

  const [cultivos,  setCultivos]  = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const [error,     setError]     = useState("");
  const [editando,  setEditando]  = useState(false);
  const [idEditar,  setIdEditar]  = useState(null);

  useEffect(() => { cargarCultivos(); }, []);

  const cargarCultivos = async () => {
    try {
      const res = await api.get("/cultivos");
      setCultivos(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (e) {
      setError("Error al cargar cultivos");
    }
  };

  const guardar = async () => {
    if (!nombreCultivo.trim() || !tipoCultivo.trim() || !idFinca || !idEstado) {
      setError("Todos los campos son obligatorios");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const payload = {
        nombre_cultivo: nombreCultivo,
        tipo_cultivo:   tipoCultivo,
        id_finca:       Number(idFinca),
        id_estado:      Number(idEstado),
      };
      if (editando) {
        await api.put(`/cultivos/${idEditar}`, payload);
      } else {
        await api.post("/cultivos", payload);
      }
      limpiarFormulario();
      await cargarCultivos();
    } catch (e) {
      setError("Error al guardar cultivo");
    } finally {
      setCargando(false);
    }
  };

  const editar = (cultivo) => {
    setNombreCultivo(cultivo.nombreCultivo || "");
    setTipoCultivo(cultivo.tipoCultivo || "");
    setIdFinca(cultivo.idFinca || "");
    setIdEstado(cultivo.idEstado || "");
    setIdEditar(cultivo.idCultivo);
    setEditando(true);
  };

  const eliminar = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este cultivo?")) return;
    try {
      await api.delete(`/cultivos/${id}`);
      await cargarCultivos();
    } catch (e) {
      setError("Error al eliminar cultivo");
    }
  };

  const limpiarFormulario = () => {
    setNombreCultivo(""); setTipoCultivo("");
    setIdFinca(""); setIdEstado("");
    setEditando(false); setIdEditar(null); setError("");
  };

  return (
    <div className="rl-container">
      <div className="page-header">
        <h1>Gestión de Cultivos</h1>
        <p>Administración de cultivos registrados</p>
      </div>

      {/* ── FORMULARIO ── */}
      <div className="rl-card">
        <p className="rl-label">
          {editando ? "Editar Cultivo" : "Nuevo Cultivo"}
        </p>

        <div className="rl-form">

          <div className="rl-field">
            <label>Nombre del cultivo</label>
            <input
              type="text"
              placeholder="Ej: Café Castillo"
              value={nombreCultivo}
              onChange={(e) => setNombreCultivo(e.target.value)}
            />
          </div>

          <div className="rl-field">
            <label>Tipo de cultivo</label>
            <input
              type="text"
              placeholder="Ej: Arábica"
              value={tipoCultivo}
              onChange={(e) => setTipoCultivo(e.target.value)}
            />
          </div>

          <div className="rl-field">
            <label>ID Finca</label>
            <input
              type="number"
              placeholder="Ej: 1"
              value={idFinca}
              onChange={(e) => setIdFinca(e.target.value)}
            />
          </div>

          <div className="rl-field">
            <label>ID Estado</label>
            <input
              type="number"
              placeholder="Ej: 1"
              value={idEstado}
              onChange={(e) => setIdEstado(e.target.value)}
            />
          </div>

        </div>

        <div className="rl-actions">
          <button className="rl-btn" onClick={guardar} disabled={cargando}>
            {cargando ? "Guardando..." : editando ? "Actualizar" : "Guardar"}
          </button>
          {editando && (
            <button className="rl-btn-cancel" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </div>

        {error && <p className="rl-error">{error}</p>}
      </div>

      {/* ── TABLA ── */}
      <div className="rl-card">
        <p className="rl-label">Cultivos Registrados</p>
        <div style={{ overflowX: "auto" }}>
          <table className="rl-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Finca</th>
                <th>Estado</th>
                <th>Fecha creación</th>
                <th>Última actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cultivos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="rl-empty">
                    No hay cultivos registrados
                  </td>
                </tr>
              ) : (
                cultivos.map((cultivo) => (
                  <tr key={cultivo.idCultivo}>
                    <td>{cultivo.idCultivo}</td>
                    <td>{cultivo.nombreCultivo}</td>
                    <td>{cultivo.tipoCultivo}</td>
                    <td>{cultivo.finca?.nombreFinca || '—'}</td>
                    <td>{cultivo.estadoCultivo?.nombreEstado || '—'}</td>
                    <td>
                      {cultivo.createdAt
                        ? new Date(cultivo.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      {cultivo.updatedAt
                        ? new Date(cultivo.updatedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => editar(cultivo)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => eliminar(cultivo.idCultivo)}
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
      </div>
    </div>
  );
}