import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import api from '../../../services/api'
import { BiHome, BiLeaf, BiCalendarCheck, BiPlus, BiDotsVerticalRounded, BiMapPin, BiUser, BiChevronRight } from 'react-icons/bi'
import './DashboardExperto.css'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

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
  } catch {
    return null
  }
}

function UbicacionPickerModal({ latInicial, lngInicial, onConfirm, onCancel }) {
  const [lat, setLat] = useState(latInicial || '')
  const [lng, setLng] = useState(lngInicial || '')

  const center =
    lat && lng
      ? [parseFloat(lat), parseFloat(lng)]
      : [4.5709, -74.2973]

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
            <input
              placeholder="Latitud"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              type="number"
              step="any"
            />
          </div>
          <div className="cl-input-group">
            <label>Longitud</label>
            <input
              placeholder="Longitud"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              type="number"
              step="any"
            />
          </div>
        </div>

        <div className="cl-map-wrapper">
          <MapContainer
            center={center}
            zoom={lat && lng ? 13 : 6}
            style={{
              height: '280px',
              width: '100%',
              borderRadius: '16px',
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <ClickHandler />
            {lat && lng && (
              <Marker position={[parseFloat(lat), parseFloat(lng)]} />
            )}
          </MapContainer>
        </div>

        <div className="cl-modal-actions" style={{ marginTop: '1.5rem' }}>
          <button className="btn-cl-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-brand-primary" onClick={() => onConfirm(lat, lng)}>
            Confirmar ubicación
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardExperto({ onNavigate }) {
  const [fincasAsignadas, setFincasAsignadas] = useState([])
  const [cultivosPorFinca, setCultivosPorFinca] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCrearModal, setShowCrearModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    nombre_finca: '',
    municipio: '',
    departamento: '',
    altitud_msnm: '',
    area_hectareas: '',
    latitud: '',
    longitud: '',
    id_cafetero: '',
  })

  const [cafeteros, setCafeteros] = useState([])

  const [showUbicacionModal, setShowUbicacionModal] = useState(false)
  const [ubicacionLat, setUbicacionLat] = useState('')
  const [ubicacionLng, setUbicacionLng] = useState('')

  const payload = decodeTokenPayload()
  const nombreExperto = payload?.nombre || 'Experto'
  const idExperto = payload?.id

  // Cálculo dinámico de cultivos totales para los KPIs superiores
  const totalCultivosContador = Object.values(cultivosPorFinca).reduce(
    (acc, lista) => acc + (lista?.length || 0), 0
  )

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      if (!idExperto) {
        setError('No se encontró el usuario experto en la sesión. Cierra sesión de nuevo.')
        return
      }

      const [asignacionesRes, cultivosRes, cafeterosRes] = await Promise.all([
        api.get('/asignaciones_expertos'),
        api.get('/cultivos'),
        api.get('/cafeteros'),
      ])

      const cafeterosData = Array.isArray(cafeterosRes.data)
        ? cafeterosRes.data
        : (cafeterosRes.data?.data ?? [])
      setCafeteros(cafeterosData)

      const asignaciones = getArrayData(asignacionesRes.data).filter(
        (a) => Number(a.idExperto) === Number(idExperto)
      )

      const fincas = asignaciones
        .map((a) => {
          const f = a.finca || {}
          const cafetero = cafeterosData.find(
            (c) => Number(c.idUsuario) === Number(f.idUsuario)
          )
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
        })
        .filter((f) => f.idFinca)

      const unicas = [...new Map(fincas.map((f) => [f.idFinca, f])).values()]
      setFincasAsignadas(unicas)

      const todosCultivos = getArrayData(cultivosRes.data)
      const cultivosMap = {}
      unicas.forEach((f) => {
        cultivosMap[f.idFinca] = todosCultivos.filter(
          (c) => Number(c.idFinca) === Number(f.idFinca)
        )
      })
      setCultivosPorFinca(cultivosMap)
    } catch (err) {
      if (err?.response?.status === 403) {
        setError('Acceso denegado por el servidor.')
      } else {
        setError(err?.response?.data?.message || 'No se pudo cargar el dashboard.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
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

  const handleCreate = async (e) => {
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

      const fincaRes = await api.post('/fincas', fincaPayload)
      const nuevaFinca = fincaRes.data?.data || fincaRes.data

      await api.post('/asignaciones_expertos', {
        idExperto: idExperto,
        idFinca: nuevaFinca.idFinca,
        fechaAsignada: new Date().toISOString().split('T')[0],
      })

      setForm({
        nombre_finca: '',
        municipio: '',
        departamento: '',
        altitud_msnm: '',
        area_hectareas: '',
        latitud: '',
        longitud: '',
        id_cafetero: '',
      })
      setShowCrearModal(false)
      fetchData()
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'No se pudo registrar la finca.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="coffeelife-dashboard-container">
      {/* 🚀 NUEVA SECCIÓN DE ENCABEZADO INTEGRADO CON CONTADORES KPIs */}
      <div className="dashboard-header-flex">
        <div className="welcome-banner-text">
          <h1 className="welcome-main-title">¡Hola, {nombreExperto}!</h1>
          <p className="welcome-subtitle">Aquí puedes gestionar las fincas que tienes asignadas.</p>
        </div>

        <div className="header-kpi-cards-wrapper">
          {/* Tarjeta 1 */}
          <div className="kpi-card-item">
            <div className="kpi-icon-container home-kpi">
              <BiHome size={20} />
            </div>
            <div className="kpi-data-text">
              <span className="kpi-number-val">{fincasAsignadas.length}</span>
              <span className="kpi-label-name">Fincas asignadas</span>
            </div>
          </div>

          {/* Tarjeta 2 */}
          <div className="kpi-card-item">
            <div className="kpi-icon-container leaf-kpi">
              <BiLeaf size={20} />
            </div>
            <div className="kpi-data-text">
              <span className="kpi-number-val">{totalCultivosContador}</span>
              <span className="kpi-label-name">Cultivos totales</span>
            </div>
          </div>

          {/* Tarjeta 3 */}
          <div className="kpi-card-item">
            <div className="kpi-icon-container task-kpi">
              <BiCalendarCheck size={20} />
            </div>
            <div className="kpi-data-text">
              <span className="kpi-number-val">56</span>
              <span className="kpi-label-name">Actividades realizadas</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="cl-state-alert error">{error}</div>}

      {/* SECCIÓN PRINCIPAL DE FINCAS */}
      <div className="fincas-content-section">
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
          <div className="cl-loading-box"><p>Cargando fincas asignadas...</p></div>
        ) : fincasAsignadas.length === 0 ? (
          <div className="cl-loading-box alert"><p>No se encontraron fincas asignadas para tu perfil de experto.</p></div>
        ) : (
          <div className="coffeelife-fincas-grid">
            {fincasAsignadas.map((f) => {
              const cultivos = cultivosPorFinca[f.idFinca] || []
              return (
                <div key={f.idFinca} className="coffeelife-finca-card">
                  
                  <div className="finca-card-img-wrapper">
                    <img 
                      src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80" 
                      alt={f.nombre} 
                    />
                    <div className="finca-card-floating-badge">
                      <span className={`status-dot ${f.activo !== false ? 'active' : 'inactive'}`}></span>
                      {f.activo !== false ? 'Activa' : 'Inactiva'}
                    </div>
                    <button className="finca-options-trigger" title="Opciones">
                      <BiDotsVerticalRounded size={16} />
                    </button>
                  </div>

                  <div className="finca-card-main-body">
                    <h3 className="finca-title-text">{f.nombre}</h3>
                    
                    <div className="finca-geo-location">
                      <BiMapPin size={14} />
                      <span>{f.municipio}, {f.departamento}</span>
                    </div>

                    {f.nombreCafetero && (
                      <div className="finca-owner-info">
                        <BiUser size={14} />
                        <span>Encargado: <strong>{f.nombreCafetero}</strong></span>
                      </div>
                    )}

                    <div className="finca-specs-tags">
                      {f.altitud && <span className="spec-pill">{f.altitud} msnm</span>}
                      {f.area && <span className="spec-pill">{f.area} ha</span>}
                      <span className="spec-pill variety-pill">Café Especial</span>
                    </div>

                    <p className="finca-assignment-date">
                      Asignación: {f.fechaAsignada ? new Date(f.fechaAsignada).toLocaleDateString('es-CO', {day: 'numeric', month: 'short', year: 'numeric'}) : '-'}
                    </p>

                    <div className="finca-internal-counters">
                      <div className="internal-stat">
                        <strong>{cultivos.length}</strong>
                        <span>Cultivos</span>
                      </div>
                      <div className="internal-stat">
                        <strong>--</strong>
                        <span>Monitoreos</span>
                      </div>
                      <div className="internal-stat">
                        <strong>0</strong>
                        <span>Alertas</span>
                      </div>
                    </div>

                    <button 
                      className="btn-card-action-trigger" 
                      onClick={() => onNavigate?.('cultivos', { ...f, totalCultivos: cultivos.length })}
                    >
                      Ver cultivos de la finca
                      <BiChevronRight size={16} />
                    </button>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL REGISTRO */}
      {showCrearModal && (
        <div className="cl-modal-overlay" onClick={() => setShowCrearModal(false)}>
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
                  <BiMapPin size={16} />
                  {form.latitud && form.longitud ? `Ubicación seteada: ${form.latitud}, ${form.longitud}` : 'Abrir mapa interactivo'}
                </button>
              </div>

              <div className="cl-input-group">
                <label>Caficultor / Propietario</label>
                <select name="id_cafetero" value={form.id_cafetero} onChange={handleChange}>
                  <option value="">Seleccione un caficultor (opcional)</option>
                  {cafeteros.map((c) => (
                    <option key={c.idUsuario} value={c.idUsuario}>
                      {c.nombre} {c.apellido}
                    </option>
                  ))}
                </select>
              </div>

              {formError && <p className="cl-form-error-msg">{formError}</p>}

              <div className="cl-modal-actions">
                <button type="button" className="btn-cl-secondary" onClick={() => setShowCrearModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-brand-primary" disabled={saving}>
                  {saving ? 'Registrando...' : 'Registrar Finca'}
                </button>
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