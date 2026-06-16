import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../../services/api'
import { BiUser, BiMapPin, BiChevronLeft, BiTime, BiCalendar, BiTimeFive, BiPlus, BiDotsVerticalRounded, BiLeaf, BiCamera, BiFile, BiLayer, BiChevronRight } from 'react-icons/bi'
import './CultivosExperto.css'
import '../../../components/cargando.css'

/* ==========================================================================
   📸 MODAL CAMBIAR FOTO DE CULTIVO
   ========================================================================== */
function FotoCultivoModal({ cultivo, onClose, onFotoActualizada }) {
  const [preview, setPreview] = useState(cultivo.fotoUrl || null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef()

  const handleFileChange = (e) => {
    const sel = e.target.files[0]
    if (!sel) return
    setFile(sel)
    setPreview(URL.createObjectURL(sel))
    setUploadError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    setFile(dropped)
    setPreview(URL.createObjectURL(dropped))
    setUploadError('')
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('imagen', file)
      const res = await api.post(`/cultivos/${cultivo.idCultivo}/foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const nuevaUrl = res.data?.fotoUrl || res.data?.data?.fotoUrl || preview
      onFotoActualizada(cultivo.idCultivo, nuevaUrl)
      onClose()
    } catch (err) {
      setUploadError(err?.response?.data?.message || 'No se pudo subir la foto.')
    } finally {
      setUploading(false)
    }
  }

  const nombre = cultivo.nombreCultivo || cultivo.nombre_cultivo || 'Cultivo'

  return (
    <div className="cl-modal-overlay" onClick={onClose}>
      <div className="cl-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <h2 className="cl-modal-title">Foto del cultivo</h2>
        <p className="cl-modal-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
          {nombre}
        </p>

        <div
          className="cl-foto-dropzone"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="cl-foto-preview" />
          ) : (
            <div className="cl-foto-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <p>Haz clic o arrastra una imagen aquí</p>
              <span>JPG, PNG o WEBP · Máx. 5 MB</span>
            </div>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

        {preview && (
          <button type="button" className="btn-cl-secondary cl-btn-full" onClick={() => inputRef.current?.click()}>
            Cambiar imagen
          </button>
        )}

        {uploadError && <p className="cl-form-error-msg">{uploadError}</p>}

        <div className="cl-modal-actions" style={{ marginTop: '1.25rem' }}>
          <button className="btn-cl-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-brand-primary" onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? <><div className="loader" style={{width: '16px', borderWidth: '2px', margin: '0', display: 'inline-block', verticalAlign: 'middle'}} /> Subiendo...</> : 'Guardar foto'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   🎛️ MENÚ DE 3 PUNTOS POR TARJETA DE CULTIVO
   ========================================================================== */
function CultivoOptionsMenu({ cultivo, onEditar, onCambiarFoto }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="finca-options-menu" ref={menuRef}> {/* Reutiliza la posición estratégica del core */}
      <button
        className="btn-floating-options"
        title="Opciones"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
        </svg>
      </button>

      {open && (
        <div className="finca-dropdown"> {/* Reutiliza la animación y estilo de dropdowns */}
          <button className="finca-dropdown-item" onClick={() => { setOpen(false); onEditar(cultivo) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar cultivo
          </button>
          <button className="finca-dropdown-item" onClick={() => { setOpen(false); onCambiarFoto(cultivo) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Cambiar foto
          </button>
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   🌱 COMPONENTE PRINCIPAL (CULTIVOS EXPERTO)
   ========================================================================== */
export default function CultivosExperto({ finca, onNavigate }) {
  const [cultivos, setCultivos] = useState([])
  const [stats, setStats] = useState({})
  const [fotosPorCultivo, setFotosPorCultivo] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [estados, setEstados] = useState([])
  const [form, setForm] = useState({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })

  const [cultivoParaFoto, setCultivoParaFoto] = useState(null)

  const FOTO_PLACEHOLDER = 'https://blogtrip.org/wp-content/uploads/2016/04/paisaje-cafetero-parque-nacional-cafe-eje-cafetero.jpg'

  const estadosLoaded = useRef(false)

  const loadEstados = async () => {
    if (estadosLoaded.current) return
    estadosLoaded.current = true
    try {
      const res = await api.get('/cat_estados_cultivo')
      const est = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setEstados(est)
    } catch {
      // silencioso
    }
  }

  const loadStats = async (cultivosList) => {
    try {
      const res = await api.get('/monitoreos')
      const monitoreos = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      const statsMap = {}
      cultivosList.forEach((c) => {
        const deCultivo = monitoreos.filter((m) => Number(m.idCultivo) === Number(c.idCultivo))
        let totalImagenes = 0
        deCultivo.forEach((m) => { totalImagenes += (m.imagenes?.length || 0) })
        statsMap[c.idCultivo] = { monitoreos: deCultivo.length, imagenes: totalImagenes }
      })
      setStats(statsMap)
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    if (!finca?.idFinca) return
    const fetchData = async () => {
      try {
        const res = await api.get('/cultivos')
        const todos = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
        const filtrados = todos.filter((c) => Number(c.idFinca) === Number(finca.idFinca))
        setCultivos(filtrados)

        const fotosIniciales = {}
        filtrados.forEach((c) => { if (c.fotoUrl) fotosIniciales[c.idCultivo] = c.fotoUrl })
        setFotosPorCultivo(fotosIniciales)

        loadStats(filtrados)
      } catch {
        setError('No se pudieron cargar los cultivos.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [finca])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleEditClick = (cultivo) => {
    loadEstados()
    setEditando(cultivo)
    setForm({
      nombre_cultivo: cultivo.nombreCultivo || cultivo.nombre_cultivo || '',
      tipo_cultivo: cultivo.tipoCultivo || cultivo.tipo_cultivo || '',
      id_estado_cultivo: cultivo.idEstado
        ? String(cultivo.idEstado)
        : (cultivo.id_estado_cultivo ? String(cultivo.id_estado_cultivo) : ''),
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

  const handleFotoActualizada = (idCultivo, url) => {
    setFotosPorCultivo((prev) => ({ ...prev, [idCultivo]: url }))
  }

  return (
    <div className="coffeelife-container">

      {/* 🏡 TARJETA SUPERIOR DETALLE DE LA FINCA */}
      <div className="finca-detail-header-card">
        <div className="finca-detail-left">
          <div className="finca-detail-img-container">
            {finca?.fotoUrl ? (
              <img src={finca.fotoUrl} alt="Finca" />
            ) : (
              <div className="finca-detail-no-foto">
                <BiCamera size={28} />
              </div>
            )}
          </div>
          <div className="finca-detail-info">
            <span className="badge-selected">Finca seleccionada</span>
            <h1 className="finca-detail-title">{finca?.nombre || 'Finca sin nombre'}</h1>
            <div className="finca-detail-meta">
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{finca?.nombreCafetero || '—'}</span>
              </div>
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
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

        <div className="finca-detail-right">
          <div className="kpi-cards-container">
            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-brown">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{cultivos.length}</span>
                <span className="kpi-label">Cultivos<br/>en esta finca</span>
              </div>
            </div>
            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-orange">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{Object.values(stats).reduce((a, b) => a + b.monitoreos, 0)}</span>
                <span className="kpi-label">Actividades<br/>este mes</span>
              </div>
            </div>
            <div className="kpi-card-mini">
              <div className="kpi-icon-circle brand-light-green-kpi"> {/* Clase sincronizada con CSS */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className="kpi-data">
                <span className="kpi-value">Hoy</span>
                <span className="kpi-label">Última actividad<br/>09:30 a. m.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌿 BARRA DE SECCIÓN (CULTIVOS) */}
      <div className="cultivos-section-bar">
        <div className="section-bar-left">
          <h2>Cultivos de la finca</h2>
          <span className="badge-count">{cultivos.length} cultivos</span>
        </div>
        <button className="btn-brand-primary" onClick={() => { loadEstados(); handleCancelEdit(); setShowModal(true) }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar cultivo
        </button>
      </div>

      {/* 🖼️ CONTENIDO PRINCIPAL: GRILLA O ESTADOS */}
      {loading ? (
        <div className="state-message-box"><div className="loader" /><p>Cargando cultivos...</p></div>
      ) : error ? (
        <div className="state-message-box error"><p>{error}</p></div>
      ) : cultivos.length === 0 ? (
        <div className="state-message-box alert"><p>Esta finca no tiene cultivos registrados.</p></div>
      ) : (
        <div className="coffeelife-cards-grid">
          {cultivos.map((c) => {
            const s = stats[c.idCultivo] || { monitoreos: 0, imagenes: 0 }
            const fotoSrc = fotosPorCultivo[c.idCultivo] || FOTO_PLACEHOLDER

            return (
              <div key={c.idCultivo} className="coffeelife-card">
                <div className="card-image-wrapper">
                  <img src={fotoSrc} alt="Cultivo" />
                  <CultivoOptionsMenu
                    cultivo={c}
                    onEditar={handleEditClick}
                    onCambiarFoto={(cultivo) => setCultivoParaFoto(cultivo)}
                  />
                </div>

                <div className="card-content-body">
                  <div className="card-main-header">
                    <div className="card-icon-container">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22V8M12 8c-2-2.5-5-2.5-7 0 0 3 2.5 5 7 5M12 8c2-2.5 5-2.5 7 0 0 3-2.5 5-7 5"/>
                      </svg>
                    </div>
                    <div className="card-title-group">
                      <h3>{c.nombreCultivo || c.nombre_cultivo || '—'}</h3>
                      <p className="card-subtitle">Variedad: {c.tipoCultivo || c.tipo_cultivo || '—'}</p>
                      <span className="badge-status-active">{c.estadoCultivo?.nombreEstado || 'Activo'}</span>
                    </div>
                  </div>

                  <div className="card-stats-row">
                    <div className="stat-col">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <div className="stat-numbers"><strong>{s.imagenes}</strong><span>Fotos</span></div>
                    </div>
                    <div className="stat-col">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      <div className="stat-numbers"><strong>{s.monitoreos}</strong><span>Reportes</span></div>
                    </div>
                    <div className="stat-col">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 22H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6"/>
                        <path d="M16 18a2.08 2.08 0 0 0-2-2 2.08 2.08 0 0 0-2 2v4h4z"/>
                        <path d="M20 14a2.08 2.08 0 0 0-2-2 2.08 2.08 0 0 0-2 2v8h4z"/>
                      </svg>
                      <div className="stat-numbers"><strong>1</strong><span>Focos</span></div>
                    </div>
                  </div>

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

      {/* 🔲 MODAL CREAR / EDITAR CULTIVO */}
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
                <button type="button" className="btn-cl-secondary" onClick={() => { setShowModal(false); handleCancelEdit() }}>Cancelar</button>
                <button type="submit" className="btn-brand-primary" disabled={saving}>
                  {saving ? <><div className="loader" style={{width: '16px', borderWidth: '2px', margin: '0', display: 'inline-block', verticalAlign: 'middle'}} /> Guardando...</> : editando ? 'Guardar Cambios' : 'Registrar Cultivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📸 ENLACE CON MODAL FOTO CULTIVO */}
      {cultivoParaFoto && (
        <FotoCultivoModal
          cultivo={cultivoParaFoto}
          onClose={() => setCultivoParaFoto(null)}
          onFotoActualizada={handleFotoActualizada}
        />
      )}
    </div>
  )
}