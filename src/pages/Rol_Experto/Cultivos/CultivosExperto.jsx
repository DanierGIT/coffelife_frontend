import { useState, useEffect, useRef } from 'react'
import api from '../../../services/api'
import './CultivosExperto.css'

// Imágenes reales por tipo de cultivo
const CULTIVO_IMAGES = {
  cafe:     'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=600&q=80',
  café:     'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=600&q=80',
  platano:  'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&q=80',
  plátano:  'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&q=80',
  banano:   'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&q=80',
  aguacate: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80',
  cacao:    'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&q=80',
  maiz:     'https://images.unsplash.com/photo-1601593346740-925612772716?w=600&q=80',
  maíz:     'https://images.unsplash.com/photo-1601593346740-925612772716?w=600&q=80',
}

const DEFAULT_CULTIVO_IMAGE = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'

const getCultivoImage = (nombre = '', tipo = '') => {
  const key = (nombre + ' ' + tipo).toLowerCase()
  for (const [k, url] of Object.entries(CULTIVO_IMAGES)) {
    if (key.includes(k)) return url
  }
  return DEFAULT_CULTIVO_IMAGE
}

// Imagen real de finca para el header
const FINCA_HEADER_IMAGE = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80'

// ── Menú de 3 puntos ─────────────────────────────────────────
function CultivoCardMenu({ cultivo, onEdit }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="cl-card-menu-wrapper" ref={menuRef}>
      <button
        className="cl-card-menu"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        title="Opciones"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>

      {open && (
        <div className="cl-dropdown-menu">
          <button
            className="cl-dropdown-item"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(cultivo) }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar cultivo
          </button>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
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
  const [form, setForm] = useState({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })

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
          deCultivo.forEach((m) => { totalImagenes += (m.imagenes?.length || 0) })
          statsMap[c.idCultivo] = { monitoreos: deCultivo.length, imagenes: totalImagenes }
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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

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
    <div className="cl-dashboard">

      {/* ── Header detalle de finca ── */}
      <div className="clc-finca-header">
        <div className="clc-finca-header-inner">
          <div className="clc-finca-img-wrap">
            <img src={FINCA_HEADER_IMAGE} alt="Finca" />
          </div>
          <div className="clc-finca-info">
            <span className="clc-badge-selected">Finca seleccionada</span>
            <h1 className="clc-finca-title">{finca?.nombre || 'Finca sin nombre'}</h1>
            <div className="clc-finca-meta">
              <span className="clc-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {finca?.nombreCafetero || '—'}
              </span>
              <span className="clc-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {finca?.municipio || '—'}, {finca?.departamento || '—'}
              </span>
            </div>
            <div className="clc-finca-tags">
              <span className="cl-tag">Café</span>
              {finca?.altitud && <span className="cl-tag">{finca.altitud} msnm</span>}
              {finca?.area && <span className="cl-tag">{finca.area} ha</span>}
            </div>
          </div>
        </div>

        <div className="clc-finca-right">
          <button className="clc-btn-back" onClick={() => onNavigate('dashboard')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver a mis fincas
          </button>
          <div className="clc-kpis">
            <div className="clc-kpi-card">
              <span className="clc-kpi-icon clc-kpi-icon--plant">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V8M12 8c-2-2.5-5-2.5-7 0 0 3 2.5 5 7 5M12 8c2-2.5 5-2.5 7 0 0 3-2.5 5-7 5"/></svg>
              </span>
              <div className="clc-kpi-data">
                <span className="clc-kpi-value">{cultivos.length}</span>
                <span className="clc-kpi-label">Cultivos<br/>en esta finca</span>
              </div>
            </div>
            <div className="clc-kpi-card">
              <span className="clc-kpi-icon clc-kpi-icon--cal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </span>
              <div className="clc-kpi-data">
                <span className="clc-kpi-value">{Object.values(stats).reduce((a, b) => a + b.monitoreos, 0)}</span>
                <span className="clc-kpi-label">Actividades<br/>este mes</span>
              </div>
            </div>
            <div className="clc-kpi-card">
              <span className="clc-kpi-icon clc-kpi-icon--clock">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              <div className="clc-kpi-data">
                <span className="clc-kpi-value">Hoy</span>
                <span className="clc-kpi-label">Última actividad<br/>09:30 a. m.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sección cultivos ── */}
      <div className="cl-section">
        <div className="cl-section-header">
          <div className="cl-section-title-row">
            <h2 className="cl-section-title">Cultivos de la finca</h2>
            {!loading && <span className="cl-badge">{cultivos.length} cultivos</span>}
          </div>
          <button className="cl-btn-primary" onClick={() => { handleCancelEdit(); setShowModal(true) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar cultivo
          </button>
        </div>

        {loading ? (
          <div className="cl-loading"><div className="cl-spinner" /><span>Cargando cultivos...</span></div>
        ) : error ? (
          <div className="cl-alert">{error}</div>
        ) : cultivos.length === 0 ? (
          <div className="cl-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V8M12 8c-2-2.5-5-2.5-7 0 0 3 2.5 5 7 5M12 8c2-2.5 5-2.5 7 0 0 3-2.5 5-7 5"/></svg>
            <p>Esta finca no tiene cultivos registrados.</p>
          </div>
        ) : (
          <div className="clc-cultivos-grid">
            {cultivos.map((c) => {
              const s = stats[c.idCultivo] || { monitoreos: 0, imagenes: 0 }
              const nombre = c.nombreCultivo || c.nombre_cultivo || '—'
              const tipo   = c.tipoCultivo   || c.tipo_cultivo   || '—'
              const estado = c.estadoCultivo?.nombreEstado || 'Activo'

              return (
                <div key={c.idCultivo} className="clc-cultivo-card">
                  <div className="clc-card-img-wrap">
                    <img
                      src={getCultivoImage(nombre, tipo)}
                      alt={nombre}
                      onError={(e) => { e.target.src = DEFAULT_CULTIVO_IMAGE }}
                    />
                    {/* Menú 3 puntos con dropdown */}
                    <CultivoCardMenu cultivo={c} onEdit={handleEditClick} />
                  </div>

                  <div className="clc-card-body">
                    <div className="clc-card-header-row">
                      <div className="clc-card-icon-wrap">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V8M12 8c-2-2.5-5-2.5-7 0 0 3 2.5 5 7 5M12 8c2-2.5 5-2.5 7 0 0 3-2.5 5-7 5"/></svg>
                      </div>
                      <div>
                        <h3 className="clc-card-name">{nombre}</h3>
                        <p className="clc-card-variedad">Variedad: {tipo}</p>
                        <span className="clc-badge-activo">{estado}</span>
                      </div>
                    </div>

                    <div className="clc-stats-row">
                      <div className="clc-stat-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        <strong>{s.imagenes}</strong><span>Fotos</span>
                      </div>
                      <div className="clc-stat-sep" />
                      <div className="clc-stat-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <strong>{s.monitoreos}</strong><span>Recomendaciones</span>
                      </div>
                      <div className="clc-stat-sep" />
                      <div className="clc-stat-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 22H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6"/></svg>
                        <strong>1</strong><span>Tratamientos</span>
                      </div>
                    </div>

                    <button className="clc-btn-ver-detalle" onClick={() => onNavigate('detalle_cultivo', c)}>
                      Ver detalles del cultivo
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal cultivo ── */}
      {showModal && (
        <div className="cl-modal-overlay" onClick={() => { setShowModal(false); handleCancelEdit() }}>
          <div className="cl-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="cl-modal-header">
              <h2 className="cl-modal-title">{editando ? 'Editar cultivo' : 'Registrar nuevo cultivo'}</h2>
              <button className="cl-modal-close" onClick={() => { setShowModal(false); handleCancelEdit() }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="cl-form-section-label">Información del cultivo</div>
              <div className="cl-input-group" style={{ marginBottom: '14px' }}>
                <label className="cl-label">Nombre del cultivo *</label>
                <input className="cl-input" name="nombre_cultivo" value={form.nombre_cultivo} onChange={handleChange} placeholder="Ej. Lote Central - Café" required />
              </div>
              <div className="cl-input-group" style={{ marginBottom: '14px' }}>
                <label className="cl-label">Variedad / Tipo de cultivo *</label>
                <input className="cl-input" name="tipo_cultivo" value={form.tipo_cultivo} onChange={handleChange} placeholder="Ej. Castillo, Bourbon, Catimor" required />
              </div>
              <div className="cl-input-group" style={{ marginBottom: '14px' }}>
                <label className="cl-label">Estado actual</label>
                <select className="cl-input cl-select" name="id_estado_cultivo" value={form.id_estado_cultivo} onChange={handleChange}>
                  <option value="">— Sin estado —</option>
                  {estados.map((est) => (
                    <option key={est.idEstado} value={est.idEstado}>{est.nombreEstado}</option>
                  ))}
                </select>
              </div>
              {formError && (
                <div className="cl-form-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {formError}
                </div>
              )}
              <div className="cl-modal-actions">
                <button type="submit" className="cl-btn-primary" disabled={saving}>
                  {saving ? (
                    <><span className="cl-btn-spinner" /> Guardando...</>
                  ) : editando ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Guardar cambios</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Registrar cultivo</>
                  )}
                </button>
                <button type="button" className="cl-btn-secondary" onClick={() => { setShowModal(false); handleCancelEdit() }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}