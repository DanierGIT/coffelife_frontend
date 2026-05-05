import { useEffect, useState } from "react";

import FormularioCafetero from "./components/FormularioCafetero";
import TablaCafetero from "./components/TablaCafetero";

import {
  obtenerCafeteros,
  eliminarCafetero,
} from "./services/cafeterosService";

import "./styles/cafeteros.css";

function Campesino() {

  const [cafeteros, setCafeteros] = useState([]);
  
  const [cafeteroEditar, setCafeteroEditar] =
    useState(null);

  const cargarDatos = async () => {

    const datos = await obtenerCafeteros();

    setCafeteros(datos);

  };

  useEffect(() => {

    cargarDatos();

  }, []);

  const eliminar = async (id) => {

    await eliminarCafetero(id);

    cargarDatos();

  };

  const editar = (cafetero) => {

    setCafeteroEditar(cafetero);

  };

  const limpiarEdicion = () => {

    setCafeteroEditar(null);

  };

  return (

    <div className="layout">

      <main className="contenedor">

        {/* HEADER */}
        <div className="encabezado">

          <div>

            <h1>
              Gestión de Cafeteros ☕
            </h1>

            <p>
              Administra el personal cafetero del sistema CoffeeLife
            </p>

          </div>

          <div className="estado-sistema">

            <span className="estado-dot"></span>

            Sistema Activo

          </div>

        </div>

        {/* FORMULARIO */}
        <section className="panel">

          <div className="panel-header">

            <h2>
              ➕ Nuevo Cafetero
            </h2>

          </div>

          <FormularioCafetero
            cargarDatos={cargarDatos}
            cafeteroEditar={cafeteroEditar}
            limpiarEdicion={limpiarEdicion}
          />

        </section>

        {/* TABLA */}
        <section className="panel">

          <div className="panel-header tabla-header">

            <h2>
              Lista de Cafeteros
            </h2>

            <div className="contador">

              Total:
              
              <strong>
                {cafeteros.length}
              </strong>

            </div>

          </div>

          <TablaCafetero
            cafeteros={cafeteros}
            eliminar={eliminar}
            editar={editar}
          />

        </section>

      </main>

    </div>

  );

}

export default Campesino;