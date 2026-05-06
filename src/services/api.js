import axios from 'axios'

// URL base del backend.
const api = axios.create({
  baseURL: 'http://localhost:3333',
  withCredentials: true,
})

// ── Interceptor de REQUEST: adjunta el JWT automáticamente ─────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cl_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// ── Interceptor de RESPONSE: maneja 401 globalmente ───────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido → limpiar sesión
      localStorage.removeItem('cl_token')
      localStorage.removeItem('cl_user')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export default api
