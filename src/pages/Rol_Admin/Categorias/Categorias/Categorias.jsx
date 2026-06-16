import { useState, useEffect, useRef } from 'react'
import { BiLeaf, BiSearch, BiError, BiListUl, BiBriefcase, BiChat, BiChevronDown, BiMenu } from 'react-icons/bi'
import CatEstadosCultivo     from './CatEstadosCultivo'
import CatEstadosAnalisis    from './CatEstadosAnalisis'
import CatNivelesRoya        from './CatNivelesRoya'
import CatPrioridades        from './CatPrioridades'
import CatTiposTratamiento   from './CatTiposTratamiento'
import CatTiposRecomendacion from './CatTiposRecomendacion'
import './Categorias.css'
import '../../Administrador/Administrador.css'

const TABS = [
  { key: 'cultivo',     label: 'Estados de Cultivo',     icon: <BiLeaf size={16} />,     component: <CatEstadosCultivo /> },
  { key: 'analisis',    label: 'Estados de Análisis',    icon: <BiSearch size={16} />,   component: <CatEstadosAnalisis /> },
  { key: 'roya',        label: 'Niveles de Roya',        icon: <BiError size={16} />,    component: <CatNivelesRoya /> },
  { key: 'prioridad',   label: 'Prioridades',            icon: <BiListUl size={16} />,   component: <CatPrioridades /> },
  { key: 'tratamiento', label: 'Tipos de Tratamiento',   icon: <BiBriefcase size={16} />,component: <CatTiposTratamiento /> },
  { key: 'tipos',       label: 'Tipos de Recomendación', icon: <BiChat size={16} />,     component: <CatTiposRecomendacion /> },
]

export default function Categorias({ subPage }) {
  const initial = TABS.find(t => t.key === subPage)?.key ?? 'cultivo'
  const [active, setActive] = useState(initial)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (subPage) {
      const found = TABS.find(t => t.key === subPage)
      if (found) setActive(found.key)
    }
  }, [subPage])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = TABS.find(t => t.key === active)

  return (
    <div className="categorias-page">
      <div className="catalogo-banner">
        <div className="catalogo-banner-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <span className="catalogo-banner-badge">Catálogo Agrícola</span>
          <h2 style={{ margin: '4px 0 4px', fontSize: '18px', fontWeight: 700, color: '#1b5e20' }}>
            Categorías del sistema
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#4a7c59', lineHeight: 1.5 }}>
            Administra los diferentes tipos de categorías del sistema. Desde aquí puedes crear, editar, activar o desactivar los catálogos que facilitan la clasificación de los registros.
          </p>
        </div>
        <div className="categorias-dropdown" ref={ref}>
          <button className="categorias-dropdown-btn" onClick={() => setOpen(!open)}>
            <BiMenu size={18} className="categorias-dropdown-hamburger" />
            <span className="categorias-dropdown-label">
              <span className="categorias-dropdown-btn-icon">{current?.icon}</span>
              {current?.label}
              <BiChevronDown size={16} className={`categorias-dropdown-arrow${open ? ' open' : ''}`} />
            </span>
          </button>
          {open && (
            <div className="categorias-dropdown-menu">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`categorias-dropdown-item${active === tab.key ? ' active' : ''}`}
                  onClick={() => { setActive(tab.key); setOpen(false) }}
                >
                  <span className="categorias-dropdown-item-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="categorias-content">
        {current?.component}
      </div>
    </div>
  )
}
