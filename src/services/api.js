import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://backend-coffe-lifee-production.up.railway.app',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cl_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthRequest =
      url.includes('/login') ||
      url.includes('/register') ||
      url.includes('/recuperar-password') ||
      url.includes('/restablecer-password') ||
      url.includes('/mi-perfil')

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('cl_token')
      localStorage.removeItem('cl_user')
      window.location.assign('/')
    }

    return Promise.reject(error)
  }
)

export default api