import { useEffect, useState } from "react";
import "./AnalisisIA.css";
import api from "../../../services/api";

const getAnalisis = async () => {
  const res = await api.get("/analisis_ia");
  return res.data;
};
const createAnalisis = async (data) => {
  const res = await api.post("/analisis_ia", data);
  return res.data;
};
const updateAnalisis = async (id, data) => {
  const res = await api.put(`/analisis_ia/${id}`, data);
  return res.data;
};
const deleteAnalisis = async (id) => {
  const res = await api.delete(`/analisis_ia/${id}`);
  return res.data;
};

const AnalisisIA = () => {
  const [analisis, setAnalisis] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState({
    idAnalisis: null,
    id_imagen: "",
    id_estado_analisis: "",
    resultado: "",
    confianza: "",
  });

  const obtenerAnalisis = async () => {
    try {
      const data = await getAnalisis();
      setAnalisis(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error al obtener análisis IA", error);
      setAnalisis([]);
    }
  };

  useEffect(() => {
    obtenerAnalisis();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const limpiarFormulario = () => {
    setForm({
      idAnalisis: null,
      idImagen: "",
      idEstado: "",
      resultado: "",
      porcentajeConfianza: "",
      idNivelRoya: "",
    });
  };

  const crearAnalisis = async () => {
    try {
      const payload = {
        idImagen: Number(form.idImagen),
        idEstado: Number(form.idEstado),
        resultado: form.resultado,
        porcentajeConfianza: Number(form.porcentajeConfianza),
        idNivelRoya: Number(form.idNivelRoya),
      };
      await createAnalisis(payload);
      limpiarFormulario();
      obtenerAnalisis();
    } catch (error) {
      console.error("Error al crear análisis", error);
    }
  };

  const editarAnalisis = (item) => {
    setForm({
      idAnalisis: item.idAnalisis,
      idImagen: item.idImagen,
      idEstado: item.idEstado,
      resultado: item.resultado,
      porcentajeConfianza: item.porcentajeConfianza,
      idNivelRoya: item.idNivelRoya,
    });
    setMostrarModal(true);
  };

  const actualizarAnalisis = async () => {
    try {
      const payload = {
        idImagen: Number(form.idImagen),
        idEstado: Number(form.idEstado),
        resultado: form.resultado,
        porcentajeConfianza: Number(form.porcentajeConfianza),
        idNivelRoya: Number(form.idNivelRoya),
      };
      await updateAnalisis(form.idAnalisis, payload);
      setMostrarModal(false);
      limpiarFormulario();
      obtenerAnalisis();
    } catch (error) {
      console.error("Error al actualizar análisis", error);
    }
  };

  const eliminarAnalisis = async (item) => {
    const confirmar = window.confirm(
      `¿Deseas eliminar el análisis #${item.idAnalisis}?`
    );
    if (!confirmar) return;
    try {
      await deleteAnalisis(item.idAnalisis);
      obtenerAnalisis();
    } catch (error) {
      console.error("Error al eliminar análisis", error);
    }
  };

  const obtenerClaseConfianza = (valor) => {
    if (valor >= 80) return "badge alta";
    if (valor >= 50) return "badge media";
    return "badge baja";
  };

  return (
    <div>
      {/* ─── Título ─── */}
      <h1 className="analisis-page-title">Análisis IA</h1>
      <p className="analisis-page-subtitle">
        Gestión inteligente de diagnósticos CoffeeLife
      </p>

      {/* ─── Formulario ─── */}
      <div className="admin-form-card">
        <h2 className="admin-form-title">Registrar análisis</h2>

        <div className="form-grid">
          <input
            type="number"
            name="idImagen"
            placeholder="ID Imagen"
            value={form.idImagen}
            onChange={handleChange}
          />
          <input
            type="number"
            name="idEstado"
            placeholder="ID Estado"
            value={form.idEstado}
            onChange={handleChange}
          />
          <input
            type="text"
            name="resultado"
            placeholder="Resultado IA"
            value={form.resultado}
            onChange={handleChange}
          />
          <input
            type="number"
            name="porcentajeConfianza"
            placeholder="% Confianza"
            value={form.porcentajeConfianza}
            onChange={handleChange}
          />
          <input
            type="number"
            name="idNivelRoya"
            placeholder="Nivel Roya"
            value={form.idNivelRoya}
            onChange={handleChange}
          />
        </div>

        <div className="admin-form-actions">
          <button className="btn-primary" onClick={crearAnalisis}>
            Registrar análisis
          </button>
        </div>
      </div>

      {/* ─── Tabla ─── */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Imagen</th>
              <th>Estado</th>
              <th>Resultado</th>
              <th>Confianza</th>
              <th>Nivel Roya</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {analisis.length > 0 ? (
              analisis.map((item) => (
                <tr key={item.idAnalisis}>
                  <td>{item.idAnalisis}</td>
                  <td>{item.imagen?.rutaImagen || `#${item.idImagen}`}</td>
                  <td>{item.estadoAnalisis?.nombreEstado || `#${item.idEstado}`}</td>
                  <td>{item.resultado}</td>
                  <td>
                    <span className={obtenerClaseConfianza(item.porcentajeConfianza)}>
                      {item.porcentajeConfianza}%
                    </span>
                  </td>
                  <td>{item.nivelRoya?.nombreNivel || `Nivel ${item.idNivelRoya}`}</td>
                  <td className="acciones">
                    <button
                      className="btn-editar"
                      onClick={() => editarAnalisis(item)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-eliminar"
                      onClick={() => eliminarAnalisis(item)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="sin-datos">
                  No hay análisis registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Modal de edición ─── */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Editar análisis</h3>
              <button
                className="modal-close"
                onClick={() => setMostrarModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-form">
              <input
                type="number"
                name="idImagen"
                placeholder="ID Imagen"
                value={form.idImagen}
                onChange={handleChange}
              />
              <input
                type="number"
                name="idEstado"
                placeholder="ID Estado"
                value={form.idEstado}
                onChange={handleChange}
              />
              <input
                type="text"
                name="resultado"
                placeholder="Resultado"
                value={form.resultado}
                onChange={handleChange}
              />
              <input
                type="number"
                name="porcentajeConfianza"
                placeholder="% Confianza"
                value={form.porcentajeConfianza}
                onChange={handleChange}
              />
              <input
                type="number"
                name="idNivelRoya"
                placeholder="Nivel Roya"
                value={form.idNivelRoya}
                onChange={handleChange}
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancelar"
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>
              <button className="btn-guardar" onClick={actualizarAnalisis}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalisisIA;