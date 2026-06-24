import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './Fincas.css'
import '../Administrador/Administrador.css'
import Loading from '../../../components/Loading'
import { BiMapPin, BiUser, BiGroup, BiLeaf, BiEdit, BiToggleLeft, BiToggleRight, BiPlus, BiInfoCircle, BiHide, BiShow, BiTrash, BiSearch, BiFilter } from 'react-icons/bi'
import ToggleSwitch from '../../../components/ToggleSwitch'

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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
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

function MapaGeneral({ fincas }) {
  const fincasConCoords = fincas.filter((f) => f.latitud && f.longitud)

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
            position={[parseFloat(f.latitud), parseFloat(f.longitud)]}
          >
            <Tooltip direction="top" offset={[0, -10]} permanent={false}>
              <div className="map-tooltip-content">
                <strong>{f.nombreFinca}</strong><br />
                {f.municipio}, {f.departamento}<br />
                Cultivos: {f.totalCultivos ?? 0}<br />
                {f.nombreExperto ? `Experto: ${f.nombreExperto}` : 'Sin experto asignado'}
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

const STORAGE_KEY = 'fincas_toggles'

const getLocalToggles = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

const normalizeActivo = (val) => {
  if (val === null || val === undefined) return true
  return val === true || val === 1 || val === '1'
}

export default function Fincas() {
  const { user } = useAuth()

  // Estados de datos primarios
  const [fincasRaw, setFincasRaw] = useState([])
  const [expertos, setExpertos] = useState([])
  const [cafeteros, setCafeteros] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [estadosCultivo, setEstadosCultivo] = useState([])

  // Referencias para carga bajo demanda
  const expertosLoadedRef = useRef(false)
  const cafeterosLoadedRef = useRef(false)
  const estadosCultivoLoadedRef = useRef(false)

  // Fincas enriquecidas con datos de asignaciones y cafeteros (carga bajo demanda)
  const fincas = useMemo(() => {
    return fincasRaw.map((finca) => {
      const a = asignaciones.find((a) => Number(a.idFinca) === Number(finca.idFinca))
      const c = cafeteros.find((c) => Number(c.idUsuario) === Number(finca.idUsuario))
      return {
        ...finca,
        totalCultivos: 0,
        activo: finca.activo !== undefined ? finca.activo : true,
        nombreCafetero: c ? `${c.nombre} ${c.apellido}` : null,
        idCafeteroAsignado: finca.idUsuario || null,
        nombreExperto: a?.experto ? `${a.experto.nombre} ${a.experto.apellido}` : null,
        idAsignacion: a?.idAsignacion || null,
        idExpertoAsignado: a?.experto?.idUsuario || null,
      }
    })
  }, [fincasRaw, asignaciones, cafeteros])

  // Estados de carga e interfaz
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showMap, setShowMap] = useState(false)

  // Modales y selecciones secundarias
  const [selectedFinca, setSelectedFinca] = useState(null)
  const [selectedExperto, setSelectedExperto] = useState('')
  const [showAsignarModal, setShowAsignarModal] = useState(false)
  const [showCafeteroModal, setShowCafeteroModal] = useState(false)
  const [selectedCafetero, setSelectedCafetero] = useState('')
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [detalleFinca, setDetalleFinca] = useState(null)

  // Gestión de Cultivos dentro de Fincas
  const [showCultivoModal, setShowCultivoModal] = useState(false)
  const [selectedFincaForCultivo, setSelectedFincaForCultivo] = useState(null)
  const [cultivoLoading, setCultivoLoading] = useState(false)
  const [cultivosFinca, setCultivosFinca] = useState([])
  const [editandoCultivo, setEditandoCultivo] = useState(null)
  const [cultivoForm, setCultivoForm] = useState({
    nombre_cultivo: '',
    tipo_cultivo: '',
    id_estado_cultivo: '',
  })

  // Formularios de Fincas
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

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState('')
  const [filterExperto, setFilterExperto] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterCafetero, setFilterCafetero] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const filterRef = useRef(null)

  // Ubicación Picker Modal
  const [showUbicacionModal, setShowUbicacionModal] = useState(false)
  const [ubicacionTarget, setUbicacionTarget] = useState('create')
  const [ubicacionLat, setUbicacionLat] = useState('')
  const [ubicacionLng, setUbicacionLng] = useState('')

  // Cerrar dropdown de filtros al hacer clic fuera
  const handleClickOutside = useCallback((e) => {
    if (filterRef.current && !filterRef.current.contains(e.target)) {
      setShowFilters(false)
    }
  }, [])

  useEffect(() => {
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilters, handleClickOutside])

  // ═══ CARGA INICIAL: solo /fincas ═══
  const cargarFincas = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/fincas?limit=1000')
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      const localToggles = getLocalToggles()
      const merged = data.map(item => {
        const id = item.idFinca
        return {
          ...item,
          activo: id in localToggles ? localToggles[id] : normalizeActivo(item.activo)
        }
      })
      setFincasRaw(merged)
    } catch (err) {
      console.error("Error cargando fincas:", err)
      setError('No se pudieron cargar las fincas.')
    } finally {
      setLoading(false)
    }
  }

  // ═══ CARGAS BAJO DEMANDA ═══
  const cargarExpertosAsignaciones = async () => {
    if (expertosLoadedRef.current) return
    expertosLoadedRef.current = true
    try {
      const [expRes, asigRes] = await Promise.all([
        api.get('/expertos'),
        api.get('/asignaciones_expertos'),
      ])
      setExpertos(Array.isArray(expRes.data) ? expRes.data : (expRes.data?.data ?? []))
      setAsignaciones(Array.isArray(asigRes.data) ? asigRes.data : (asigRes.data?.data ?? []))
    } catch (err) {
      console.error("Error cargando expertos/asignaciones:", err)
      expertosLoadedRef.current = false
    }
  }

  const cargarCafeteros = async () => {
    if (cafeterosLoadedRef.current) return
    cafeterosLoadedRef.current = true
    try {
      const res = await api.get('/cafeteros')
      setCafeteros(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch (err) {
      console.error("Error cargando cafeteros:", err)
      cafeterosLoadedRef.current = false
    }
  }

  const cargarEstadosCultivo = async () => {
    if (estadosCultivoLoadedRef.current) return
    estadosCultivoLoadedRef.current = true
    try {
      const res = await api.get('/cat_estados_cultivo')
      setEstadosCultivo(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch (err) {
      console.error("Error cargando estados de cultivo:", err)
      estadosCultivoLoadedRef.current = false
    }
  }

  useEffect(() => {
    cargarFincas()
  }, [])

  // Filtros en memoria utilizando UseMemo
  const filteredFincas = (() => {
    let data = fincas
    if (filterExperto) {
      data = data.filter((f) => String(f.idExpertoAsignado) === filterExperto)
    }
    if (filterEstado) {
      const activo = filterEstado === 'activo'
      data = data.filter((f) => f.activo === activo)
    }
    if (filterCafetero) {
      data = data.filter((f) => String(f.idCafeteroAsignado) === filterCafetero)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      data = data.filter((f) =>
        (f.nombreFinca || '').toLowerCase().includes(term) ||
        (f.municipio || '').toLowerCase().includes(term) ||
        (f.departamento || '').toLowerCase().includes(term)
      )
    }
    return data
  })()

  const totalPages = Math.max(1, Math.ceil(filteredFincas.length / ITEMS_PER_PAGE))
  const paginatedFincas = filteredFincas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    (currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  )

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
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
        id_usuario: user?.id || user?.id_usuario || user?.idUsuario,
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
      cargarFincas()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo registrar la finca.')
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
      cargarFincas()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo actualizar la finca.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta finca?')) return
    try {
      await api.delete(`/fincas/${id}`)
      cargarFincas()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar la finca.')
    }
  }

  const handleToggleActivo = async (idFinca, newActivo) => {
    const revert = () => {
      setFincasRaw((prev) =>
        prev.map((f) => f.idFinca === idFinca ? { ...f, activo: !newActivo } : f)
      )
    }
    setFincasRaw((prev) =>
      prev.map((f) => f.idFinca === idFinca ? { ...f, activo: newActivo } : f)
    )
    try {
      const toggles = getLocalToggles()
      toggles[idFinca] = newActivo
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles))
      await api.put(`/fincas/${idFinca}`, { activo: newActivo ? 1 : 0 })
    } catch (err) {
      revert()
      setError(err?.response?.data?.message || 'No se pudo cambiar el estado de la finca.')
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
    cargarEstadosCultivo()
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
        id_estado: cultivoForm.id_estado_cultivo ? Number(cultivoForm.id_estado_cultivo) : undefined,
      }
      if (editandoCultivo) {
        await api.put(`/cultivos/${editandoCultivo.idCultivo}`, payload)
      } else {
        await api.post('/cultivos', payload)
      }
      setCultivoForm({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })
      setEditandoCultivo(null)
      await cargarCultivosFinca(selectedFincaForCultivo.idFinca)
      cargarFincas()
    } catch (err) {
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
      cargarFincas()
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
      }
      setShowAsignarModal(false)
      setSelectedExperto('')
      setSelectedFinca(null)
      await cargarFincas()
      if (expertosLoadedRef.current) {
        await cargarExpertosAsignaciones()
      }
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudo asignar el experto.')
    }
  }

  const handleAsignarCafetero = async () => {
    if (!selectedFinca) return
    try {
      if (!selectedCafetero) {
        await api.put(`/fincas/${selectedFinca.idFinca}`, { id_usuario: null })
      } else {
        await api.put(`/fincas/${selectedFinca.idFinca}`, { id_usuario: Number(selectedCafetero) })
      }
      setShowCafeteroModal(false)
      setSelectedCafetero('')
      setSelectedFinca(null)
      await cargarFincas()
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudo asignar el cafetero.')
    }
  }

  return (
    <>
      <div className="module-header">
        <div className="module-header-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 9h.01" /><path d="M15 9h.01" /><path d="M9 13h.01" /><path d="M15 13h.01" /><path d="M9 17h.01" /><path d="M15 17h.01" />
          </svg>
        </div>
        <div className="module-header-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="module-header-badge">GESTIÓN AGRÍCOLA</span>
            <button className="btn-primary" onClick={() => setShowCrearModal(true)}>
              <BiPlus size={16} /> Agregar finca
            </button>
          </div>
          <h1>Fincas</h1>
          <p>
            Administra las fincas registradas en CoffeeLife. Desde aquí puedes
            crear nuevas fincas, actualizar información geográfica, asignar
            cafeteros y expertos, gestionar cultivos y consultar la ubicación
            de cada finca en el mapa interactivo.
          </p>
        </div>
      </div>

      {loading && <Loading type="overlay" text="Cargando datos del módulo..." />}
      {error && <div className="error-message" style={{ padding: '1rem', margin: '1rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px' }}>{error}</div>}

      <div className="admin-table-card">
        <div className="table-toolbar">
          <div className="search-bar">
            <BiSearch size={16} />
            <input
              placeholder="Buscar por nombre, municipio o departamento..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            />
          </div>
          <div className="filter-group">
            <div className="filter-btn-wrap" ref={filterRef}>
              <button className="btn-filter" onClick={() => {
                if (!showFilters) { cargarExpertosAsignaciones(); cargarCafeteros() }
                setShowFilters((v) => !v)
              }}>
                <BiFilter size={16} /> Filtros
                {[filterEstado, filterExperto, filterCafetero].some(Boolean) && (
                  <span className="filter-badge">
                    {[filterEstado, filterExperto, filterCafetero].filter(Boolean).length}
                  </span>
                )}
              </button>
              {showFilters && (
                <div className="filter-dropdown">
                  <select value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setCurrentPage(1) }}>
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                  <select value={filterExperto} onChange={(e) => { setFilterExperto(e.target.value); setCurrentPage(1) }}>
                    <option value="">Todos los expertos</option>
                    {expertos.map((exp) => (
                      <option key={exp.idUsuario} value={exp.idUsuario}>{exp.nombre} {exp.apellido}</option>
                    ))}
                  </select>
                  <select value={filterCafetero} onChange={(e) => { setFilterCafetero(e.target.value); setCurrentPage(1) }}>
                    <option value="">Todos los cafeteros</option>
                    {cafeteros.map((caf) => (
                      <option key={caf.idUsuario} value={caf.idUsuario}>{caf.nombre} {caf.apellido}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button className="btn-secondary" onClick={() => setShowMap(!showMap)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {showMap ? <><BiHide size={16} /> Ocultar mapa</> : <><BiShow size={16} /> Mostrar mapa</>}
            </button>
          </div>
        </div>

        {showMap && <MapaGeneral fincas={fincas} />}

        <div className="table-scroll">
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
              {filteredFincas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="finca-empty">
                    {searchTerm ? 'No se encontraron fincas con ese criterio' : 'No hay fincas registradas'}
                  </td>
                </tr>
              ) : (
                paginatedFincas.map((f, idx) => (
                  <tr key={f.idFinca} className={!f.activo ? 'fila-inactiva' : ''}>
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
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
                      <button className="btn-icon btn-icon-ver" onClick={() => { setDetalleFinca(f); setShowDetalleModal(true) }} title="Ver detalle de la finca">
                        <BiShow size={16} />
                      </button>
                      <button className="btn-icon btn-icon-experto" onClick={() => { cargarExpertosAsignaciones(); setSelectedFinca(f); setSelectedExperto(f.idExpertoAsignado ? String(f.idExpertoAsignado) : ''); setShowAsignarModal(true) }} title={f.nombreExperto ? `Experto: ${f.nombreExperto}` : 'Asignar experto'}>
                        <BiUser size={16} />
                      </button>
                      <button className="btn-icon btn-icon-cafetero" onClick={() => { cargarCafeteros(); setSelectedFinca(f); setSelectedCafetero(f.idCafeteroAsignado ? String(f.idCafeteroAsignado) : ''); setShowCafeteroModal(true) }} title={f.nombreCafetero ? `Cafetero: ${f.nombreCafetero}` : 'Asignar cafetero'}>
                        <BiGroup size={16} />
                      </button>
                      <button className="btn-icon btn-icon-cultivo" onClick={() => openCultivoModal(f)} title="Registrar cultivo">
                        <BiLeaf size={16} />
                      </button>
                      <button className="btn-icon btn-icon-editar" onClick={() => openEditModal(f)} title="Editar finca">
                        <BiEdit size={16} />
                      </button>
                      <ToggleSwitch
                        active={f.activo !== false}
                        onClick={(e, next) => handleToggleActivo(f.idFinca, next)}
                        title={f.activo === false ? 'Activar finca' : 'Desactivar finca'}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Anterior</button>
          {Array.from({ length: totalPages }, (_, i) => {
            const page = i + 1
            return (
              <button key={page} className={currentPage === page ? 'active' : ''} onClick={() => setCurrentPage(page)}>
                {page}
              </button>
            )
          })}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Siguiente</button>
          <span className="pagination-info">{filteredFincas.length} registros</span>
        </div>
      )}

      {/* Modal Crear Finca (Sintaxis JSX Cerrada del Botón Corregida) */}
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
                  <BiMapPin size={16} />
                  {form.latitud && form.longitud ? `Ubicación: ${form.latitud}, ${form.longitud}` : 'Seleccionar ubicación'}
                </button>
              </div>
              {error && <p className="modal-error">{error}</p>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <Loading type="inline" text="Registrando..." /> : 'Registrar finca'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowCrearModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Selección Ubicación Picker */}
      {showUbicacionModal && (
        <UbicacionPickerModal
          latInicial={ubicacionLat}
          lngInicial={ubicacionLng}
          onConfirm={handleUbicacionConfirm}
          onCancel={() => setShowUbicacionModal(false)}
        />
      )}

      {showAsignarModal && (
        <div className="modal-overlay" onClick={() => setShowAsignarModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Asignar experto</h2>
            <p>Finca: <strong>{selectedFinca?.nombreFinca}</strong></p>
            {selectedFinca?.nombreExperto ? (
              <p className="experto-actual">Experto actual: <strong>{selectedFinca.nombreExperto}</strong></p>
            ) : (
              <p className="experto-sin-asignar">Esta finca no tiene experto asignado</p>
            )}
            <select value={selectedExperto} onChange={(e) => setSelectedExperto(e.target.value)} className="experto-select">
              <option value="">
                {selectedFinca?.nombreExperto ? 'Cambiar experto...' : 'Selecciona un experto'}
              </option>
              {expertos.map((exp) => (
                <option key={exp.idUsuario} value={exp.idUsuario}>{exp.nombre} {exp.apellido}</option>
              ))}
            </select>
            <div className="experto-modal-actions">
              <button className="btn-primary" onClick={handleAsignarExperto}>
                {selectedExperto ? 'Guardar asignación' : 'Dejar sin experto'}
              </button>
              <button className="btn-secondary" onClick={() => setShowAsignarModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showCafeteroModal && selectedFinca && (
        <div className="modal-overlay" onClick={() => setShowCafeteroModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Asignar cafetero — {selectedFinca.nombre_finca}</h2>
            {selectedFinca.nombreCafetero ? (
              <p className="cafetero-asignado"><BiUser size={16} /> Cafetero <strong>{selectedFinca.nombreCafetero}</strong> asignado</p>
            ) : (
              <p className="cafetero-sin-asignar"><BiInfoCircle size={16} /> Esta finca no tiene cafetero asignado</p>
            )}
            <select className="experto-select" value={selectedCafetero} onChange={(e) => setSelectedCafetero(e.target.value)}>
              <option value="">Seleccione un cafetero</option>
              {cafeteros.map((c) => (
                <option key={c.idUsuario} value={c.idUsuario}>{c.nombre} {c.apellido}</option>
              ))}
            </select>
            <div className="experto-modal-actions">
              <button className="btn-primary" onClick={handleAsignarCafetero}>
                {selectedCafetero ? 'Guardar asignación' : 'Dejar sin cafetero'}
              </button>
              <button className="btn-secondary" onClick={() => setShowCafeteroModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {editingFinca && (
        <div className="modal-overlay" onClick={() => setEditingFinca(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Editar finca</h2>
            <form onSubmit={handleUpdate}>
              <div className="finca-form-row">
                <input name="nombre_finca" value={editForm.nombre_finca} onChange={handleEditChange} placeholder="Nombre de la finca" required />
                <input name="municipio" value={editForm.municipio} onChange={handleEditChange} placeholder="Municipio" required />
                <input name="departamento" value={editForm.departamento} onChange={handleEditChange} placeholder="Departamento" required />
              </div>
              <div className="finca-form-row">
                <input name="altitud_msnm" value={editForm.altitud_msnm} onChange={handleEditChange} placeholder="Altitud (msnm)" />
                <input name="area_hectareas" value={editForm.area_hectareas} onChange={handleEditChange} placeholder="Área (hectáreas)" />
                <button type="button" className="btn-ubicacion" onClick={() => openUbicacionPicker('edit')}>
                  <BiMapPin size={16} />
                  {editForm.latitud && editForm.longitud ? `Ubicación: ${editForm.latitud}, ${editForm.longitud}` : 'Seleccionar ubicación'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? <Loading type="inline" text="Guardando..." /> : 'Guardar cambios'}</button>
                <button type="button" className="btn-secondary" onClick={() => setEditingFinca(null)}>Cancelar</button>
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
                <span className="badge-dot" />{detalleFinca.activo ? 'Activo' : 'Inactivo'}
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
                <span className="detalle-value">{detalleFinca.altitudMsnm ? `${detalleFinca.altitudMsnm} m.s.n.m.` : '—'}</span>
              </div>
              <div className="detalle-field">
                <span className="detalle-label">Área</span>
                <span className="detalle-value">{detalleFinca.areaHectareas ? `${detalleFinca.areaHectareas} ha` : '—'}</span>
              </div>
              <div className="detalle-field">
                <span className="detalle-label">Cultivos registrados</span>
                <span className="detalle-value">{detalleFinca.totalCultivos ?? 0}</span>
              </div>
              <div className="detalle-field">
                <span className="detalle-label">Experto asignado</span>
                <span className="detalle-value">{detalleFinca.nombreExperto || 'Sin asignar'}</span>
              </div>
              {detalleFinca.latitud && detalleFinca.longitud && (
                <div className="detalle-field detalle-field-full">
                  <span className="detalle-label">Coordenadas</span>
                  <span className="detalle-value">{detalleFinca.latitud}, {detalleFinca.longitud}</span>
                </div>
              )}
            </div>
            <div className="detalle-actions">
              <button className="btn-secondary" onClick={() => setShowDetalleModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showCultivoModal && (
        <div className="modal-overlay" onClick={() => setShowCultivoModal(false)}>
          <div className="modal-box modal-box--cultivos" onClick={(e) => e.stopPropagation()}>
            <h2>{editandoCultivo ? 'Editar cultivo' : 'Registrar cultivo'}</h2>
            <p className="modal-help">Finca: <strong>{selectedFincaForCultivo?.nombreFinca}</strong></p>
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
                          <button className="cultivo-btn cultivo-btn-editar" onClick={() => handleEditCultivo(c)} title="Editar cultivo"><BiEdit size={14} /></button>
                          <button className="cultivo-btn cultivo-btn-eliminar" onClick={() => handleDeleteCultivo(c.idCultivo)} title="Eliminar cultivo"><BiTrash size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {cultivosFinca.length === 0 && <p className="cultivos-sin-registros">No hay cultivos registrados en esta finca</p>}
            <div className="cultivos-divider" />
            <form onSubmit={handleCreateCultivo}>
              <div className="finca-form-row">
                <input name="nombre_cultivo" value={cultivoForm.nombre_cultivo} onChange={handleCultivoChange} placeholder="Nombre del cultivo" required />
                <input name="tipo_cultivo" value={cultivoForm.tipo_cultivo} onChange={handleCultivoChange} placeholder="Tipo de cultivo" required />
                <select name="id_estado_cultivo" value={cultivoForm.id_estado_cultivo} onChange={handleCultivoChange} className="cultivo-select">
                  <option value="">--- Sin estado ---</option>
                  {estadosCultivo.map((est) => (
                    <option key={est.idEstado} value={est.idEstado}>{est.nombreEstado}</option>
                  ))}
                </select>
              </div>
              <div className="cultivo-form-actions">
                <button type="submit" className="btn-primary" disabled={cultivoLoading}>
                  {cultivoLoading ? 'Guardando...' : editandoCultivo ? 'Actualizar cultivo' : 'Guardar cultivo'}
                </button>
                {editandoCultivo && (
                  <button type="button" className="btn-secondary" onClick={handleCancelEditCultivo}>Cancelar edición</button>
                )}
                <button type="button" className="btn-secondary" onClick={() => { setShowCultivoModal(false); setSelectedFincaForCultivo(null); setEditandoCultivo(null) }}>Cerrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
