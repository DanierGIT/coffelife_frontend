import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import api from '../../../services/api'
import './DashboardExperto.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Imágenes reales de fincas cafeteras colombianas
const FINCA_IMAGES = [
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80',
  'https://images.unsplash.com/photo-1504455583697-3a9b04be6397?w=600&q=80',
  'https://images.unsplash.com/photo-1531489956451-20f6ab2ada0e?w=600&q=80',
  'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=600&q=80',
]

const getFincaImage = (idFinca) => FINCA_IMAGES[Number(idFinca) % FINCA_IMAGES.length]

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const decodeTokenPayload = () => {
  try {
    const token = localStorage.getItem('cl_token')
    if (!token) return null
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(base64))
  } catch { return null }
}

// ── Menú de 3 puntos ─────────────────────────────────────────
function CardMenu({ finca, onEdit }) {
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
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(finca) }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar finca
          </button>
        </div>
      )}
    </div>
  )
}

// ── Modal ubicación ───────────────────────────────────────────
function UbicacionPickerModal({ latInicial, lngInicial, onConfirm, onCancel }) {
  const [lat, setLat] = useState(latInicial || '')
  const [lng, setLng] = useState(lngInicial || '')
  const center = lat && lng ? [parseFloat(lat), parseFloat(lng)] : [4.5709, -74.2973]

  function ClickHandler() {
    useMapEvents({
      click(e) {
        setLat(e.latlng.lat.toFixed(6))
        setLng(e.latlng.lng.toFixed(6))
      },
    })
    return null
  }

  return (
    <div className="cl-modal-overlay" onClick={onCancel}>
      <div className="cl-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="cl-modal-header">
          <h2 className="cl-modal-title">Seleccionar ubicación</h2>
        </div>
        <div className="cl-form-row" style={{ marginTop: '16px' }}>
          <div className="cl-input-group">
            <label className="cl-label">Latitud</label>
            <input className="cl-input" placeholder="Ej: 4.5709" value={lat} onChange={(e) => setLat(e.target.value)} type="number" step="any" />
          </div>
          <div className="cl-input-group">
            <label className="cl-label">Longitud</label>
            <input className="cl-input" placeholder="Ej: -74.2973" value={lng} onChange={(e) => setLng(e.target.value)} type="number" step="any" />
          </div>
        </div>
        <div className="cl-map-wrapper">
          <MapContainer center={center} zoom={lat && lng ? 13 : 6} style={{ height: '280px', width: '100%', borderRadius: '12px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <ClickHandler />
            {lat && lng && <Marker position={[parseFloat(lat), parseFloat(lng)]} />}
          </MapContainer>
        </div>
        <div className="cl-modal-actions">
          <button className="cl-btn-primary" onClick={() => onConfirm(lat, lng)}>Confirmar ubicación</button>
          <button className="cl-btn-secondary" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function DashboardExperto({ onNavigate }) {
  const [fincasAsignadas, setFincasAsignadas] = useState([])
  const [cultivosPorFinca, setCultivosPorFinca] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCrearModal, setShowCrearModal] = useState(false)
  const [editandoFinca, setEditandoFinca] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    nombre_finca: '', municipio: '', departamento: '',
    altitud_msnm: '', area_hectareas: '', latitud: '', longitud: '', id_cafetero: '',
  })

  const [cafeteros, setCafeteros] = useState([])
  const [showUbicacionModal, setShowUbicacionModal] = useState(false)
  const [ubicacionLat, setUbicacionLat] = useState('')
  const [ubicacionLng, setUbicacionLng] = useState('')

  const payload = decodeTokenPayload()
  const nombreExperto = payload?.nombre || 'Experto'
  const idExperto = payload?.id

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      if (!idExperto) { setError('No se encontró el usuario experto en la sesión.'); return }

      const [asignacionesRes, cultivosRes, cafeterosRes] = await Promise.all([
        api.get('/asignaciones_expertos'),
        api.get('/cultivos'),
        api.get('/cafeteros'),
      ])

      const cafeterosData = Array.isArray(cafeterosRes.data) ? cafeterosRes.data : (cafeterosRes.data?.data ?? [])
      setCafeteros(cafeterosData)

      const asignaciones = getArrayData(asignacionesRes.data).filter(
        (a) => Number(a.idExperto) === Number(idExperto)
      )

      const fincas = asignaciones.map((a) => {
        const f = a.finca || {}
        const cafetero = cafeterosData.find((c) => Number(c.idUsuario) === Number(f.idUsuario))
        const exp = a.experto || {}
        return {
          idFinca: f.idFinca || a.idFinca,
          nombre: f.nombreFinca || `Finca #${f.idFinca || a.idFinca || '-'}`,
          municipio: f.municipio || '-',
          departamento: f.departamento || '-',
          altitud: f.altitudMsnm || null,
          area: f.areaHectareas || null,
          activo: f.activo,
          fechaAsignada: a.fechaAsignada,
          nombreCafetero: cafetero ? `${cafetero.nombre} ${cafetero.apellido}` : null,
          nombreExperto: exp.nombre && exp.apellido ? `${exp.nombre} ${exp.apellido}` : null,
        }
      }).filter((f) => f.idFinca)

      const unicas = [...new Map(fincas.map((f) => [f.idFinca, f])).values()]
      setFincasAsignadas(unicas)

      const todosCultivos = getArrayData(cultivosRes.data)
      const cultivosMap = {}
      unicas.forEach((f) => {
        cultivosMap[f.idFinca] = todosCultivos.filter((c) => Number(c.idFinca) === Number(f.idFinca))
      })
      setCultivosPorFinca(cultivosMap)
    } catch (err) {
      setError(err?.response?.status === 403 ? 'Acceso denegado por backend.' : (err?.response?.data?.message || 'No se pudo cargar el dashboard.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const openCrear = () => {
    setEditandoFinca(null)
    setForm({ nombre_finca: '', municipio: '', departamento: '', altitud_msnm: '', area_hectareas: '', latitud: '', longitud: '', id_cafetero: '' })
    setFormError('')
    setShowCrearModal(true)
  }

  const openEditar = (finca) => {
    setEditandoFinca(finca)
    setForm({
      nombre_finca: finca.nombre || '',
      municipio: finca.municipio || '',
      departamento: finca.departamento || '',
      altitud_msnm: finca.altitud || '',
      area_hectareas: finca.area || '',
      latitud: '',
      longitud: '',
      id_cafetero: '',
    })
    setFormError('')
    setShowCrearModal(true)
  }

  const openUbicacionPicker = () => {
    setUbicacionLat(form.latitud)
    setUbicacionLng(form.longitud)
    setShowUbicacionModal(true)
  }

  const handleUbicacionConfirm = (lat, lng) => {
    setForm((f) => ({ ...f, latitud: lat, longitud: lng }))
    setShowUbicacionModal(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const fincaPayload = {
        id_usuario: form.id_cafetero ? Number(form.id_cafetero) : idExperto,
        nombre_finca: form.nombre_finca,
        municipio: form.municipio,
        departamento: form.departamento,
        altitud_msnm: form.altitud_msnm ? parseFloat(form.altitud_msnm) : undefined,
        area_hectareas: form.area_hectareas ? parseFloat(form.area_hectareas) : undefined,
        latitud: form.latitud ? parseFloat(form.latitud) : undefined,
        longitud: form.longitud ? parseFloat(form.longitud) : undefined,
      }

      if (editandoFinca) {
        await api.put(`/fincas/${editandoFinca.idFinca}`, fincaPayload)
      } else {
        const fincaRes = await api.post('/fincas', fincaPayload)
        const nuevaFinca = fincaRes.data?.data || fincaRes.data
        await api.post('/asignaciones_expertos', {
          idExperto,
          idFinca: nuevaFinca.idFinca,
          fechaAsignada: new Date().toISOString().split('T')[0],
        })
      }

      setShowCrearModal(false)
      fetchData()
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.response?.data?.error || 'No se pudo guardar la finca.')
    } finally {
      setSaving(false)
    }
  }

  const totalCultivos = Object.values(cultivosPorFinca).reduce((acc, c) => acc + c.length, 0)

  return (
    <div className="cl-dashboard">

      {/* ── Greeting + Stats ── */}
      <div className="cl-hero">
        <div className="cl-hero-greeting">
          <h1 className="cl-hero-title">¡Hola, {nombreExperto}!</h1>
          <p className="cl-hero-sub">Aquí puedes gestionar las fincas que tienes asignadas.</p>
        </div>
        <div className="cl-stats-row">
          <div className="cl-stat-card">
            <span className="cl-stat-icon cl-stat-icon--house">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <div>
              <span className="cl-stat-number">{fincasAsignadas.length}</span>
              <span className="cl-stat-label">Fincas asignadas</span>
            </div>
          </div>
          <div className="cl-stat-card">
            <span className="cl-stat-icon cl-stat-icon--plant">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V12"/><path d="M5 12C5 7 8 4 12 4s7 3 7 8"/>
                <path d="M5 12c0 3 2 5 7 5s7-2 7-5"/>
              </svg>
            </span>
            <div>
              <span className="cl-stat-number">{totalCultivos}</span>
              <span className="cl-stat-label">Cultivos totales</span>
            </div>
          </div>
          <div className="cl-stat-card">
            <span className="cl-stat-icon cl-stat-icon--cal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <div>
              <span className="cl-stat-number">{fincasAsignadas.length > 0 ? 'Hoy' : '-'}</span>
              <span className="cl-stat-label">Última actividad</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="cl-alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {/* ── Fincas Section ── */}
      <div className="cl-section">
        <div className="cl-section-header">
          <div className="cl-section-title-row">
            <h2 className="cl-section-title">Mis fincas asignadas</h2>
            {!loading && <span className="cl-badge">{fincasAsignadas.length} fincas</span>}
          </div>
          <button className="cl-btn-primary" onClick={openCrear}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Crear nueva finca
          </button>
        </div>

        {loading ? (
          <div className="cl-loading"><div className="cl-spinner" /><span>Cargando fincas...</span></div>
        ) : fincasAsignadas.length === 0 ? (
          <div className="cl-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            <p>No hay fincas asignadas para este experto.</p>
          </div>
        ) : (
          <div className="cl-fincas-grid">
            {fincasAsignadas.map((f) => {
              const cultivos = cultivosPorFinca[f.idFinca] || []
              return (
                <div key={f.idFinca} className="cl-finca-card">
                  {/* Card image */}
                  <div className="cl-card-image">
                    <img
                      src={getFincaImage(f.idFinca)}
                      alt={f.nombre}
                      className="cl-card-img"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <div className="cl-card-img-overlay" />

                    {/* Menú 3 puntos con dropdown */}
                    <CardMenu finca={f} onEdit={openEditar} />

                    <span className={`cl-card-status-badge ${f.activo !== false ? 'activa' : 'inactiva'}`}>
                      {f.activo !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="cl-card-body">
                    <div className="cl-card-icon-wrap">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                        <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                      </svg>
                    </div>
                    <div className="cl-card-info">
                      <h3 className="cl-card-name">{f.nombre}</h3>
                      {f.nombreCafetero && <p className="cl-card-owner">{f.nombreCafetero}</p>}
                      <div className="cl-card-tags">
                        {f.altitud && <span className="cl-tag">{f.altitud} m.s.n.m.</span>}
                        {f.area && <span className="cl-tag">{f.area} ha</span>}
                      </div>
                      <p className="cl-card-location">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {f.municipio}, {f.departamento}
                      </p>
                    </div>
                    <div className="cl-card-footer">
                      <div className="cl-card-footer-meta">
                        <span className="cl-footer-stat">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22V12"/><path d="M5 12C5 7 8 4 12 4s7 3 7 8"/>
                          </svg>
                          <strong>{cultivos.length}</strong>
                          <span>cultivos</span>
                        </span>
                        <span className="cl-footer-stat">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          <span>Asignada:</span>
                          <strong>{f.fechaAsignada ? new Date(f.fechaAsignada).toLocaleDateString('es-CO') : '-'}</strong>
                        </span>
                      </div>
                      <button
                        className="cl-btn-ver-cultivos"
                        onClick={() => onNavigate?.('cultivos', { ...f, totalCultivos: cultivos.length })}
                      >
                        Ver cultivos
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && fincasAsignadas.length > 0 && (
          <div className="cl-pagination">
            <span className="cl-pagination-info">Mostrando 1 a {fincasAsignadas.length} de {fincasAsignadas.length} fincas</span>
            <div className="cl-pagination-controls">
              <button className="cl-page-btn" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="cl-page-btn cl-page-btn--active">1</button>
              <button className="cl-page-btn" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Crear / Editar Finca ── */}
      {showCrearModal && (
        <div className="cl-modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="cl-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h2 className="cl-modal-title">
                {editandoFinca ? `Editar finca: ${editandoFinca.nombre}` : 'Registrar nueva finca'}
              </h2>
              <button className="cl-modal-close" onClick={() => setShowCrearModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="cl-form-section-label">Información básica</div>
              <div className="cl-form-row">
                <div className="cl-input-group">
                  <label className="cl-label">Nombre de la finca *</label>
                  <input className="cl-input" name="nombre_finca" value={form.nombre_finca} onChange={handleChange} placeholder="Ej: Finca El Paraíso" required />
                </div>
                <div className="cl-input-group">
                  <label className="cl-label">Municipio *</label>
                  <input className="cl-input" name="municipio" value={form.municipio} onChange={handleChange} placeholder="Ej: Manizales" required />
                </div>
                <div className="cl-input-group">
                  <label className="cl-label">Departamento *</label>
                  <input className="cl-input" name="departamento" value={form.departamento} onChange={handleChange} placeholder="Ej: Caldas" required />
                </div>
              </div>

              <div className="cl-form-section-label">Características</div>
              <div className="cl-form-row">
                <div className="cl-input-group">
                  <label className="cl-label">Altitud (msnm)</label>
                  <input className="cl-input" name="altitud_msnm" value={form.altitud_msnm} onChange={handleChange} placeholder="Ej: 1800" type="number" step="any" />
                </div>
                <div className="cl-input-group">
                  <label className="cl-label">Área (hectáreas)</label>
                  <input className="cl-input" name="area_hectareas" value={form.area_hectareas} onChange={handleChange} placeholder="Ej: 5.5" type="number" step="any" />
                </div>
                <div className="cl-input-group">
                  <label className="cl-label">Ubicación GPS</label>
                  <button type="button" className="cl-btn-ubicacion" onClick={openUbicacionPicker}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {form.latitud && form.longitud
                      ? `${parseFloat(form.latitud).toFixed(4)}, ${parseFloat(form.longitud).toFixed(4)}`
                      : 'Seleccionar en mapa'}
                  </button>
                </div>
              </div>

              {!editandoFinca && (
                <>
                  <div className="cl-form-section-label">Caficultor asociado</div>
                  <div className="cl-form-row">
                    <div className="cl-input-group" style={{ flex: 1 }}>
                      <label className="cl-label">Caficultor (opcional)</label>
                      <select className="cl-input cl-select" name="id_cafetero" value={form.id_cafetero} onChange={handleChange}>
                        <option value="">Seleccione un caficultor</option>
                        {cafeteros.map((c) => (
                          <option key={c.idUsuario} value={c.idUsuario}>{c.nombre} {c.apellido}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {formError && (
                <div className="cl-form-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {formError}
                </div>
              )}

              <div className="cl-modal-actions">
                <button type="submit" className="cl-btn-primary" disabled={saving}>
                  {saving ? (
                    <><span className="cl-btn-spinner" />{editandoFinca ? 'Guardando...' : 'Registrando...'}</>
                  ) : editandoFinca ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Guardar cambios</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Registrar finca</>
                  )}
                </button>
                <button type="button" className="cl-btn-secondary" onClick={() => setShowCrearModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUbicacionModal && (
        <UbicacionPickerModal
          latInicial={ubicacionLat}
          lngInicial={ubicacionLng}
          onConfirm={handleUbicacionConfirm}
          onCancel={() => setShowUbicacionModal(false)}
        />
      )}
    </div>
  )
}