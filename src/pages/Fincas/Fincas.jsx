import { useState, useEffect } from "react";
import api from "../../services/api";
import "./Fincas.css";

// ── Modal de edición ─────────────────────────────
function EditModal({ finca, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombreFinca:   finca.nombreFinca   || "",
    municipio:     finca.municipio     || "",
    departamento:  finca.departamento  || "",
    latitud:       finca.latitud       || "",
    longitud:      finca.longitud      || "",
    altitudMsnm:   finca.altitudMsnm   || "",
    areaHectareas: finca.areaHectareas || "",
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put(`/fincas/${finca.idFinca}`, form);
      onSaved();
      onClose();
    } catch {
      setError("No se pudo guardar los cambios.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title">Editar finca</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>

          <div className="modal-row">
            <label>
              Nombre de la finca
              <input name="nombreFinca" value={form.nombreFinca} onChange={handleChange} required />
            </label>
            <label>
              Municipio
              <input name="municipio" value={form.municipio} onChange={handleChange} required />
            </label>
          </div>

          <label>
            Departamento
            <input name="departamento" value={form.departamento} onChange={handleChange} required />
          </label>

          <div className="modal-row">
            <label>
              Latitud
              <input name="latitud" value={form.latitud} onChange={handleChange} placeholder="Ej: 4.7110" />
            </label>
            <label>
              Longitud
              <input name="longitud" value={form.longitud} onChange={handleChange} placeholder="Ej: -74.0721" />
            </label>
          </div>

          <div className="modal-row">
            <label>
              Altitud (m.s.n.m.)
              <input name="altitudMsnm" value={form.altitudMsnm} onChange={handleChange} placeholder="Ej: 1800" />
            </label>
            <label>
              Área (hectáreas)
              <input name="areaHectareas" value={form.areaHectareas} onChange={handleChange} placeholder="Ej: 5.2" />
            </label>
          </div>

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
export default function Fincas() {
  const [fincas,       setFincas]       = useState([]);
  const [editingFinca, setEditingFinca] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");

  const [form, setForm] = useState({
    nombreFinca:   "",
    municipio:     "",
    departamento:  "",
    latitud:       "",
    longitud:      "",
    altitudMsnm:   "",
    areaHectareas: "",
  });

  // ── Obtener fincas ──
  const getFincas = async () => {
    try {
      const res = await api.get("/fincas");
      setFincas(res.data);
    } catch {
      setError("No se pudieron cargar las fincas.");
    }
  };

  useEffect(() => {
    getFincas();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ── Crear finca ──
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/fincas", form);
      setForm({
        nombreFinca:   "",
        municipio:     "",
        departamento:  "",
        latitud:       "",
        longitud:      "",
        altitudMsnm:   "",
        areaHectareas: "",
      });
      setSuccess("Finca registrada correctamente.");
      getFincas();
    } catch {
      setError("No se pudo registrar la finca.");
    } finally {
      setLoading(false);
    }
  };

  // ── Eliminar finca ──
  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta finca?")) return;
    try {
      await api.delete(`/fincas/${id}`);
      getFincas();
    } catch {
      setError("No se pudo eliminar la finca.");
    }
  };

  return (
    <>
      <h1 className="admin-page-title">Fincas</h1>

      {/* ─── Formulario ─── */}
      <div className="admin-form-card">
        <h2 className="admin-form-title">Registrar nueva finca</h2>

        <form className="finca-form" onSubmit={handleCreate}>

          {/* Fila 1 */}
          <div className="finca-form-row">
            <input
              name="nombreFinca"
              value={form.nombreFinca}
              onChange={handleChange}
              placeholder="Nombre de la finca"
              required
            />
            <input
              name="municipio"
              value={form.municipio}
              onChange={handleChange}
              placeholder="Municipio"
              required
            />
            <input
              name="departamento"
              value={form.departamento}
              onChange={handleChange}
              placeholder="Departamento"
              required
            />
          </div>

          {/* Fila 2 */}
          <div className="finca-form-row">
            <input
              name="latitud"
              value={form.latitud}
              onChange={handleChange}
              placeholder="Latitud (ej: 4.7110)"
            />
            <input
              name="longitud"
              value={form.longitud}
              onChange={handleChange}
              placeholder="Longitud (ej: -74.0721)"
            />
            <input
              name="altitudMsnm"
              value={form.altitudMsnm}
              onChange={handleChange}
              placeholder="Altitud m.s.n.m."
            />
            <input
              name="areaHectareas"
              value={form.areaHectareas}
              onChange={handleChange}
              placeholder="Área (hectáreas)"
            />
          </div>

          {error   && <p className="modal-error">{error}</p>}
          {success && <p className="finca-success">{success}</p>}

          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Registrando..." : "Registrar finca"}
            </button>
          </div>

        </form>
      </div>

      {/* ─── Tabla ─── */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Municipio</th>
              <th>Departamento</th>
              <th>Altitud</th>
              <th>Área (ha)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {fincas.length === 0 ? (
              <tr>
                <td colSpan={7} className="finca-empty">
                  No hay fincas registradas aún.
                </td>
              </tr>
            ) : (
              fincas.map((f) => (
                <tr key={f.idFinca}>
                  <td>{f.idFinca}</td>
                  <td>{f.nombreFinca}</td>
                  <td>{f.municipio}</td>
                  <td>{f.departamento}</td>
                  <td>{f.altitudMsnm ? `${f.altitudMsnm} m` : "—"}</td>
                  <td>{f.areaHectareas ?? "—"}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => setEditingFinca(f)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(f.idFinca)}
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

      {/* ─── Modal ─── */}
      {editingFinca && (
        <EditModal
          finca={editingFinca}
          onClose={() => setEditingFinca(null)}
          onSaved={getFincas}
        />
      )}
    </>
  );
}
