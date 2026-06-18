import { useState, useRef } from 'react'
import AnimatedLogo from '../components/AnimatedLogo'
import Loading from '../components/Loading'
import '../components/cargando.css'
import './Landing.css'

export default function Landing({ onGoLogin, onGoRegister }) {
  const [loadingNav, setLoadingNav] = useState(false)
  const navRef = useRef(false)

  const go = (fn) => {
    if (navRef.current) return
    navRef.current = true
    setLoadingNav(true)
    setTimeout(() => {
      setLoadingNav(false)
      setTimeout(() => { navRef.current = false; fn() }, 80)
    }, 500)
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing-page">
      {loadingNav && <Loading type="overlay" text="Cargando..." />}
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <span className="landing-nav-brand">Coffe<span>Life</span></span>
          <div className="landing-nav-actions">
            <button className="landing-btn-outline" onClick={() => go(onGoLogin)}>
              Iniciar sesión
            </button>
            <button className="landing-btn-primary landing-btn-primary--sm" onClick={() => go(onGoRegister)}>
              Comenzar gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="landing-hero">
        <div className="landing-hero-bg" />
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <div className="landing-hero-split">
            <div className="landing-hero-left">
              <AnimatedLogo size="xl" showTagline />
            </div>
            <div className="landing-hero-right">
              <div className="landing-hero-badge">Plataforma de gestión cafetalera</div>
              <h1 className="landing-hero-title">
                Gestiona tus cultivos de café<br />
                <span>con inteligencia y precisión</span>
              </h1>
              <p className="landing-hero-sub">
                Monitorea el estado de tus fincas, detecta la roya a tiempo y recibe
                recomendaciones personalizadas de expertos agrónomos — todo desde un solo lugar.
              </p>
              <div className="landing-hero-actions">
                <button className="landing-btn-primary" onClick={() => go(onGoRegister)}>
                  Comenzar gratis
                </button>
                <button className="landing-btn-ghost" onClick={() => scrollTo('features')}>
                  Conocer más
                </button>
              </div>
              <div className="landing-hero-features">
                <div className="landing-hf-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                  <span>Registra desde tu celular</span>
                </div>
                <div className="landing-hf-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  <span>Detección con inteligencia artificial</span>
                </div>
                <div className="landing-hf-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Recomendaciones de expertos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className="landing-features" id="features">
        <div className="landing-section-label">¿Qué ofrece CoffeeLife?</div>
        <h2 className="landing-section-title">Todo lo que necesitas para tu cafetal</h2>
        <p className="landing-section-sub">
          Una plataforma completa diseñada para caficultores y expertos agrónomos.
        </p>
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <h3>Monitoreo de cultivos</h3>
            <p>Registra y consulta el estado de cada cultivo en tiempo real. Historial completo de monitoreos con fotografías.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3>Detección inteligente</h3>
            <p>Análisis asistido por IA para identificar niveles de roya y otras enfermedades. Actúa a tiempo y salva tu cosecha.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>Recomendaciones personalizadas</h3>
            <p>Expertos agrónomos asignan tratamientos y recomendaciones específicas para cada finca según sus necesidades.</p>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="landing-cta">
        <div className="landing-cta-bg" />
        <div className="landing-cta-overlay" />
        <div className="landing-cta-content">
          <h2 className="landing-cta-title">¿Listo para transformar tu cafetal?</h2>
          <p className="landing-cta-sub">
            Únete a la comunidad de caficultores que ya confían en CoffeeLife para
            gestionar sus cultivos con datos reales.
          </p>
          <button className="landing-btn-primary landing-btn-primary--lg" onClick={() => go(onGoRegister)}>
            Crear cuenta gratuita
          </button>
          <p className="landing-cta-login">
            ¿Ya tienes cuenta?{' '}
            <button className="landing-link" onClick={() => go(onGoLogin)}>Inicia sesión</button>
          </p>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <AnimatedLogo size="sm" horizontal />
          <p className="landing-footer-text">
            &copy; {new Date().getFullYear()} CoffeeLife. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
