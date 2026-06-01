import { useEffect, useState } from 'react'
import './aplicacion.css'
import api from '../../../services/api'
import '../Administrador/Administrador.css'

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
  const [dosis, setDosis] = useState('')
  const [frecuencia, setFrecuencia] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [idUsuario, setIdUsuario] = useState('')

  const [aplicaciones, setAplicaciones] = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [idEditar, setIdEditar] = useState(null)
  const [showCrearModal, setShowCrearModal] = useState(false)

  const [formModal, setFormModal] = useState({
    idTratamiento: '',
    dosis: '',
    frecuencia: '',
    observaciones: '',
    idUsuario: '',
  })

  const cargarAplicaciones = async () => {
    try {
      const res = await api.get('/aplicaciones_tratamientos')
      setAplicaciones(getArrayData(res.data))
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar aplicaciones.')
    }
  }

  const cargarCatalogos = async () => {
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
    cargarCatalogos()
  }, [])

  const limpiarFormulario = () => {
    setIdTratamiento('')
    setDosis('')
    setFrecuencia('')
    setObservaciones('')
    setIdUsuario('')
  }

  const guardar = async () => {
    if (!idTratamiento || !idUsuario || !dosis.trim()) {
      setError('Tratamiento, usuario y dosis son obligatorios.')
      return
    }

    setCargando(true)
    setError('')
    setExito('')

    try {
      await api.post('/aplicaciones_tratamientos', {
        id_tratamiento: Number(idTratamiento),
        id_usuario: Number(idUsuario),
        dosis: dosis.trim(),
        frecuencia: frecuencia.trim() || null,
        observaciones: observaciones.trim() || null,
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
    setIdEditar(aplicacion.idAplicacion)

    setFormModal({
      idTratamiento: aplicacion.idTratamiento || '',
      dosis: aplicacion.dosis || '',
      frecuencia: aplicacion.frecuencia || '',
      observaciones: aplicacion.observaciones || '',
      idUsuario: aplicacion.idUsuario || '',
    })

    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setIdEditar(null)
    setFormModal({
      idTratamiento: '',
      dosis: '',
      frecuencia: '',
      observaciones: '',
      idUsuario: '',
    })
  }

  const actualizar = async () => {
    if (!formModal.idTratamiento || !formModal.idUsuario || !formModal.dosis.trim()) {
      setError('Tratamiento, usuario y dosis son obligatorios.')
      return
    }

    setCargando(true)
    setError('')

    try {
      await api.put(`/aplicaciones_tratamientos/${idEditar}`, {
        id_tratamiento: Number(formModal.idTratamiento),
        id_usuario: Number(formModal.idUsuario),
        dosis: formModal.dosis.trim(),
        frecuencia: formModal.frecuencia.trim() || null,
        observaciones: formModal.observaciones.trim() || null,
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

  return (
    <div className="rl-container">
      <div className="page-header">
        <h1>Aplicación de Tratamientos</h1>
        <p>Registro de aplicación de tratamientos</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          className="btn-primary"
          onClick={() => setShowCrearModal(true)}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
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
                <th>Dosis</th>
                <th>Frecuencia</th>
                <th>Observaciones</th>
                <th>Fecha Registro</th>
                <th>Fecha Actualizacion</th>
                <th>Usuario</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {aplicaciones.length === 0 ? (
                <tr>
                  <td colSpan="9" className="rl-empty">No hay aplicaciones registradas</td>
                </tr>
              ) : (
                aplicaciones.map((aplicacion, idx) => (
                  <tr key={aplicacion.idAplicacion}>
                    <td>{idx + 1}</td>
                    <td>{aplicacion.tratamiento ? getTratamientoLabel(aplicacion.tratamiento) : `#${aplicacion.idTratamiento}`}</td>
                    <td>{aplicacion.dosis}</td>
                    <td>{aplicacion.frecuencia || '-'}</td>
                    <td>{aplicacion.observaciones || '-'}</td>
                    <td>{aplicacion.fechaRegistro ? new Date(aplicacion.fechaRegistro).toLocaleDateString() : '-'}</td>
                    <td>{aplicacion.fechaActualizacion ? new Date(aplicacion.fechaActualizacion).toLocaleDateString() : '-'}</td>
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
                Dosis
                <input
                  type="text"
                  placeholder="Ej: 20ml"
                  value={formModal.dosis}
                  onChange={(e) => setFormModal({ ...formModal, dosis: e.target.value })}
                />
              </label>

              <label>
                Frecuencia
                <input
                  type="text"
                  placeholder="Ej: Cada 7 dias"
                  value={formModal.frecuencia}
                  onChange={(e) => setFormModal({ ...formModal, frecuencia: e.target.value })}
                />
              </label>

              <label>
                Observaciones
                <textarea
                  placeholder="Observaciones opcionales"
                  value={formModal.observaciones}
                  onChange={(e) => setFormModal({ ...formModal, observaciones: e.target.value })}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-cancelar" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-guardar" onClick={actualizar} disabled={cargando}>
                {cargando ? 'Guardando...' : 'Guardar cambios'}
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
              <label>Dosis
                <input type="text" placeholder="Ej: 20ml" value={dosis} onChange={(e) => setDosis(e.target.value)} />
              </label>
              <label>Frecuencia
                <input type="text" placeholder="Ej: Cada 7 dias" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} />
              </label>
              <label>Observaciones
                <textarea placeholder="Observaciones opcionales" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </label>
            </div>
            {error && <p className="rl-error" style={{ marginTop: '10px' }}>{error}</p>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCrearModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={guardar} disabled={cargando}>
                {cargando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}