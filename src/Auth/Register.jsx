import React, { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { validatePassword } from '../utils/passwordValidator'
import './Auth.css'
import AnimatedLogo from '../components/AnimatedLogo'
import Loading from '../components/Loading'
import '../components/cargando.css'
import PasswordStrength from '../components/PasswordStrength'
import { BiUser, BiEnvelope, BiLockAlt, BiShow, BiHide, BiCheckCircle, BiSearch, BiSearchAlt2, BiMessageDetail, BiRightArrowAlt, BiPhone } from 'react-icons/bi'

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

const UserIcon = () => <BiUser size={16} />

const MailIcon = () => <BiEnvelope size={16} />

const PhoneIcon = () => <BiPhone size={16} />

const LockIcon = () => <BiLockAlt size={16} />

const EyeIcon = () => <BiShow size={16} />

const EyeOffIcon = () => <BiHide size={16} />

export default function Register({ onGoLogin, onGoLanding }) {
  const { register } = useAuth()

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '', password: '', confirm: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [successType, setSuccessType] = useState('default')
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
      await register(form.nombre, form.apellido, form.email, form.password, form.telefono)
      setSuccessType('default')
      setSuccess(true)
      setTimeout(() => { onGoLogin() }, 2000)
    } catch (err) {
      setSuccessType('cafetero')
      setSuccess(true)
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
            <div className="auth-logo" onClick={() => goNav(onGoLanding)} style={{ cursor: 'pointer' }}>
              <AnimatedLogo size="lg" showTagline />
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            {successType === 'cafetero' ? (
              <>
                <div className="auth-success-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 className="auth-card-title" style={{ marginBottom: 4 }}>Registro completado</h2>
                <p className="auth-card-subtitle" style={{ marginBottom: 20, fontSize: 13 }}>
                  Tu cuenta de caficultor fue creada exitosamente.
                </p>
                <div className="auth-app-notice">
                  <div className="auth-app-notice-phone">
                    <div className="auth-app-notice-phone-screen">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3949ab" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                  </div>
                  <div className="auth-app-notice-text">
                    <strong>Descarga la app para iniciar sesión</strong>
                    <p>
                      CoffeeLife para caficultores está disponible exclusivamente en dispositivos móviles.
                      Ingresa desde la aplicación para acceder a todas las funciones.
                    </p>
                    <div className="auth-app-stores">
                      {/* TODO: Reemplazar con los links reales cuando la app esté publicada */}
                      <button className="auth-store-btn" disabled>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                        Google Play
                      </button>
                      <button className="auth-store-btn" disabled>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                        App Store
                      </button>
                    </div>
                  </div>
                </div>
                <button className="auth-btn-back" onClick={() => goNav(onGoLanding)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Volver al inicio
                </button>
              </>
            ) : (
              <>
                <div className="auth-card-icon" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
                  <BiCheckCircle size={28} color="#2e7d32" />
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
              </>
            )}
          </div>
        </div>
      </div>
    )
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
            <AnimatedLogo size="lg" showTagline />
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
                  <p>Registra y consulta el estado de cada cultivo en tiempo real.</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <BiSearchAlt2 size={18} />
                </div>
                <div className="auth-feature-text">
                  <h4>Detección de roya</h4>
                  <p>Análisis asistido por IA para identificar niveles de roya a tiempo.</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <BiMessageDetail size={18} />
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
          <div className="auth-card-icon" onClick={() => goNav(onGoLanding)} style={{ cursor: 'pointer' }}>
            <AnimatedLogo size="sm" showText={false} />
          </div>

          <h2 className="auth-card-title">Crear cuenta</h2>
          <p className="auth-card-subtitle">
            Completa los datos para registrarte<br />en CoffeeLife.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field-row">
              <div className="auth-field" style={{ flex: 1 }}>
                <span className="auth-field-icon"><UserIcon /></span>
                <input className="auth-input" type="text" name="nombre"
                  value={form.nombre} onChange={handleChange}
                  placeholder="Nombre" required autoComplete="given-name"
                />
              </div>
              <div className="auth-field" style={{ flex: 1 }}>
                <span className="auth-field-icon"><UserIcon /></span>
                <input className="auth-input" type="text" name="apellido"
                  value={form.apellido} onChange={handleChange}
                  placeholder="Apellido" required autoComplete="family-name"
                />
              </div>
            </div>

            <div className="auth-field">
              <span className="auth-field-icon"><MailIcon /></span>
              <input className="auth-input" type="email" name="email"
                value={form.email} onChange={handleChange}
                placeholder="Correo electrónico" required autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <span className="auth-field-icon"><PhoneIcon /></span>
              <input className="auth-input" type="tel" name="telefono"
                value={form.telefono} onChange={handleChange}
                placeholder="Número de teléfono" autoComplete="tel"
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
              {!loading && <BiRightArrowAlt size={18} />}
            </button>
          </form>

          {/* 
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">o continúa con</span>
            <div className="auth-divider-line" />
          </div>

          <button className="auth-social-btn" type="button"><GoogleIcon />Continuar con Google</button>
          <button className="auth-social-btn" type="button"><MicrosoftIcon />Continuar con Microsoft</button>
          */}

          <p className="auth-switch">
            ¿Ya tienes cuenta?{' '}
            <button className="auth-switch-link" onClick={onGoLogin}>Inicia sesión</button>
          </p>
        </div>
      </div>
    </div>
  )
}