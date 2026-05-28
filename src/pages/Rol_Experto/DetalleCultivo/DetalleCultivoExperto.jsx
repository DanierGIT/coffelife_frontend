import { useState, useEffect } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './DetalleCultivoExperto.css'

const TABS = ['Resumen', 'Monitoreo', 'Recomendaciones', 'Tratamientos', 'Fotos', 'Historial']

export default function DetalleCultivoExperto({ cultivo, onNavigate, finca }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Resumen')
  const [monitoreos, setMonitoreos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showMonitoreoModal, setShowMonitoreoModal] = useState(false)
  const [editandoMonitoreo, setEditandoMonitoreo] = useState(null)
  const [monForm, setMonForm] = useState({ fecha_monitoreo: '', observaciones: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!cultivo?.idCultivo) return
    const fetchMonitoreos = async () => {
      setLoading(true)
      try {
        const res = await api.get('/monitoreos', { params: { id_cultivo: cultivo.idCultivo } })
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
        setMonitoreos(data)
      } catch {
        console.error('Error al cargar monitoreos')
      } finally {
        setLoading(false)
      }
    }
    fetchMonitoreos()
  }, [cultivo])

  const handleCreateMonitoreo = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        id_cultivo: cultivo.idCultivo,
        id_experto: user?.id,
        fecha_monitoreo: monForm.fecha_monitoreo,
        observaciones: monForm.observaciones.trim() || undefined,
      }
      if (editandoMonitoreo) {
        await api.put(`/monitoreos/${editandoMonitoreo.idMonitoreo}`, payload)
      } else {
        await api.post('/monitoreos', payload)
      }
      const res = await api.get('/monitoreos', { params: { id_cultivo: cultivo.idCultivo } })
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setMonitoreos(data)
      setMonForm({ fecha_monitoreo: '', observaciones: '' })
      setEditandoMonitoreo(null)
      setShowMonitoreoModal(false)
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al guardar monitoreo')
    } finally {
      setSaving(false)
    }
  }

  const handleEditMonitoreo = (m) => {
    setEditandoMonitoreo(m)
    setMonForm({
      fecha_monitoreo: (m.fechaMonitoreo || '').slice(0, 10),
      observaciones: m.observaciones || '',
    })
    setShowMonitoreoModal(true)
  }

  const handleCancelEditMonitoreo = () => {
    setEditandoMonitoreo(null)
    setMonForm({ fecha_monitoreo: '', observaciones: '' })
  }

  const timeline = [...monitoreos].reverse()

  const tabContent = () => {
    switch (activeTab) {
      case 'Resumen':
        return (
          <div className="detalle-tab-content">
            {loading ? (
              <p className="detalle-empty">Cargando monitoreos...</p>
            ) : timeline.length === 0 ? (
              <p className="detalle-empty">No hay monitoreos registrados para este cultivo.</p>
            ) : (
              <div className="timeline">
                {timeline.map((m, idx) => {
                  const fotos = m.imagenes?.length || 0
                  const recomendaciones = m.recomendaciones || []
                  const analisis = m.imagenes?.flatMap((img) => img.analisis || []) || []
                  const estadoAnalisis = analisis.find((a) => a.estadoAnalisis)?.estadoAnalisis?.nombreEstado || null
                  return (
                    <div key={m.idMonitoreo} className="timeline-item">
                      <div className="timeline-marker">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="6"/>
                        </svg>
                        <div className="timeline-line" />
                      </div>
                      <div className="timeline-card">
                        <div className="timeline-card-top">
                          <span className="timeline-date">
                            {m.fechaMonitoreo
                              ? new Date(m.fechaMonitoreo + 'T00:00:00').toLocaleDateString('es-ES', {
                                  year: 'numeric', month: 'long', day: 'numeric'
                                })
                              : '—'}
                          </span>
                          <span className={`timeline-estado ${estadoAnalisis === 'Completado' ? 'estado-completado' : 'estado-revision'}`}>
                            {estadoAnalisis || 'Sin análisis'}
                          </span>
                        </div>
                        <div className="timeline-card-body">
                          <div className="timeline-stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                            <span>{fotos} foto{fotos !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="timeline-stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            <span>{recomendaciones.length} recomendacione{recomendaciones.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="timeline-stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                            </svg>
                            <span>{recomendaciones.reduce((acc, r) => acc + (r.tratamientos?.length || 0), 0)} tratamiento{recomendaciones.reduce((acc, r) => acc + (r.tratamientos?.length || 0), 0) !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        {m.observaciones && (
                          <div className="timeline-obs">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            {m.observaciones}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      case 'Monitoreo':
        return (
          <div className="detalle-tab-content">
            <div className="monitoreo-header">
              <h3>Monitoreos registrados</h3>
              <button className="cult-btn-agregar" onClick={() => setShowMonitoreoModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nuevo monitoreo
              </button>
            </div>
            {monitoreos.length === 0 ? (
              <p className="detalle-empty">No hay monitoreos registrados.</p>
            ) : (
              <div className="monitoreo-list">
                {monitoreos.map((m) => (
                  <div key={m.idMonitoreo} className="monitoreo-item">
                    <div className="monitoreo-item-date">
                      {m.fechaMonitoreo
                        ? new Date(m.fechaMonitoreo + 'T00:00:00').toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })
                        : '—'}
                    </div>
                    <div className="monitoreo-item-obs">{m.observaciones || 'Sin observaciones'}</div>
                    <div className="monitoreo-item-fotos">{m.imagenes?.length || 0} foto{(m.imagenes?.length || 0) !== 1 ? 's' : ''}</div>
                    <button className="monitoreo-item-edit" title="Editar monitoreo" onClick={() => handleEditMonitoreo(m)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      case 'Recomendaciones':
        return <div className="detalle-tab-content"><p className="detalle-empty">Secci&oacute;n de recomendaciones</p></div>
      case 'Tratamientos':
        return <div className="detalle-tab-content"><p className="detalle-empty">Secci&oacute;n de tratamientos</p></div>
      case 'Fotos':
        return <div className="detalle-tab-content"><p className="detalle-empty">Secci&oacute;n de fotos</p></div>
      case 'Historial':
        return <div className="detalle-tab-content"><p className="detalle-empty">Secci&oacute;n de historial</p></div>
      default:
        return null
    }
  }

  return (
    <div className="detalle-page">
      <div className="detalle-header">
        <button className="back-btn" onClick={() => onNavigate('cultivos', finca)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver a cultivos
        </button>
        <span className="detalle-breadcrumb">
          {finca?.nombre || 'Finca'} / {cultivo?.nombreCultivo || cultivo?.nombre_cultivo || 'Cultivo'}
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
              <span className="detalle-card-value">{cultivo?.nombreCultivo || cultivo?.nombre_cultivo || '—'}</span>
            </div>
            <div className="detalle-card-item">
              <span className="detalle-card-label">Tipo de cultivo</span>
              <span className="detalle-card-value">{cultivo?.tipoCultivo || cultivo?.tipo_cultivo || '—'}</span>
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
          {cultivo?.createdAt && (
            <div className="detalle-card-row">
              <div className="detalle-card-item">
                <span className="detalle-card-label">Fecha de registro</span>
                <span className="detalle-card-value">
                  {new Date(cultivo.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              </div>
              <div className="detalle-card-item" />
            </div>
          )}
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

      {showMonitoreoModal && (
        <div className="modal-overlay" onClick={() => { setShowMonitoreoModal(false); handleCancelEditMonitoreo() }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editandoMonitoreo ? 'Editar monitoreo' : 'Nuevo monitoreo'}</h2>
            <form className="finca-form" onSubmit={handleCreateMonitoreo}>
              <div className="finca-form-row">
                <input
                  type="date"
                  name="fecha_monitoreo"
                  value={monForm.fecha_monitoreo}
                  onChange={(e) => setMonForm({ ...monForm, fecha_monitoreo: e.target.value })}
                  required
                />
                <textarea
                  name="observaciones"
                  value={monForm.observaciones}
                  onChange={(e) => setMonForm({ ...monForm, observaciones: e.target.value })}
                  placeholder="Observaciones (opcional)"
                  rows={3}
                  className="finca-textarea"
                />
              </div>
              <div className="finca-form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editandoMonitoreo ? 'Actualizar monitoreo' : 'Registrar monitoreo'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowMonitoreoModal(false); handleCancelEditMonitoreo() }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
