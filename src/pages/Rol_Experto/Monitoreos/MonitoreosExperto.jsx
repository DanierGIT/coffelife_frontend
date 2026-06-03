import { useEffect, useState } from 'react'
import { Camera, Leaf, Calendar, Image } from 'lucide-react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import NuevoMonitoreoModal from './NuevoMonitoreoModal'
import './MonitoreosExperto.css'

export default function MonitoreosExperto({ cultivo, finca }) {
  const { user } = useAuth()
  const expertoId = user?.idUsuario ?? user?.id ?? null

  const [monitoreos,      setMonitoreos]      = useState([])
  const [loading,         setLoading]         = useState(false)
  const [showModal,       setShowModal]       = useState(false)

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

  useEffect(() => {
    fetchMonitoreos()
  }, [cultivo])

  return (
    <div className="monitoreo-list-page">

      {/* ── Topbar ── */}
      <div className="list-topbar">
        <div>
          <h2>Monitoreos registrados</h2>
          <p>Gestiona y revisa todos los monitoreos del cultivo.</p>
        </div>
        <button className="btn-save" onClick={() => setShowModal(true)}>
          + Nuevo monitoreo
        </button>
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div className="empty-state">Cargando monitoreos...</div>
      ) : monitoreos.length === 0 ? (
        <div className="empty-state">No hay monitoreos registrados.</div>
      ) : (
        <div className="monitor-grid">
          {monitoreos.map((m) => (
            <div key={m.idMonitoreo} className="monitor-card">
              <div className="monitor-date">
                <Calendar size={16} />
                {m.fechaMonitoreo}
              </div>
              <div className="monitor-body">
                <p>{m.observaciones || 'Sin observaciones'}</p>
                <div className="monitor-footer">
                  <Image size={15} />
                  {m.imagenes?.length || 0} fotos
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal stepper ── */}
      {showModal && (
        <NuevoMonitoreoModal
          cultivo={cultivo}
          finca={finca}
          expertoId={expertoId}
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