/**
 * Fincas.jsx
 * Igual que antes pero con mapa Leaflet para seleccionar/ver ubicación.
 * Requiere instalar: npm install leaflet react-leaflet
 * Y en tu index.html o main.jsx importar el CSS:
 *   import 'leaflet/dist/leaflet.css'
 */
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './Fincas.css'

// Fix ícono por defecto de Leaflet (problema conocido con bundlers)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Helpers ──────────────────────────────────────────
const toFloat = (val) => val !== '' && val !== null && val !== undefined
  ? parseFloat(val)
  : null

// ── Selector de coordenadas en el mapa ──────────────
function MapPicker({ latitud, longitud, onChange }) {
  const center = latitud && longitud
    ? [parseFloat(latitud), parseFloat(longitud)]
    : [4.5709, -74.2973]

  function ClickHandler() {
    useMapEvents({
      click(e) {
        onChange(
          e.latlng.lat.toFixed(6),
          e.latlng.lng.toFixed(6),
        )
      },
    })
    return null
  }

  return (
    <div className="map-wrapper">
      <p className="map-hint">📍 Haz clic en el mapa para seleccionar la ubicación</p>
      <MapContainer
        center={center}
        zoom={latitud && longitud ? 13 : 6}
        style={{ height: '260px', width: '100%', borderRadius: '10px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        />
        <ClickHandler />
        {latitud && longitud && (
          <Marker position={[parseFloat(latitud), parseFloat(longitud)]} />
        )}
      </MapContainer>
    </div>
  )
}

// ── Mapa de solo lectura (fila de tabla) ─────────────
function MapaFinca({ latitud, longitud }) {
  if (!latitud || !longitud) return null
  return (
    <MapContainer
      center={[parseFloat(latitud), parseFloat(longitud)]}
      zoom={13}
      style={{ height: '140px', width: '100%', borderRadius: '8px', marginTop: '6px' }}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      zoomControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[parseFloat(latitud), parseFloat(longitud)]} />
    </MapContainer>
  )
}

// ── Modal de edición ─────────────────────────────────
function EditModal({ finca, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre_finca:   finca.nombreFinca   || '',
    municipio:      finca.municipio     || '',
    departamento:   finca.departamento  || '',
    latitud:        finca.latitud       || '',
    longitud:       finca.longitud      || '',
    altitud_msnm:   finca.altitudMsnm   || '',
    area_hectareas: finca.areaHectareas || '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange   = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleMapClick = (lat, lng) => setForm((f) => ({ ...f, latitud: lat, longitud: lng }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        nombre_finca:   form.nombre_finca,
        municipio:      form.municipio,
        departamento:   form.departamento,
        latitud:        toFloat(form.latitud),
        longitud:       toFloat(form.longitud),
        altitud_msnm:   toFloat(form.altitud_msnm),
        area_hectareas: toFloat(form.area_hectareas),
      }
      await api.put(`/fincas/${finca.idFinca}`, payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar los cambios.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar finca</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>Nombre de la finca
              <input name="nombre_finca" value={form.nombre_finca} onChange={handleChange} required />
            </label>
            <label>Municipio
              <input name="municipio" value={form.municipio} onChange={handleChange} required />
            </label>
          </div>
          <label>Departamento
            <input name="departamento" value={form.departamento} onChange={handleChange} required />
          </label>
          <div className="modal-row">
            <label>Latitud
              <input name="latitud" value={form.latitud} onChange={handleChange} placeholder="Ej: 4.7110" />
            </label>
            <label>Longitud
              <input name="longitud" value={form.longitud} onChange={handleChange} placeholder="Ej: -74.0721" />
            </label>
          </div>

          {/* Mapa interactivo */}
          <MapPicker
            latitud={form.latitud}
            longitud={form.longitud}
            onChange={handleMapClick}
          />

          <div className="modal-row">
            <label>Altitud (m.s.n.m.)
              <input name="altitud_msnm" value={form.altitud_msnm} onChange={handleChange} placeholder="Ej: 1800" />
            </label>
            <label>Área (hectáreas)
              <input name="area_hectareas" value={form.area_hectareas} onChange={handleChange} placeholder="Ej: 5.2" />
            </label>
          </div>

          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────
export default function Fincas() {
  const { user } = useAuth()

  const [fincas,       setFincas]       = useState([])
  const [editingFinca, setEditingFinca] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')

  const [form, setForm] = useState({
    nombre_finca:   '',
    municipio:      '',
    departamento:   '',
    latitud:        '',
    longitud:       '',
    altitud_msnm:   '',
    area_hectareas: '',
  })

  const getFincas = async () => {
    try {
      const res = await api('/fincas')
      setFincas(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch {
      setError('No se pudieron cargar las fincas.')
    }
  }

  useEffect(() => { getFincas() }, [])

  const handleChange   = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleMapClick = (lat, lng) => setForm((f) => ({ ...f, latitud: lat, longitud: lng }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      
        console.log("Usuario completo:", user)

const payload = {
  id_usuario:
    user?.id ||
    user?.id_usuario ||
    user?.idUsuario,

  nombre_finca: form.nombre_finca,
  municipio: form.municipio,
  departamento: form.departamento,
  latitud: toFloat(form.latitud),
  longitud: toFloat(form.longitud),
  altitud_msnm: toFloat(form.altitud_msnm),
  area_hectareas: toFloat(form.area_hectareas),
}

console.log("Payload enviado:", payload)

      await api.post('/fincas', payload)
      setForm({
        nombre_finca: '', municipio: '', departamento: '',
        latitud: '', longitud: '', altitud_msnm: '', area_hectareas: '',
      })
      setSuccess('Finca registrada correctamente.')
      getFincas()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo registrar la finca.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta finca?')) return
    try {
      await api.delete(`/fincas/${id}`)
      getFincas()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar la finca.')
    }
  }

  return (
    <>
      <h1 className="admin-page-title">Fincas</h1>

      {/* ── Formulario de registro ── */}
      <div className="admin-form-card">
        <h2 className="admin-form-title">Registrar nueva finca</h2>
        <form className="finca-form" onSubmit={handleCreate}>
          <div className="finca-form-row">
            <input name="nombre_finca"  value={form.nombre_finca}  onChange={handleChange} placeholder="Nombre de la finca" required />
            <input name="municipio"     value={form.municipio}     onChange={handleChange} placeholder="Municipio"          required />
            <input name="departamento"  value={form.departamento}  onChange={handleChange} placeholder="Departamento"       required />
          </div>
          <div className="finca-form-row">
            <input name="latitud"        value={form.latitud}        onChange={handleChange} placeholder="Latitud (ej: 4.7110)"    />
            <input name="longitud"       value={form.longitud}       onChange={handleChange} placeholder="Longitud (ej: -74.0721)" />
            <input name="altitud_msnm"   value={form.altitud_msnm}   onChange={handleChange} placeholder="Altitud m.s.n.m."        />
            <input name="area_hectareas" value={form.area_hectareas} onChange={handleChange} placeholder="Área (hectáreas)"        />
          </div>

          {/* Mapa interactivo */}
          <MapPicker
            latitud={form.latitud}
            longitud={form.longitud}
            onChange={handleMapClick}
          />

          {error   && <p className="modal-error">{error}</p>}
          {success && <p className="finca-success">{success}</p>}
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar finca'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Tabla de fincas ── */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Municipio</th>
              <th>Departamento</th>
              <th>Altitud</th>
              <th>Área (ha)</th>
              <th>Ubicación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {fincas.length === 0 ? (
              <tr><td colSpan={8} className="finca-empty">No hay fincas registradas aún.</td></tr>
            ) : fincas.map((f) => (
              <tr key={f.idFinca}>
                <td>{f.idFinca}</td>
                <td>{f.nombreFinca}</td>
                <td>{f.municipio}</td>
                <td>{f.departamento}</td>
                <td>{f.altitudMsnm ? `${f.altitudMsnm} m` : '—'}</td>
                <td>{f.areaHectareas ?? '—'}</td>
                <td className="td-map">
                  {f.latitud && f.longitud
                    ? <MapaFinca latitud={f.latitud} longitud={f.longitud} />
                    : <span className="no-coords">Sin coordenadas</span>
                  }
                </td>
                <td>
                  <button className="btn-edit"   onClick={() => setEditingFinca(f)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDelete(f.idFinca)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingFinca && (
        <EditModal
          finca={editingFinca}
          onClose={() => setEditingFinca(null)}
          onSaved={getFincas}
        />
      )}
    </>
  )
}
