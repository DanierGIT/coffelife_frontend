import { useEffect, useState, useRef } from 'react'
import './aplicacion.css'
import api from '../../../services/api'
import '../Administrador/Administrador.css'
import { BiPlus, BiDroplet } from 'react-icons/bi'
import Loading from '../../../components/Loading'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const getTratamientoLabel = (tratamiento) => {
  const nombre = tratamiento?.nombre || `Tratamiento #${tratamiento?.idTratamiento}`
  const tipo = tratamiento?.tipoTratamiento?.nombreTipo

  if (tipo) return `${nombre} - ${tipo}`
  return nombre
}

export default function Aplicacion() {
  const [idTratamiento, setIdTratamiento] = useState('')
  const [fechaAplicacion, setFechaAplicacion] = useState('')
  const [observacion, setObservacion] = useState('')
  const [idUsuario, setIdUsuario] = useState('')

  const [aplicaciones, setAplicaciones] = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [idEditar, setIdEditar] = useState(null)
  const [showCrearModal, setShowCrearModal] = useState(false)
  const catalogsLoaded = useRef(false)

  const [formModal, setFormModal] = useState({
    idTratamiento: '',
    fechaAplicacion: '',
    observacion: '',
    idUsuario: '',
  })

  const cargarAplicaciones = async () => {
    setPageLoading(true)
    try {
      const res = await api.get('/aplicaciones_tratamientos')
      setAplicaciones(getArrayData(res.data))
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar aplicaciones.')
    } finally {
      setPageLoading(false)
    }
  }

  const loadCatalogos = async () => {
    if (catalogsLoaded.current) return
    catalogsLoaded.current = true
    try {
      const [tratamientosRes, usuariosRes] = await Promise.all([
        api.get('/tratamientos'),
        api.get('/usuarios'),
      ])

      setTratamientos(getArrayData(tratamientosRes.data))
      setUsuarios(getArrayData(usuariosRes.data))
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar tratamientos o usuarios.')
    }
  }

  useEffect(() => {
    cargarAplicaciones()
  }, [])

  const limpiarFormulario = () => {
    setIdTratamiento('')
    setFechaAplicacion('')
    setObservacion('')
    setIdUsuario('')
  }

  const guardar = async () => {
    if (!idTratamiento || !idUsuario) {
      setError('Tratamiento y usuario son obligatorios.')
      return
    }

    setCargando(true)
    setError('')
    setExito('')

    try {
      await api.post('/aplicaciones_tratamientos', {
        id_tratamiento:   Number(idTratamiento),
        id_usuario:       Number(idUsuario),
        fecha_aplicacion: fechaAplicacion || new Date().toISOString().slice(0, 10),
        observacion:      observacion.trim() || null,
      })

      setExito('Aplicacion registrada correctamente.')
      setShowCrearModal(false)
      limpiarFormulario()
      await cargarAplicaciones()
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al guardar.')
    } finally {
      setCargando(false)
    }
  }

  const abrirEditar = (aplicacion) => {
    loadCatalogos()
    setIdEditar(aplicacion.idAplicacion)

    setFormModal({
      idTratamiento: aplicacion.idTratamiento || '',
      fechaAplicacion: aplicacion.fechaAplicacion || '',
      observacion: aplicacion.observacion || '',
      idUsuario: aplicacion.idUsuario || '',
    })

    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setIdEditar(null)
    setFormModal({
      idTratamiento: '',
      fechaAplicacion: '',
      observacion: '',
      idUsuario: '',
    })
  }

  const actualizar = async () => {
    if (!formModal.idTratamiento || !formModal.idUsuario) {
      setError('Tratamiento y usuario son obligatorios.')
      return
    }

    setCargando(true)
    setError('')

    try {
      await api.put(`/aplicaciones_tratamientos/${idEditar}`, {
        id_tratamiento:   Number(formModal.idTratamiento),
        id_usuario:       Number(formModal.idUsuario),
        fecha_aplicacion: formModal.fechaAplicacion || new Date().toISOString().slice(0, 10),
        observacion:      formModal.observacion.trim() || null,
      })

      cerrarModal()
      await cargarAplicaciones()
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al actualizar.')
    } finally {
      setCargando(false)
    }
  }

  const eliminar = async (id) => {
    if (!window.confirm('Seguro que deseas eliminar esta aplicacion?')) return

    try {
      await api.delete(`/aplicaciones_tratamientos/${id}`)
      await cargarAplicaciones()
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al eliminar.')
    }
  }

  if (pageLoading) return <Loading type="content" text="Cargando..." />

  return (
    <div className="rl-container">
      <div className="page-header">
        <div className="page-header-icon">
          <BiDroplet size={22} />
        </div>
        <div className="page-header-text">
          <h1>Aplicación de Tratamientos</h1>
          <p>Registro de aplicación de tratamientos</p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          className="btn-primary"
          onClick={() => { loadCatalogos(); setShowCrearModal(true) }}
          style={{
            background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <BiPlus size={18} />
          Agregar aplicacion
        </button>
      </div>



      <div className="rl-card">
        <p className="rl-label">Aplicaciones Registradas</p>

        <table className="rl-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tratamiento</th>
                <th>Fecha Aplicación</th>
                <th>Observación</th>
                <th>Fecha Registro</th>
                <th>Usuario</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {aplicaciones.length === 0 ? (
                <tr>
                  <td colSpan="7" className="rl-empty">No hay aplicaciones registradas</td>
                </tr>
              ) : (
                aplicaciones.map((aplicacion, idx) => (
                  <tr key={aplicacion.idAplicacion}>
                    <td>{idx + 1}</td>
                    <td>{aplicacion.tratamiento ? getTratamientoLabel(aplicacion.tratamiento) : `#${aplicacion.idTratamiento}`}</td>
                    <td>{aplicacion.fechaAplicacion ? new Date(aplicacion.fechaAplicacion).toLocaleDateString() : '-'}</td>
                    <td>{aplicacion.observacion || '-'}</td>
                    <td>{aplicacion.fechaRegistro ? new Date(aplicacion.fechaRegistro).toLocaleDateString() : '-'}</td>
                    <td>{aplicacion.usuario?.nombre ?? `#${aplicacion.idUsuario}`}</td>
                    <td className="acciones">
                      <button className="btn-editar" onClick={() => abrirEditar(aplicacion)}>
                        Editar
                      </button>

                      <button className="btn-eliminar" onClick={() => eliminar(aplicacion.idAplicacion)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Aplicacion</h3>
              <button className="modal-close" onClick={cerrarModal}>x</button>
            </div>

            <div className="modal-form">
              <label>
                Tratamiento
                <select
                  value={formModal.idTratamiento}
                  onChange={(e) => setFormModal({ ...formModal, idTratamiento: e.target.value })}
                >
                  <option value="">Seleccionar tratamiento...</option>

                  {tratamientos.map((tratamiento) => (
                    <option key={tratamiento.idTratamiento} value={tratamiento.idTratamiento}>
                      {getTratamientoLabel(tratamiento)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Usuario
                <select
                  value={formModal.idUsuario}
                  onChange={(e) => setFormModal({ ...formModal, idUsuario: e.target.value })}
                >
                  <option value="">Seleccionar usuario...</option>

                  {usuarios.map((usuario) => (
                    <option key={usuario.idUsuario ?? usuario.id} value={usuario.idUsuario ?? usuario.id}>
                      {usuario.nombre ?? usuario.correo} {usuario.apellido ?? ''}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Fecha aplicación
                <input
                  type="date"
                  value={formModal.fechaAplicacion}
                  onChange={(e) => setFormModal({ ...formModal, fechaAplicacion: e.target.value })}
                />
              </label>

              <label>
                Observación
                <textarea
                  placeholder="Observación opcional"
                  value={formModal.observacion}
                  onChange={(e) => setFormModal({ ...formModal, observacion: e.target.value })}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-cancelar" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-guardar" onClick={actualizar} disabled={cargando}>
                {cargando ? <Loading type="inline" text="Guardando..." /> : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCrearModal && (
        <div className="modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nueva Aplicacion</h3>
              <button className="modal-close" onClick={() => setShowCrearModal(false)}>x</button>
            </div>
            <div className="modal-form">
              <label>Tratamiento
                <select value={idTratamiento} onChange={(e) => setIdTratamiento(e.target.value)}>
                  <option value="">Seleccionar tratamiento...</option>
                  {tratamientos.map((tratamiento) => (
                    <option key={tratamiento.idTratamiento} value={tratamiento.idTratamiento}>
                      {getTratamientoLabel(tratamiento)}
                    </option>
                  ))}
                </select>
              </label>
              <label>Usuario
                <select value={idUsuario} onChange={(e) => setIdUsuario(e.target.value)}>
                  <option value="">Seleccionar usuario...</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.idUsuario ?? usuario.id} value={usuario.idUsuario ?? usuario.id}>
                      {usuario.nombre ?? usuario.correo} {usuario.apellido ?? ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>Fecha aplicación
                <input type="date" value={fechaAplicacion} onChange={(e) => setFechaAplicacion(e.target.value)} />
              </label>
              <label>Observación
                <textarea placeholder="Observación opcional" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
              </label>
            </div>
            {error && <p className="rl-error" style={{ marginTop: '10px' }}>{error}</p>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCrearModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={guardar} disabled={cargando}>
                {cargando ? <Loading type="inline" text="Guardando..." /> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}