import { useEffect, useState } from 'react'
import { BiCalendar, BiImage } from 'react-icons/bi'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import NuevoMonitoreoModal from './NuevoMonitoreoModal'
import './MonitoreosExperto.css'
import '../../../components/cargando.css'

export default function MonitoreosExperto({ cultivo, finca }) {
  const { user } = useAuth()
  const expertoId = user?.idUsuario ?? user?.id ?? null
  const userId    = user?.idUsuario ?? user?.id ?? null

  const [monitoreos, setMonitoreos] = useState([])
  const [loading,    setLoading]    = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [expandedId, setExpandedId] = useState(null)

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
        <div className="empty-state"><div className="loader" /><p>Cargando monitoreos...</p></div>
      ) : monitoreos.length === 0 ? (
        <div className="empty-state">No hay monitoreos registrados.</div>
      ) : (
        <div className="monitor-grid">
          {monitoreos.map((m, idx) => {
            const mid = m.idMonitoreo ?? m.id_monitoreo ?? `mon-${idx}`
            const isOpen = expandedId === mid
            const fotos = Array.isArray(m.imagenes) ? m.imagenes : []
            return (
              <div
                key={mid}
                className={`monitor-card ${isOpen ? 'monitor-card--open' : ''}`}
              >
                <div className="monitor-header-clickable" onClick={() => setExpandedId(isOpen ? null : mid)}>
                  <div className="monitor-date">
                    <BiCalendar size={16} />
                    {m.fechaMonitoreo}
                  </div>
                  <svg className="monitor-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                <div className="monitor-body">
                  <p>{m.observaciones || 'Sin observaciones'}</p>
                  <div className="monitor-footer">
                    <BiImage size={15} />
                    {fotos.length} foto{fotos.length !== 1 ? 's' : ''}
                  </div>
                </div>
                {isOpen && (
                  <div className="monitor-detail">
                    {m.observaciones ? (
                      <div className="monitor-detail-section">
                        <span className="monitor-detail-label">Observaciones</span>
                        <p className="monitor-detail-text">{m.observaciones}</p>
                      </div>
                    ) : null}
                    {fotos.length > 0 && (
                      <div className="monitor-detail-section">
                        <span className="monitor-detail-label">Fotos ({fotos.length})</span>
                        <div className="monitor-detail-fotos">
                          {fotos.map((f, i) => (
                            <img key={i} src={f.rutaImagen || f.url || f.fotoUrl || f} alt={`Foto ${i+1}`} className="monitor-detail-foto" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
    </div>
  )
}