import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './MapaRiesgo.css'

const NIVEL_CLASS = (n = '') => {
  const l = n.toLowerCase()
  if (l.includes('alto')) return 'high'
  if (l.includes('medio')) return 'mid'
  return 'low'
}

export default function MapaRiesgo() {
  const [fincas,   setFincas]   = useState([])
  const [analisis, setAnalisis] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    Promise.allSettled([
      api.get('/fincas'),
      api.get('/analisis_ia'),
    ]).then(([fRes, aRes]) => {
      const f = fRes.status === 'fulfilled'
        ? (Array.isArray(fRes.value.data) ? fRes.value.data : fRes.value.data?.data ?? [])
        : []
      const a = aRes.status === 'fulfilled'
        ? (Array.isArray(aRes.value.data) ? aRes.value.data : aRes.value.data?.data ?? [])
        : []
      setFincas(f)
      setAnalisis(a)
      if (f.length > 0) setSelected(f[0])
    }).finally(() => setLoading(false))
  }, [])

  // Enriquecer fincas con nivel de riesgo del analisis
  const fincasConRiesgo = fincas.map(f => {
    const anal = analisis.filter(a => a.idFinca === f.idFinca)
    const ultimo = anal[anal.length - 1]
    const nivel = ultimo?.nivelRoya?.nombre || ultimo?.nivel_roya || 'Bajo'
    return { ...f, nivel, nivelClass: NIVEL_CLASS(nivel), areaHa: f.areaHectareas }
  })

  const alto  = fincasConRiesgo.filter(f => f.nivelClass === 'high').length
  const medio = fincasConRiesgo.filter(f => f.nivelClass === 'mid').length
  const bajo  = fincasConRiesgo.filter(f => f.nivelClass === 'low').length

  return (
    <div className="mapa-page">
      <div className="mapa-header">
        <div>
          <h1>Mapa de riesgo</h1>
          <p>Ubicación de fincas y nivel de riesgo por parcela</p>
        </div>
      </div>

      <div className="mapa-content">
        {/* Mapa simulado */}
        <div className="mapa-container">
          {loading ? (
            <div className="mapa-loading">Cargando mapa…</div>
          ) : (
            <div className="mapa-visual">
              {/* Representación visual con puntos de calor */}
              <div className="mapa-bg">
                <div className="mapa-terrain" />
                {/* Controles del mapa */}
                <div className="mapa-controls">
                  <button className="mapa-ctrl">+</button>
                  <button className="mapa-ctrl">−</button>
                  <button className="mapa-ctrl" title="Ubicación">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                {/* Pins de fincas */}
                {fincasConRiesgo.map((f, i) => (
                  <div
                    key={f.idFinca}
                    className={`mapa-pin ${f.nivelClass}`}
                    style={{
                      left: `${20 + (i % 4) * 20}%`,
                      top:  `${20 + Math.floor(i / 4) * 30}%`,
                    }}
                    onClick={() => setSelected(f)}
                    title={f.nombreFinca}
                  >
                    <svg width="20" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  </div>
                ))}
                {/* Leyenda del mapa */}
                <div className="mapa-legend">
                  <span className="mapa-legend-item low">● Bajo riesgo</span>
                  <span className="mapa-legend-item mid">● Medio riesgo</span>
                  <span className="mapa-legend-item high">● Alto riesgo</span>
                </div>
              </div>
              <p className="mapa-data-note">Datos utilizados: fincas (latitud, longitud), monitoreos, analisis_ia, cat_niveles_roya</p>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="mapa-sidebar">
          <h3>Fincas en el mapa</h3>
          <div className="mapa-fincas-list">
            {loading ? (
              <p className="mapa-empty">Cargando…</p>
            ) : fincasConRiesgo.length === 0 ? (
              <p className="mapa-empty">No hay fincas registradas.</p>
            ) : (
              fincasConRiesgo.map(f => (
                <div
                  key={f.idFinca}
                  className={`mapa-finca-item${selected?.idFinca === f.idFinca ? ' active' : ''}`}
                  onClick={() => setSelected(f)}
                >
                  <div className="mapa-finca-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a9 9 0 0 1 9 9c0 5-9 13-9 13S3 16 3 11a9 9 0 0 1 9-9z"/>
                      <circle cx="12" cy="11" r="3"/>
                    </svg>
                  </div>
                  <div className="mapa-finca-info">
                    <p>{f.nombreFinca || `Finca #${f.idFinca}`}</p>
                    <span>{f.municipio && f.departamento ? `${f.municipio}, ${f.departamento}` : '—'}</span>
                    {f.areaHa && <span>{f.areaHa} ha</span>}
                  </div>
                  <span className={`mapa-nivel-badge ${f.nivelClass}`}>{f.nivel}</span>
                </div>
              ))
            )}
          </div>

          {/* Resumen */}
          {!loading && (
            <div className="mapa-resumen">
              <div className={`mapa-res-item high`}><span>Alto riesgo</span><strong>{alto}</strong></div>
              <div className={`mapa-res-item mid`}><span>Medio riesgo</span><strong>{medio}</strong></div>
              <div className={`mapa-res-item low`}><span>Bajo riesgo</span><strong>{bajo}</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
