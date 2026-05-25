import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { validatePassword } from '../utils/passwordValidator'
import './Auth.css'
import logo from '../assets/logo.jpg'

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

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

export default function Register({ onGoLogin }) {
  const { register } = useAuth()

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirm: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    const { isValid: pwOk, errors: pwErrors } = validatePassword(form.password, 'cafetero')
    if (!pwOk) {
      setError(`Contraseña inválida: ${pwErrors.join(', ')}`)
      return
    }
    setLoading(true)
    try {
      await register(form.fullName, form.email, form.password)
      setSuccess(true)
      setTimeout(() => { onGoLogin() }, 2000)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-bg" />
          <Dots className="auth-dots" />
          <div className="auth-left-content">
            <div className="auth-logo">
              <img src={logo} alt="CoffeeLife" className="auth-logo-img" />
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="auth-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="auth-card-title">¡Cuenta creada!</h2>
            <p className="auth-card-subtitle">
              Tu cuenta fue registrada correctamente.<br />
              Redirigiendo al inicio de sesión…
            </p>
            <div style={{ marginTop: 24, height: 4, borderRadius: 4, background: '#e8f5e9', overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: '#2e7d32', borderRadius: 4,
                animation: 'progressBar 2s linear forwards'
              }} />
            </div>
            <style>{`@keyframes progressBar { from { width: 0% } to { width: 100% } }`}</style>
            <p style={{ marginTop: 16, fontSize: 13, color: '#888' }}>
              ¿No te redirige?{' '}
              <button className="auth-switch-link" onClick={onGoLogin}>Ir al login</button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">

      {/* ══ PANEL IZQUIERDO ══ */}
      <div className="auth-left">
        <div className="auth-left-bg" />
        <Dots className="auth-dots" />

        <div className="auth-left-content">
          <div className="auth-logo">
            <img src={logo} alt="CoffeeLife" className="auth-logo-img" />
          </div>

          <div className="auth-left-headline">
            <h2 className="auth-headline-title">
              Gestiona tus cultivos<br />
              con inteligencia <span>y precisión.</span>
            </h2>
            <p className="auth-headline-sub">
              Monitorea el estado de tus fincas, detecta la roya
              a tiempo y toma decisiones respaldadas por datos reales.
            </p>

            <div className="auth-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <div className="auth-feature-text">
                  <h4>Monitoreo de cultivos</h4>
                  <p>Registra y consulta el estado de cada cultivo en tiempo real.</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </div>
                <div className="auth-feature-text">
                  <h4>Detección de roya</h4>
                  <p>Análisis asistido por IA para identificar niveles de roya a tiempo.</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className="auth-feature-text">
                  <h4>Tratamientos y recomendaciones</h4>
                  <p>Expertos asignan tratamientos personalizados para cada finca.</p>
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
          <div className="auth-card-icon">
            <img src={logo} alt="CoffeeLife" className="auth-card-logo" />
          </div>

          <h2 className="auth-card-title">Crear cuenta</h2>
          <p className="auth-card-subtitle">
            Completa los datos para registrarte<br />en CoffeeLife.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <span className="auth-field-icon"><UserIcon /></span>
              <input className="auth-input" type="text" name="fullName"
                value={form.fullName} onChange={handleChange}
                placeholder="Nombre completo" required autoComplete="name"
              />
            </div>

            <div className="auth-field">
              <span className="auth-field-icon"><MailIcon /></span>
              <input className="auth-input" type="email" name="email"
                value={form.email} onChange={handleChange}
                placeholder="Correo electrónico" required autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <span className="auth-field-icon"><LockIcon /></span>
              <input className="auth-input"
                type={showPass ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange}
                placeholder="Contraseña (mín. 8 caracteres)" required autoComplete="new-password"
              />
              <button type="button" className="auth-eye-btn"
                onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <PasswordStrength password={form.password} />

            <div className="auth-field">
              <span className="auth-field-icon"><LockIcon /></span>
              <input className="auth-input"
                type={showConf ? 'text' : 'password'} name="confirm"
                value={form.confirm} onChange={handleChange}
                placeholder="Confirmar contraseña" required autoComplete="new-password"
              />
              <button type="button" className="auth-eye-btn"
                onClick={() => setShowConf(!showConf)} tabIndex={-1}>
                {showConf ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Registrarse'}
              {!loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">o continúa con</span>
            <div className="auth-divider-line" />
          </div>

          <button className="auth-social-btn" type="button"><GoogleIcon />Continuar con Google</button>
          <button className="auth-social-btn" type="button"><MicrosoftIcon />Continuar con Microsoft</button>

          <p className="auth-switch">
            ¿Ya tienes cuenta?{' '}
            <button className="auth-switch-link" onClick={onGoLogin}>Inicia sesión</button>
          </p>
        </div>
      </div>
    </div>
  )
}