import { useEffect, useState } from "react";
import api from "../../../services/api";
import "./styles/tratamientos.css";
import "./styles/formulario.css";
import "./styles/tabla.css";
import "../Administrador/Administrador.css";

// ─── Servicio inline (usa el api centralizado del proyecto) ───
const obtenerTratamientos = async () => {
  const res = await api.get("/tratamientos");
  return Array.isArray(res.data) ? res.data : res.data.data || [];
};
const crearTratamiento = async (data) => {
  const res = await api.post("/tratamientos", data);
  return res.data;
};
const actualizarTratamiento = async (id, data) => {
  const res = await api.put(`/tratamientos/${id}`, data);
  return res.data;
};
const eliminarTratamiento = async (id) => {
  const res = await api.delete(`/tratamientos/${id}`);
  return res.data;
};

// ─── Subcomponente: Formulario ───
function FormularioTratamiento({ cargarDatos, tratamientoEditar, limpiarEdicion }) {
  const [tipos, setTipos] = useState([]);
  const [formulario, setFormulario] = useState({
    id_tipo_tratamiento: "",
    nombre: "",
    descripcion: "",
  });

  useEffect(() => {
    api.get("/cat_tipos_tratamientos")
      .then((r) => {
        const datos = Array.isArray(r.data) ? r.data : r.data.data || [];
        const unicos = datos.filter(
          (t, i, self) => i === self.findIndex((x) => x.idTipo === t.idTipo)
        );
        setTipos(unicos);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (tratamientoEditar) {
      setFormulario({
        id_tipo_tratamiento: tratamientoEditar.idTipoTratamiento || "",
        nombre:              tratamientoEditar.nombre || "",
        descripcion:         tratamientoEditar.descripcion || "",
      });
    } else {
      setFormulario({ id_tipo_tratamiento: "", nombre: "", descripcion: "" });
    }
  }, [tratamientoEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario({
      ...formulario,
      [name]: name === "id_tipo_tratamiento" ? Number(value) : value,
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!formulario.id_tipo_tratamiento) {
      alert("Selecciona un tipo de tratamiento");
      return;
    }
    if (!formulario.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    try {
      const payload = {
        id_tipo_tratamiento: Number(formulario.id_tipo_tratamiento),
        nombre:              formulario.nombre.trim(),
        descripcion:         formulario.descripcion.trim(),
      };
      if (tratamientoEditar) {
        await actualizarTratamiento(tratamientoEditar.idTratamiento, payload);
        limpiarEdicion();
      } else {
        await crearTratamiento(payload);
      }
      await cargarDatos();
      if (!tratamientoEditar) { limpiarEdicion?.(); }
      setFormulario({ id_tipo_tratamiento: "", nombre: "", descripcion: "" });
    } catch (error) {
      console.error("ERROR GUARDANDO:", error);
    }
  };

  return (
    <form className="formulario" onSubmit={guardar}>
      <select
        name="id_tipo_tratamiento"
        value={formulario.id_tipo_tratamiento}
        onChange={handleChange}
        required
      >
        <option value="">Selecciona un tipo</option>
        {tipos.map((tipo) => (
          <option key={tipo.idTipo} value={tipo.idTipo}>
            {tipo.nombreTipo}
          </option>
        ))}
      </select>

      <input
        type="text"
        name="nombre"
        placeholder="Nombre del tratamiento"
        value={formulario.nombre}
        onChange={handleChange}
        required
      />

      <textarea
        name="descripcion"
        placeholder="Descripción"
        value={formulario.descripcion}
        onChange={handleChange}
      />

      <button type="submit">
        {tratamientoEditar ? "Actualizar Tratamiento" : "Guardar Tratamiento"}
      </button>
    </form>
  );
}

// ─── Subcomponente: Tabla ───
function TablaTratamientos({ tratamientos, eliminar, editar }) {
  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tipo</th>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {tratamientos.length === 0 ? (
          <tr>
            <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#999" }}>
              No hay tratamientos registrados
            </td>
          </tr>
        ) : (
          tratamientos.map((t, idx) => (
            <tr key={t.idTratamiento}>
              <td>{idx + 1}</td>
              <td>{t.tipoTratamiento?.nombreTipo || '—'}</td>
              <td>{t.nombre}</td>
              <td>{t.descripcion}</td>
              <td className="acciones">
                <button className="editar"   onClick={() => editar(t)}>Editar</button>
                <button className="eliminar" onClick={() => eliminar(t.idTratamiento)}>Eliminar</button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ─── Componente principal ───
function Tratamientos() {
  const [tratamientos,      setTratamientos]      = useState([]);
  const [tratamientoEditar, setTratamientoEditar] = useState(null);
  const [modalAbierto,      setModalAbierto]      = useState(false);
  const [showCrearModal, setShowCrearModal] = useState(false);

  const cargarDatos = async () => {
    const datos = await obtenerTratamientos();
    setTratamientos(datos);
  };

  useEffect(() => { cargarDatos(); }, []);

  const eliminar = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este tratamiento?")) return;
    await eliminarTratamiento(id);
    cargarDatos();
  };

  const editar = (tratamiento) => {
    setTratamientoEditar(tratamiento);
    setModalAbierto(true);
  };

  const limpiarEdicion = () => {
    setTratamientoEditar(null);
    setModalAbierto(false);
  };

  return (
    <div className="contenedor-tratamientos">
      <div className="page-header">
        <h1>Tratamientos</h1>
        <p>Tratamientos disponibles para cultivos</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          className="btn-primary"
          onClick={() => setShowCrearModal(true)}
          style={{
            background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar tratamiento
        </button>
      </div>

      <div className="card">
        <div className="tabla-header">
          <h2>Lista de Tratamientos</h2>
          <span className="contador">
            {tratamientos.length} tratamiento{tratamientos.length !== 1 ? "s" : ""}
          </span>
        </div>
        <TablaTratamientos
          tratamientos={tratamientos}
          eliminar={eliminar}
          editar={editar}
        />
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={limpiarEdicion}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="cerrar-modal" onClick={limpiarEdicion}>✕</button>
            <h2>Editar Tratamiento</h2>
            <FormularioTratamiento
              cargarDatos={cargarDatos}
              tratamientoEditar={tratamientoEditar}
              limpiarEdicion={limpiarEdicion}
            />
          </div>
        </div>
      )}

      {showCrearModal && (
        <div className="modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="cerrar-modal" onClick={() => setShowCrearModal(false)}>✕</button>
            <h2>Nuevo Tratamiento</h2>
            <FormularioTratamiento
              cargarDatos={cargarDatos}
              tratamientoEditar={null}
              limpiarEdicion={() => setShowCrearModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default Tratamientos;