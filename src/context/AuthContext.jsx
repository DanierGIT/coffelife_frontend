import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cl_user')
      if (saved) setUser(JSON.parse(saved))
    } catch {
      localStorage.removeItem('cl_user')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
  const res = await api.post('/login', { correo: email, password })
  const { token, data: userData } = res.data
  console.log('userData del backend:', userData)  // <-- agrega esta línea
  localStorage.setItem('cl_token', token)
  localStorage.setItem('cl_user',  JSON.stringify(userData))
  setUser(userData)
}

  const register = async (fullName, email, password) => {
    const parts = fullName.trim().split(' ')
    const nombre   = parts[0] || fullName
    const apellido = parts.slice(1).join(' ') || nombre
    await api.post('/register', { nombre, apellido, correo: email, password })
    await login(email, password)
  }

  const logout = () => {
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