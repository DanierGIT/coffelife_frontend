import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './DetalleCultivoExperto.css'
import '../Cultivos/CultivosExperto.css'
import Loading from '../../../components/Loading'
import '../../../components/cargando.css'
import MonitoreosExperto from '../Monitoreos/MonitoreosExperto'
import { BiTime, BiCalendarCheck, BiEdit, BiImage, BiMessageDetail, BiDroplet, BiPackage, BiClipboard, BiSolidFlask } from 'react-icons/bi'

const TABS = ['Resumen', 'Monitoreo']

const extraerRoya = (obs = '') => {
  let idx = -1, pos = -1, s = 0
  while ((pos = obs.indexOf('[ROYA:', s)) !== -1) { idx = pos; s = pos + 1 }
  if (idx === -1) {
    const fallback = obs.match(/Nivel de roya:\s*([^\n]+)/gi)
    if (fallback) {
      const ult = fallback[fallback.length - 1]
      const nivel = ult.replace(/Nivel de roya:\s*/i, '').trim()
      return { nivel, limpio: obs }
    }
    return { nivel: null, limpio: obs }
  }
  const endIdx = obs.indexOf(']', idx + 6)
  const nivel = endIdx > idx ? obs.slice(idx + 6, endIdx) : null
  const limpio = obs.slice(0, idx) + obs.slice(endIdx + 1)
  return { nivel, limpio: limpio.replace(/\n{3,}/g, '\n\n').trim() }
}

const limpiarHistorial = (texto) => {
  if (!texto) return ''
  const idxHistorial = texto.indexOf('HISTORIAL DE CAMBIOS')
  if (idxHistorial === -1) {
    const partes = texto.split('---')
    return partes[partes.length - 1].trim()
  }
  const antes = texto.slice(0, idxHistorial).trim()
  const despues = texto.slice(idxHistorial)
  const ultSeg = despues.split('---')
  const ultObs = ultSeg[ultSeg.length - 1].trim()
  if (antes && !antes.includes('═')) return antes
  return ultObs || antes
}

const parsearObservacionAplicacion = (obsCruda = '') => {
  const match = obsCruda.match(/^\[([^|]*)(?:\|([^|]*))?(?:\|([^|]*))?(?:\|([^|]*))?\]\s*/)
  if (!match) return { insumo: null, dosis: '', frecuencia: '', duracion: '', texto: obsCruda }
  return {
    insumo: match[1] || null,
    dosis: match[2] || '',
    frecuencia: match[3] || '',
    duracion: match[4] || '',
    texto: obsCruda.slice(match[0].length).trim(),
  }
}

