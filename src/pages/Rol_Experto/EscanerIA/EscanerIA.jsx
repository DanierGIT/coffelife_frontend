import { useState, useEffect, useRef } from 'react'
import api from '../../../services/api'
import './EscanerIA.css'

// ── Sub-tab: Fotos del caficultor ─────────────────────────────────────────────
function FotosCaficultor() {
  const [imagenes, setImagenes] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/imagenes')
      .then(r => setImagenes(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => setImagenes([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="escaner-fotos">
      {loading ? (
        <p className="escaner-empty">Cargando imágenes…</p>
      ) : imagenes.length === 0 ? (
        <div className="escaner-no-fotos">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p>No hay nuevas fotos del caficultor</p>
          <span>Cuando el caficultor tome nuevas fotos, aparecerán aquí automáticamente.</span>
        </div>
      ) : (
        <div className="escaner-grid">
          {imagenes.map((img) => (
            <div key={img.idImagen} className={`escaner-foto-card${selected?.idImagen === img.idImagen ? ' selected' : ''}`} onClick={() => setSelected(img)}>
              <div className="escaner-foto-thumb">
                {img.urlImagen
                  ? <img src={img.urlImagen} alt="hoja" />
                  : <div className="escaner-foto-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                }
              </div>
              <div className="escaner-foto-info">
                <p>Finca #{img.idFinca ?? '—'}</p>
                <span>{img.fechaCaptura ? new Date(img.fechaCaptura).toLocaleDateString('es-CO') : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="escaner-detail-panel">
          <div className="escaner-detail-header">
            <h3>Información del monitoreo</h3>
            <button onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="escaner-detail-body">
            <div className="escaner-detail-img">
              {selected.urlImagen ? <img src={selected.urlImagen} alt="hoja" /> : <div className="escaner-foto-placeholder large" />}
            </div>
            <div className="escaner-detail-meta">
              <div className="escaner-meta-row"><span>Finca</span><strong>{selected.nombreFinca ?? `#${selected.idFinca}`}</strong></div>
              <div className="escaner-meta-row"><span>Fecha</span><strong>{selected.fechaCaptura ? new Date(selected.fechaCaptura).toLocaleDateString('es-CO') : '—'}</strong></div>
              <div className="escaner-meta-row"><span>Observaciones</span><strong>{selected.observaciones || '—'}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-tab: Escanear nueva planta ────────────────────────────────────────────
function EscanearPlanta() {
  const [analisis, setAnalisis] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/analisis_ia')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
        setAnalisis(data)
        if (data.length > 0) setSelected(data[0])
      })
      .catch(() => setAnalisis([]))
      .finally(() => setLoading(false))
  }, [])

  const nivel = selected?.nivelRoya?.nombre || selected?.nivel_roya || ''
  const nivelClass = nivel.toLowerCase().includes('alto') ? 'high'
    : nivel.toLowerCase().includes('medio') ? 'mid' : 'low'

  return (
    <div className="escaner-analisis">
      <div className="escaner-analisis-list">
        <h3>Análisis recientes</h3>
        {loading ? <p className="escaner-empty">Cargando…</p> : analisis.length === 0 ? (
          <p className="escaner-empty">No hay análisis registrados.</p>
        ) : (
          analisis.map(a => (
            <div key={a.idAnalisis} className={`escaner-analisis-item${selected?.idAnalisis === a.idAnalisis ? ' active' : ''}`} onClick={() => setSelected(a)}>
              <div className="escaner-analisis-thumb">
                {a.urlImagen ? <img src={a.urlImagen} alt="hoja" /> : <span>🌿</span>}
              </div>
              <div>
                <p>Finca #{a.idFinca ?? '—'}</p>
                <span>{a.fechaAnalisis ? new Date(a.fechaAnalisis).toLocaleDateString('es-CO') : '—'}</span>
              </div>
              <span className={`nivel-badge ${nivelClass}`}>{a.nivelRoya?.nombre ?? nivel ?? '—'}</span>
            </div>
          ))
        )}
      </div>

      {selected && (
        <div className="escaner-result-panel">
          <div className="escaner-result-header">
            <h3>Último análisis IA</h3>
          </div>
          <div className="escaner-result-body">
            <div className="escaner-result-diagnosis">
              <p className="diagnosis-label">Diagnóstico de IA</p>
              <p className={`diagnosis-title ${nivelClass}`}>{nivel || 'Sin diagnóstico'}</p>
              <div className="diagnosis-bar">
                <div className="diagnosis-bar-fill" style={{ width: `${selected.porcentajeConfianza ?? 0}%` }} />
              </div>
              <p className="diagnosis-conf">Nivel de roya <strong>{selected.porcentajeConfianza ?? 0}%</strong> <span className={`conf-badge ${nivelClass}`}>{nivel}</span></p>
              <div className="diagnosis-meta">
                <div><span>Estado análisis</span><span className="badge-completado">Completado</span></div>
                <div><span>Fecha</span><span>{selected.fechaAnalisis ? new Date(selected.fechaAnalisis).toLocaleDateString('es-CO') : '—'}</span></div>
              </div>
            </div>
            <div className="escaner-result-cultivo">
              <p className="diagnosis-label">Información del cultivo</p>
              <div><span>Finca</span><strong>{selected.nombreFinca ?? `#${selected.idFinca}`}</strong></div>
              <div><span>Área</span><strong>{selected.areaHectareas ? `${selected.areaHectareas} ha` : '—'}</strong></div>
              <div><span>Cultivo</span><strong>{selected.nombreCultivo ?? '—'}</strong></div>
            </div>
          </div>
          <button className="btn-ver-resultado">Ver resultado completo</button>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function EscanerIA() {
  const [tab, setTab] = useState('fotos')

  return (
    <div className="escaner-page">
      <div className="escaner-page-header">
        <div>
          <h1>Escáner IA <span className="escaner-badge">Compartido</span></h1>
          <p>Revisa las fotos tomadas por el caficultor o escanea una nueva planta</p>
        </div>
      </div>

      <div className="escaner-tabs">
        <button className={`escaner-tab${tab === 'fotos' ? ' active' : ''}`} onClick={() => setTab('fotos')}>
          Fotos del caficultor
        </button>
        <button className={`escaner-tab${tab === 'escanear' ? ' active' : ''}`} onClick={() => setTab('escanear')}>
          Escanear nueva planta
        </button>
      </div>

      <div className="escaner-tab-content">
        {tab === 'fotos' ? <FotosCaficultor /> : <EscanearPlanta />}
      </div>
    </div>
  )
}
