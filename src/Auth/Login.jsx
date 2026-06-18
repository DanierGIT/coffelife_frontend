import React, { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'
import AnimatedLogo from '../components/AnimatedLogo'
import Loading from '../components/Loading'
import '../components/cargando.css'
import { BiEnvelope, BiLockAlt, BiShow, BiHide, BiSearch, BiSearchAlt2, BiMessageDetail, BiRightArrowAlt } from 'react-icons/bi'

// const GoogleIcon = () => (
//   <svg width="20" height="20" viewBox="0 0 48 48">
//     <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
//     <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
//     <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
//     <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
//   </svg>
// )

// const MicrosoftIcon = () => (
//   <svg width="20" height="20" viewBox="0 0 23 23">
//     <rect x="1"  y="1"  width="10" height="10" fill="#F25022"/>
//     <rect x="12" y="1"  width="10" height="10" fill="#7FBA00"/>
//     <rect x="1"  y="12" width="10" height="10" fill="#00A4EF"/>
//     <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
//   </svg>
// )

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

const MailIcon = () => <BiEnvelope size={16} />

const LockIcon = () => <BiLockAlt size={16} />

const EyeIcon = () => <BiShow size={16} />

const EyeOffIcon = () => <BiHide size={16} />

export default function Login({ onGoRegister, onGoRecuperar, onGoLanding }) {
  const { login } = useAuth()

  const [form,     setForm]     = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [loadingNav, setLoadingNav] = useState(false)
  const navRef = useRef(false)

  const goNav = (fn) => {
    if (navRef.current) return
    navRef.current = true
    setLoadingNav(true)
    setTimeout(() => {
      setLoadingNav(false)
      setTimeout(() => { navRef.current = false; fn() }, 80)
    }, 500)
  }

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
    } catch (err) {
      if (!err.response) {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté disponible.')
      } else {
        setError(err.response.data?.message || 'Correo o contraseña incorrectos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {loadingNav && <Loading type="overlay" text="Cargando..." />}

      {/* ══ PANEL IZQUIERDO ══ */}
      <div className="auth-left">
        <div className="auth-left-bg" />
        <Dots className="auth-dots" />

        <div className="auth-left-content">
          <div className="auth-logo" onClick={() => goNav(onGoLanding)} style={{ cursor: 'pointer' }}>
            <AnimatedLogo size="xl" showTagline />
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
                  <BiSearch size={18} />
                </div>
                <div className="auth-feature-text">
                  <h4>Monitoreo de cultivos</h4>
                  <p>Registra y consulta el estado de cada cultivo en tiempo real desde cualquier lugar.</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <BiSearchAlt2 size={18} />
                </div>
                <div className="auth-feature-text">
                  <h4>Detección de roya</h4>
                  <p>Análisis asistido por IA para identificar niveles de roya y actuar a tiempo.</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <BiMessageDetail size={18} />
                </div>
                <div className="auth-feature-text">
                  <h4>Tratamientos y recomendaciones</h4>
                  <p>Expertos agrónomos asignan tratamientos personalizados para cada finca.</p>
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
          <div className="auth-card-icon" onClick={() => goNav(onGoLanding)} style={{ cursor: 'pointer' }}>
            <AnimatedLogo size="md" horizontal />
          </div>

          <h2 className="auth-card-title">¡Bienvenido de nuevo!</h2>
          <p className="auth-card-subtitle">
            Inicia sesión para continuar<br />con la gestión de tus cultivos.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <span className="auth-field-icon"><MailIcon /></span>
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

            <div className="auth-field">
              <span className="auth-field-icon"><LockIcon /></span>
              <input
                className="auth-input"
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Contraseña"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <div className="auth-row-extra">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Recordarme
              </label>
<button type="button" className="auth-forgot" onClick={onGoRecuperar}>
  ¿Olvidaste tu contraseña?
</button>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
              {!loading && <BiRightArrowAlt size={18} />}
            </button>
          </form>

          {/*
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
          */}

          <p className="auth-switch">
            ¿No tienes cuenta?{' '}
            <button className="auth-switch-link" onClick={onGoRegister}>
              Regístrate
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
