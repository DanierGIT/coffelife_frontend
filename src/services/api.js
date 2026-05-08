import axios from 'axios'

const api = axios.create({
  baseURL: '',          // ← vacío para que el proxy de Vite funcione
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cl_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cl_token')
      localStorage.removeItem('cl_user')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export default api