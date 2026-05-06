/**
 * Register.jsx
 * Diseño espejo al Login de CoffeeLife.
 */

import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23">
    <rect x="1"  y="1"  width="10" height="10" fill="#F25022"/>
    <rect x="12" y="1"  width="10" height="10" fill="#7FBA00"/>
    <rect x="1"  y="12" width="10" height="10" fill="#00A4EF"/>
    <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
  </svg>
)

const Dots = ({ className }) => (
  <div className={className}>
    {Array.from({ length: 20 }).map((_, i) => (
      <div key={i} className="auth-dot" />
    ))}
  </div>
)

const RightDots = () => (
  <div className="auth-right-dots">
    {Array.from({ length: 16 }).map((_, i) => (
      <div key={i} className="auth-right-dot" />
    ))}
  </div>
)

export default function Register({ onGoLogin }) {
  const { register } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    email:    '',
    password: '',
    confirm:  '',
  })
  const [showPass,  setShowPass]  = useState(false)
  const [showConf,  setShowConf]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')



  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      await register(form.fullName, form.email, form.password)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">

      {/* ══ PANEL IZQUIERDO ══ */}
      <div className="auth-left">
        <div className="auth-left-bg" />
        <Dots className="auth-dots" />

        <div className="auth-left-content">
          <div className="auth-logo">
            <span className="auth-logo-icon">🌿</span>
            <span className="auth-logo-name">CoffeeLife</span>
          </div>

          <div className="auth-left-headline">
            <h2 className="auth-headline-title">
              Cada acción cuenta, 🌿<br />
              cada hábito <span>transforma.</span>
            </h2>
            <p className="auth-headline-sub">
              Únete a CoffeeLife y sé parte de una comunidad
              que construye un futuro más sostenible.
            </p>

            <div className="auth-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">✅</div>
                <div className="auth-feature-text">
                  <h4>Impacto real</h4>
                  <p>Tus acciones generan un cambio positivo en el planeta.</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">👥</div>
                <div className="auth-feature-text">
                  <h4>Comunidad activa</h4>
                  <p>Conecta, colabora y crece con personas que comparten tus valores.</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">🎁</div>
                <div className="auth-feature-text">
                  <h4>Recompensas verdes</h4>
                  <p>Gana puntos, desbloquea logros y obtén beneficios por tu compromiso.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ PANEL DERECHO ══ */}
      <div className="auth-right">
        <RightDots />

        <div className="auth-card">
          <div className="auth-card-icon">🌿</div>

          <h2 className="auth-card-title">Crear cuenta</h2>
          <p className="auth-card-subtitle">
            Completa los datos para registrarte<br />en CoffeeLife.
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Nombre */}
            <div className="auth-field">
              <span className="auth-field-icon">👤</span>
              <input
                className="auth-input"
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nombre completo"
                required
                autoComplete="name"
              />
            </div>

            {/* Correo */}
            <div className="auth-field">
              <span className="auth-field-icon">✉️</span>
              <input
                className="auth-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Correo electrónico"
                required
                autoComplete="email"
              />
            </div>

            {/* Contraseña */}
            <div className="auth-field">
              <span className="auth-field-icon">🔒</span>
              <input
                className="auth-input"
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Contraseña (mín. 8 caracteres)"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Confirmar */}
            <div className="auth-field">
              <span className="auth-field-icon">🔒</span>
              <input
                className="auth-input"
                type={showConf ? 'text' : 'password'}
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Confirmar contraseña"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowConf(!showConf)}
                tabIndex={-1}
              >
                {showConf ? '🙈' : '👁️'}
              </button>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Registrarse'}
              {!loading && <span className="auth-btn-arrow">→</span>}
            </button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">o continúa con</span>
            <div className="auth-divider-line" />
          </div>

          <button className="auth-social-btn" type="button">
            <GoogleIcon />
            Continuar con Google
          </button>

          <button className="auth-social-btn" type="button">
            <MicrosoftIcon />
            Continuar con Microsoft
          </button>

          <p className="auth-switch">
            ¿Ya tienes cuenta?{' '}
            <button className="auth-switch-link" onClick={onGoLogin}>
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
