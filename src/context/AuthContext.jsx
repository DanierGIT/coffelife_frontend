import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

const getTokenFromResponse = (data) => {
  return data?.token?.token || data?.token?.value || data?.token || data?.accessToken || null
}

const getUserFromResponse = (data) => {
  return data?.usuario || data?.user || data?.data?.usuario || data?.data?.user || null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const token = localStorage.getItem('cl_token')
      const saved = localStorage.getItem('cl_user')

      if (token && saved) {
        setUser(JSON.parse(saved))
      }
    } catch {
      localStorage.removeItem('cl_token')
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
    const res = await api.post('/login', { correo: email, password })

    const token = getTokenFromResponse(res.data)
    const userData = getUserFromResponse(res.data)

    if (!token || !userData) {
      throw new Error('Respuesta de login inválida.')
    }

    localStorage.setItem('cl_token', token)
    localStorage.setItem('cl_user', JSON.stringify(userData))
    setUser(userData)
  }

  const register = async (fullName, email, password) => {
    const parts = fullName.trim().split(/\s+/)
    const nombre = parts[0] || fullName
    const apellido = parts.slice(1).join(' ') || nombre

    const res = await api.post('/register', {
      nombre,
      apellido,
      correo: email,
      password,
    })

    return res.data
  }

  const recuperarPassword = async (correo) => {
    const res = await api.post('/recuperar-password', { correo })
    return res.data
  }

  const restablecerPassword = async (token, nuevaPassword) => {
    const res = await api.post('/restablecer-password', { token, nuevaPassword })
    return res.data
  }

  // ─────────────────────────────────────────────



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
        recuperarPassword,
        restablecerPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)