import { useEffect, useState } from "react";
import PasswordStrength from "../../../../components/PasswordStrength";

import {

  crearCafetero,
  actualizarCafetero,

} from "../services/cafeterosService";

import "../styles/formulario.css";

function FormularioCafetero({

  cargarDatos,
  cafeteroEditar,
  limpiarEdicion,

}) {

  const [formulario, setFormulario] = useState({

    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    password: "",
    observaciones: "",
    activo: true,

  });

  useEffect(() => {

    if (cafeteroEditar) {

      setFormulario({

        nombre: cafeteroEditar.nombre || "",
        apellido: cafeteroEditar.apellido || "",
        correo: cafeteroEditar.correo || "",
        telefono: cafeteroEditar.telefono || "",
        password: "",
        observaciones: cafeteroEditar.observaciones || "",
        activo: cafeteroEditar.activo,

      });

    }

  }, [cafeteroEditar]);

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormulario({

      ...formulario,

      [name]:
        name === "activo"
          ? value === "true"
          : value,

    });

  };

  const guardar = async (e) => {

    e.preventDefault();

    if (cafeteroEditar) {

      await actualizarCafetero(
        cafeteroEditar.idUsuario,
        formulario
      );

      limpiarEdicion();

    } else {

      await crearCafetero(formulario);

    }

    cargarDatos();

    setFormulario({

      nombre: "",
      apellido: "",
      correo: "",
      telefono: "",
      password: "",
      observaciones: "",
      activo: true,

    });

  };

  return (

    <>

      {/* FORMULARIO NORMAL CREAR */}

      {!cafeteroEditar && (

        <form
          className="formulario"
          onSubmit={guardar}
        >

          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={formulario.nombre}
            onChange={handleChange}
          />

          <input
            type="text"
            name="apellido"
            placeholder="Apellido"
            value={formulario.apellido}
            onChange={handleChange}
          />

          <input
            type="email"
            name="correo"
            placeholder="Correo"
            value={formulario.correo}
            onChange={handleChange}
          />

          <input
            type="text"
            name="telefono"
            placeholder="Teléfono"
            value={formulario.telefono}
            onChange={handleChange}
          />

          <div style={{ position: 'relative' }}>
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={formulario.password}
              onChange={handleChange}
              style={{ width: '100%' }}
            />
            <PasswordStrength password={formulario.password} />
          </div>

          <textarea
            name="observaciones"
            placeholder="Observaciones"
            value={formulario.observaciones}
            onChange={handleChange}
          />

          <select
            name="activo"
            value={formulario.activo}
            onChange={handleChange}
          >

            <option value={true}>
              Activo
            </option>

            <option value={false}>
              Inactivo
            </option>

          </select>

          <button type="submit">
            Guardar Cafetero
          </button>

        </form>

      )}

      {/* MODAL EDITAR */}

      {cafeteroEditar && (

        <div className="modal-overlay">

          <div className="modal">

            <button
              className="cerrar-modal"
              onClick={limpiarEdicion}
            >

              ✕

            </button>

            <h2>
              Editar Cafetero 
            </h2>

            <form
              className="formulario"
              onSubmit={guardar}
            >

              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                value={formulario.nombre}
                onChange={handleChange}
              />

              <input
                type="text"
                name="apellido"
                placeholder="Apellido"
                value={formulario.apellido}
                onChange={handleChange}
              />

              <input
                type="email"
                name="correo"
                placeholder="Correo"
                value={formulario.correo}
                onChange={handleChange}
              />

              <input
                type="text"
                name="telefono"
                placeholder="Teléfono"
                value={formulario.telefono}
                onChange={handleChange}
              />

              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  placeholder="Nueva contraseña"
                  value={formulario.password}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
                <PasswordStrength password={formulario.password} />
              </div>

              <textarea
                name="observaciones"
                placeholder="Observaciones"
                value={formulario.observaciones}
                onChange={handleChange}
              />

              <select
                name="activo"
                value={formulario.activo}
                onChange={handleChange}
              >

                <option value={true}>
                  Activo
                </option>

                <option value={false}>
                  Inactivo
                </option>

              </select>

              <button type="submit">
                Actualizar Cafetero
              </button>

            </form>

          </div>

        </div>

      )}

    </>

  );

}

export default FormularioCafetero;