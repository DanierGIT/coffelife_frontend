import { useEffect, useState } from "react";
import "./AnalisisIa.css";

import {
  getAnalisis,
  createAnalisis,
  updateAnalisis,
  deleteAnalisis,
} from "./api";

const AnalisisIa = () => {

  // =========================
  // STATES
  // =========================
  const [analisis, setAnalisis] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [form, setForm] = useState({
    idAnalisis: null,
    idImagen: "",
    idEstado: "",
    resultado: "",
    porcentajeConfianza: "",
    idNivelRoya: "",
  });

  // =========================
  // OBTENER DATOS
  // =========================
  const obtenerAnalisis = async () => {
    try {
      const data = await getAnalisis();

      console.log(data);

      setAnalisis(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error al obtener análisis IA", error);
      setAnalisis([]);
    }
  };

  useEffect(() => {
    obtenerAnalisis();
  }, []);

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  // =========================
  // CREAR
  // =========================
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

  // =========================
  // EDITAR
  // =========================
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

  // =========================
  // ACTUALIZAR
  // =========================
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

  // =========================
  // ELIMINAR
  // =========================
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

  // =========================
  // LIMPIAR FORM
  // =========================
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

  // =========================
  // BADGES
  // =========================
  const obtenerClaseConfianza = (valor) => {

    if (valor >= 80) return "badge alta";

    if (valor >= 50) return "badge media";

    return "badge baja";
  };

  return (
    <div className="analisis-container">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}
      <header className="analisis-header">

        <div>
          <h1>Análisis IA</h1>
          <p>Gestión inteligente de diagnósticos CoffeeLife</p>
        </div>

      </header>

      {/* ========================= */}
      {/* FORM */}
      {/* ========================= */}
      <section className="analisis-form">

        <h2>Registrar análisis</h2>

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

        <button onClick={crearAnalisis}>
          Registrar análisis
        </button>

      </section>

      {/* ========================= */}
      {/* TABLA */}
      {/* ========================= */}
      <section className="tabla-analisis">

        <div className="tabla-header">
          <h2>Historial de análisis IA</h2>
        </div>

        <table>

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

                  <td>#{item.idImagen}</td>

                  <td>#{item.idEstado}</td>

                  <td>{item.resultado}</td>

                  <td>
                    <span className={obtenerClaseConfianza(item.porcentajeConfianza)}>
                      {item.porcentajeConfianza}%
                    </span>
                  </td>

                  <td>
                    Nivel {item.idNivelRoya}
                  </td>

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

      </section>

      {/* ========================= */}
      {/* MODAL */}
      {/* ========================= */}
      {mostrarModal && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">
              <h3>Editar análisis</h3>
            </div>

            <div className="modal-body">

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

            <div className="modal-footer">

              <button
                className="btn-cancelar"
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>

              <button
                className="btn-guardar"
                onClick={actualizarAnalisis}
              >
                Guardar cambios
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default AnalisisIa;