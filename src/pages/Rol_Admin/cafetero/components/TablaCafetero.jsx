import "../styles/tabla.css";

function TablaCafeteros({

  cafeteros,
  eliminar,
  editar,

}) {

  return (

    <table className="tabla">

      <thead>

        <tr>

          <th>ID</th>
          <th>Nombre</th>
          <th>Apellido</th>
          <th>Correo</th>
          <th>Teléfono</th>
          <th>Estado</th>
          <th>Acciones</th>

        </tr>

      </thead>

      <tbody>

        {cafeteros.map((cafetero, idx) => (

          <tr key={cafetero.idUsuario}>

            <td>{idx + 1}</td>

            <td>{cafetero.nombre}</td>

            <td>{cafetero.apellido}</td>

            <td>{cafetero.correo}</td>

            <td>{cafetero.telefono}</td>

            <td>

              <span
                className={
                  cafetero.activo
                    ? "estado activo"
                    : "estado inactivo"
                }
              >

                {
                  cafetero.activo
                    ? "Activo"
                    : "Inactivo"
                }

              </span>

            </td>

            <td className="acciones">

              <button
                className="editar"
                onClick={() => editar(cafetero)}
              >
                Editar
              </button>

              <button
                className="eliminar"
                onClick={() => eliminar(cafetero.idUsuario)}
              >
                Eliminar
              </button>

            </td>

          </tr>

        ))}

      </tbody>

    </table>

  );

}

export default TablaCafeteros;