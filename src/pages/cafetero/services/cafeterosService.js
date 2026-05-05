const URL =  "http://localhost:3333/cafeteros";


// ==========================
// OBTENER CAFETEROS
// ==========================
export const obtenerCafeteros = async () => {

  try {

    const respuesta = await fetch(URL);

    const datos = await respuesta.json();

    if (!respuesta.ok) {

      throw new Error(
        datos.error || datos.message || "Error al obtener cafeteros"
      );

    }

    return datos;

  } catch (error) {

    console.error("ERROR OBTENER:", error);

    alert(error.message);

    return [];

  }

};


// ==========================
// CREAR CAFETERO
// ==========================
export const crearCafetero = async (cafetero) => {

  try {

    const respuesta = await fetch(URL, {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(cafetero),

    });

    const datos = await respuesta.json();

    console.log("RESPUESTA BACKEND:", datos);

    if (!respuesta.ok) {

      throw new Error(
        datos.error || datos.message || "Error al crear cafetero"
      );

    }

    return datos;

  } catch (error) {

    console.error("ERROR CREAR:", error);

    alert(error.message);

  }

};


// ==========================
// ELIMINAR CAFETERO
// ==========================
export const eliminarCafetero = async (id) => {

  try {

    const respuesta = await fetch(`${URL}/${id}`, {

      method: "DELETE",

    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {

      throw new Error(
        datos.error || datos.message || "Error al eliminar cafetero"
      );

    }

    return datos;

  } catch (error) {

    console.error("ERROR ELIMINAR:", error);

    alert(error.message);

  }

};


// ==========================
// ACTUALIZAR CAFETERO
// ==========================
export const actualizarCafetero = async (id, cafetero) => {

  try {

    const respuesta = await fetch(`${URL}/${id}`, {

      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(cafetero),

    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {

      throw new Error(
        datos.error || datos.message || "Error al actualizar cafetero"
      );

    }

    return datos;

  } catch (error) {

    console.error("ERROR ACTUALIZAR:", error);

    alert(error.message);

  }

};