const colorRoya = (nivel) => {
  if (!nivel) return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
  const n = nivel.toLowerCase()
  if (n.includes('critico')) return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' }
  if (n.includes('alto')) return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }
  if (n.includes('medio')) return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' }
  if (n.includes('bajo')) return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' }
  return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
}

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
  const [showMonitoreoModal, setShowMonitoreoModal] = useState(false)
  const [ultimaRecomendacion, setUltimaRecomendacion] = useState(null)
  const [ultimoTratamiento, setUltimoTratamiento] = useState(null)


  useEffect(() => {
    if (!cultivo?.idCultivo) return
    setImgLoaded(false)
    setLoading(true)
    const loadSummary = async () => {
      try {
        const mRes = await api.get('/monitoreos', { params: { id_cultivo: cultivo.idCultivo } })
        const raw = Array.isArray(mRes.data) ? mRes.data : (mRes.data?.data ?? [])
        const monitoreos = raw.filter((m) => Number(m.idCultivo ?? m.id_cultivo) === Number(cultivo.idCultivo))
        setTotalMons(monitoreos.length)
        let fotos = 0
        monitoreos.forEach((m) => { fotos += (m.imagenes?.length || 0) })
        setTotalFotos(fotos)
        const sorted = [...monitoreos].sort((a, b) => new Date(b.fechaMonitoreo) - new Date(a.fechaMonitoreo))
        setUltimo(sorted[0] || null)
        const idsMonitoreo = new Set(monitoreos.map((m) => Number(m.idMonitoreo)))

        const [recRes, aplRes] = await Promise.all([
          api.get('/recomendaciones'),
          api.get('/aplicaciones_tratamientos', { params: { perPage: 1000 } }),
        ])
        const todasRecs = Array.isArray(recRes.data) ? recRes.data : (recRes.data?.data ?? [])
        const todasApls = Array.isArray(aplRes.data) ? aplRes.data : (aplRes.data?.data ?? [])

        const recsCultivo = todasRecs.filter((r) => idsMonitoreo.has(Number(r.idMonitoreo || r.id_monitoreo)))
        recsCultivo.sort((a, b) => new Date(b.fechaRegistro || b.fecha_reistro) - new Date(a.fechaRegistro || a.fecha_reistro))
        const ultRec = recsCultivo[0] || null
        setUltimaRecomendacion(ultRec)

        if (ultRec) {
          const idTrat = Number(ultRec.idTratamiento || ultRec.id_tratamiento)
          if (idTrat) {
            const aplsDeRec = todasApls.filter((a) => Number(a.idTratamiento || a.id_tratamiento) === idTrat)
            aplsDeRec.sort((a, b) => new Date(b.fechaRegistro || b.fecha_reistro) - new Date(a.fechaRegistro || a.fecha_reistro))
            setUltimoTratamiento(aplsDeRec[0] || null)
          } else {
            setUltimoTratamiento(null)
          }
        } else {
          setUltimoTratamiento(null)
        }
      } catch {
        setUltimo(null)
        setUltimaRecomendacion(null)
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [cultivo])

  const tabContent = () => {
    switch (activeTab) {
      case 'Resumen':
        return (
          <div className="detalle-tab-content">
            {loading ? (
              <Loading type="content" text="Cargando resumen..." />
            ) : (
              <div className="detalle-resumen-grid">
                {/* ── Tarjeta 1: Último monitoreo ── */}
                <div className="resumen-card resumen-card--monitoreo">
                  <div className="resumen-card-icon">
                    <BiClipboard size={22} />
                  </div>
                  <h4 className="resumen-card-title">Último monitoreo</h4>
                  {ultimo ? (
                    (() => {
                      const { nivel, limpio } = extraerRoya(ultimo.observaciones || '')
                      const royaColor = colorRoya(nivel)
                      return (
                    <>
                      <p className="resumen-card-text">{limpiarHistorial(limpio) || 'Sin observaciones registradas.'}</p>
                      {nivel && (
                        <span className="resumen-roya-badge" style={{
                          background: royaColor.bg,
                          color: royaColor.text,
                          border: `1px solid ${royaColor.border}`,
                        }}>
                          <BiDroplet size={12} />
                          Roya: {nivel}
                        </span>
                      )}
                      <div className="resumen-card-rows">
                        <div className="resumen-card-row">
                          <BiCalendarCheck size={14} />
                          <span>{fmtFecha(ultimo.fechaMonitoreo)}</span>
                        </div>
                        {ultimo.fechaActualizacion && ultimo.fechaActualizacion !== ultimo.fechaRegistro && (
                          <div className="resumen-card-row resumen-card-row--edit">
                            <BiEdit size={14} />
                            <span>Editado {fmtFecha(ultimo.fechaActualizacion)}</span>
                          </div>
                        )}
                        <div className="resumen-card-row">
                          <BiImage size={14} />
                          <span>{ultimo.imagenes?.length || 0} foto{(ultimo.imagenes?.length || 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </>
                      )
                    })()
                  ) : (
                    <p className="resumen-card-empty">Sin monitoreos registrados.</p>
                  )}
                </div>

                {/* ── Tarjeta 2: Última recomendación ── */}
                <div className="resumen-card resumen-card--recomendacion">
                  <div className="resumen-card-icon">
                    <BiMessageDetail size={22} />
                  </div>
                  <h4 className="resumen-card-title">Última recomendación</h4>
                  {ultimaRecomendacion ? (
                    <>
                      <p className="resumen-card-text">
                        {ultimaRecomendacion.recomendacion || ultimaRecomendacion.descripcion || 'Sin descripción.'}
                      </p>
                      <div className="resumen-card-rows">
                        <div className="resumen-card-row">
                          <BiCalendarCheck size={14} />
                          <span>{fmtFecha(ultimaRecomendacion.fechaRegistro || ultimaRecomendacion.fecha_reistro)}</span>
                        </div>
                        <div className="resumen-card-row">
                          <BiDroplet size={14} />
                          <span className="resumen-card-badge">
                            {ultimaRecomendacion.tipoRecomendacion?.nombre || ultimaRecomendacion.tipo_recomendacion?.nombre || 'General'}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="resumen-card-empty">Sin recomendaciones registradas.</p>
                  )}
                </div>

                {/* ── Tarjeta 3: Último tratamiento ── */}
                <div className="resumen-card resumen-card--tratamiento">
                  <div className="resumen-card-icon">
                    <BiPackage size={22} />
                  </div>
                  <h4 className="resumen-card-title">Último tratamiento</h4>
                  {ultimoTratamiento ? (
                    <>
                      <p className="resumen-card-text resumen-card-text--strong">
                        {ultimoTratamiento.tratamiento?.nombre || ultimoTratamiento.nombreTratamiento || 'Tratamiento aplicado'}
                      </p>
                      {(() => {
                        const parsed = parsearObservacionAplicacion(ultimoTratamiento.observacion || '')
                        const prodNombre = ultimoTratamiento.insumo?.nombre || ultimoTratamiento.nombreInsumo || ultimoTratamiento.nombre_insumo || parsed.insumo
                        const dosis = ultimoTratamiento.dosis || parsed.dosis
                        if (prodNombre) {
                          return (
                            <div className="resumen-card-productos">
                              <div className="resumen-card-prod">
                                <BiSolidFlask size={12} />
                                <span>{prodNombre}</span>
                                {dosis && <span className="resumen-card-dosis">{dosis}</span>}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}
                      <div className="resumen-card-rows">
                        <div className="resumen-card-row">
                          <BiCalendarCheck size={14} />
                          <span>{fmtFecha(ultimoTratamiento.fechaRegistro || ultimoTratamiento.fecha_reistro)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="resumen-card-empty">Sin tratamientos registrados.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )

      case 'Monitoreo':
        return (
          <MonitoreosExperto
            cultivo={cultivo}
            finca={finca}
            showNuevoModal={showMonitoreoModal}
            onCloseNuevoModal={() => setShowMonitoreoModal(false)}
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
            {cultivo?.fotoUrl ? (
              <>
                {!imgLoaded && (
                  <div className="finca-detail-img-loader">
                    <Loading type="inline" />
                  </div>
                )}
                <img
                  src={cultivo.fotoUrl}
                  alt="Cultivo"
                  onLoad={() => setImgLoaded(true)}
                  style={{ display: imgLoaded ? 'block' : 'none' }}
                />
              </>
            ) : (
              <div className="card-no-foto" style={{ borderRadius: '18px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Sin foto</span>
              </div>
            )}
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

      <div className="detalle-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            className={`detalle-tab ${activeTab === t ? 'detalle-tab--active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
        {activeTab === 'Monitoreo' && (
          <button
            onClick={() => setShowMonitoreoModal(true)}
            style={{
              marginLeft: 'auto',
              height: 36,
              border: 'none',
              borderRadius: 10,
              background: '#1b5e20',
              color: 'white',
              fontWeight: 700,
              padding: '0 20px',
              cursor: 'pointer',
              fontSize: 13,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,.15)',
            }}
          >
            + Nuevo monitoreo
          </button>
        )}
      </div>

      {tabContent()}
    </div>
  )
}