import { useState, useEffect } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './Fincas.css'

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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put(`/fincas/${finca.idFinca}`, form)
      onSaved()
      onClose()
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar finca</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="grid-2">
            <input name="nombre_finca" value={form.nombre_finca} onChange={handleChange} placeholder="Nombre finca" />
            <input name="municipio" value={form.municipio} onChange={handleChange} placeholder="Municipio" />
          </div>

          <input name="departamento" value={form.departamento} onChange={handleChange} placeholder="Departamento" />

          <div className="grid-2">
            <input name="latitud" value={form.latitud} onChange={handleChange} placeholder="Latitud" />
            <input name="longitud" value={form.longitud} onChange={handleChange} placeholder="Longitud" />
          </div>

          <div className="grid-2">
            <input name="altitud_msnm" value={form.altitud_msnm} onChange={handleChange} placeholder="Altitud" />
            <input name="area_hectareas" value={form.area_hectareas} onChange={handleChange} placeholder="Área (ha)" />
          </div>

          <button className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Fincas() {
  const { user } = useAuth()

  const [fincas, setFincas] = useState([])
  const [editing, setEditing] = useState(null)

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
    const res = await api('/fincas')
    setFincas(res.data?.data || res.data || [])
  }

  useEffect(() => {
    getFincas()
  }, [])

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()

    await api.post('/fincas', {
      ...form,
      id_usuario: user?.idUsuario,
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

    getFincas()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar finca?')) return
    await api.delete(`/fincas/${id}`)
    getFincas()
  }

  return (
    <div className="page">

      {/* HEADER */}
      <div className="page-header">
        <h1>Fincas</h1>
        <p>Gestión de fincas registradas</p>
      </div>

      {/* FORM CARD */}
      <div className="card">
        <h2>Registrar finca</h2>

        <form onSubmit={handleCreate} className="form">
          <div className="grid-3">
            <input name="nombre_finca" value={form.nombre_finca} onChange={handleChange} placeholder="Nombre" />
            <input name="municipio" value={form.municipio} onChange={handleChange} placeholder="Municipio" />
            <input name="departamento" value={form.departamento} onChange={handleChange} placeholder="Departamento" />
          </div>

          <div className="grid-2">
            <input name="latitud" value={form.latitud} onChange={handleChange} placeholder="Latitud" />
            <input name="longitud" value={form.longitud} onChange={handleChange} placeholder="Longitud" />
          </div>

          <div className="grid-2">
            <input name="altitud_msnm" value={form.altitud_msnm} onChange={handleChange} placeholder="Altitud" />
            <input name="area_hectareas" value={form.area_hectareas} onChange={handleChange} placeholder="Área" />
          </div>

          <button className="btn-primary">Registrar finca</button>
        </form>
      </div>

      {/* TABLE */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Municipio</th>
              <th>Departamento</th>
              <th>Área</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {fincas.map((f) => (
              <tr key={f.idFinca}>
                <td>{f.idFinca}</td>
                <td>{f.nombreFinca}</td>
                <td>{f.municipio}</td>
                <td>{f.departamento}</td>
                <td>{f.areaHectareas || '—'}</td>
                <td className="actions">
                  <button onClick={() => setEditing(f)}>Editar</button>
                  <button onClick={() => handleDelete(f.idFinca)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditModal
          finca={editing}
          onClose={() => setEditing(null)}
          onSaved={getFincas}
        />
      )}
    </div>
  )
}