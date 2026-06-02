import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './CultivosExperto.css'

export default function CultivosExperto({ finca, onNavigate }) {
  const [cultivos, setCultivos] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [estados, setEstados] = useState([])
  const [form, setForm] = useState({
    nombre_cultivo: '',
    tipo_cultivo: '',
    id_estado_cultivo: '',
  })

  useEffect(() => {
    if (!finca?.idFinca) return
    const fetchData = async () => {
      try {
        const [cultivosRes, estadosRes, monitoreosRes] = await Promise.all([
          api.get('/cultivos'),
          api.get('/cat_estados_cultivo'),
          api.get('/monitoreos'),
        ])

        const todos = Array.isArray(cultivosRes.data) ? cultivosRes.data : (cultivosRes.data?.data ?? [])
        const filtrados = todos.filter((c) => Number(c.idFinca) === Number(finca.idFinca))
        setCultivos(filtrados)

        const est = Array.isArray(estadosRes.data) ? estadosRes.data : (estadosRes.data?.data ?? [])
        setEstados(est)

        const monitoreos = Array.isArray(monitoreosRes.data) ? monitoreosRes.data : (monitoreosRes.data?.data ?? [])
        const statsMap = {}
        filtrados.forEach((c) => {
          const deCultivo = monitoreos.filter((m) => Number(m.idCultivo) === Number(c.idCultivo))
          let totalImagenes = 0
          deCultivo.forEach((m) => {
            totalImagenes += (m.imagenes?.length || 0)
          })
          statsMap[c.idCultivo] = {
            monitoreos: deCultivo.length,
            imagenes: totalImagenes,
          }
        })
        setStats(statsMap)
      } catch {
        setError('No se pudieron cargar los cultivos.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [finca])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleEditClick = (cultivo) => {
    setEditando(cultivo)
    setForm({
      nombre_cultivo: cultivo.nombreCultivo || cultivo.nombre_cultivo || '',
      tipo_cultivo: cultivo.tipoCultivo || cultivo.tipo_cultivo || '',
      id_estado_cultivo: cultivo.idEstado ? String(cultivo.idEstado) : (cultivo.id_estado_cultivo ? String(cultivo.id_estado_cultivo) : ''),
    })
    setShowModal(true)
  }

  const handleCancelEdit = () => {
    setEditando(null)
    setForm({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        id_finca: finca.idFinca,
        nombre_cultivo: form.nombre_cultivo.trim(),
        tipo_cultivo: form.tipo_cultivo.trim(),
        id_estado_cultivo: form.id_estado_cultivo ? Number(form.id_estado_cultivo) : undefined,
      }
      if (editando) {
        await api.put(`/cultivos/${editando.idCultivo}`, payload)
      } else {
        await api.post('/cultivos', payload)
      }
      const res = await api.get('/cultivos')
      const todos = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setCultivos(todos.filter((c) => Number(c.idFinca) === Number(finca.idFinca)))
      setForm({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })
      setEditando(null)
      setShowModal(false)
    } catch (err) {
      setFormError(err?.response?.data?.message || 'No se pudo registrar el cultivo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="coffeelife-container">
      {/* HEADER PRINCIPAL DE LA FINCA */}
      <div className="finca-detail-header-card">
        <div className="finca-detail-left">
          <div className="finca-detail-img-container">
            <img
              src="https://www.tomplanmytrip.com/wp-content/uploads/2021/10/Daniels-house-1.jpg"
              alt="Finca"
            />
          </div>
          <div className="finca-detail-info">
            <span className="badge-selected">Finca seleccionada</span>
            <h1 className="finca-detail-title">{finca?.nombre || 'Finca sin nombre'}</h1>
            
            <div className="finca-detail-meta">
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>{finca?.nombreCafetero || '—'}</span>
              </div>
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{finca?.municipio || '—'}, {finca?.departamento || '—'}</span>
              </div>
            </div>

            <div className="finca-tags-row">
              <span className="tag-item">Café</span>
              {finca?.altitud && <span className="tag-item">{finca.altitud} msnm</span>}
              {finca?.area && <span className="tag-item">{finca.area} ha</span>}
            </div>
          </div>
        </div>

        {/* METRICAS / KPIS SUPERIORES DERECHOS */}
        <div className="finca-detail-right">
          <button className="btn-back-coffeelife" onClick={() => onNavigate('dashboard')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Volver a mi fincas
          </button>

          <div className="kpi-cards-container">
            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-brown">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{cultivos.length}</span>
                <span className="kpi-label">Cultivos<br/>en esta finca</span>
              </div>
            </div>

            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-orange">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{Object.values(stats).reduce((a, b) => a + b.monitoreos, 0)}</span>
                <span className="kpi-label">Actividades<br/>este mes</span>
              </div>
            </div>

            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="kpi-data">
                <span className="kpi-value">Hoy</span>
                <span className="kpi-label">Última actividad<br/>09:30 a. m.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN TITULO DE CULTIVOS Y BOTÓN AGREGAR */}
      <div className="cultivos-section-bar">
        <div className="section-bar-left">
          <h2>Cultivos de la finca</h2>
          <span className="badge-count">{cultivos.length} cultivos</span>
        </div>
        <button className="btn-brand-primary" onClick={() => { handleCancelEdit(); setShowModal(true); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar cultivo
        </button>
      </div>

      {/* RENDERIZADO DE ESTADOS DE CARGA / CONTENIDO */}
      {loading ? (
        <div className="state-message-box"><p>Cargando cultivos...</p></div>
      ) : error ? (
        <div className="state-message-box error"><p>{error}</p></div>
      ) : cultivos.length === 0 ? (
        <div className="state-message-box alert"><p>Esta finca no tiene cultivos registrados.</p></div>
      ) : (
        <div className="coffeelife-cards-grid">
          {cultivos.map((c) => {
            const s = stats[c.idCultivo] || { monitoreos: 0, imagenes: 0 }
            return (
              <div key={c.idCultivo} className="coffeelife-card">
                <div className="card-image-wrapper">
                  <img
                    src="https://colombiaverde.com.co/wp-content/uploads/2023/05/cultivos-de-cafe-en-colombia-1200x800.jpg"
                    alt="Cultivo"
                  />
                  <button className="btn-floating-options" title="Editar cultivo" onClick={() => handleEditClick(c)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                    </svg>
                  </button>
                </div>

                <div className="card-content-body">
                  <div className="card-main-header">
                    <div className="card-icon-container">
                      {/* Icono de planta orgánico */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#437024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V8M12 8c-2-2.5-5-2.5-7 0 0 3 2.5 5 7 5M12 8c2-2.5 5-2.5 7 0 0 3-2.5 5-7 5"/></svg>
                    </div>
                    <div className="card-title-group">
                      <h3>{c.nombreCultivo || c.nombre_cultivo || '—'}</h3>
                      <p className="card-subtitle">Variedad: {c.tipoCultivo || c.tipo_cultivo || '—'}</p>
                      <span className="badge-status-active">
                        {c.estadoCultivo?.nombreEstado || 'Activo'}
                      </span>
                    </div>
                  </div>

                  {/* DIVISION INTERNA DE STATS */}
                  <div className="card-stats-row">
                    <div className="stat-col">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      <div className="stat-numbers">
                        <strong>{s.imagenes}</strong>
                        <span>Fotos</span>
                      </div>
                    </div>
                    <div className="stat-col">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      <div className="stat-numbers">
                        <strong>{s.monitoreos}</strong>
                        <span>Recomendaciones</span>
                      </div>
                    </div>
                    <div className="stat-col">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 22H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6"/><path d="M16 18a2.08 2.08 0 0 0-2-2 2.08 2.08 0 0 0-2 2v4h4z"/><path d="M20 14a2.08 2.08 0 0 0-2-2 2.08 2.08 0 0 0-2 2v8h4z"/></svg>
                      <div className="stat-numbers">
                        <strong>1</strong>
                        <span>Tratamientos</span>
                      </div>
                    </div>
                  </div>

                  {/* BOTÓN INFERIOR FULL-WIDTH */}
                  <button className="btn-card-action-trigger" onClick={() => onNavigate('detalle_cultivo', c)}>
                    Ver detalles del cultivo
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL COFFEELIFE */}
      {showModal && (
        <div className="cl-modal-overlay" onClick={() => { setShowModal(false); handleCancelEdit() }}>
          <div className="cl-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="cl-modal-title">{editando ? 'Editar cultivo' : 'Registrar nuevo cultivo'}</h2>
            <form className="cl-modal-form" onSubmit={handleCreate}>
              <div className="cl-input-group">
                <label>Nombre del cultivo</label>
                <input name="nombre_cultivo" value={form.nombre_cultivo} onChange={handleChange} placeholder="Ej. Lote Central - Café" required />
              </div>
              
              <div className="cl-input-group">
                <label>Variedad / Tipo de cultivo</label>
                <input name="tipo_cultivo" value={form.tipo_cultivo} onChange={handleChange} placeholder="Ej. Castillo, Bourbon, Catimor" required />
              </div>

              <div className="cl-input-group">
                <label>Estado actual</label>
                <select name="id_estado_cultivo" value={form.id_estado_cultivo} onChange={handleChange}>
                  <option value="">--- Sin estado ---</option>
                  {estados.map((est) => (
                    <option key={est.idEstado} value={est.idEstado}>{est.nombreEstado}</option>
                  ))}
                </select>
              </div>

              {formError && <p className="cl-form-error-msg">{formError}</p>}
              
              <div className="cl-modal-actions">
                <button type="button" className="btn-cl-secondary" onClick={() => { setShowModal(false); handleCancelEdit() }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-brand-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Registrar Cultivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}