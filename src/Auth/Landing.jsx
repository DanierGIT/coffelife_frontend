import { useState, useRef, useEffect } from 'react'
import AnimatedLogo from '../components/AnimatedLogo'
import Loading from '../components/Loading'
import '../components/cargando.css'
import './Landing.css'
import {
  BiLeaf, BiSearchAlt, BiMessageDetail, BiRightArrowAlt,
  BiMobile, BiBrain, BiCoffee, BiShield, BiCloud, BiBarChart, BiMap, BiUser
} from 'react-icons/bi'

const features = [
  {
    icon: <BiSearchAlt size={24} />,
    title: 'Monitoreo de cultivos',
    desc: 'Registra el estado de cada cultivo en tiempo real con fotografías y datos precisos. Accede al historial completo desde cualquier dispositivo.',
  },
  {
    icon: <BiBrain size={24} />,
    title: 'Detección inteligente',
    desc: 'Nuestro motor de IA analiza las imágenes para identificar niveles de roya y enfermedades. Recibe alertas tempranas y salva tu cosecha.',
  },
  {
    icon: <BiMessageDetail size={24} />,
    title: 'Recomendaciones de expertos',
    desc: 'Agrónomos profesionales asignan tratamientos personalizados para cada finca. Decisiones respaldadas por ciencia y experiencia de campo.',
  },
]

const statsMotivational = [
  { icon: <BiMap size={28} />, desc: 'Lleva el control de todas tus fincas desde un solo lugar' },
  { icon: <BiBarChart size={28} />, desc: 'Decisiones informadas con datos precisos de cada cultivo' },
  { icon: <BiUser size={28} />, desc: 'Acompañamiento profesional de agrónomos certificados' },
  { icon: <BiCoffee size={28} />, desc: 'Tecnología diseñada para potenciar la calidad del café' },
]

