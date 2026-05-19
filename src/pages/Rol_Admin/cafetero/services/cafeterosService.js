import api from '../../../../services/api'

const URL = '/cafeteros'

export const obtenerCafeteros = async () => {
  try {
    const respuesta = await api.get(URL)
    return respuesta.data
  } catch (error) {
    const msg = error.response?.data?.message || 'Error al obtener cafeteros'
    console.error('ERROR OBTENER:', error)
    alert(msg)
    return []
  }
}

export const crearCafetero = async (cafetero) => {
  try {
    const respuesta = await api.post(URL, cafetero)
    return respuesta.data
  } catch (error) {
    const msg = error.response?.data?.message || 'Error al crear cafetero'
    console.error('ERROR CREAR:', error)
    alert(msg)
  }
}

export const eliminarCafetero = async (id) => {
  try {
    const respuesta = await api.delete(`${URL}/${id}`)
    return respuesta.data
  } catch (error) {
    const msg = error.response?.data?.message || 'Error al eliminar cafetero'
    console.error('ERROR ELIMINAR:', error)
    alert(msg)
  }
}

export const actualizarCafetero = async (id, cafetero) => {
  try {
    const respuesta = await api.put(`${URL}/${id}`, cafetero)
    return respuesta.data
  } catch (error) {
    const msg = error.response?.data?.message || 'Error al actualizar cafetero'
    console.error('ERROR ACTUALIZAR:', error)
    alert(msg)
  }
}