/**
 * AuthContext.jsx
 * ─────────────────────────────────────────────
 * Contexto de sesión con modo MOCK para desarrollo.
 *
 * Para activar el modo mock (sin backend):
 *   Cambia MOCK_MODE = true
 *
 * Para conectar al backend real:
 *   Cambia MOCK_MODE = false
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

// ─── MODO DESARROLLO SIN BACKEND ─────────────────────────────────────────────
// Cambia a false cuando tengas el backend listo
const MOCK_MODE = true

const MOCK_USER = {
  fullName: 'Admin CoffeeLife',
  email:    'admin@coffeelife.com',
  role:     'admin',
}
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('cl_user')
    const token = localStorage.getItem('cl_token')
    if (saved && token) {
      setUser(JSON.parse(saved))
      if (!MOCK_MODE) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    if (MOCK_MODE) {
      const userData = { ...MOCK_USER, email }
      localStorage.setItem('cl_token', 'mock-token-dev')
      localStorage.setItem('cl_user',  JSON.stringify(userData))
      setUser(userData)
      return
    }
    const res = await api.post('/login', { email, password })
    const { token, user: userData } = res.data
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('cl_token', token)
    localStorage.setItem('cl_user',  JSON.stringify(userData))
    setUser(userData)
  }

  const register = async (fullName, email, password) => {
    if (MOCK_MODE) {
      const userData = { fullName, email, role: 'admin' }
      localStorage.setItem('cl_token', 'mock-token-dev')
      localStorage.setItem('cl_user',  JSON.stringify(userData))
      setUser(userData)
      return
    }
    const res = await api.post('/register', { fullName, email, password })
    const { token, user: userData } = res.data
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('cl_token', token)
    localStorage.setItem('cl_user',  JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    if (!MOCK_MODE) {
      try { await api.post('/logout') } catch { /* ignorar */ }
      delete api.defaults.headers.common['Authorization']
    }
    localStorage.removeItem('cl_token')
    localStorage.removeItem('cl_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
