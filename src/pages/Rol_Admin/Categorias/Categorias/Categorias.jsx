import { useState, useEffect } from 'react'
import { BiLeaf, BiSearch, BiError, BiListUl, BiBriefcase, BiChat } from 'react-icons/bi'
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
    icon: <BiLeaf size={16} />,
    component: <CatEstadosCultivo />,
  },
  {
    key: 'analisis',
    label: 'Estados de Análisis',
    icon: <BiSearch size={16} />,
    component: <CatEstadosAnalisis />,
  },
  {
    key: 'roya',
    label: 'Niveles de Roya',
    icon: <BiError size={16} />,
    component: <CatNivelesRoya />,
  },
  {
    key: 'prioridad',
    label: 'Prioridades',
    icon: <BiListUl size={16} />,
    component: <CatPrioridades />,
  },
  {
    key: 'tratamiento',
    label: 'Tipos de Tratamiento',
    icon: <BiBriefcase size={16} />,
    component: <CatTiposTratamiento />,
  },
  {
    key: 'tipos',
    label: 'Tipos de Recomendación',
    icon: <BiChat size={16} />,
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