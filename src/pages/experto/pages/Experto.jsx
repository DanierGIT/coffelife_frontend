import { useEffect, useState } from "react";
import "./UsuariosExperto.css";
import { getExpertos, createExperto, updateExperto, deleteExperto } from "./api";

const Experto = () => {

  const [expertos, setExpertos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [form, setForm] = useState({
    id: null,
    nombre: "",
    correo: "",
    password: "",
    activo: true,
  });

  // =========================
  // LISTAR
  // =========================
  const obtenerExpertos = async () => {
    try {
      const data = await getExpertos();
      setExpertos(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error al obtener expertos", error);
      setExpertos([]);
    }
  };

  useEffect(() => {
    obtenerExpertos();
  }, []);

  // =========================
  // FORM CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: name === "activo" ? value === "true" : value,
    });
  };

  // =========================
  // CREAR (FORM NORMAL)
  // =========================
  const crearExperto = async () => {
    try {
      if (!form.password) {
        alert("La contraseña es obligatoria");
        return;
      }

      const payload = {
        nombre: form.nombre,
        correo: form.correo,
        password: form.password,
        activo: form.activo,
      };

      await createExperto(payload);

      setForm({
        id: null,
        nombre: "",
        correo: "",
        password: "",
        activo: true,
      });

      obtenerExpertos();
    } catch (error) {
      console.error("Error al crear experto", error);
    }
  };

  // =========================
  // EDITAR (ABRE MODAL)
  // =========================
  const editarExperto = (exp) => {
    const id = exp.idUsuario || exp.id_usuario || exp.id;

    if (!id) {
      console.error("ID inválido ❌", exp);
      return;
    }

    setForm({
      id,
      nombre: exp.nombre,
      correo: exp.correo,
      password: "",
      activo: Boolean(exp.activo),
    });

    setMostrarModal(true);
  };

  // =========================
  // ACTUALIZAR (MODAL)
  // =========================
  const actualizarExperto = async () => {
    try {
      const payload = {
        nombre: form.nombre,
        correo: form.correo,
        activo: form.activo,
      };

      await updateExperto(form.id, payload);

      setMostrarModal(false);

      setForm({
        id: null,
        nombre: "",
        correo: "",
        password: "",
        activo: true,
      });

      obtenerExpertos();
    } catch (error) {
      console.error("Error al actualizar experto", error);
    }
  };

  // =========================
  // ELIMINAR
  // =========================
  const eliminarExperto = async (exp) => {
    const id = exp.idUsuario || exp.id_usuario || exp.id;

    if (!id) return;

    if (!window.confirm(`¿Eliminar a ${exp.nombre}?`)) return;

    await deleteExperto(id);
    obtenerExpertos();
  };

  const [hover,setHover] = useState(false);
  return (
    <div className="container" style={{ marginLeft: "200px" }}>

      <header className="header" >
        <span>Bienvenido Al Panel De Expertos</span>
      </header>

      {/* ========================= */}
      {/* FORM CREAR */}
      {/* ========================= */}
      <section className="form">
        <h3 id="registraus">Crear Experto</h3>

        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
        <input name="correo" placeholder="Correo" value={form.correo} onChange={handleChange} />
        <input type="password" name="password" placeholder="Contraseña" value={form.password} onChange={handleChange} />

        <select name="activo" value={String(form.activo)} onChange={handleChange}>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>

        <button onClick={crearExperto}>Crear</button>
      </section>

      {/* ========================= */}
      {/* TABLA */}
      {/* ========================= */}
      <section className="tabla">
        <h3 id="registraus">Expertos registrados</h3>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {expertos.map((exp) => (
              <tr key={exp.idUsuario || exp.id}>
                <td>{exp.idUsuario || exp.id}</td>
                <td>{exp.nombre}</td>
                <td>{exp.correo}</td>
                <td>
                  <span className={exp.activo ? "activo" : "inactivo"}>
                    {exp.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <button onClick={() => editarExperto(exp)} id="edit-boton">Editar</button>
                  <button onClick={() => eliminarExperto(exp)} id="delete-boton">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ========================= */}
      {/* MODAL EDITAR */}
      {/* ========================= */}
{mostrarModal && (
  <div className="modal-overlay">

    <div className="modal">

      <div className="modal-header">
         Editar Experto
      </div>

      <div className="modal-body">
        <input name="nombre" value={form.nombre} onChange={handleChange} />
        <input name="correo" value={form.correo} onChange={handleChange} />

        <select name="activo" value={String(form.activo)} onChange={handleChange}>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
      </div>

      <div className="modal-footer">
        <button className="btn-cancel" onClick={() => setMostrarModal(false)}>
          Cancelar
        </button>

        <button className="btn-save" onClick={actualizarExperto}>
          Guardar
        </button>
      </div>

    </div>

  </div>
)}

    </div>
  );
};

export default Experto;