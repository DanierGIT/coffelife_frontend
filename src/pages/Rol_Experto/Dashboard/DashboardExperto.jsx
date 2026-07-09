import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { useNotificaciones } from '../../../hooks/useNotificaciones'
import { BiHome, BiLeaf, BiCalendarCheck, BiPlus, BiDotsVerticalRounded, BiMapPin, BiUser, BiChevronRight, BiCamera } from 'react-icons/bi'
import CoffeePriceCard from '../../../components/CoffeePriceCard'
import Loading from '../../../components/Loading'
import '../../../components/cargando.css'
import './DashboardExperto.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const FINCAS_POR_PAGINA = 10

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const activoEsTrue = (val) => {
  if (val === null || val === undefined) return true
  return val === true || val === 1 || val === '1'
}

/* ─── Mapa para seleccionar coordenadas ──────────────────────────── */
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
        <h2 className="cl-modal-title">Seleccionar ubicación geográfica</h2>
        <div className="cl-modal-form-row">
          <div className="cl-input-group">
            <label>Latitud</label>
            <input placeholder="Latitud" value={lat} onChange={(e) => setLat(e.target.value)} type="number" step="any" />
          </div>
          <div className="cl-input-group">
            <label>Longitud</label>
            <input placeholder="Longitud" value={lng} onChange={(e) => setLng(e.target.value)} type="number" step="any" />
          </div>
        </div>
        <div className="cl-map-wrapper">
          <MapContainer center={center} zoom={lat && lng ? 13 : 6} style={{ height: '280px', width: '100%', borderRadius: '16px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <ClickHandler />
            {lat && lng && <Marker position={[parseFloat(lat), parseFloat(lng)]} />}
          </MapContainer>
        </div>
        <div className="cl-modal-actions" style={{ marginTop: '1.5rem' }}>
          <button className="btn-cl-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn-brand-primary" onClick={() => onConfirm(lat, lng)}>Confirmar ubicación</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal cambiar foto de finca ────────────────────────────────── */
function FotoFincaModal({ finca, onClose, onFotoActualizada }) {
  const [preview, setPreview] = useState(finca.fotoUrl || null)
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
      const res = await api.post(`/fincas/${finca.idFinca}/foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const nuevaUrl = res.data?.fotoUrl || res.data?.data?.fotoUrl || preview
      onFotoActualizada(finca.idFinca, nuevaUrl)
      onClose()
    } catch (err) {
      setUploadError(err?.response?.data?.message || 'No se pudo subir la foto.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="cl-modal-overlay" onClick={onClose}>
      <div className="cl-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <h2 className="cl-modal-title">Foto de la finca</h2>
        <p className="cl-modal-subtitle">{finca.nombre}</p>

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
            {uploading ? <Loading type="inline" text="Subiendo..." /> : 'Guardar foto'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal editar finca ─────────────────────────────────────────── */
function EditarFincaModal({ finca, cafeteros, onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre_finca: finca.nombre || '',
    municipio: finca.municipio || '',
    departamento: finca.departamento || '',
    altitud_msnm: finca.altitud || '',
    area_hectareas: finca.area || '',
    id_cafetero: '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api.put(`/fincas/${finca.idFinca}`, {
        nombre_finca: form.nombre_finca,
        municipio: form.municipio,
        departamento: form.departamento,
        altitud_msnm: form.altitud_msnm ? parseFloat(form.altitud_msnm) : undefined,
        area_hectareas: form.area_hectareas ? parseFloat(form.area_hectareas) : undefined,
      })
      onGuardado()
      onClose()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'No se pudo actualizar la finca.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cl-modal-overlay" onClick={onClose}>
      <div className="cl-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <h2 className="cl-modal-title">Editar finca</h2>
        <form className="cl-modal-form" onSubmit={handleSubmit}>
          <div className="cl-input-group">
            <label>Nombre de la finca</label>
            <input name="nombre_finca" value={form.nombre_finca} onChange={handleChange} required />
          </div>
          <div className="cl-modal-form-row">
            <div className="cl-input-group">
              <label>Municipio</label>
              <input name="municipio" value={form.municipio} onChange={handleChange} required />
            </div>
            <div className="cl-input-group">
              <label>Departamento</label>
              <input name="departamento" value={form.departamento} onChange={handleChange} required />
            </div>
          </div>
          <div className="cl-modal-form-row">
            <div className="cl-input-group">
              <label>Altitud (msnm)</label>
              <input name="altitud_msnm" value={form.altitud_msnm} onChange={handleChange} type="number" step="any" />
            </div>
            <div className="cl-input-group">
              <label>Área (hectáreas)</label>
              <input name="area_hectareas" value={form.area_hectareas} onChange={handleChange} type="number" step="any" />
            </div>
          </div>
          {formError && <p className="cl-form-error-msg">{formError}</p>}
          <div className="cl-modal-actions">
            <button type="button" className="btn-cl-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-brand-primary" disabled={saving}>
              {saving ? <Loading type="inline" text="Guardando..." /> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Menú de 3 puntos por tarjeta de finca ──────────────────────── */
function FincaOptionsMenu({ finca, onEditar, onCambiarFoto }) {
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
    <div className="finca-options-menu" ref={menuRef}>
      <button
        className="finca-options-trigger"
        title="Opciones"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
        </svg>
      </button>

      {open && (
        <div className="finca-dropdown">
          <button className="finca-dropdown-item" onClick={() => { setOpen(false); onEditar(finca) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar finca
          </button>
          <button className="finca-dropdown-item" onClick={() => { setOpen(false); onCambiarFoto(finca) }}>
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

/* ─── Componente principal ───────────────────────────────────────── */
export default function DashboardExperto({ onNavigate }) {
  const [fincasAsignadas, setFincasAsignadas] = useState([])
  const [cultivosPorFinca, setCultivosPorFinca] = useState({})
  const [monitoreosPorFinca, setMonitoreosPorFinca] = useState({})
  const [fotosPorFinca, setFotosPorFinca] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)

  // Modal crear finca
  const [showCrearModal, setShowCrearModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    nombre_finca: '', municipio: '', departamento: '',
    altitud_msnm: '', area_hectareas: '', latitud: '', longitud: '', id_cafetero: '',
  })
  const [cafeteros, setCafeteros] = useState([])

  // Modal crear cultivo (post‑finca)
  const [showCrearCultivoModal, setShowCrearCultivoModal] = useState(false)
  const [nuevaFincaData, setNuevaFincaData] = useState(null)
  const [cultivoSaving, setCultivoSaving] = useState(false)
  const [cultivoForm, setCultivoForm] = useState({ nombre_cultivo: '', tipo_cultivo: '' })

  // Modal mapa
  const [showUbicacionModal, setShowUbicacionModal] = useState(false)
  const [ubicacionLat, setUbicacionLat] = useState('')
  const [ubicacionLng, setUbicacionLng] = useState('')

  // Modales editar / foto
  const [fincaParaEditar, setFincaParaEditar] = useState(null)
  const [fincaParaFoto, setFincaParaFoto] = useState(null)

  const { user } = useAuth()
  const notificacionKey = useNotificaciones(user?.idUsuario ?? user?.id)
  const nombreExperto = user?.nombre || 'Experto'
  const idExperto = user?.idUsuario ?? user?.id

  const totalCultivosContador = Object.values(cultivosPorFinca).reduce(
    (acc, lista) => acc + (lista?.length || 0), 0
  )

  // Paginación calculada
  const totalPaginas = Math.max(1, Math.ceil(fincasAsignadas.length / FINCAS_POR_PAGINA))
  const fincasPaginadas = fincasAsignadas.slice(
    (paginaActual - 1) * FINCAS_POR_PAGINA,
    paginaActual * FINCAS_POR_PAGINA
  )
  const irAPagina = (n) => {
    if (n < 1 || n > totalPaginas) return
    setPaginaActual(n)
  }

  const fetchEnrichment = async (unicas) => {
    try {
      const [cultivosRes, cafeterosRes, monitoreosRes] = await Promise.all([
        api.get('/cultivos'),
        api.get('/cafeteros', { params: { limit: 1000 } }),
        api.get('/monitoreos'),
      ])

      const cafeterosData = Array.isArray(cafeterosRes.data)
        ? cafeterosRes.data : (cafeterosRes.data?.data ?? [])
      setCafeteros(cafeterosData)

      setFincasAsignadas(prev => prev.map(f => {
        const cafetero = cafeterosData.find((c) => Number(c.idUsuario) === Number(f.idUsuario) || Number(c.idCafetero) === Number(f.idFinca))
        return { ...f, nombreCafetero: cafetero ? `${cafetero.nombre} ${cafetero.apellido}` : null }
      }))

      const todosCultivos = getArrayData(cultivosRes.data)
      const cultivosMap = {}
      unicas.forEach((f) => {
        cultivosMap[f.idFinca] = todosCultivos.filter((c) => Number(c.idFinca) === Number(f.idFinca))
      })
      setCultivosPorFinca(cultivosMap)

      // Contar monitoreos por finca
      const todosMonitoreos = getArrayData(monitoreosRes.data)
      const fincaIds = new Set(unicas.map((f) => Number(f.idFinca)))
      const monCount = {}
      todosMonitoreos.forEach((m) => {
        const idCultivo = Number(m.idCultivo ?? m.id_cultivo)
        const cultivo = todosCultivos.find((c) => Number(c.idCultivo) === idCultivo)
        const idFinca = Number(cultivo?.idFinca ?? cultivo?.id_finca)
        if (idFinca && fincaIds.has(idFinca)) {
          monCount[idFinca] = (monCount[idFinca] || 0) + 1
        }
      })
      setMonitoreosPorFinca(monCount)
    } catch {
      // silencioso
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      if (!idExperto) {
        setError('No se encontró el usuario experto en la sesión.')
        return
      }

      const asignacionesRes = await api.get('/asignaciones_expertos', { params: { limit: 1000 } })
 
      const asignaciones = getArrayData(asignacionesRes.data).filter(
        (a) => Number(a.idExperto) === Number(idExperto)
      )

      const fincas = asignaciones.map((a) => {
        const f = a.finca || {}
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
          fotoUrl: f.fotoUrl || null,
          nombreCafetero: null,
          nombreExperto: exp.nombre && exp.apellido ? `${exp.nombre} ${exp.apellido}` : null,
        }
      }).filter((f) => f.idFinca)

      const unicas = [...new Map(fincas.map((f) => [f.idFinca, f])).values()]
      setFincasAsignadas(unicas)

      const fotosIniciales = {}
      unicas.forEach((f) => { if (f.fotoUrl) fotosIniciales[f.idFinca] = f.fotoUrl })
      setFotosPorFinca(fotosIniciales)

      fetchEnrichment(unicas)
    } catch (err) {
      setError(err?.response?.status === 403
        ? 'Acceso denegado por el servidor.'
        : err?.response?.data?.message || 'No se pudo cargar el dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [notificacionKey])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const openUbicacionPicker = () => { setUbicacionLat(form.latitud); setUbicacionLng(form.longitud); setShowUbicacionModal(true) }
  const handleUbicacionConfirm = (lat, lng) => { setForm((f) => ({ ...f, latitud: lat, longitud: lng })); setShowUbicacionModal(false) }
  const handleFotoActualizada = (idFinca, url) => setFotosPorFinca((prev) => ({ ...prev, [idFinca]: url }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    // Validar cafetero obligatorio
    if (!form.id_cafetero) {
      setFormError('Debes seleccionar un caficultor/propietario para la finca.')
      return
    }
    setSaving(true)
    try {
      const fincaRes = await api.post('/fincas', {
        id_usuario: Number(form.id_cafetero),
        nombre_finca: form.nombre_finca,
        municipio: form.municipio,
        departamento: form.departamento,
        altitud_msnm: form.altitud_msnm ? parseFloat(form.altitud_msnm) : undefined,
        area_hectareas: form.area_hectareas ? parseFloat(form.area_hectareas) : undefined,
        latitud: form.latitud ? parseFloat(form.latitud) : undefined,
        longitud: form.longitud ? parseFloat(form.longitud) : undefined,
      })
      const nuevaFinca = fincaRes.data?.data || fincaRes.data
      setForm({ nombre_finca: '', municipio: '', departamento: '', altitud_msnm: '', area_hectareas: '', latitud: '', longitud: '', id_cafetero: '' })

      // Asignar al experto que la creó
      try {
        await api.post('/asignaciones_expertos', {
          idExperto: idExperto,
          idFinca: nuevaFinca.idFinca,
          fechaAsignada: new Date().toISOString().split('T')[0],
        })
      } catch (err) {
        console.error('[Asignacion] Error al asignar finca al experto:', err?.response?.data || err.message)
      }

      // Cerrar modal de finca y abrir modal para crear el primer cultivo
      setShowCrearModal(false)
      setFormError('')
      setNuevaFincaData(nuevaFinca)
      setCultivoForm({ nombre_cultivo: '', tipo_cultivo: '' })
      setShowCrearCultivoModal(true)
      setPaginaActual(1)
      fetchData()
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.response?.data?.error || 'No se pudo registrar la finca.')
    } finally {
      setSaving(false)
    }
  }

  const handleCrearCultivo = async (e) => {
    e.preventDefault()
    setCultivoSaving(true)
    try {
      await api.post('/cultivos', {
        id_finca: nuevaFincaData.idFinca,
        nombre_cultivo: cultivoForm.nombre_cultivo.trim(),
        tipo_cultivo: cultivoForm.tipo_cultivo.trim(),
      })
      setFormError('')
      setCultivoForm({ nombre_cultivo: '', tipo_cultivo: '' })
      setShowCrearCultivoModal(false)
      setNuevaFincaData(null)
      fetchData()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'No se pudo crear el cultivo.')
    } finally {
      setCultivoSaving(false)
    }
  }

  return (
    <div className="coffeelife-dashboard-container">

      {/* KPIs HEADER */}
      <div className="dashboard-header-flex">
        <div className="welcome-banner-text animate-left">
          <div className="welcome-banner-row">
            <div className="welcome-avatar-sm">
              {user?.fotoPerfil ? (
                <img src={user.fotoPerfil} alt="avatar" className="welcome-avatar-img-sm" />
              ) : (
                <BiUser size={20} />
              )}
            </div>
            <div>
              <h1 className="welcome-main-title">¡Hola, {user?.nombre || nombreExperto}!</h1>
              <p className="welcome-subtitle">Aquí puedes gestionar las fincas que tienes asignadas.</p>
            </div>
          </div>
        </div>

        <div className="header-kpi-cards-wrapper animate-right">
          <div className="kpi-card-item">
            <div className="kpi-icon-container home-kpi">
              <BiHome size={20} />
            </div>
            <div className="kpi-data-text">
              <span className="kpi-number-val">{fincasAsignadas.length}</span>
              <span className="kpi-label-name">Fincas asignadas</span>
            </div>
          </div>

          <div className="kpi-card-item">
            <div className="kpi-icon-container leaf-kpi">
              <BiLeaf size={20} />
            </div>
            <div className="kpi-data-text">
              <span className="kpi-number-val">{totalCultivosContador}</span>
              <span className="kpi-label-name">Cultivos totales</span>
            </div>
          </div>

          <div className="kpi-card-item">
            <div className="kpi-icon-container task-kpi">
              <BiCalendarCheck size={20} />
            </div>
            <div className="kpi-data-text">
              <span className="kpi-number-val">56</span>
              <span className="kpi-label-name">Actividades realizadas</span>
            </div>
          </div>
          <CoffeePriceCard />
        </div>
      </div>

      {error && <div className="cl-state-alert error">{error}</div>}

      {/* SECCIÓN FINCAS */}
      <div className="fincas-content-section animate-bottom">
        <div className="fincas-section-top-bar">
          <div className="top-bar-left-info">
            <h2>Mis fincas asignadas</h2>
            <span className="cl-count-pill">{fincasAsignadas.length} fincas</span>
          </div>
          <button className="btn-brand-primary" onClick={() => setShowCrearModal(true)}>
            <BiPlus size={16} />
            Crear nueva finca
          </button>
        </div>

        {loading ? (
          <Loading type="content" text="Cargando fincas asignadas..." />
        ) : fincasAsignadas.length === 0 ? (
          <div className="cl-loading-box alert"><p>No se encontraron fincas asignadas para tu perfil de experto.</p></div>
        ) : (
          <>
            <div className="coffeelife-fincas-grid">
              {fincasPaginadas.map((f, idx) => {
                const cultivos = cultivosPorFinca[f.idFinca] || []
                const fotoSrc = fotosPorFinca[f.idFinca] || null

                const cardDelay = Math.min(idx, 5)
                return (
                  <div key={f.idFinca} className={`coffeelife-finca-card animate-bottom delay-${cardDelay}${!activoEsTrue(f.activo) ? ' finca-inactiva' : ''}`}>
                    <div className="finca-card-img-wrapper">
                      {fotoSrc ? (
                        <img src={fotoSrc} alt={f.nombre} />
                      ) : (
                        <div className="finca-card-no-foto">
                          <BiCamera size={24} />
                        </div>
                      )}
                      <div className="finca-card-floating-badge">
                        <span className={`status-dot ${activoEsTrue(f.activo) ? 'active' : 'inactive'}`}></span>
                        {activoEsTrue(f.activo) ? 'Activa' : 'Inactiva'}
                      </div>
                      {/* Menú 3 puntos */}
                      <FincaOptionsMenu
                        finca={f}
                        onEditar={(finca) => setFincaParaEditar(finca)}
                        onCambiarFoto={(finca) => setFincaParaFoto(finca)}
                      />
                    </div>

                    <div className="finca-card-main-body">
                      <h3 className="finca-title-text">{f.nombre}</h3>

                      <div className="finca-geo-location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{f.municipio}, {f.departamento}</span>
                      </div>

                      {f.nombreCafetero && (
                        <div className="finca-owner-info">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span>Encargado: <strong>{f.nombreCafetero}</strong></span>
                        </div>
                      )}

                      <div className="finca-specs-tags">
                        {f.altitud && <span className="spec-pill">{f.altitud} msnm</span>}
                        {f.area && <span className="spec-pill">{f.area} ha</span>}
                        <span className="spec-pill variety-pill">Café Especial</span>
                      </div>

                      <p className="finca-assignment-date">
                        Asignación: {f.fechaAsignada
                          ? new Date(f.fechaAsignada).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '-'}
                      </p>

                      <div className="finca-internal-counters">
                        <div className="internal-stat">
                          <strong>{cultivos.length}</strong>
                          <span>Cultivos</span>
                        </div>
                        <div className="internal-stat">
                          <strong>{monitoreosPorFinca[f.idFinca] ?? 0}</strong>
                          <span>Monitoreos</span>
                        </div>
                        <div className="internal-stat">
                          <strong>0</strong>
                          <span>Alertas</span>
                        </div>
                      </div>

                      <button
                        className="btn-card-action-trigger"
                        disabled={!activoEsTrue(f.activo)}
                        onClick={!activoEsTrue(f.activo) ? undefined : () => onNavigate?.('cultivos', { ...f, totalCultivos: cultivos.length, fotoUrl: fotosPorFinca[f.idFinca] || f.fotoUrl })}
                      >
                        Ver cultivos de la finca
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── PAGINACIÓN ──────────────────────────────────────── */}
            <div className="cl-pagination-bar">
              <span className="cl-pagination-info">
                {fincasAsignadas.length > 0
                  ? `Mostrando ${(paginaActual - 1) * FINCAS_POR_PAGINA + 1} a ${Math.min(paginaActual * FINCAS_POR_PAGINA, fincasAsignadas.length)} de ${fincasAsignadas.length} fincas`
                  : '0 fincas'}
              </span>
              {totalPaginas > 1 && (
                <div className="cl-pagination-controls">
                  <button className="cl-page-btn" onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1} aria-label="Anterior">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                    <button key={n} className={`cl-page-btn cl-page-number${n === paginaActual ? ' active' : ''}`} onClick={() => irAPagina(n)}>
                      {n}
                    </button>
                  ))}
                  <button className="cl-page-btn" onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} aria-label="Siguiente">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* MODAL CREAR FINCA */}
      {showCrearModal && (
        <div className="cl-modal-overlay" onClick={() => { setShowCrearModal(false); setFormError('') }}>
          <div className="cl-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h2 className="cl-modal-title">Registrar nueva finca</h2>
            <form className="cl-modal-form" onSubmit={handleCreate}>
              <div className="cl-input-group">
                <label>Nombre de la finca</label>
                <input name="nombre_finca" value={form.nombre_finca} onChange={handleChange} placeholder="Ej. Finca La Esperanza" required />
              </div>
              <div className="cl-modal-form-row">
                <div className="cl-input-group">
                  <label>Municipio</label>
                  <input name="municipio" value={form.municipio} onChange={handleChange} placeholder="Ej. Pitalito" required />
                </div>
                <div className="cl-input-group">
                  <label>Departamento</label>
                  <input name="departamento" value={form.departamento} onChange={handleChange} placeholder="Ej. Huila" required />
                </div>
              </div>
              <div className="cl-modal-form-row">
                <div className="cl-input-group">
                  <label>Altitud (msnm)</label>
                  <input name="altitud_msnm" value={form.altitud_msnm} onChange={handleChange} placeholder="Ej. 1750" type="number" step="any" />
                </div>
                <div className="cl-input-group">
                  <label>Área (hectáreas)</label>
                  <input name="area_hectareas" value={form.area_hectareas} onChange={handleChange} placeholder="Ej. 4.5" type="number" step="any" />
                </div>
              </div>
              <div className="cl-input-group">
                <label>Coordenadas de Ubicación</label>
                <button type="button" className="btn-cl-map-trigger" onClick={openUbicacionPicker}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {form.latitud && form.longitud ? `Ubicación: ${form.latitud}, ${form.longitud}` : 'Abrir mapa interactivo'}
                </button>
              </div>
              <div className="cl-input-group">
                <label>Caficultor / Propietario <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="id_cafetero" value={form.id_cafetero} onChange={handleChange} required>
                  <option value="">-- Seleccione un caficultor --</option>
                  {cafeteros.map((c) => (
                    <option key={c.idUsuario} value={c.idUsuario}>{c.nombre} {c.apellido}</option>
                  ))}
                </select>
              </div>
              {formError && <p className="cl-form-error-msg">{formError}</p>}
              <div className="cl-modal-actions">
                <button type="button" className="btn-cl-secondary" onClick={() => setShowCrearModal(false)}>Cancelar</button>
                <button type="submit" className="btn-brand-primary" disabled={saving}>
                  {saving ? <Loading type="inline" text="Registrando..." /> : 'Registrar Finca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MAPA */}
      {showUbicacionModal && (
        <UbicacionPickerModal
          latInicial={ubicacionLat}
          lngInicial={ubicacionLng}
          onConfirm={handleUbicacionConfirm}
          onCancel={() => setShowUbicacionModal(false)}
        />
      )}

      {/* MODAL EDITAR FINCA */}
      {fincaParaEditar && (
        <EditarFincaModal
          finca={fincaParaEditar}
          cafeteros={cafeteros}
          onClose={() => setFincaParaEditar(null)}
          onGuardado={fetchData}
        />
      )}

      {/* MODAL FOTO FINCA */}
      {fincaParaFoto && (
        <FotoFincaModal
          finca={fincaParaFoto}
          onClose={() => setFincaParaFoto(null)}
          onFotoActualizada={handleFotoActualizada}
        />
      )}

      {/* MODAL CREAR PRIMER CULTIVO (obligatorio tras crear finca) */}
      {showCrearCultivoModal && nuevaFincaData && (
        <div className="cl-modal-overlay" onClick={() => {}}>
          <div className="cl-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h2 className="cl-modal-title">Crear primer cultivo</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
              La finca <strong>{nuevaFincaData.nombreFinca || nuevaFincaData.nombre || '—'}</strong> debe tener al menos un cultivo.
            </p>
            <form className="cl-modal-form" onSubmit={handleCrearCultivo}>
              <div className="cl-input-group">
                <label>Nombre del cultivo <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  name="nombre_cultivo"
                  value={cultivoForm.nombre_cultivo}
                  onChange={(e) => setCultivoForm({ ...cultivoForm, nombre_cultivo: e.target.value })}
                  placeholder="Ej. Lote Central - Café"
                  required
                />
              </div>
              <div className="cl-input-group">
                <label>Variedad / Tipo de cultivo <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  name="tipo_cultivo"
                  value={cultivoForm.tipo_cultivo}
                  onChange={(e) => setCultivoForm({ ...cultivoForm, tipo_cultivo: e.target.value })}
                  placeholder="Ej. Castillo, Bourbon, Catimor"
                  required
                />
              </div>
              {formError && <p className="cl-form-error-msg">{formError}</p>}
              <div className="cl-modal-actions">
                <button type="submit" className="btn-brand-primary" disabled={cultivoSaving}>
                  {cultivoSaving ? <Loading type="inline" text="Creando..." /> : 'Crear cultivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}