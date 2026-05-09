import axios from 'axios'

// Usamos la instancia global de api con baseURL vacío
// para que pase por el proxy de Vite correctamente
const api = axios.create({
  baseURL: '',
  withCredentials: true,
})

// Agrega el token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cl_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

export const getData = async (endpoint) => {
  const res = await api.get(endpoint)
  return res.data
}

export const createData = async (endpoint, data) => {
  const res = await api.post(endpoint, data)
  return res.data
}

export const updateData = async (endpoint, id, data) => {
  const res = await api.put(`${endpoint}/${id}`, data)
  return res.data
}

export const deleteData = async (endpoint, id) => {
  const res = await api.delete(`${endpoint}/${id}`)
  return res.data
}

export default api