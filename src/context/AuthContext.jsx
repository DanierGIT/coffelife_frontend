/**
 * AuthContext.jsx
 * ----------------
 * Contexto de sesión del administrador.
 *
 * Por ahora el usuario está hardcodeado para desarrollo.
 * Cuando el backend esté listo, reemplaza el objeto `mockUser`
 * por una llamada real a la API de autenticación.
 *
 * Expone:
 *  - user     → objeto con datos del admin autenticado
 *  - logout() → limpia la sesión (listo para conectar al backend)
 */

import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// ─── USUARIO DE PRUEBA ────────────────────────────────────────────────────────
// TODO: reemplazar con llamada real al backend cuando esté listo el login
const mockUser = {
  fullName: "Admin CoffeeLife",
  email: "admin@coffeelife.com",
  role: "admin",
}
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(mockUser)

  const logout = () => {
    // TODO: llamar al endpoint de logout del backend
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
