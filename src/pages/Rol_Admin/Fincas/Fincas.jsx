import { useEffect, useState } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './Fincas.css'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const getRoleName = (user) => {
  return (
    user?.rol?.nombreRol ||
    user?.rol?.nombre_rol ||
    user?.rol ||
    ''
  ).toString().toLowerCase().trim()
}

const getToday = () => new Date().toISOString().slice(0, 10)

function EditModal({ finca, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre_finca: finca.nombreFinca || '',
    municipio: finca.municipio || '',
    departamento: finca.departamento || '',
    latitud: finca.latitud || '',
    longitud: finca.longitud || '',
    altitud_msnm: finca.altitudMsnm || '',
    area_hectareas: finca.areaHectareas || '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.put(`/fincas/${finca.idFinca}`, form)
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
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar finca</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>
              Nombre de la finca
              <input name="nombre_finca" value={form.nombre_finca} onChange={handleChange} required />
            </label>

            <label>
              Municipio
              <input name="municipio" value={form.municipio} onChange={handleChange} required />
            </label>
          </div>

          <label>
            Departamento
            <input name="departamento" value={form.departamento} onChange={handleChange} required />
          </label>

          <div className="modal-row">
            <label>
              Latitud
              <input name="latitud" value={form.latitud} onChange={handleChange} placeholder="Ej: 4.7110" />
            </label>

            <label>
              Longitud
              <input name="longitud" value={form.longitud} onChange={handleChange} placeholder="Ej: -74.0721" />
            </label>
          </div>

          <div className="modal-row">
            <label>
              Altitud m.s.n.m.
              <input name="altitud_msnm" value={form.altitud_msnm} onChange={handleChange} placeholder="Ej: 1800" />
            </label>

            <label>
              Area en hectareas
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

function AssignExpertModal({ finca, expertos, asignacionActual, onClose, onSaved }) {
  const [idExperto, setIdExperto] = useState(asignacionActual?.idExperto || '')
  const [fechaAsignada, setFechaAsignada] = useState(asignacionActual?.fechaAsignada || getToday())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const expertoSeleccionado = expertos.find(
    (experto) => Number(experto.idUsuario) === Number(idExperto)
  )

  const expertosOrdenados = [...expertos].sort((a, b) => {
    if (a.activo === b.activo) return a.nombre.localeCompare(b.nombre)
    return a.activo ? -1 : 1
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!expertoSeleccionado?.activo) {
      setError('No puedes asignar una finca a un experto inactivo.')
      setLoading(false)
      return
    }

    try {
      const payload = {
        idExperto: Number(idExperto),
        idFinca: Number(finca.idFinca),
        fechaAsignada,
      }

      if (asignacionActual?.idAsignacion) {
        await api.put(`/asignaciones_expertos/${asignacionActual.idAsignacion}`, payload)
      } else {
        await api.post('/asignaciones_expertos', payload)
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo asignar el experto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Asignar experto</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <p className="modal-help">
            Finca seleccionada: <strong>{finca.nombreFinca}</strong>
          </p>

          <label>
            Experto
            <select value={idExperto} onChange={(e) => setIdExperto(e.target.value)} required>
              <option value="">Selecciona un experto</option>

              {expertosOrdenados.map((experto) => (
                <option
                  key={experto.idUsuario}
                  value={experto.idUsuario}
                  disabled={!experto.activo}
                >
                  {experto.nombre} {experto.apellido || ''} - {experto.correo} - {experto.activo ? 'Activo' : 'Inactivo'}
                </option>
              ))}
            </select>
          </label>

          {expertoSeleccionado && (
            <div className={expertoSeleccionado.activo ? 'expert-status active' : 'expert-status inactive'}>
              Estado del experto: <strong>{expertoSeleccionado.activo ? 'Activo' : 'Inactivo'}</strong>
            </div>
          )}

          <label>
            Fecha de asignacion
            <input
              type="date"
              value={fechaAsignada}
              onChange={(e) => setFechaAsignada(e.target.value)}
              required
            />
          </label>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !expertoSeleccionado?.activo}
            >
              {loading ? 'Asignando...' : asignacionActual ? 'Actualizar asignacion' : 'Asignar experto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Fincas() {
  const { user } = useAuth()
  const role = getRoleName(user)
  const isAdmin = role === 'admin' || role === 'administrador'

  const [fincas, setFincas] = useState([])
  const [expertos, setExpertos] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [editingFinca, setEditingFinca] = useState(null)
  const [assigningFinca, setAssigningFinca] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
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
      const res = await api.get('/fincas')
      setFincas(getArrayData(res.data))
    } catch {
      setError('No se pudieron cargar las fincas.')
    }
  }

  const getAdminData = async () => {
    if (!isAdmin) return

    try {
      const [expertosRes, asignacionesRes] = await Promise.all([
        api.get('/expertos'),
        api.get('/asignaciones_expertos'),
      ])

      setExpertos(getArrayData(expertosRes.data))
      setAsignaciones(getArrayData(asignacionesRes.data))
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar expertos o asignaciones.')
    }
  }

  useEffect(() => {
    getFincas()
  }, [])

  useEffect(() => {
    getAdminData()
  }, [isAdmin])

  const refreshData = async () => {
    await getFincas()
    await getAdminData()
  }

  const getAsignacionByFinca = (idFinca) => {
    return asignaciones.find((asignacion) => Number(asignacion.idFinca) === Number(idFinca))
  }

  const getNombreExpertoAsignado = (idFinca) => {
    const asignacion = getAsignacionByFinca(idFinca)

    if (!asignacion) return 'Sin asignar'

    if (asignacion.experto?.nombre) {
      return `${asignacion.experto.nombre} ${asignacion.experto.apellido || ''}`.trim()
    }

    const experto = expertos.find((item) => Number(item.idUsuario) === Number(asignacion.idExperto))

    if (!experto) return 'Asignado'

    return `${experto.nombre} ${experto.apellido || ''}`.trim()
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/fincas', {
        ...form,
        id_usuario: user?.idUsuario || user?.id,
      })

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
      setError(err?.response?.data?.message || 'No se pudo registrar la finca.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta finca?')) return

    try {
      await api.delete(`/fincas/${id}`)
      refreshData()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar la finca.')
    }
  }

  return (
    <>
      <h1 className="admin-page-title">Fincas</h1>

      <div className="admin-form-card">
        <h2 className="admin-form-title">Registrar nueva finca</h2>

        <form className="finca-form" onSubmit={handleCreate}>
          <div className="finca-form-row">
            <input name="nombre_finca" value={form.nombre_finca} onChange={handleChange} placeholder="Nombre de la finca" required />
            <input name="municipio" value={form.municipio} onChange={handleChange} placeholder="Municipio" required />
            <input name="departamento" value={form.departamento} onChange={handleChange} placeholder="Departamento" required />
          </div>

          <div className="finca-form-row">
            <input name="latitud" value={form.latitud} onChange={handleChange} placeholder="Latitud (ej: 4.7110)" />
            <input name="longitud" value={form.longitud} onChange={handleChange} placeholder="Longitud (ej: -74.0721)" />
            <input name="altitud_msnm" value={form.altitud_msnm} onChange={handleChange} placeholder="Altitud m.s.n.m." />
            <input name="area_hectareas" value={form.area_hectareas} onChange={handleChange} placeholder="Area (hectareas)" />
          </div>

          {error && <p className="modal-error">{error}</p>}
          {success && <p className="finca-success">{success}</p>}

          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar finca'}
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
              <th>Area (ha)</th>
              {isAdmin && <th>Experto</th>}
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {fincas.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="finca-empty">
                  No hay fincas registradas aun.
                </td>
              </tr>
            ) : fincas.map((f) => {
              const asignacionActual = getAsignacionByFinca(f.idFinca)

              return (
                <tr key={f.idFinca}>
                  <td>{f.idFinca}</td>
                  <td>{f.nombreFinca}</td>
                  <td>{f.municipio}</td>
                  <td>{f.departamento}</td>
                  <td>{f.altitudMsnm ? `${f.altitudMsnm} m` : '-'}</td>
                  <td>{f.areaHectareas ?? '-'}</td>

                  {isAdmin && (
                    <td>
                      <span className={asignacionActual ? 'assignment-hint assigned' : 'assignment-hint'}>
                        {getNombreExpertoAsignado(f.idFinca)}
                      </span>
                    </td>
                  )}

                  <td>
                    <div className="finca-actions">
                      {isAdmin && (
                        <button className="btn-assign" onClick={() => setAssigningFinca(f)}>
                          {asignacionActual ? 'Cambiar experto' : 'Asignar experto'}
                        </button>
                      )}

                      <button className="btn-edit" onClick={() => setEditingFinca(f)}>
                        Editar
                      </button>

                      <button className="btn-delete" onClick={() => handleDelete(f.idFinca)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editingFinca && (
        <EditModal
          finca={editingFinca}
          onClose={() => setEditingFinca(null)}
          onSaved={refreshData}
        />
      )}

      {assigningFinca && (
        <AssignExpertModal
          finca={assigningFinca}
          expertos={expertos}
          asignacionActual={getAsignacionByFinca(assigningFinca.idFinca)}
          onClose={() => setAssigningFinca(null)}
          onSaved={refreshData}
        />
      )}
    </>
  )
}