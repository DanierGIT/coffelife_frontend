import { useState, useEffect } from "react";
import api from "../../../services/api";
import "./Recomendaciones.css";

function EditModal({ recomendacion, onClose, onSaved, monitoreos, tipos, expertos, prioridades }) {
  const [form, setForm] = useState({
    idMonitoreo:     recomendacion.idMonitoreo     || "",
    idTipo:          recomendacion.idTipo          || "",
    idExpertoEmisor: recomendacion.idExpertoEmisor || "",
    descripcion:     recomendacion.descripcion     || "",
    fechaLimite:     recomendacion.fechaLimite     || "",
    idPrioridad:     recomendacion.idPrioridad     || "",
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
      await api.put(`/recomendaciones/${recomendacion.idRecomendacion}`, form);
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
          <h2 className="modal-title">Editar recomendación</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>
              Monitoreo
              <select name="idMonitoreo" value={form.idMonitoreo} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                {monitoreos.map((m) => (
                  <option key={m.idMonitoreo} value={m.idMonitoreo}>
                    #{m.idMonitoreo} - {m.fechaMonitoreo}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo de recomendación
              <select name="idTipo" value={form.idTipo} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                {tipos.map((t) => (
                  <option key={t.idTipo} value={t.idTipo}>{t.nombreTipo}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="modal-row">
            <label>
              Experto emisor
              <select name="idExpertoEmisor" value={form.idExpertoEmisor} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                {expertos.map((u) => (
                  <option key={u.idUsuario} value={u.idUsuario}>{u.nombre} {u.apellido}</option>
                ))}
              </select>
            </label>
            <label>
              Prioridad
              <select name="idPrioridad" value={form.idPrioridad} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                {prioridades.map((p) => (
                  <option key={p.idPrioridad} value={p.idPrioridad}>{p.nombre}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Descripción
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} required rows={3} />
          </label>
          <label>
            Fecha límite
            <input type="date" name="fechaLimite" value={form.fechaLimite} onChange={handleChange} />
          </label>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Recomendaciones() {
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [monitoreos,      setMonitoreos]      = useState([]);
  const [tipos,           setTipos]           = useState([]);
  const [expertos,        setExpertos]        = useState([]);
  const [prioridades,     setPrioridades]     = useState([]);
  const [editingRec,      setEditingRec]      = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState("");

  const [form, setForm] = useState({
    idMonitoreo:     "",
    idTipo:          "",
    idExpertoEmisor: "",
    descripcion:     "",
    fechaLimite:     "",
    idPrioridad:     "",
  });

  const getRecomendaciones = async () => {
    try {
      const res = await api.get("/recomendaciones");
      setRecomendaciones(res.data.data || res.data);
    } catch {
      setError("No se pudieron cargar las recomendaciones.");
    }
  };

  useEffect(() => {
    getRecomendaciones();
    api.get("/monitoreos").then((r) => setMonitoreos(r.data.data || r.data));
    api.get("/cat_tipos_recomendacion").then((r) => setTipos(r.data.data || r.data));
    api.get("/usuarios").then((r) => setExpertos(r.data.data || r.data));
    api.get("/cat_prioridades").then((r) => setPrioridades(r.data.data || r.data));
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/recomendaciones", form);
      setForm({
        idMonitoreo: "", idTipo: "", idExpertoEmisor: "",
        descripcion: "", fechaLimite: "", idPrioridad: "",
      });
      setSuccess("Recomendación registrada correctamente.");
      getRecomendaciones();
    } catch {
      setError("No se pudo registrar la recomendación.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta recomendación?")) return;
    try {
      await api.delete(`/recomendaciones/${id}`);
      getRecomendaciones();
    } catch {
      setError("No se pudo eliminar la recomendación.");
    }
  };

  return (
    <>
      <h1 className="admin-page-title">Recomendaciones</h1>

      <div className="admin-form-card">
        <h2 className="admin-form-title">Registrar nueva recomendación</h2>
        <form className="rec-form" onSubmit={handleCreate}>

          <div className="rec-form-row">
            <select name="idMonitoreo" value={form.idMonitoreo} onChange={handleChange} required>
              <option value="">Seleccionar monitoreo...</option>
              {monitoreos.map((m) => (
                <option key={m.idMonitoreo} value={m.idMonitoreo}>
                  #{m.idMonitoreo} - {m.fechaMonitoreo}
                </option>
              ))}
            </select>
            <select name="idTipo" value={form.idTipo} onChange={handleChange} required>
              <option value="">Tipo de recomendación...</option>
              {tipos.map((t) => (
                <option key={t.idTipo} value={t.idTipo}>{t.nombreTipo}</option>
              ))}
            </select>
            <select name="idExpertoEmisor" value={form.idExpertoEmisor} onChange={handleChange} required>
              <option value="">Experto emisor...</option>
              {expertos.map((u) => (
                <option key={u.idUsuario} value={u.idUsuario}>{u.nombre} {u.apellido}</option>
              ))}
            </select>
          </div>

          <div className="rec-form-row">
            <select name="idPrioridad" value={form.idPrioridad} onChange={handleChange} required>
              <option value="">Prioridad...</option>
              {prioridades.map((p) => (
                <option key={p.idPrioridad} value={p.idPrioridad}>{p.nombre}</option>
              ))}
            </select>
            <input
              type="date"
              name="fechaLimite"
              value={form.fechaLimite}
              onChange={handleChange}
            />
          </div>

          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Descripción de la recomendación"
            required
            rows={3}
          />

          {error   && <p className="modal-error">{error}</p>}
          {success && <p className="rec-success">{success}</p>}

          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Registrando..." : "Registrar recomendación"}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Monitoreo</th>
              <th>Tipo</th>
              <th>Experto</th>
              <th>Prioridad</th>
              <th>Descripción</th>
              <th>Fecha límite</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recomendaciones.length === 0 ? (
              <tr>
                <td colSpan={8} className="finca-empty">
                  No hay recomendaciones registradas aún.
                </td>
              </tr>
            ) : (
              recomendaciones.map((r) => (
                <tr key={r.idRecomendacion}>
                  <td>{r.idRecomendacion}</td>
                  <td>#{r.idMonitoreo}</td>
                  <td>{r.tipo?.nombreTipo || r.idTipo}</td>
                  <td>{r.experto ? `${r.experto.nombre} ${r.experto.apellido}` : r.idExpertoEmisor}</td>
                  <td>{r.prioridad?.nombre || r.idPrioridad}</td>
                  <td>{r.descripcion}</td>
                  <td>{r.fechaLimite || "—"}</td>
                  <td>
                    <button className="btn-edit" onClick={() => setEditingRec(r)}>Editar</button>
                    <button className="btn-delete" onClick={() => handleDelete(r.idRecomendacion)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingRec && (
        <EditModal
          recomendacion={editingRec}
          onClose={() => setEditingRec(null)}
          onSaved={getRecomendaciones}
          monitoreos={monitoreos}
          tipos={tipos}
          expertos={expertos}
          prioridades={prioridades}
        />
      )}
    </>
  );
}