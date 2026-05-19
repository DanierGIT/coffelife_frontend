import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cl_user')

      if (saved) {
        setUser(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error cargando usuario:', error)
      localStorage.removeItem('cl_user')
      localStorage.removeItem('cl_token')
    } finally {
      setLoading(false)
    }
  }, [])

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const res = await api.post('/login', {
        correo: email,
        password,
      })

      console.log('Respuesta login:', res.data)

      const { token, usuario } = res.data

      // Guardar token
      localStorage.setItem('cl_token', token)

      // Guardar usuario
      localStorage.setItem(
        'cl_user',
        JSON.stringify(usuario)
      )

      // Actualizar estado
      setUser(usuario)

      return usuario
    } catch (error) {
      console.error('Error login:', error)
      throw error
    }
  }

  // ─────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────
  const register = async (fullName, email, password) => {
    try {
      const parts = fullName.trim().split(' ')

      const nombre = parts[0] || fullName
      const apellido =
        parts.slice(1).join(' ') || nombre

      await api.post('/register', {
        nombre,
        apellido,
        correo: email,
        password,
      })

      // Login automático
      await login(email, password)
    } catch (error) {
      console.error('Error register:', error)
      throw error
    }
  }

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('cl_token')
    localStorage.removeItem('cl_user')

    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)