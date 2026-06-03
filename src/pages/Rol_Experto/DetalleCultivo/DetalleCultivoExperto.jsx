import { useState } from 'react'
import './DetalleCultivoExperto.css'
import MonitoreosExperto from '../Monitoreos/MonitoreosExperto'
import RecomendacionesTab from '../Recomendaciones/RecomendacionesTab'

const TABS = [
  'Resumen',
  'Monitoreo',
  'Recomendaciones',
  'Tratamientos',
  'Fotos',
  'Historial',
]

export default function DetalleCultivoExperto({ cultivo, onNavigate, finca }) {
  const [activeTab, setActiveTab] = useState('Resumen')

  const tabContent = () => {
    switch (activeTab) {
      case 'Resumen':
        return (
          <div className="detalle-tab-content">
            <p className="detalle-empty">Resumen del cultivo</p>
          </div>
        )

      case 'Monitoreo':
        return (
          <MonitoreosExperto
            cultivo={cultivo}
            finca={finca}
          />
        )

      case 'Recomendaciones':
        return (
          <RecomendacionesTab
            cultivo={cultivo}
            finca={finca}
          />
        )

      case 'Tratamientos':
        return (
          <div className="detalle-tab-content">
            <p className="detalle-empty">Sección de tratamientos</p>
          </div>
        )

      case 'Fotos':
        return (
          <div className="detalle-tab-content">
            <p className="detalle-empty">Sección de fotos</p>
          </div>
        )

      case 'Historial':
        return (
          <div className="detalle-tab-content">
            <p className="detalle-empty">Sección de historial</p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="detalle-page">

      <div className="detalle-header">
        <button
          className="back-btn"
          onClick={() => onNavigate('cultivos', finca)}
        >
          ← Volver a cultivos
        </button>
        <span className="detalle-breadcrumb">
          {finca?.nombre || 'Finca'} / {cultivo?.nombreCultivo || 'Cultivo'}
        </span>
      </div>

      <div className="detalle-card">
        <div className="detalle-card-img">
          <img
            src="https://colombiaverde.com.co/wp-content/uploads/2023/05/cultivos-de-cafe-en-colombia-1200x800.jpg"
            alt="Cultivo"
          />
        </div>

        <div className="detalle-card-info">
          <div className="detalle-card-row">
            <div className="detalle-card-item">
              <span className="detalle-card-label">Nombre del cultivo</span>
              <span className="detalle-card-value">{cultivo?.nombreCultivo || '—'}</span>
            </div>
            <div className="detalle-card-item">
              <span className="detalle-card-label">Tipo de cultivo</span>
              <span className="detalle-card-value">{cultivo?.tipoCultivo || '—'}</span>
            </div>
          </div>

          <div className="detalle-card-row">
            <div className="detalle-card-item">
              <span className="detalle-card-label">Estado</span>
              <span className="detalle-card-value">
                <span className="detalle-estado-badge">
                  {cultivo?.estadoCultivo?.nombreEstado || '—'}
                </span>
              </span>
            </div>
            <div className="detalle-card-item">
              <span className="detalle-card-label">Finca</span>
              <span className="detalle-card-value">{finca?.nombre || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="detalle-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`detalle-tab ${activeTab === t ? 'detalle-tab--active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      {tabContent()}
    </div>
  )
}