function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function RevealSection({ children, className = '' }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} className={`reveal-section${visible ? ' reveal-section--visible' : ''} ${className}`}>
      {children}
    </div>
  )
}

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

      {/* ─── DECORATIVE FLOATING LEAVES ─── */}
      <div className="landing-float-leaf lfl-1"><BiLeaf size={28} /></div>
      <div className="landing-float-leaf lfl-2"><BiLeaf size={20} /></div>
      <div className="landing-float-leaf lfl-3"><BiLeaf size={16} /></div>
      <div className="landing-float-leaf lfl-4"><BiLeaf size={24} /></div>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <AnimatedLogo size="md" horizontal className="landing-nav-logo" />
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
        <div className="landing-hero-pattern" />
        <div className="landing-hero-content">
          <div className="landing-hero-split">
            <div className="landing-hero-left">
              <AnimatedLogo size="xl" showTagline />
            </div>
            <div className="landing-hero-right">
              <div className="hero-entrance hero-entrance--1">
                <div className="landing-hero-badge">
                  <BiCoffee size={14} />
                  <span>Plataforma de gestión cafetalera</span>
                </div>
              </div>
              <div className="hero-entrance hero-entrance--2">
                <h1 className="landing-hero-title">
                  Gestiona tus cultivos de café
                  <span>con inteligencia y precisión</span>
                </h1>
              </div>
              <div className="hero-entrance hero-entrance--3">
                <div className="landing-title-divider">
                  <span className="ltd-line" />
                  <span className="ltd-icon"><BiLeaf size={16} /></span>
                  <span className="ltd-line" />
                </div>
              </div>
              <div className="hero-entrance hero-entrance--4">
                <p className="landing-hero-sub">
                  Monitorea el estado de tus fincas, detecta la roya a tiempo y recibe
                  recomendaciones personalizadas de expertos agrónomos — todo desde un solo lugar.
                </p>
              </div>
              <div className="hero-entrance hero-entrance--5">
                <div className="landing-hero-actions">
                  <button className="landing-btn-primary" onClick={() => go(onGoRegister)}>
                    <span>Comenzar gratis</span>
                    <BiRightArrowAlt size={20} />
                  </button>
                  <button className="landing-btn-ghost" onClick={() => scrollTo('features')}>
                    <BiLeaf size={16} />
                    <span>Conocer más</span>
                  </button>
                </div>
              </div>
              <div className="hero-entrance hero-entrance--6">
                <div className="landing-hero-features">
                  <div className="landing-hf-item">
                    <BiMobile size={16} />
                    <span>App móvil incluida</span>
                  </div>
                  <div className="landing-hf-item">
                    <BiCloud size={16} />
                    <span>Datos en la nube</span>
                  </div>
                  <div className="landing-hf-item">
                    <BiShield size={16} />
                    <span>Seguridad garantizada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <RevealSection>
        <section className="landing-features" id="features">
          <div className="landing-section-label">
            <BiLeaf size={12} />
            <span>¿Qué ofrece CoffeeLife?</span>
          </div>
          <h2 className="landing-section-title">
            Todo lo que necesitas<br />para tu cafetal
          </h2>
          <div className="landing-title-divider">
            <span className="ltd-line" />
            <span className="ltd-icon"><BiLeaf size={18} /></span>
            <span className="ltd-line" />
          </div>
          <p className="landing-section-sub">
            Una plataforma integral diseñada para caficultores modernos y expertos agrónomos.
          </p>
          <div className="landing-features-grid">
            {features.map((f, i) => (
              <div className="landing-feature-card" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="landing-feature-card-bg" />
                <div className="landing-feature-card-glow" />
                <div className="landing-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="landing-feature-card-line" />
              </div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* ═══════════ STATS ═══════════ */}
      <RevealSection>
        <section className="landing-stats">
          <div className="landing-stats-bg" />
          <div className="landing-stats-inner">
            {statsMotivational.map((s, i) => (
              <div className="landing-stat-item" key={i}>
                <div className="landing-stat-icon">{s.icon}</div>
                <div className="landing-stat-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* ═══════════ CTA ═══════════ */}
      <RevealSection>
        <section className="landing-cta">
          <div className="landing-cta-bg" />
          <div className="landing-cta-overlay" />
          <div className="landing-cta-pattern" />
          <div className="landing-cta-content">
            <div className="landing-cta-badge">Comienza hoy</div>
            <h2 className="landing-cta-title">¿Listo para transformar tu cafetal?</h2>
            <div className="landing-title-divider">
              <span className="ltd-line ltd-line--light" />
              <span className="ltd-icon"><BiLeaf size={16} /></span>
              <span className="ltd-line ltd-line--light" />
            </div>
            <p className="landing-cta-sub">
              Únete a la comunidad de caficultores que ya confían en CoffeeLife para
              gestionar sus cultivos con datos reales y decisiones inteligentes.
            </p>
            <button className="landing-btn-primary landing-btn-primary--lg" onClick={() => go(onGoRegister)}>
              <span>Crear cuenta gratuita</span>
              <BiRightArrowAlt size={22} />
            </button>
            <p className="landing-cta-login">
              ¿Ya tienes cuenta?{' '}
              <button className="landing-link" onClick={() => go(onGoLogin)}>Inicia sesión</button>
            </p>
          </div>
        </section>
      </RevealSection>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <AnimatedLogo size="sm" horizontal />
            <p className="landing-footer-desc">
              Transformando la gestión cafetalera con tecnología inteligente.
            </p>
          </div>
          <div className="landing-footer-links">
            <div className="landing-footer-col">
              <h4>Producto</h4>
              <button className="landing-footer-link" onClick={() => scrollTo('features')}>Características</button>
              <button className="landing-footer-link" onClick={() => go(onGoRegister)}>Registrarse</button>
            </div>
            <div className="landing-footer-col">
              <h4>Soporte</h4>
              <button className="landing-footer-link" onClick={() => go(onGoLogin)}>Iniciar sesión</button>
              <button className="landing-footer-link">Contacto</button>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>&copy; {new Date().getFullYear()} CoffeeLife. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
