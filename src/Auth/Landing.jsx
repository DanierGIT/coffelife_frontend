import { useState, useRef } from 'react'
import AnimatedLogo from '../components/AnimatedLogo'
import Loading from '../components/Loading'
import '../components/cargando.css'
import './Landing.css'
import { BiLeaf, BiSearchAlt, BiMessageDetail, BiRightArrowAlt, BiMobile, BiBrain, BiCheckCircle } from 'react-icons/bi'

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
          <AnimatedLogo size="md" horizontal />
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
              <div className="landing-title-divider">
                <BiLeaf size={18} />
              </div>
              <p className="landing-hero-sub">
                Monitorea el estado de tus fincas, detecta la roya a tiempo y recibe
                recomendaciones personalizadas de expertos agrónomos — todo desde un solo lugar.
              </p>
              <div className="landing-hero-actions">
                <button className="landing-btn-primary" onClick={() => go(onGoRegister)}>
                  Comenzar gratis
                  <BiRightArrowAlt size={20} />
                </button>
                <button className="landing-btn-ghost" onClick={() => scrollTo('features')}>
                  Conocer más
                </button>
              </div>
              <div className="landing-hero-features">
                <div className="landing-hf-item">
                  <BiMobile size={18} />
                  <span>Registra desde tu celular</span>
                </div>
                <div className="landing-hf-item">
                  <BiBrain size={18} />
                  <span>Detección con inteligencia artificial</span>
                </div>
                <div className="landing-hf-item">
                  <BiMessageDetail size={18} />
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
        <div className="landing-title-divider">
          <BiLeaf size={20} />
        </div>
        <p className="landing-section-sub">
          Una plataforma completa diseñada para caficultores y expertos agrónomos.
        </p>
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <BiSearchAlt size={22} />
            </div>
            <h3>Monitoreo de cultivos</h3>
            <p>Registra y consulta el estado de cada cultivo en tiempo real. Historial completo de monitoreos con fotografías.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <BiBrain size={22} />
            </div>
            <h3>Detección inteligente</h3>
            <p>Análisis asistido por IA para identificar niveles de roya y otras enfermedades. Actúa a tiempo y salva tu cosecha.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <BiMessageDetail size={22} />
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
          <div className="landing-title-divider">
            <BiLeaf size={18} />
          </div>
          <p className="landing-cta-sub">
            Únete a la comunidad de caficultores que ya confían en CoffeeLife para
            gestionar sus cultivos con datos reales.
          </p>
          <div className="landing-cta-stats">
            <div className="landing-cta-stat">
              <strong>+500</strong>
              <span>Caficultores</span>
            </div>
            <div className="landing-cta-stat">
              <strong>+1200</strong>
              <span>Fincas registradas</span>
            </div>
            <div className="landing-cta-stat">
              <strong>+3000</strong>
              <span>Monitoreos</span>
            </div>
          </div>
          <button className="landing-btn-primary landing-btn-primary--lg" onClick={() => go(onGoRegister)}>
            Crear cuenta gratuita
            <BiRightArrowAlt size={22} />
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
          <div className="landing-footer-links">
            <button className="landing-footer-link" onClick={() => go(onGoLogin)}>Iniciar sesión</button>
            <button className="landing-footer-link" onClick={() => go(onGoRegister)}>Registrarse</button>
          </div>
          <p className="landing-footer-text">
            &copy; {new Date().getFullYear()} CoffeeLife. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
