import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
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

function MapPicker({ latitud, longitud, onChange }) {

  const center =
    latitud && longitud
      ? [parseFloat(latitud), parseFloat(longitud)]
      : [4.5709, -74.2973]

  function ClickHandler() {

    useMapEvents({
      click(e) {

        onChange(
          e.latlng.lat.toFixed(6),
          e.latlng.lng.toFixed(6)
        )
      },
    })

    return null
  }

  return (
    <div className="map-wrapper">

      <p className="map-hint">
        📍 Haz clic en el mapa para seleccionar la ubicación
      </p>

      <MapContainer
        center={center}
        zoom={latitud && longitud ? 13 : 6}
        style={{
          height: '260px',
          width: '100%',
          borderRadius: '10px',
        }}
      >

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        <ClickHandler />

        {latitud && longitud && (
          <Marker
            position={[
              parseFloat(latitud),
              parseFloat(longitud),
            ]}
          />
        )}

      </MapContainer>

    </div>
  )
}

function MapaFinca({ latitud, longitud }) {

  if (!latitud || !longitud) return null

  return (
    <MapContainer
      center={[
        parseFloat(latitud),
        parseFloat(longitud),
      ]}
      zoom={13}
      style={{
        height: '140px',
        width: '100%',
        borderRadius: '8px',
        marginTop: '6px',
      }}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      zoomControl={false}
    >

      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Marker
        position={[
          parseFloat(latitud),
          parseFloat(longitud),
        ]}
      />

    </MapContainer>
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

  const [form, setForm] = useState({
    nombre_finca: '',
    municipio: '',
    departamento: '',
    latitud: '',
    longitud: '',
    altitud_msnm: '',
    area_hectareas: '',
  })

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

      const [fincasRes, asignacionesRes] = await Promise.all([
        api.get('/fincas'),
        api.get('/asignaciones_expertos'),
      ])

      const fincasData = Array.isArray(fincasRes.data)
        ? fincasRes.data
        : (fincasRes.data?.data ?? [])

      const asignaciones = Array.isArray(asignacionesRes.data)
        ? asignacionesRes.data
        : (asignacionesRes.data?.data ?? [])

      console.log('getFincas - fincasData:', fincasData)
      console.log('getFincas - asignaciones:', asignaciones)

      const fincasConExpertos = fincasData.map((finca) => {
        const asignacion = asignaciones.find(
          (a) => Number(a.idFinca) === Number(finca.idFinca)
        )
        if (asignacion?.experto) {
          return {
            ...finca,
            nombreExperto: `${asignacion.experto.nombre} ${asignacion.experto.apellido}`,
            idAsignacion: asignacion.idAsignacion,       // para hacer PUT si ya existe
            idExpertoAsignado: asignacion.experto.idUsuario,
          }
        }
        return { ...finca, nombreExperto: null, idAsignacion: null, idExpertoAsignado: null }
      })

      console.log('getFincas - fincasConExpertos:', fincasConExpertos)

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

  useEffect(() => {

    getFincas()
    getExpertos()

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

  const handleMapClick = (lat, lng) => {

    setForm((f) => ({
      ...f,
      latitud: lat,
      longitud: lng,
    }))
  }

  const handleEditMapClick = (lat, lng) => {

    setEditForm((f) => ({
      ...f,
      latitud: lat,
      longitud: lng,
    }))
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
              name="latitud"
              value={form.latitud}
              onChange={handleChange}
              placeholder="Latitud"
            />

            <input
              name="longitud"
              value={form.longitud}
              onChange={handleChange}
              placeholder="Longitud"
            />

            <input
              name="altitud_msnm"
              value={form.altitud_msnm}
              onChange={handleChange}
              placeholder="Altitud"
            />

            <input
              name="area_hectareas"
              value={form.area_hectareas}
              onChange={handleChange}
              placeholder="Área"
            />

          </div>

          <MapPicker
            latitud={form.latitud}
            longitud={form.longitud}
            onChange={handleMapClick}
          />

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
              <th>Ubicación</th>
              <th>Acciones</th>
            </tr>

          </thead>

          <tbody>

            {fincas.length === 0 ? (

              <tr>
                <td colSpan={8}>
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

                  <td className="td-map">

                    {f.latitud && f.longitud ? (

                      <MapaFinca
                        latitud={f.latitud}
                        longitud={f.longitud}
                      />

                    ) : (

                      <span>
                        Sin coordenadas
                      </span>

                    )}

                  </td>

                  <td>

                    <button
                      className="btn-primary"
                      onClick={() => {
                        setSelectedFinca(f)
                        setShowAsignarModal(true)
                      }}
                    >
                      {f.nombreExperto
                        ? `Experto: ${f.nombreExperto}`
                        : 'Asignar experto'}
                    </button>

                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(f)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(f.idFinca)}
                    >
                      Eliminar
                    </button>

                  </td>

                </tr>

              ))
            )}

          </tbody>

        </table>

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
                  name="latitud"
                  value={editForm.latitud}
                  onChange={handleEditChange}
                  placeholder="Latitud"
                />

                <input
                  name="longitud"
                  value={editForm.longitud}
                  onChange={handleEditChange}
                  placeholder="Longitud"
                />

                <input
                  name="altitud_msnm"
                  value={editForm.altitud_msnm}
                  onChange={handleEditChange}
                  placeholder="Altitud"
                />

                <input
                  name="area_hectareas"
                  value={editForm.area_hectareas}
                  onChange={handleEditChange}
                  placeholder="Área"
                />

              </div>

              <MapPicker
                latitud={editForm.latitud}
                longitud={editForm.longitud}
                onChange={handleEditMapClick}
              />

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

    </>
  )
}