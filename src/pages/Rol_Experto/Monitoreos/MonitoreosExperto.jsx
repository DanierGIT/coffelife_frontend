import { useEffect, useState } from 'react'
import { BiCalendar, BiImage, BiShow, BiX, BiArrowBack, BiMessageDetail, BiCheck, BiAlarm } from 'react-icons/bi'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import NuevoMonitoreoModal from './NuevoMonitoreoModal'
import './MonitoreosExperto.css'
import Loading from '../../../components/Loading'
import '../../../components/cargando.css'

const fmt = (d) => {
  if (!d) return '—'
  const dt = new Date(d + (d.includes('T') ? '' : 'T12:00:00'))
  return isNaN(dt) ? '—' : dt.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

const fmtDatetime = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt) ? '—' : dt.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function DetalleMonitoreoModal({ monitoreo, onBack }) {
  const fotos = Array.isArray(monitoreo.imagenes) ? monitoreo.imagenes : []
  const [recs, setRecs] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(true)

  useEffect(() => {
    const id = monitoreo.idMonitoreo ?? monitoreo.id_monitoreo
    if (!id) { setLoadingRecs(false); return }
    setLoadingRecs(true)
    api.get('/recomendaciones')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
        setRecs(data.filter((r) => Number(r.idMonitoreo) === Number(id)))
      })
      .catch(() => setRecs([]))
      .finally(() => setLoadingRecs(false))
  }, [monitoreo])

  return (
    <div className="mon-detalle-overlay" onClick={onBack}>
      <div className="mon-detalle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mon-detalle-header">
          <h3>Detalle del monitoreo</h3>
          <button className="mon-detalle-close" onClick={onBack}><BiX size={20} /></button>
        </div>
        <div className="mon-detalle-body">
          <div className="mon-detalle-row">
            <span className="mon-detalle-label">Fecha</span>
            <span className="mon-detalle-value">{fmt(monitoreo.fechaMonitoreo ?? monitoreo.fecha_monitoreo)}</span>
          </div>
          <div className="mon-detalle-row">
            <span className="mon-detalle-label">Experto</span>
            <span className="mon-detalle-value">
              {monitoreo.usuario ? `${monitoreo.usuario.nombre || ''} ${monitoreo.usuario.apellido || ''}`.trim() : '—'}
            </span>
          </div>
          <div className="mon-detalle-row">
            <span className="mon-detalle-label">Observaciones</span>
            <span className="mon-detalle-value">{monitoreo.observaciones || '—'}</span>
          </div>
          <div className="mon-detalle-row">
            <span className="mon-detalle-label">Registrado</span>
            <span className="mon-detalle-value">{fmtDatetime(monitoreo.fechaRegistro ?? monitoreo.fecha_registro)}</span>
          </div>
          {fotos.length > 0 && (
            <div className="mon-detalle-fotos">
              <span className="mon-detalle-label">Fotos ({fotos.length})</span>
              <div className="mon-detalle-fotos-grid">
                {fotos.map((f, i) => (
                  <img key={i} src={f.rutaImagen || f.url || f.fotoUrl || f} alt={`Foto ${i+1}`} className="mon-detalle-foto" />
                ))}
              </div>
            </div>
          )}

          {/* Recomendaciones y tratamientos */}
          <div className="mon-detalle-section">
            <span className="mon-detalle-label">
              <BiMessageDetail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Recomendaciones y tratamientos
            </span>
            {loadingRecs ? (
              <Loading type="inline" text="Cargando..." />
            ) : recs.length === 0 ? (
              <p className="mon-detalle-empty">No hay recomendaciones asociadas a este monitoreo.</p>
            ) : (
              <div className="mon-detalle-recs-list">
                {recs.map((r) => {
                  const trats = Array.isArray(r.tratamientos) ? r.tratamientos : []
                  return (
                    <div key={r.idRecomendacion ?? r.id_recomendacion} className="mon-detalle-rec-card">
                      <div className="mon-detalle-rec-header">
                        <BiCheck size={14} />
                        <span>{r.tipo?.nombreTipo || 'Recomendación'}</span>
                        {r.prioridad?.nombre && (
                          <span className="mon-detalle-rec-prio">{r.prioridad.nombre}</span>
                        )}
                      </div>
                      <p className="mon-detalle-rec-desc">{r.descripcion || 'Sin descripción'}</p>
                      {r.fechaLimite && (
                        <div className="mon-detalle-rec-meta">
                          <BiAlarm size={12} />
                          <span>Fecha de la recomendación: {fmt(r.fechaLimite)}</span>
                        </div>
                      )}
                      {trats.length > 0 && (
                        <div className="mon-detalle-trats">
                          <span className="mon-detalle-trat-label">Tratamientos aplicados:</span>
                          {trats.map((t, i) => {
                            const apl = t.aplicacion || t
                            const tratNombre = apl?.tratamiento?.nombre || apl?.nombre || 'Tratamiento'
                            const obs = apl?.observacion || ''
                            const fechaApl = apl?.fecha_aplicacion || apl?.fechaAplicacion || ''
                            return (
                              <div key={i} className="mon-detalle-trat-item">
                                <span className="mon-detalle-trat-nombre">{tratNombre}</span>
                                {fechaApl && <span className="mon-detalle-trat-fecha">{fmt(fechaApl)}</span>}
                                {obs && <span className="mon-detalle-trat-obs">{obs}</span>}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="mon-detalle-actions">
          <button className="mon-detalle-btn" onClick={onBack}>
            <BiArrowBack size={14} style={{ marginRight: 6 }} />
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MonitoreosExperto({ cultivo, finca }) {
  const { user } = useAuth()
  const expertoId = user?.idUsuario ?? user?.id ?? null
  const userId    = user?.idUsuario ?? user?.id ?? null

  const [monitoreos, setMonitoreos] = useState([])
  const [loading,    setLoading]    = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [detalle,    setDetalle]    = useState(null)

  const fetchMonitoreos = async () => {
    if (!cultivo?.idCultivo) return
    setLoading(true)
    try {
      const res  = await api.get('/monitoreos', { params: { id_cultivo: cultivo.idCultivo } })
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setMonitoreos(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMonitoreos() }, [cultivo])

  return (
    <div className="monitoreo-list-page">
      <div className="list-topbar">
        <div>
          <h2>Monitoreos registrados</h2>
          <p>Gestiona y revisa todos los monitoreos del cultivo.</p>
        </div>
        <button className="btn-save" onClick={() => setShowModal(true)}>
          + Nuevo monitoreo
        </button>
      </div>

      {loading ? (
        <Loading type="content" text="Cargando monitoreos..." />
      ) : monitoreos.length === 0 ? (
        <div className="empty-state">No hay monitoreos registrados.</div>
      ) : (
        <div className="monitor-grid-sm">
          {monitoreos.map((m, idx) => {
            const mid = m.idMonitoreo ?? m.id_monitoreo ?? `mon-${idx}`
            const fotos = Array.isArray(m.imagenes) ? m.imagenes : []
            return (
              <div key={mid} className="monitor-card-sm">
                <div className="monitor-card-sm-top">
                  <div className="monitor-card-sm-date">
                    <BiCalendar size={14} />
                    {fmt(m.fechaMonitoreo ?? m.fecha_monitoreo)}
                  </div>
                  <button className="monitor-card-sm-eye" onClick={() => setDetalle(m)} title="Ver detalle">
                    <BiShow size={18} />
                  </button>
                </div>
                <p className="monitor-card-sm-obs">
                  {m.observaciones
                    ? (m.observaciones.length > 80 ? m.observaciones.slice(0, 80) + '...' : m.observaciones)
                    : 'Sin observaciones'
                  }
                </p>
                <div className="monitor-card-sm-footer">
                  <BiImage size={14} />
                  {fotos.length} foto{fotos.length !== 1 ? 's' : ''}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <NuevoMonitoreoModal
          cultivo={cultivo}
          finca={finca}
          expertoId={expertoId}
          userId={userId}
          onGuardado={() => {
            setShowModal(false)
            fetchMonitoreos()
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {detalle && (
        <DetalleMonitoreoModal
          monitoreo={detalle}
          onBack={() => setDetalle(null)}
        />
      )}
    </div>
  )
}
