import { useState } from 'react'
import CatEstadosCultivo     from './CatEstadosCultivo'
import CatEstadosAnalisis    from './CatEstadosAnalisis'
import CatNivelesRoya        from './CatNivelesRoya'
import CatPrioridades        from './CatPrioridades'
import CatTiposTratamiento   from './CatTiposTratamiento'
import CatTiposRecomendacion from './CatTiposRecomendacion'
import './Categorias.css'

const TABS = [
  { key: 'cultivo',    label: '🌱 Estados de Cultivo',       component: <CatEstadosCultivo /> },
  { key: 'analisis',   label: '🔬 Estados de Análisis',      component: <CatEstadosAnalisis /> },
  { key: 'roya',       label: '🍂 Niveles de Roya',          component: <CatNivelesRoya /> },
  { key: 'prioridad',  label: '⚡ Prioridades',              component: <CatPrioridades /> },
  { key: 'tratamiento',label: '💊 Tipos de Tratamiento',     component: <CatTiposTratamiento /> },
  { key: 'tipos',      label: '📋 Tipos de Recomendación',   component: <CatTiposRecomendacion /> },
]

export default function Categorias({ subPage }) {
  // Si viene subPage desde el sidebar, úsala; si no, la primera por defecto
  const initial = TABS.find(t => t.key === subPage)?.key ?? 'cultivo'
  const [active, setActive] = useState(initial)

  const current = TABS.find(t => t.key === active)

  return (
    <div className="categorias-page">
      <h1 className="categorias-title">Categorías</h1>

      {/* Tabs de navegación */}
      <div className="categorias-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`categorias-tab${active === tab.key ? ' active' : ''}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la categoría activa */}
      <div className="categorias-content">
        {current?.component}
      </div>
    </div>
  )
}