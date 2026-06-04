import { useState, useEffect } from 'react'
import api from '../../../services/api'
import { BiUser, BiMapPin, BiChevronLeft, BiTime, BiCalendar, BiTimeFive, BiPlus, BiDotsVerticalRounded, BiLeaf, BiCamera, BiFile, BiLayer, BiChevronRight } from 'react-icons/bi'
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
                <BiUser size={16} />
                <span>{finca?.nombreCafetero || '—'}</span>
              </div>
              <div className="meta-item">
                <BiMapPin size={16} />
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
            <BiChevronLeft size={16} />
            Volver a mi fincas
          </button>

          <div className="kpi-cards-container">
            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-brown">
                <BiTime size={20} />
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{cultivos.length}</span>
                <span className="kpi-label">Cultivos<br/>en esta finca</span>
              </div>
            </div>

            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-orange">
                <BiCalendar size={20} />
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{Object.values(stats).reduce((a, b) => a + b.monitoreos, 0)}</span>
                <span className="kpi-label">Actividades<br/>este mes</span>
              </div>
            </div>

            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-green">
                <BiTimeFive size={20} />
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
          <BiPlus size={16} />
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
                    <BiDotsVerticalRounded size={16} />
                  </button>
                </div>

                <div className="card-content-body">
                  <div className="card-main-header">
                    <div className="card-icon-container">
                      <BiLeaf size={22} color="#437024" />
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
                      <BiCamera size={16} color="#6b7280" />
                      <div className="stat-numbers">
                        <strong>{s.imagenes}</strong>
                        <span>Fotos</span>
                      </div>
                    </div>
                    <div className="stat-col">
                      <BiFile size={16} color="#6b7280" />
                      <div className="stat-numbers">
                        <strong>{s.monitoreos}</strong>
                        <span>Recomendaciones</span>
                      </div>
                    </div>
                    <div className="stat-col">
                      <BiLayer size={16} color="#6b7280" />
                      <div className="stat-numbers">
                        <strong>1</strong>
                        <span>Tratamientos</span>
                      </div>
                    </div>
                  </div>

                  {/* BOTÓN INFERIOR FULL-WIDTH */}
                  <button className="btn-card-action-trigger" onClick={() => onNavigate('detalle_cultivo', c)}>
                    Ver detalles del cultivo
                    <BiChevronRight size={16} />
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