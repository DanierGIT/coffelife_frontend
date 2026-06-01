import { useEffect, useState } from 'react'
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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <h2 className="modal-title">Seleccionar ubicaci&oacute;n</h2>

        <div className="finca-form-row" style={{ marginTop: '16px' }}>
          <input
            placeholder="Latitud"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            type="number"
            step="any"
          />
          <input
            placeholder="Longitud"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            type="number"
            step="any"
          />
        </div>

        <div className="map-wrapper" style={{ marginTop: '12px' }}>
          <MapContainer
            center={center}
            zoom={lat && lng ? 13 : 6}
            style={{
              height: '280px',
              width: '100%',
              borderRadius: '10px',
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

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className="btn-primary" onClick={() => onConfirm(lat, lng)}>
            Confirmar
          </button>
          <button className="btn-secondary" onClick={onCancel}>
            Cancelar
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

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      if (!idExperto) {
        setError('No se encontro el usuario experto en la sesion. Cierra sesion e ingresa nuevamente.')
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
        setError('Acceso denegado por backend.')
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
    <div className="dash-exp">
      <div className="dex-greeting">
        <h1 className="dex-greeting-title">Hola de nuevo, {nombreExperto}</h1>
        <p className="dex-greeting-sub">Aqui puedes gestionar tus fincas asignadas</p>
      </div>

      {error && <div className="dash-exp-alert">{error}</div>}

      <div className="dash-exp-section">
        <div className="dex-section-header">
          <h2 className="dash-exp-section-title" style={{ margin: 0 }}>Mis fincas asignadas</h2>
          <button className="dex-btn-agregar" onClick={() => setShowCrearModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar fincas
          </button>
        </div>

        {loading ? (
          <p className="dex-empty-text">Cargando...</p>
        ) : fincasAsignadas.length === 0 ? (
          <p className="dex-empty-text">No hay fincas asignadas para este experto.</p>
        ) : (
          <div className="dex-fincas-grid">
            {fincasAsignadas.map((f) => {
              const cultivos = cultivosPorFinca[f.idFinca] || []
              return (
                <div key={f.idFinca} className="dex-card">
                  <div className="dex-card-top">
                    <div className="dex-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                        <line x1="8" y1="2" x2="8" y2="18"/>
                        <line x1="16" y1="6" x2="16" y2="22"/>
                      </svg>
                    </div>
                    <span className={`dex-card-status ${f.activo !== false ? 'activa' : 'inactiva'}`}>
                      {f.activo !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <h3 className="dex-card-name">{f.nombre}</h3>
                  <p className="dex-card-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {f.municipio}, {f.departamento}
                  </p>

                  <div className="dex-card-meta">
                    {f.altitud && <span className="dex-card-tag">{f.altitud} m.s.n.m.</span>}
                    {f.area && <span className="dex-card-tag">{f.area} ha</span>}
                  </div>

                  {f.nombreCafetero && (
                    <p className="dex-card-cafetero">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Cafetero: {f.nombreCafetero}
                    </p>
                  )}

                  <p className="dex-card-date">
                    Asignada: {f.fechaAsignada ? new Date(f.fechaAsignada).toLocaleDateString('es-CO') : '-'}
                  </p>

                  <div className="dex-card-footer">
                    <span className="dex-crop-count">
                      Cultivos: {cultivos.length}
                    </span>
                    <button className="dex-card-btn" onClick={() => onNavigate?.('cultivos', { ...f, totalCultivos: cultivos.length })}>
                      Ver cultivos
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCrearModal && (
        <div className="modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Registrar nueva finca</h2>
            <form className="finca-form" onSubmit={handleCreate}>
              <div className="finca-form-row">
                <input name="nombre_finca" value={form.nombre_finca} onChange={handleChange} placeholder="Nombre de la finca" required />
                <input name="municipio" value={form.municipio} onChange={handleChange} placeholder="Municipio" required />
                <input name="departamento" value={form.departamento} onChange={handleChange} placeholder="Departamento" required />
              </div>
              <div className="finca-form-row">
                <input name="altitud_msnm" value={form.altitud_msnm} onChange={handleChange} placeholder="Altitud (msnm)" type="number" step="any" />
                <input name="area_hectareas" value={form.area_hectareas} onChange={handleChange} placeholder="Área (hectáreas)" type="number" step="any" />
                <button type="button" className="btn-ubicacion" onClick={openUbicacionPicker}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {form.latitud && form.longitud ? `Ubicación: ${form.latitud}, ${form.longitud}` : 'Seleccionar ubicación'}
                </button>
              </div>
              <div className="finca-form-row">
                <select name="id_cafetero" value={form.id_cafetero} onChange={handleChange} className="finca-select">
                  <option value="">Seleccione un caficultor (opcional)</option>
                  {cafeteros.map((c) => (
                    <option key={c.idUsuario} value={c.idUsuario}>
                      {c.nombre} {c.apellido}
                    </option>
                  ))}
                </select>
              </div>
              {formError && <p className="modal-error">{formError}</p>}
              <div className="finca-form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Registrando...' : 'Registrar finca'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowCrearModal(false)}>Cancelar</button>
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
