import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react'

import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [user, setUser] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  // =========================================
  // CARGAR USUARIO
  // =========================================

  useEffect(() => {

    try {

      const saved =
        localStorage.getItem('cl_user')

      // EVITAR JSON.parse(undefined)

      if (
        saved &&
        saved !== 'undefined'
      ) {

        setUser(JSON.parse(saved))

      }

    } catch (error) {

      console.error(error)

      localStorage.removeItem('cl_user')

    } finally {

      setLoading(false)

    }

  }, [])

  // =========================================
  // LOGIN
  // =========================================

  const login = async (
    email,
    password
  ) => {

    try {

      const res = await api.post(

        '/login',

        {
          correo: email,
          password,
        }

      )

      // BACKEND DEVUELVE:
      // { token, usuario }

      const {
        token,
        usuario: userData,
      } = res.data

      console.log(
        'Usuario backend:',
        userData
      )

      localStorage.setItem(
        'cl_token',
        token
      )

      localStorage.setItem(
        'cl_user',
        JSON.stringify(userData)
      )

      setUser(userData)

      return userData

    } catch (error) {

      console.error(
        'Error login:',
        error
      )

      throw error

    }

  }

  // =========================================
  // REGISTER
  // =========================================

  const register = async (
    fullName,
    email,
    password
  ) => {

    try {

      const parts =
        fullName.trim().split(' ')

      const nombre =
        parts[0] || fullName

      const apellido =
        parts.slice(1).join(' ') ||
        nombre

      await api.post(

        '/register',

        {
          nombre,
          apellido,
          correo: email,
          password,

          // IMPORTANTE:
          // EXISTE EN cat_roles

          idRol: 3,
        }

      )

      // LOGIN AUTOMÁTICO

      await login(
        email,
        password
      )

    } catch (error) {

      console.error(
        'Error register:',
        error
      )

      throw error

    }

  }

  // =========================================
  // UPDATE USER
  // =========================================

  const updateUser = (
    nuevosDatos
  ) => {

    const usuarioActualizado = {

      ...user,
      ...nuevosDatos,

    }

    setUser(usuarioActualizado)

    localStorage.setItem(

      'cl_user',

      JSON.stringify(
        usuarioActualizado
      )

    )

  }

  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {

    localStorage.removeItem(
      'cl_token'
    )

    localStorage.removeItem(
      'cl_user'
    )

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
        updateUser,

      }}
    >

      {children}

    </AuthContext.Provider>

  )

}

export const useAuth = () =>
  useContext(AuthContext)