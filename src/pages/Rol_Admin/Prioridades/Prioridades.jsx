import { useEffect, useState } from "react";
import "./Prioridades.css";
import api from "../../../services/api";

export const getPrioridades = async () => {
  const response = await api.get("/cat_prioridades");
  return response.data;
};
export const createPrioridad = async (data) => {
  const response = await api.post("/cat_prioridades", data);
  return response.data;
};
export const deletePrioridad = async (id) => {
  const response = await api.delete(`/cat_prioridades/${id}`);
  return response.data;
};

function Prioridades() {
  const [prioridades, setPrioridades] = useState([]);
  const [nombre, setNombre] = useState("");
  const [nivelOrden, setNivelOrden] = useState("");

  const cargarPrioridades = async () => {
    try {
      const data = await getPrioridades();
      setPrioridades(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarPrioridades();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !nivelOrden) {
      alert("Completa todos los campos");
      return;
    }
    try {
      await createPrioridad({ nombre, nivel_orden: Number(nivelOrden) });
      setNombre("");
      setNivelOrden("");
      cargarPrioridades();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    const confirmar = window.confirm("¿Eliminar esta prioridad?");
    if (!confirmar) return;
    try {
      await deletePrioridad(id);
      cargarPrioridades();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="prioridades-container">
      <div className="prioridades-header">
        <h1>Gestión de Prioridades</h1>
      </div>
      <form className="prioridad-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre prioridad"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          type="number"
          placeholder="Nivel"
          value={nivelOrden}
          min="1"
          max="3"
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || ["1", "2", "3"].includes(value)) {
              setNivelOrden(value);
            }
          }}
        />
        <button type="submit">Crear Prioridad</button>
      </form>
      <div className="tabla-container">
        <table className="tabla-prioridades">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Nivel</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prioridades.map((p) => (
              <tr key={p.idPrioridad}>
                <td>{p.idPrioridad}</td>
                <td>{p.nombre}</td>
                <td>
                  <span className={`badge badge-${p.nivelOrden}`}>
                    {p.nivelOrden}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(p.idPrioridad)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Prioridades;