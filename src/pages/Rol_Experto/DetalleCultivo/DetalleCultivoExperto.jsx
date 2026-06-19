import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './DetalleCultivoExperto.css'
import '../Cultivos/CultivosExperto.css'
import Loading from '../../../components/Loading'
import '../../../components/cargando.css'
import MonitoreosExperto from '../Monitoreos/MonitoreosExperto'

const TABS = ['Resumen', 'Monitoreo']

const fmtFecha = (f, short) => {
  if (!f) return '—'
  const d = new Date(f + (f.includes('T') ? '' : 'T12:00:00'))
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('es-CO', short
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DetalleCultivoExperto({ cultivo, onNavigate, finca }) {
  const [activeTab, setActiveTab] = useState('Resumen')
  const [ultimo, setUltimo] = useState(null)
  const [totalMons, setTotalMons] = useState(0)
  const [totalFotos, setTotalFotos] = useState(0)
  const [loading, setLoading] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    if (!cultivo?.idCultivo) return
    setImgLoaded(false)
    setLoading(true)
    api.get('/monitoreos', { params: { id_cultivo: cultivo.idCultivo } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
        setTotalMons(data.length)
        let fotos = 0
        data.forEach((m) => { fotos += (m.imagenes?.length || 0) })
        setTotalFotos(fotos)
        const sorted = [...data].sort((a, b) => new Date(b.fechaMonitoreo) - new Date(a.fechaMonitoreo))
        setUltimo(sorted[0] || null)
      })
      .catch(() => setUltimo(null))
      .finally(() => setLoading(false))
  }, [cultivo])

  const tabContent = () => {
    switch (activeTab) {
      case 'Resumen':
        return (
          <div className="detalle-tab-content">
            {loading ? (
              <Loading type="content" text="Cargando resumen..." />
            ) : ultimo ? (
              <div className="detalle-resumen-card">
                <div className="detalle-resumen-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Último monitoreo — {fmtFecha(ultimo.fechaMonitoreo)}</span>
                </div>
                <p className="detalle-resumen-obs">{ultimo.observaciones || 'Sin observaciones registradas.'}</p>
                <div className="detalle-resumen-footer">
                  <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> {ultimo.imagenes?.length || 0} foto{(ultimo.imagenes?.length || 0) !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ) : (
              <p className="detalle-empty">No hay monitoreos registrados para este cultivo.</p>
            )}
          </div>
        )

      case 'Monitoreo':
        return (
          <MonitoreosExperto
            cultivo={cultivo}
            finca={finca}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="detalle-page">

      <div className="finca-detail-header-card">
        <div className="finca-detail-left">
          <div className="finca-detail-img-container">
            {!imgLoaded && (
              <div className="finca-detail-img-loader">
                <Loading type="inline" />
              </div>
            )}
            <img
              src={cultivo?.fotoUrl || "https://blogtrip.org/wp-content/uploads/2016/04/paisaje-cafetero-parque-nacional-cafe-eje-cafetero.jpg"}
              alt="Cultivo"
              onLoad={() => setImgLoaded(true)}
              style={{ display: imgLoaded ? 'block' : 'none' }}
            />
          </div>
          <div className="finca-detail-info">
            <span className="badge-selected">Cultivo registrado</span>
            <h1 className="finca-detail-title">{cultivo?.nombreCultivo || '—'}</h1>
            <div className="finca-detail-meta">
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22V8M12 8c-2-2.5-5-2.5-7 0 0 3 2.5 5 7 5M12 8c2-2.5 5-2.5 7 0 0 3-2.5 5-7 5"/>
                </svg>
                <span>{cultivo?.tipoCultivo || 'Variedad sin especificar'}</span>
              </div>
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{finca?.nombre || 'Finca sin nombre'}</span>
              </div>
            </div>
            <div className="finca-tags-row">
              <span className="tag-item">{cultivo?.estadoCultivo?.nombreEstado || 'Activo'}</span>
            </div>
          </div>
        </div>

        <div className="finca-detail-right">
          <div className="kpi-cards-container">
            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-green-kpi">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{totalMons}</span>
                <span className="kpi-label">Monitoreos<br/>realizados</span>
              </div>
            </div>
            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-green-kpi">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{totalFotos}</span>
                <span className="kpi-label">Fotos<br/>tomadas</span>
              </div>
            </div>
            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-green-kpi">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{ultimo ? fmtFecha(ultimo.fechaMonitoreo, true) : '—'}</span>
                <span className="kpi-label">Último<br/>monitoreo</span>
              </div>
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