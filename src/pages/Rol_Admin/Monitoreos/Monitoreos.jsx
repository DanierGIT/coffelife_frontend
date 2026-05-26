import { useState, useEffect, useMemo } from 'react'
import api from '../../../services/api'
import './Monitoreos.css'

const fmt = (val) => (val ? new Date(val).toLocaleDateString('es-CO') : '—')

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

// ── Modal de edición ──────────────────────────────────────────────────────────
function EditModal({ monitoreo, onClose, onSaved, cultivos, expertos, fincaMap }) {
  const [form, setForm] = useState({
    id_cultivo:      monitoreo.idCultivo      || monitoreo.id_cultivo      || '',
    id_experto:      monitoreo.idExperto       || monitoreo.id_experto       || '',
    fecha_monitoreo: (monitoreo.fechaMonitoreo || monitoreo.fecha_monitoreo || '').slice(0, 10),
    observaciones:   monitoreo.observaciones  || '',
  })

  const fincaActual = fincaMap[monitoreo.cultivo?.idFinca]
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const id = monitoreo.idMonitoreo || monitoreo.id_monitoreo
      const payload = {
        fecha_monitoreo: form.fecha_monitoreo,
        observaciones: form.observaciones,
      }
      await api.put(`/monitoreos/${id}`, payload)
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
          <h2 className="modal-title">Editar monitoreo</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          {fincaActual && (
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '12px', padding: '8px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
              <strong>Finca:</strong> {fincaActual.nombreFinca} &nbsp;|&nbsp; <strong>Cultivo:</strong> {monitoreo.cultivo?.nombreCultivo || '—'}
            </p>
          )}
          <div className="modal-row">
            <label>Cultivo
              <select name="id_cultivo" value={form.id_cultivo} disabled>
                <option value="">Seleccionar cultivo...</option>
                {cultivos.map((c) => (
                  <option key={c.idCultivo} value={c.idCultivo}>
                    {c.nombreCultivo}
                  </option>
                ))}
              </select>
            </label>
            <label>Experto
              <select name="id_experto" value={form.id_experto} disabled>
                <option value="">Seleccionar experto...</option>
                {expertos.map((e) => (
                  <option key={e.idUsuario} value={e.idUsuario}>
                    {e.nombre} {e.apellido || ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>Fecha de monitoreo
            <input name="fecha_monitoreo" type="date" value={form.fecha_monitoreo} onChange={handleChange} required />
          </label>
          <label>Observaciones
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={4} />
          </label>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Monitoreos() {
  const [monitoreos,       setMonitoreos]       = useState([])
  const [cultivos,         setCultivos]         = useState([])
  const [expertos,         setExpertos]         = useState([])
  const [fincas,           setFincas]           = useState([])
  const [editingMonitoreo, setEditingMonitoreo] = useState(null)
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')
  const [success,          setSuccess]          = useState('')

  const fincaMap = useMemo(() => {
    const map = {}
    fincas.forEach((f) => { map[f.idFinca] = f })
    return map
  }, [fincas])

  const [form, setForm] = useState({
    id_finca:        '',
    id_cultivo:      '',
    id_experto:      '',
    fecha_monitoreo: '',
    observaciones:   '',
  })

  const filteredCultivos = useMemo(() => {
    if (!form.id_finca) return []
    return cultivos.filter((c) => String(c.idFinca) === String(form.id_finca))
  }, [cultivos, form.id_finca])

  const getMonitoreos = async () => {
    try {
      const res = await api.get('/monitoreos')
      setMonitoreos(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch {
      setError('No se pudieron cargar los monitoreos.')
    }
  }

  const getCatalogos = async () => {
    try {
      const [cultivosRes, expertosRes, fincasRes] = await Promise.all([
        api.get('/cultivos'),
        api.get('/expertos'),
        api.get('/fincas'),
      ])
      setCultivos(Array.isArray(cultivosRes.data) ? cultivosRes.data : (cultivosRes.data?.data ?? []))
      setExpertos(Array.isArray(expertosRes.data) ? expertosRes.data : (expertosRes.data?.data ?? []))
      setFincas(getArrayData(fincasRes.data))
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    getMonitoreos()
    getCatalogos()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/monitoreos', form)
      setForm({ id_finca: '', id_cultivo: '', id_experto: '', fecha_monitoreo: '', observaciones: '' })
      setSuccess('Monitoreo registrado correctamente.')
      getMonitoreos()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo registrar el monitoreo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="admin-page-title">Monitoreos</h1>

      <div className="admin-form-card">
        <h2 className="admin-form-title">Registrar nuevo monitoreo</h2>
        <form className="monitoreo-form" onSubmit={handleCreate}>
          <div className="monitoreo-form-row">
            <label className="monitoreo-label">Finca
              <select name="id_finca" value={form.id_finca} onChange={(e) => {
                handleChange(e)
                setForm((prev) => ({ ...prev, id_cultivo: '' }))
              }} required>
                <option value="">Seleccionar finca...</option>
                {fincas.map((f) => (
                  <option key={f.idFinca} value={f.idFinca}>
                    {f.nombreFinca}
                  </option>
                ))}
              </select>
            </label>
            <label className="monitoreo-label">Cultivo
              <select name="id_cultivo" value={form.id_cultivo} onChange={handleChange} required
                disabled={!form.id_finca}>
                <option value="">{form.id_finca ? 'Seleccionar cultivo...' : 'Primero seleccione una finca'}</option>
                {filteredCultivos.map((c) => (
                  <option key={c.idCultivo} value={c.idCultivo}>
                    {c.nombreCultivo}
                  </option>
                ))}
              </select>
            </label>
            <label className="monitoreo-label">Experto
              <select name="id_experto" value={form.id_experto} onChange={handleChange} required>
                <option value="">Seleccionar experto...</option>
                {expertos.map((e) => (
                  <option key={e.idUsuario} value={e.idUsuario}>
                    {e.nombre} {e.apellido || ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="monitoreo-label">Fecha de monitoreo
              <input name="fecha_monitoreo" type="date" value={form.fecha_monitoreo} onChange={handleChange} required />
            </label>
          </div>
          <label className="monitoreo-label monitoreo-label--full">Observaciones
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} placeholder="Describe las condiciones del cultivo..." />
          </label>
          {error   && <p className="monitoreo-error">{error}</p>}
          {success && <p className="monitoreo-success">{success}</p>}
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : '+ Registrar monitoreo'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Finca</th><th>Cultivo</th><th>Experto</th><th>Fecha monitoreo</th>
              <th>Observaciones</th><th>Registrado</th><th>Actualizado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {monitoreos.length === 0 ? (
              <tr><td colSpan={9} className="monitoreo-empty">🌱 No hay monitoreos registrados aún.</td></tr>
            ) : monitoreos.map((m, idx) => {
              const id = m.idMonitoreo ?? m.id_monitoreo
              const finca = fincaMap[m.cultivo?.idFinca]
              return (
                <tr key={id}>
                  <td>{idx + 1}</td>
                  <td>{finca?.nombreFinca || '—'}</td>
                  <td>{m.cultivo?.nombreCultivo || '—'}</td>
                  <td>{m.experto ? `${m.experto.nombre || ''} ${m.experto.apellido || ''}`.trim() : '—'}</td>
                  <td>{fmt(m.fechaMonitoreo   ?? m.fecha_monitoreo)}</td>
                  <td className="monitoreo-obs">{m.observaciones || '—'}</td>
                  <td>{fmt(m.fechaRegistro      ?? m.fecha_registro)}</td>
                  <td>{fmt(m.fechaActualizacion ?? m.fecha_actualizacion)}</td>
                  <td>
                    <button className="btn-edit" onClick={() => setEditingMonitoreo(m)}>Editar</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editingMonitoreo && (
        <EditModal
          monitoreo={editingMonitoreo}
          onClose={() => setEditingMonitoreo(null)}
          onSaved={getMonitoreos}
          cultivos={cultivos}
          expertos={expertos}
          fincaMap={fincaMap}
        />
      )}
    </>
  )
}