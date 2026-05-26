import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './Fincas.css'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const toFloat = (val) =>
  val !== '' && val !== null && val !== undefined
    ? parseFloat(val)
    : null

function UbicacionPickerModal({ 
  latInicial, lngInicial, onConfirm, onCancel 
}) {

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
    <div
      className="modal-overlay"
      onClick={onCancel}
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <h2>Seleccionar ubicación</h2>

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
              <Marker
                position={[parseFloat(lat), parseFloat(lng)]}
              />
            )}
          </MapContainer>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '20px',
          }}
        >
          <button
            className="btn-primary"
            onClick={() => onConfirm(lat, lng)}
          >
            Confirmar
          </button>
          <button
            className="btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function MapaGeneral({ fincas }) {

  const fincasConCoords = fincas.filter(
    (f) => f.latitud && f.longitud
  )

  if (fincasConCoords.length === 0) return null

  const center = [
    parseFloat(fincasConCoords[0].latitud),
    parseFloat(fincasConCoords[0].longitud),
  ]

  return (
    <div className="map-wrapper">
      <MapContainer
        center={center}
        zoom={7}
        style={{
          height: '400px',
          width: '100%',
          borderRadius: '12px',
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {fincasConCoords.map((f) => (
          <Marker
            key={f.idFinca}
            position={[
              parseFloat(f.latitud),
              parseFloat(f.longitud),
            ]}
          >
            <Tooltip direction="top" offset={[0, -10]} permanent={false}>
              <div className="map-tooltip-content">
                <strong>{f.nombreFinca}</strong><br />
                {f.municipio}, {f.departamento}<br />
                Cultivos: {f.totalCultivos ?? 0}<br />
                {f.nombreExperto
                  ? `Experto: ${f.nombreExperto}`
                  : 'Sin experto asignado'}
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default function Fincas() {

  const { user } = useAuth()

  const [fincas, setFincas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [expertos, setExpertos] = useState([])
  const [selectedFinca, setSelectedFinca] = useState(null)
  const [selectedExperto, setSelectedExperto] = useState('')
  const [showAsignarModal, setShowAsignarModal] = useState(false)

  const [showCultivoModal, setShowCultivoModal] = useState(false)
  const [selectedFincaForCultivo, setSelectedFincaForCultivo] = useState(null)
  const [estadosCultivo, setEstadosCultivo] = useState([])
  const [cultivoLoading, setCultivoLoading] = useState(false)
  const [cultivoForm, setCultivoForm] = useState({
    nombre_cultivo: '',
    tipo_cultivo: '',
    id_estado_cultivo: '',
  })

  const [form, setForm] = useState({
    nombre_finca: '',
    municipio: '',
    departamento: '',
    latitud: '',
    longitud: '',
    altitud_msnm: '',
    area_hectareas: '',
  })

  const [showUbicacionModal, setShowUbicacionModal] = useState(false)
  const [ubicacionTarget, setUbicacionTarget] = useState('create')
  const [ubicacionLat, setUbicacionLat] = useState('')
  const [ubicacionLng, setUbicacionLng] = useState('')

  const [editingFinca, setEditingFinca] = useState(null)
  const [editForm, setEditForm] = useState({
    nombre_finca: '',
    municipio: '',
    departamento: '',
    latitud: '',
    longitud: '',
    altitud_msnm: '',
    area_hectareas: '',
  })

  const getFincas = async () => {

    try {

      const [fincasRes, asignacionesRes, cultivosRes] = await Promise.all([
        api.get('/fincas'),
        api.get('/asignaciones_expertos'),
        api.get('/cultivos?limit=1000'),
      ])

      const fincasData = Array.isArray(fincasRes.data)
        ? fincasRes.data
        : (fincasRes.data?.data ?? [])

      const asignaciones = Array.isArray(asignacionesRes.data)
        ? asignacionesRes.data
        : (asignacionesRes.data?.data ?? [])

      const cultivosData = Array.isArray(cultivosRes.data)
        ? cultivosRes.data
        : (cultivosRes.data?.data ?? [])

      const cultivosPorFinca = {}
      cultivosData.forEach((c) => {
        const id = c.idFinca
        cultivosPorFinca[id] = (cultivosPorFinca[id] || 0) + 1
      })

      const fincasConExpertos = fincasData.map((finca) => {
        const asignacion = asignaciones.find(
          (a) => Number(a.idFinca) === Number(finca.idFinca)
        )
        const result = {
          ...finca,
          totalCultivos: cultivosPorFinca[finca.idFinca] || 0,
        }
        if (asignacion?.experto) {
          return {
            ...result,
            nombreExperto: `${asignacion.experto.nombre} ${asignacion.experto.apellido}`,
            idAsignacion: asignacion.idAsignacion,
            idExpertoAsignado: asignacion.experto.idUsuario,
          }
        }
        return { ...result, nombreExperto: null, idAsignacion: null, idExpertoAsignado: null }
      })

      setFincas(fincasConExpertos)

    } catch {

      setError('No se pudieron cargar las fincas.')
    }
  }

  const getExpertos = async () => {

    try {

      const res = await api.get('/expertos')

      const expertos = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? [])

      setExpertos(expertos)

    } catch (error) {

      console.log(error)
    }
  }

  const getEstadosCultivo = async () => {

    try {

      const res = await api.get('/cat_estados_cultivo')

      const data = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? [])

      setEstadosCultivo(data)

    } catch (error) {

      console.log(error)
    }
  }

  useEffect(() => {

    getFincas()
    getExpertos()
    getEstadosCultivo()

  }, [])

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleEditChange = (e) => {

    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    })
  }

  const openUbicacionPicker = (target) => {
    const isCreate = target === 'create'
    setUbicacionLat(isCreate ? form.latitud : editForm.latitud)
    setUbicacionLng(isCreate ? form.longitud : editForm.longitud)
    setUbicacionTarget(target)
    setShowUbicacionModal(true)
  }

  const handleUbicacionConfirm = (lat, lng) => {
    if (ubicacionTarget === 'create') {
      setForm((f) => ({ ...f, latitud: lat, longitud: lng }))
    } else {
      setEditForm((f) => ({ ...f, latitud: lat, longitud: lng }))
    }
    setShowUbicacionModal(false)
  }

  const handleCreate = async (e) => {

    e.preventDefault()

    setLoading(true)
    setError('')
    setSuccess('')

    try {

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

      await api.post('/fincas', payload)

      setForm({
        nombre_finca: '',
        municipio: '',
        departamento: '',
        latitud: '',
        longitud: '',
        altitud_msnm: '',
        area_hectareas: '',
      })

      setSuccess('Finca registrada correctamente.')

      getFincas()

    } catch (err) {

      console.log(err.response?.data)

      setError(
        err?.response?.data?.message ||
        'No se pudo registrar la finca.'
      )

    } finally {

      setLoading(false)
    }
  }

  const openEditModal = (finca) => {

    setEditingFinca(finca)
    setEditForm({
      nombre_finca: finca.nombreFinca || '',
      municipio: finca.municipio || '',
      departamento: finca.departamento || '',
      latitud: finca.latitud || '',
      longitud: finca.longitud || '',
      altitud_msnm: finca.altitudMsnm || '',
      area_hectareas: finca.areaHectareas || '',
    })
  }

  const handleUpdate = async (e) => {

    e.preventDefault()

    if (!editingFinca) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {

      const payload = {
        nombre_finca: editForm.nombre_finca,
        municipio: editForm.municipio,
        departamento: editForm.departamento,
        latitud: toFloat(editForm.latitud),
        longitud: toFloat(editForm.longitud),
        altitud_msnm: toFloat(editForm.altitud_msnm),
        area_hectareas: toFloat(editForm.area_hectareas),
      }

      await api.put(`/fincas/${editingFinca.idFinca}`, payload)

      setSuccess('Finca actualizada correctamente.')

      setEditingFinca(null)
      getFincas()

    } catch (err) {

      console.log(err.response?.data)

      setError(
        err?.response?.data?.message ||
        'No se pudo actualizar la finca.'
      )

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

      setError(
        err?.response?.data?.message ||
        'No se pudo eliminar la finca.'
      )
    }
  }

  const openCultivoModal = (finca) => {
    setSelectedFincaForCultivo(finca)
    setCultivoForm({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })
    setShowCultivoModal(true)
  }

  const handleCultivoChange = (e) => {
    setCultivoForm({ ...cultivoForm, [e.target.name]: e.target.value })
  }

  const handleCreateCultivo = async (e) => {
    e.preventDefault()
    if (!cultivoForm.nombre_cultivo.trim() || !cultivoForm.tipo_cultivo.trim()) {
      alert('Nombre y tipo de cultivo son obligatorios')
      return
    }
    setCultivoLoading(true)
    try {
      const payload = {
        id_finca: selectedFincaForCultivo.idFinca,
        nombre_cultivo: cultivoForm.nombre_cultivo.trim(),
        tipo_cultivo: cultivoForm.tipo_cultivo.trim(),
        id_estado_cultivo: cultivoForm.id_estado_cultivo
          ? Number(cultivoForm.id_estado_cultivo)
          : undefined,
      }
      await api.post('/cultivos', payload)
      setShowCultivoModal(false)
      setSelectedFincaForCultivo(null)
      setCultivoForm({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })
      alert('Cultivo registrado correctamente.')
    } catch (err) {
      console.log(err.response?.data)
      alert(err?.response?.data?.message || 'No se pudo registrar el cultivo.')
    } finally {
      setCultivoLoading(false)
    }
  }

  const handleAsignarExperto = async () => {

    if (!selectedExperto || !selectedFinca) {
      alert('Selecciona un experto')
      return
    }

    try {

      const payload = {
        idExperto: Number(selectedExperto),
        idFinca: selectedFinca.idFinca,
        fechaAsignada: new Date().toISOString().split('T')[0],
      }

      // Si la finca ya tiene asignacion -> PUT (editar), si no -> POST (crear nueva)
      if (selectedFinca.idAsignacion) {
        await api.put(`/asignaciones_expertos/${selectedFinca.idAsignacion}`, payload)
      } else {
        await api.post('/asignaciones_expertos', payload)
      }

      const expertoSeleccionado = expertos.find(
        (exp) => exp.idUsuario == selectedExperto
      )

      const nombreExperto = `${expertoSeleccionado?.nombre} ${expertoSeleccionado?.apellido}`

      // Actualizar boton de forma inmediata
      setFincas((prev) =>
        prev.map((finca) =>
          finca.idFinca === selectedFinca.idFinca
            ? { ...finca, nombreExperto, idExpertoAsignado: Number(selectedExperto) }
            : finca
        )
      )

      setShowAsignarModal(false)
      setSelectedExperto('')
      setSelectedFinca(null)

      // Refetch para sincronizar idAsignacion actualizado desde el servidor
      await getFincas()

    } catch (error) {

      console.error('Error asignando experto:', error.response?.data || error)
      alert(
        error.response?.data?.message ||
        'No se pudo asignar el experto. Intenta de nuevo.'
      )
    }
  }

  return (
    <>

      <h1 className="admin-page-title">
        Fincas
      </h1>

      <div className="admin-form-card">

        <h2 className="admin-form-title">
          Registrar nueva finca
        </h2>

        <form
          className="finca-form"
          onSubmit={handleCreate}
        >

          <div className="finca-form-row">

            <input
              name="nombre_finca"
              value={form.nombre_finca}
              onChange={handleChange}
              placeholder="Nombre de la finca"
              required
            />

            <input
              name="municipio"
              value={form.municipio}
              onChange={handleChange}
              placeholder="Municipio"
              required
            />

            <input
              name="departamento"
              value={form.departamento}
              onChange={handleChange}
              placeholder="Departamento"
              required
            />

          </div>

          <div className="finca-form-row">

            <input
              name="altitud_msnm"
              value={form.altitud_msnm}
              onChange={handleChange}
              placeholder="Altitud (msnm)"
            />

            <input
              name="area_hectareas"
              value={form.area_hectareas}
              onChange={handleChange}
              placeholder="Área (hectáreas)"
            />

            <button
              type="button"
              className="btn-ubicacion"
              onClick={() => openUbicacionPicker('create')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {form.latitud && form.longitud
                ? `Ubicación: ${form.latitud}, ${form.longitud}`
                : 'Seleccionar ubicación'}
            </button>

          </div>

          {error && (
            <p className="modal-error">
              {error}
            </p>
          )}

          {success && (
            <p className="finca-success">
              {success}
            </p>
          )}

          <div className="admin-form-actions">

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading
                ? 'Registrando...'
                : 'Registrar finca'}
            </button>

          </div>

        </form>

      </div>

      <div className="admin-table-card">

        <table className="admin-table">

          <thead>

            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Municipio</th>
              <th>Departamento</th>
              <th>Altitud</th>
              <th>Área</th>
              <th>Cultivos</th>
              <th>Acciones</th>
            </tr>

          </thead>

          <tbody>

            {fincas.length === 0 ? (

              <tr>
                <td colSpan={8} className="finca-empty">
                  No hay fincas registradas
                </td>
              </tr>

            ) : (

              fincas.map((f, idx) => (

                <tr key={f.idFinca}>

                  <td>{idx + 1}</td>
                  <td>{f.nombreFinca}</td>
                  <td>{f.municipio}</td>
                  <td>{f.departamento}</td>

                  <td>
                    {f.altitudMsnm
                      ? `${f.altitudMsnm} m`
                      : '—'}
                  </td>

                  <td>
                    {f.areaHectareas ?? '—'}
                  </td>

                  <td>{f.totalCultivos ?? 0}</td>

                  <td className="td-actions">

                    <button
                      className="btn-icon btn-icon-experto"
                      onClick={() => {
                        setSelectedFinca(f)
                        setShowAsignarModal(true)
                      }}
                      title={f.nombreExperto ? `Experto: ${f.nombreExperto}` : 'Asignar experto'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </button>

                    <button
                      className="btn-icon btn-icon-cultivo"
                      onClick={() => openCultivoModal(f)}
                      title="Registrar cultivo"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a9 9 0 0 1 9 9c0 5-9 13-9 13S3 16 3 11a9 9 0 0 1 9-9z"/>
                        <circle cx="12" cy="11" r="3"/>
                      </svg>
                    </button>

                    <button
                      className="btn-icon btn-icon-editar"
                      onClick={() => openEditModal(f)}
                      title="Editar finca"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                  </td>

                </tr>

              ))
            )}

          </tbody>

        </table>

      </div>

      <div className="admin-form-card">
        <h2 className="admin-form-title">
          Mapa de fincas registradas
        </h2>
        <MapaGeneral fincas={fincas} />
      </div>

      {showAsignarModal && (

        <div
          className="modal-overlay"
          onClick={() => setShowAsignarModal(false)}
        >

          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>
              Asignar experto
            </h2>

            <p>
              Finca:
              <strong>
                {' '}
                {selectedFinca?.nombreFinca}
              </strong>
            </p>

            <select
              value={selectedExperto}
              onChange={(e) =>
                setSelectedExperto(e.target.value)
              }
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '20px',
                marginBottom: '20px',
              }}
            >

              <option value="">
                Selecciona un experto
              </option>

              {expertos.map((exp) => (

                <option
                  key={exp.idUsuario}
                  value={exp.idUsuario}
                >
                  {exp.nombre} {exp.apellido}
                </option>

              ))}

            </select>

            <div
              style={{
                display: 'flex',
                gap: '10px',
              }}
            >

              <button
                className="btn-primary"
                onClick={handleAsignarExperto}
              >
                Guardar asignación
              </button>

              <button
                className="btn-secondary"
                onClick={() =>
                  setShowAsignarModal(false)
                }
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>

      )}

      {editingFinca && (

        <div
          className="modal-overlay"
          onClick={() => setEditingFinca(null)}
        >

          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>
              Editar finca
            </h2>

            <form onSubmit={handleUpdate}>

              <div className="finca-form-row">

                <input
                  name="nombre_finca"
                  value={editForm.nombre_finca}
                  onChange={handleEditChange}
                  placeholder="Nombre de la finca"
                  required
                />

                <input
                  name="municipio"
                  value={editForm.municipio}
                  onChange={handleEditChange}
                  placeholder="Municipio"
                  required
                />

                <input
                  name="departamento"
                  value={editForm.departamento}
                  onChange={handleEditChange}
                  placeholder="Departamento"
                  required
                />

              </div>

              <div className="finca-form-row">

                <input
                  name="altitud_msnm"
                  value={editForm.altitud_msnm}
                  onChange={handleEditChange}
                  placeholder="Altitud (msnm)"
                />

                <input
                  name="area_hectareas"
                  value={editForm.area_hectareas}
                  onChange={handleEditChange}
                  placeholder="Área (hectáreas)"
                />

                <button
                  type="button"
                  className="btn-ubicacion"
                  onClick={() => openUbicacionPicker('edit')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {editForm.latitud && editForm.longitud
                    ? `Ubicación: ${editForm.latitud}, ${editForm.longitud}`
                    : 'Seleccionar ubicación'}
                </button>

              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
              }}>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? 'Guardando...'
                    : 'Guardar cambios'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setEditingFinca(null)
                  }
                >
                  Cancelar
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

      {showCultivoModal && (

        <div
          className="modal-overlay"
          onClick={() => setShowCultivoModal(false)}
        >

          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>
              Registrar cultivo
            </h2>

            <p className="modal-help">
              Finca: <strong>{selectedFincaForCultivo?.nombreFinca}</strong>
            </p>

            <form onSubmit={handleCreateCultivo}>

              <div className="finca-form-row" style={{ marginTop: '16px' }}>

                <input
                  name="nombre_cultivo"
                  value={cultivoForm.nombre_cultivo}
                  onChange={handleCultivoChange}
                  placeholder="Nombre del cultivo"
                  required
                />

                <input
                  name="tipo_cultivo"
                  value={cultivoForm.tipo_cultivo}
                  onChange={handleCultivoChange}
                  placeholder="Tipo de cultivo"
                  required
                />

                <select
                  name="id_estado_cultivo"
                  value={cultivoForm.id_estado_cultivo}
                  onChange={handleCultivoChange}
                  className="cultivo-select"
                >
                  <option value="">
                    --- Sin estado ---
                  </option>
                  {estadosCultivo.map((est) => (
                    <option
                      key={est.idEstado}
                      value={est.idEstado}
                    >
                      {est.nombreEstado}
                    </option>
                  ))}
                </select>

              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
              }}>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={cultivoLoading}
                >
                  {cultivoLoading
                    ? 'Guardando...'
                    : 'Guardar cultivo'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowCultivoModal(false)
                    setSelectedFincaForCultivo(null)
                  }}
                >
                  Cancelar
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </>
  )
}