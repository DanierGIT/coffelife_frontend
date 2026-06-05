import { useState, useEffect } from 'react'
import api from '../../../services/api'
import { BiTargetLock, BiMapPin } from 'react-icons/bi'
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
                    <BiTargetLock size={14} />
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
                    <BiMapPin size={20} />
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
                    <BiMapPin size={16} />
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
