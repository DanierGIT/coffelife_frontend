import { useState, useEffect, useMemo } from 'react'
import api from '../../../services/api'
import './Monitoreos.css'
import '../Administrador/Administrador.css'

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
  const [detalleMonitoreo, setDetalleMonitoreo] = useState(null)
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')
  const [success,          setSuccess]          = useState('')

  const fincaMap = useMemo(() => {
    const map = {}
    fincas.forEach((f) => { map[f.idFinca] = f })
    return map
  }, [fincas])

  const getMonitoreos = async () => {
    try {
      const res = await api.get('/monitoreos', { params: { limit: 100 } })
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

  return (
    <>
      <div className="page-header">
        <h1>Monitoreos</h1>
        <p>Registro de monitoreos de cultivos</p>
      </div>
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Finca</th><th>Cultivo</th><th>Experto</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {monitoreos.length === 0 ? (
              <tr><td colSpan={5} className="monitoreo-empty">🌱 No hay monitoreos registrados aún.</td></tr>
            ) : monitoreos.map((m, idx) => {
              const id = m.idMonitoreo ?? m.id_monitoreo
              const finca = fincaMap[m.cultivo?.idFinca]
              return (
                <tr key={id}>
                  <td>{idx + 1}</td>
                  <td>{finca?.nombreFinca || '—'}</td>
                  <td>{m.cultivo?.nombreCultivo || '—'}</td>
                  <td>{m.experto ? `${m.experto.nombre || ''} ${m.experto.apellido || ''}`.trim() : '—'}</td>
                  <td>
                    <div className="acciones-monitoreo">
                      <button className="btn-icon btn-icon-ver" onClick={() => setDetalleMonitoreo(m)} title="Ver detalle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button className="btn-icon btn-icon-editar" onClick={() => setEditingMonitoreo(m)} title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {detalleMonitoreo && (
        <div className="modal-overlay" onClick={() => setDetalleMonitoreo(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Detalle del monitoreo</h2>
              <button className="modal-close" onClick={() => setDetalleMonitoreo(null)}>✕</button>
            </div>
            <div className="detalle-grid">
              <div className="detalle-item">
                <span className="detalle-label">Fecha monitoreo</span>
                <span className="detalle-value">{fmt(detalleMonitoreo.fechaMonitoreo ?? detalleMonitoreo.fecha_monitoreo)}</span>
              </div>
              <div className="detalle-item">
                <span className="detalle-label">Observaciones</span>
                <span className="detalle-value">{detalleMonitoreo.observaciones || '—'}</span>
              </div>
              <div className="detalle-item">
                <span className="detalle-label">Registrado</span>
                <span className="detalle-value">{fmt(detalleMonitoreo.fechaRegistro ?? detalleMonitoreo.fecha_registro)}</span>
              </div>
              <div className="detalle-item">
                <span className="detalle-label">Actualizado</span>
                <span className="detalle-value">{fmt(detalleMonitoreo.fechaActualizacion ?? detalleMonitoreo.fecha_actualizacion)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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