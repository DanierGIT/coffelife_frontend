import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './Fincas.css'
import '../Administrador/Administrador.css'

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
  const [showMap, setShowMap] = useState(true)

  const [expertos, setExpertos] = useState([])
  const [cafeteros, setCafeteros] = useState([])
  const [selectedFinca, setSelectedFinca] = useState(null)
  const [selectedExperto, setSelectedExperto] = useState('')
  const [showAsignarModal, setShowAsignarModal] = useState(false)
  const [showCafeteroModal, setShowCafeteroModal] = useState(false)
  const [selectedCafetero, setSelectedCafetero] = useState('')
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [detalleFinca, setDetalleFinca] = useState(null)

  const [showCultivoModal, setShowCultivoModal] = useState(false)
  const [selectedFincaForCultivo, setSelectedFincaForCultivo] = useState(null)
  const [estadosCultivo, setEstadosCultivo] = useState([])
  const [cultivoLoading, setCultivoLoading] = useState(false)
  const [cultivosFinca, setCultivosFinca] = useState([])
  const [editandoCultivo, setEditandoCultivo] = useState(null)
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
  const [showCrearModal, setShowCrearModal] = useState(false)
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

      const [fincasRes, asignacionesRes, cultivosRes, cafeterosRes] = await Promise.all([
        api.get('/fincas'),
        api.get('/asignaciones_expertos'),
        api.get('/cultivos?limit=1000'),
        api.get('/cafeteros'),
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

      const cafeterosData = Array.isArray(cafeterosRes.data)
        ? cafeterosRes.data
        : (cafeterosRes.data?.data ?? [])

      const fincasConAsignaciones = fincasData.map((finca) => {
        const asignacion = asignaciones.find(
          (a) => Number(a.idFinca) === Number(finca.idFinca)
        )
        const cafetero = cafeterosData.find(
          (c) => Number(c.idUsuario) === Number(finca.idUsuario)
        )
        const result = {
          ...finca,
          totalCultivos: cultivosPorFinca[finca.idFinca] || 0,
          activo: finca.activo !== undefined ? finca.activo : true,
          nombreCafetero: cafetero ? `${cafetero.nombre} ${cafetero.apellido}` : null,
          idCafeteroAsignado: finca.idUsuario || null,
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

      setFincas(fincasConAsignaciones)

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

  const getCafeteros = async () => {
    try {
      const res = await api.get('/cafeteros')
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setCafeteros(data)
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
    getCafeteros()
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
      setShowCrearModal(false)
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

  const handleToggleActivo = async (finca) => {
    try {
      const nuevoEstado = !finca.activo
      await api.put(`/fincas/${finca.idFinca}`, { activo: nuevoEstado })
      setFincas((prev) =>
        prev.map((f) =>
          f.idFinca === finca.idFinca ? { ...f, activo: nuevoEstado } : f
        )
      )
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'No se pudo cambiar el estado de la finca.'
      )
    }
  }

  const cargarCultivosFinca = async (idFinca) => {
    try {
      const res = await api.get('/cultivos?limit=1000')
      const todos = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setCultivosFinca(todos.filter((c) => Number(c.idFinca) === Number(idFinca)))
    } catch {
      setCultivosFinca([])
    }
  }

  const openCultivoModal = async (finca) => {
    setSelectedFincaForCultivo(finca)
    setEditandoCultivo(null)
    setCultivoForm({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })
    setShowCultivoModal(true)
    await cargarCultivosFinca(finca.idFinca)
  }

  const handleEditCultivo = (cultivo) => {
    setEditandoCultivo(cultivo)
    setCultivoForm({
      nombre_cultivo: cultivo.nombreCultivo || cultivo.nombre_cultivo || '',
      tipo_cultivo: cultivo.tipoCultivo || cultivo.tipo_cultivo || '',
      id_estado_cultivo: cultivo.idEstado ? String(cultivo.idEstado) : (cultivo.id_estado_cultivo ? String(cultivo.id_estado_cultivo) : ''),
    })
  }

  const handleCancelEditCultivo = () => {
    setEditandoCultivo(null)
    setCultivoForm({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })
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
        id_estado: cultivoForm.id_estado_cultivo
          ? Number(cultivoForm.id_estado_cultivo)
          : undefined,
      }
      if (editandoCultivo) {
        await api.put(`/cultivos/${editandoCultivo.idCultivo}`, payload)
      } else {
        await api.post('/cultivos', payload)
      }
      setCultivoForm({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })
      setEditandoCultivo(null)
      await cargarCultivosFinca(selectedFincaForCultivo.idFinca)
      getFincas()
    } catch (err) {
      console.log(err.response?.data)
      alert(err?.response?.data?.message || 'No se pudo guardar el cultivo.')
    } finally {
      setCultivoLoading(false)
    }
  }

  const handleDeleteCultivo = async (idCultivo) => {
    if (!window.confirm('¿Eliminar este cultivo?')) return
    try {
      await api.delete(`/cultivos/${idCultivo}`)
      setCultivosFinca((prev) => prev.filter((c) => c.idCultivo !== idCultivo))
      getFincas()
    } catch (err) {
      alert(err?.response?.data?.message || 'No se pudo eliminar el cultivo.')
    }
  }

  const handleAsignarExperto = async () => {

    if (!selectedFinca) return

    try {

      if (!selectedExperto) {

        if (selectedFinca.idAsignacion) {
          await api.delete(`/asignaciones_expertos/${selectedFinca.idAsignacion}`)
        }

        setFincas((prev) =>
          prev.map((finca) =>
            finca.idFinca === selectedFinca.idFinca
              ? { ...finca, nombreExperto: null, idExpertoAsignado: null, idAsignacion: null }
              : finca
          )
        )

      } else {

        const payload = {
          idExperto: Number(selectedExperto),
          idFinca: selectedFinca.idFinca,
          fechaAsignada: new Date().toISOString().split('T')[0],
        }

        if (selectedFinca.idAsignacion) {
          await api.put(`/asignaciones_expertos/${selectedFinca.idAsignacion}`, payload)
        } else {
          await api.post('/asignaciones_expertos', payload)
        }

        const expertoSeleccionado = expertos.find(
          (exp) => exp.idUsuario == selectedExperto
        )

        const nombreExperto = `${expertoSeleccionado?.nombre} ${expertoSeleccionado?.apellido}`

        setFincas((prev) =>
          prev.map((finca) =>
            finca.idFinca === selectedFinca.idFinca
              ? { ...finca, nombreExperto, idExpertoAsignado: Number(selectedExperto) }
              : finca
          )
        )
      }

      setShowAsignarModal(false)
      setSelectedExperto('')
      setSelectedFinca(null)

      await getFincas()

    } catch (error) {
      console.error('Error asignando experto:', error.response?.data || error)
      alert(
        error.response?.data?.message ||
        'No se pudo asignar el experto. Intenta de nuevo.'
      )
    }
  }

  const handleAsignarCafetero = async () => {
    if (!selectedFinca) return
    try {
      if (!selectedCafetero) {
        await api.put(`/fincas/${selectedFinca.idFinca}`, { id_usuario: null })
        setFincas((prev) =>
          prev.map((f) =>
            f.idFinca === selectedFinca.idFinca
              ? { ...f, nombreCafetero: null, idCafeteroAsignado: null, id_usuario: null }
              : f
          )
        )
      } else {
        await api.put(`/fincas/${selectedFinca.idFinca}`, { id_usuario: Number(selectedCafetero) })
        const cafetero = cafeteros.find((c) => c.idUsuario == selectedCafetero)
        const nombreCafetero = cafetero ? `${cafetero.nombre} ${cafetero.apellido}` : null
        setFincas((prev) =>
          prev.map((f) =>
            f.idFinca === selectedFinca.idFinca
              ? { ...f, nombreCafetero, idCafeteroAsignado: Number(selectedCafetero), id_usuario: Number(selectedCafetero) }
              : f
          )
        )
      }
      setShowCafeteroModal(false)
      setSelectedCafetero('')
      setSelectedFinca(null)
      await getFincas()
    } catch (error) {
      console.error('Error asignando cafetero:', error.response?.data || error)
      alert(error.response?.data?.message || 'No se pudo asignar el cafetero.')
    }
  }

  return (
    <>

      <div className="page-header">
        <h1>Fincas</h1>
        <p>Gestión de fincas registradas</p>
      </div>

      <div className="admin-form-card">
        <div className="map-card-header">
          <div className="map-card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#2e7d32" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Mapa de fincas registradas</span>
            <span className="map-card-badge">{fincas.length} fincas</span>
          </div>
          <button className="btn-primary" onClick={() => setShowMap(!showMap)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {showMap ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                Ocultar mapa
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Mostrar mapa
              </>
            )}
          </button>
        </div>
        {showMap && <MapaGeneral fincas={fincas} />}
      </div>

      <div className="admin-table-card">

        <div className="map-card-header">
          <div className="map-card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#2e7d32" stroke="#2e7d32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>Fincas registradas</span>
            <span className="map-card-badge">{fincas.length} fincas</span>
          </div>
          <button className="btn-primary" onClick={() => setShowCrearModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar finca
          </button>
        </div>

        <table className="admin-table">

          <thead>

            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>Nombre</th>
              <th style={{ width: '110px' }}>Estado</th>
              <th style={{ width: '220px' }}>Acciones</th>
            </tr>

          </thead>

          <tbody>

            {fincas.length === 0 ? (

              <tr>
                <td colSpan={4} className="finca-empty">
                  No hay fincas registradas
                </td>
              </tr>

            ) : (

              fincas.map((f, idx) => (

                <tr key={f.idFinca} className={!f.activo ? 'fila-inactiva' : ''}>

                  <td>{idx + 1}</td>
                  <td>
                    <span className="finca-nombre-link" onClick={() => { setDetalleFinca(f); setShowDetalleModal(true) }}>
                      {f.nombreFinca}
                    </span>
                  </td>

                  <td>
                    <span className={`estado-badge ${f.activo ? 'badge-active' : 'badge-inactive'}`}>
                      <span className="badge-dot" />
                      {f.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  <td className="td-actions">

                    <button
                      className="btn-icon btn-icon-ver"
                      onClick={() => { setDetalleFinca(f); setShowDetalleModal(true) }}
                      title="Ver detalle de la finca"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>

                    <button
                      className="btn-icon btn-icon-experto"
                      onClick={() => {
                        setSelectedFinca(f)
                        setSelectedExperto(f.idExpertoAsignado ? String(f.idExpertoAsignado) : '')
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
                      className="btn-icon btn-icon-cafetero"
                      onClick={() => {
                        setSelectedFinca(f)
                        setSelectedCafetero(f.idCafeteroAsignado ? String(f.idCafeteroAsignado) : '')
                        setShowCafeteroModal(true)
                      }}
                      title={f.nombreCafetero ? `Cafetero: ${f.nombreCafetero}` : 'Asignar cafetero'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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

                    <button
                      className={`btn-icon btn-icon-toggle ${f.activo ? 'desactivar' : 'activar'}`}
                      onClick={() => handleToggleActivo(f)}
                      title={f.activo ? 'Desactivar finca' : 'Activar finca'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {f.activo ? (
                          <>
                            <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/>
                            <circle cx="16" cy="12" r="3"/>
                          </>
                        ) : (
                          <>
                            <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/>
                            <circle cx="8" cy="12" r="3"/>
                          </>
                        )}
                      </svg>
                    </button>

                  </td>

                </tr>

              ))
            )}

          </tbody>

        </table>

      </div>

      {showCrearModal && (
        <div className="modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Registrar nueva finca</h2>
            <form className="finca-form" onSubmit={handleCreate}>
              <div className="finca-form-row">
                <input name="nombre_finca" value={form.nombre_finca} onChange={handleChange} placeholder="Nombre de la finca" required />
                <input name="municipio" value={form.municipio} onChange={handleChange} placeholder="Municipio" required />
                <input name="departamento" value={form.departamento} onChange={handleChange} placeholder="Departamento" required />
              </div>
              <div className="finca-form-row">
                <input name="altitud_msnm" value={form.altitud_msnm} onChange={handleChange} placeholder="Altitud (msnm)" />
                <input name="area_hectareas" value={form.area_hectareas} onChange={handleChange} placeholder="Área (hectáreas)" />
                <button type="button" className="btn-ubicacion" onClick={() => openUbicacionPicker('create')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {form.latitud && form.longitud ? `Ubicación: ${form.latitud}, ${form.longitud}` : 'Seleccionar ubicación'}
                </button>
              </div>
              {error && <p className="modal-error">{error}</p>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrar finca'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowCrearModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

            {selectedFinca?.nombreExperto ? (
              <p className="experto-actual">
                Experto actual: <strong>{selectedFinca.nombreExperto}</strong>
              </p>
            ) : (
              <p className="experto-sin-asignar">
                Esta finca no tiene experto asignado
              </p>
            )}

            <select
              value={selectedExperto}
              onChange={(e) =>
                setSelectedExperto(e.target.value)
              }
              className="experto-select"
            >

              <option value="">
                {selectedFinca?.nombreExperto
                  ? 'Cambiar experto...'
                  : 'Selecciona un experto'}
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

            <div className="experto-modal-actions">

              <button
                className="btn-primary"
                onClick={handleAsignarExperto}
              >
                {selectedExperto ? 'Guardar asignación' : 'Dejar sin experto'}
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

      {showCafeteroModal && selectedFinca && (

        <div className="modal-overlay" onClick={() => setShowCafeteroModal(false)}>

          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            <h2>
              Asignar cafetero — {selectedFinca.nombre_finca}
            </h2>

            {selectedFinca.nombreCafetero ? (
              <p className="cafetero-asignado">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Cafetero <strong>{selectedFinca.nombreCafetero}</strong> asignado
              </p>
            ) : (
              <p className="cafetero-sin-asignar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Esta finca no tiene cafetero asignado
              </p>
            )}

            <select
              className="experto-select"
              value={selectedCafetero}
              onChange={(e) => setSelectedCafetero(e.target.value)}
            >
              <option value="">Seleccione un cafetero</option>
              {cafeteros.map((c) => (
                <option key={c.idUsuario} value={c.idUsuario}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>

            <div className="experto-modal-actions">

              <button className="btn-primary" onClick={handleAsignarCafetero}>
                {selectedCafetero ? 'Guardar asignación' : 'Dejar sin cafetero'}
              </button>

              <button className="btn-secondary" onClick={() => setShowCafeteroModal(false)}>
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

      {showDetalleModal && detalleFinca && (

        <div className="modal-overlay" onClick={() => setShowDetalleModal(false)}>

          <div className="modal-box modal-box--detalle" onClick={(e) => e.stopPropagation()}>

            <div className="detalle-header">
              <h2>{detalleFinca.nombreFinca}</h2>
              <span className={`estado-badge ${detalleFinca.activo ? 'badge-active' : 'badge-inactive'}`}>
                <span className="badge-dot" />
                {detalleFinca.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="detalle-grid">

              <div className="detalle-field">
                <span className="detalle-label">Municipio</span>
                <span className="detalle-value">{detalleFinca.municipio || '—'}</span>
              </div>

              <div className="detalle-field">
                <span className="detalle-label">Departamento</span>
                <span className="detalle-value">{detalleFinca.departamento || '—'}</span>
              </div>

              <div className="detalle-field">
                <span className="detalle-label">Altitud</span>
                <span className="detalle-value">
                  {detalleFinca.altitudMsnm ? `${detalleFinca.altitudMsnm} m.s.n.m.` : '—'}
                </span>
              </div>

              <div className="detalle-field">
                <span className="detalle-label">Área</span>
                <span className="detalle-value">
                  {detalleFinca.areaHectareas ? `${detalleFinca.areaHectareas} ha` : '—'}
                </span>
              </div>

              <div className="detalle-field">
                <span className="detalle-label">Cultivos registrados</span>
                <span className="detalle-value">{detalleFinca.totalCultivos ?? 0}</span>
              </div>

              <div className="detalle-field">
                <span className="detalle-label">Experto asignado</span>
                <span className="detalle-value">
                  {detalleFinca.nombreExperto || 'Sin asignar'}
                </span>
              </div>

              {detalleFinca.latitud && detalleFinca.longitud && (
                <div className="detalle-field detalle-field-full">
                  <span className="detalle-label">Coordenadas</span>
                  <span className="detalle-value">
                    {detalleFinca.latitud}, {detalleFinca.longitud}
                  </span>
                </div>
              )}

            </div>

            <div className="detalle-actions">
              <button className="btn-secondary" onClick={() => setShowDetalleModal(false)}>
                Cerrar
              </button>
            </div>

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
            className="modal-box modal-box--cultivos"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>
              {editandoCultivo ? 'Editar cultivo' : 'Registrar cultivo'}
            </h2>

            <p className="modal-help">
              Finca: <strong>{selectedFincaForCultivo?.nombreFinca}</strong>
            </p>

            {/* Lista de cultivos existentes */}
            {cultivosFinca.length > 0 && (
              <div className="cultivos-lista">
                <p className="cultivos-lista-titulo">Cultivos registrados</p>
                <table className="cultivos-tabla">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th style={{ width: '80px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cultivosFinca.map((c) => (
                      <tr key={c.idCultivo} className={editandoCultivo?.idCultivo === c.idCultivo ? 'cultivo-fila-editando' : ''}>
                        <td>{c.nombreCultivo || c.nombre_cultivo || '—'}</td>
                        <td>{c.tipoCultivo || c.tipo_cultivo || '—'}</td>
                        <td>
                          <span className={`cultivo-estado-badge estado-${(c.estadoCultivo?.nombreEstado || c.estado_cultivo?.nombreEstado || '').toLowerCase()}`}>
                            {c.estadoCultivo?.nombreEstado || c.estado_cultivo?.nombreEstado || '—'}
                          </span>
                        </td>
                        <td className="cultivo-acciones">
                          <button
                            className="cultivo-btn cultivo-btn-editar"
                            onClick={() => handleEditCultivo(c)}
                            title="Editar cultivo"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="cultivo-btn cultivo-btn-eliminar"
                            onClick={() => handleDeleteCultivo(c.idCultivo)}
                            title="Eliminar cultivo"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {cultivosFinca.length === 0 && (
              <p className="cultivos-sin-registros">No hay cultivos registrados en esta finca</p>
            )}

            <div className="cultivos-divider" />

            <form onSubmit={handleCreateCultivo}>

              <div className="finca-form-row">

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

              <div className="cultivo-form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={cultivoLoading}
                >
                  {cultivoLoading
                    ? 'Guardando...'
                    : editandoCultivo
                      ? 'Actualizar cultivo'
                      : 'Guardar cultivo'}
                </button>

                {editandoCultivo && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancelEditCultivo}
                  >
                    Cancelar edición
                  </button>
                )}

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowCultivoModal(false)
                    setSelectedFincaForCultivo(null)
                    setEditandoCultivo(null)
                  }}
                >
                  Cerrar
                </button>
              </div>

            </form>

          </div>

        </div>

      )}

    </>
  )
}