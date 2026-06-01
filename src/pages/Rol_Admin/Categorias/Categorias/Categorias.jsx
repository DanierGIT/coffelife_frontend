import { useState, useEffect } from 'react'
import CatEstadosCultivo     from './CatEstadosCultivo'
import CatEstadosAnalisis    from './CatEstadosAnalisis'
import CatNivelesRoya        from './CatNivelesRoya'
import CatPrioridades        from './CatPrioridades'
import CatTiposTratamiento   from './CatTiposTratamiento'
import CatTiposRecomendacion from './CatTiposRecomendacion'
import './Categorias.css'
import '../../Administrador/Administrador.css'

const TABS = [
  {
    key: 'cultivo',
    label: 'Estados de Cultivo',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a9 9 0 0 1 9 9c0 5-9 13-9 13S3 16 3 11a9 9 0 0 1 9-9z"/>
        <circle cx="12" cy="11" r="3"/>
      </svg>
    ),
    component: <CatEstadosCultivo />,
  },
  {
    key: 'analisis',
    label: 'Estados de Análisis',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    ),
    component: <CatEstadosAnalisis />,
  },
  {
    key: 'roya',
    label: 'Niveles de Roya',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    component: <CatNivelesRoya />,
  },
  {
    key: 'prioridad',
    label: 'Prioridades',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v4H3z"/><path d="M3 10h12v4H3z"/><path d="M3 17h6v4H3z"/>
      </svg>
    ),
    component: <CatPrioridades />,
  },
  {
    key: 'tratamiento',
    label: 'Tipos de Tratamiento',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
      </svg>
    ),
    component: <CatTiposTratamiento />,
  },
  {
    key: 'tipos',
    label: 'Tipos de Recomendación',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    component: <CatTiposRecomendacion />,
  },
]

export default function Categorias({ subPage }) {
  const initial = TABS.find(t => t.key === subPage)?.key ?? 'cultivo'
  const [active, setActive] = useState(initial)

  useEffect(() => {
    if (subPage) {
      const found = TABS.find(t => t.key === subPage)
      if (found) setActive(found.key)
    }
  }, [subPage])

  const current = TABS.find(t => t.key === active)

  return (
    <div className="categorias-page">
      <div className="page-header">
        <h1>Categorías</h1>
        <p>Catálogos del sistema</p>
      </div>

      <div className="categorias-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`categorias-tab${active === tab.key ? ' active' : ''}`}
            onClick={() => setActive(tab.key)}
          >
            <span className="categorias-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="categorias-content">
        {current?.component}
      </div>
    </div>
  )
}