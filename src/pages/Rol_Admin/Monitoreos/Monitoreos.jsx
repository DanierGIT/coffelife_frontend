import { useState, useEffect, useMemo } from 'react'
import api from '../../../services/api'
import './Monitoreos.css'
import '../Administrador/Administrador.css'
import { BiShow, BiEdit, BiArrowBack } from 'react-icons/bi'

const fmt = (val) => (val ? new Date(val).toLocaleDateString('es-CO') : '—')
const fmtDatetime = (val) => {
  if (!val) return '—'
  const d = new Date(val)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

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

// ── Modal de lista de monitoreos de una finca ──────────────────────────────────
function ListaMonitoreosModal({ finca, monitoreos, onBack, onVerDetalle, onEditar }) {
  const sorted = useMemo(() => {
    return [...monitoreos].sort((a, b) => {
      const fechaA = new Date(a.fechaMonitoreo || a.fecha_monitoreo || 0)
      const fechaB = new Date(b.fechaMonitoreo || b.fecha_monitoreo || 0)
      return fechaB - fechaA
    })
  }, [monitoreos])

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Monitoreos de {finca?.nombreFinca}</h2>
          <button className="modal-close" onClick={onBack}>✕</button>
        </div>
        <div className="mon-list">
          {sorted.length === 0 ? (
            <p className="mon-list-empty">No hay monitoreos registrados para esta finca.</p>
          ) : sorted.map((m) => {
            const id = m.idMonitoreo ?? m.id_monitoreo
            return (
              <div key={id} className="mon-list-item">
                <div className="mon-list-info">
                  <span className="mon-list-cultivo">{m.cultivo?.nombreCultivo || '—'}</span>
                  <span className="mon-list-fecha">{fmt(m.fechaMonitoreo ?? m.fecha_monitoreo)}</span>
                </div>
                <div className="mon-list-acciones">
                  <button className="btn-icon btn-icon-ver" onClick={() => onVerDetalle(m)} title="Ver detalle">
                    <BiShow size={16} />
                  </button>
                  <button className="btn-icon btn-icon-editar" onClick={() => onEditar(m)} title="Editar">
                    <BiEdit size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Modal de detalle de un monitoreo ──────────────────────────────────────────
function DetalleMonitoreoModal({ monitoreo, onBack }) {
  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Detalle del monitoreo</h2>
          <button className="modal-close" onClick={onBack}>✕</button>
        </div>
        <div className="detalle-grid">
          <div className="detalle-item">
            <span className="detalle-label">Cultivo</span>
            <span className="detalle-value">{monitoreo.cultivo?.nombreCultivo || '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Experto</span>
            <span className="detalle-value">
              {monitoreo.experto ? `${monitoreo.experto.nombre || ''} ${monitoreo.experto.apellido || ''}`.trim() : '—'}
            </span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Fecha de monitoreo</span>
            <span className="detalle-value">{fmt(monitoreo.fechaMonitoreo ?? monitoreo.fecha_monitoreo)}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Observaciones</span>
            <span className="detalle-value">{monitoreo.observaciones || '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Registrado</span>
            <span className="detalle-value">{fmtDatetime(monitoreo.fechaRegistro ?? monitoreo.fecha_registro)}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Actualizado</span>
            <span className="detalle-value">{fmtDatetime(monitoreo.fechaActualizacion ?? monitoreo.fecha_actualizacion)}</span>
          </div>
        </div>
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="btn-secondary" onClick={onBack}>
            <BiArrowBack size={14} style={{ marginRight: 6 }} />
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Monitoreos() {
  const [monitoreos, setMonitoreos] = useState([])
  const [cultivos,   setCultivos]   = useState([])
  const [expertos,   setExpertos]   = useState([])
  const [fincas,     setFincas]     = useState([])
  const [editingMonitoreo, setEditingMonitoreo] = useState(null)
  const [selectedFinca, setSelectedFinca] = useState(null)
  const [detailMonitoreo, setDetailMonitoreo] = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  const fincaMap = useMemo(() => {
    const map = {}
    fincas.forEach((f) => { map[f.idFinca] = f })
    return map
  }, [fincas])

  const fincaMonitoreos = useMemo(() => {
    const map = {}
    monitoreos.forEach((m) => {
      const idFinca = m.cultivo?.idFinca
      if (!idFinca) return
      if (!map[idFinca]) map[idFinca] = []
      map[idFinca].push(m)
    })
    return map
  }, [monitoreos])

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

  const handleVerDetalle = (m) => setDetailMonitoreo(m)

  const handleVolverLista = () => setDetailMonitoreo(null)

  const handleCerrarFinca = () => {
    setSelectedFinca(null)
    setDetailMonitoreo(null)
  }

  return (
    <>
     <div className="module-header">
  <div className="module-header-icon">
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 21H4a2 2 0 0 1-2-2V3" />
      <path d="M7 14l4-4 3 3 6-6" />
      <path d="M17 7h3v3" />
    </svg>
  </div>

  <div className="module-header-content">

    <span className="module-header-badge">
      SEGUIMIENTO AGRÍCOLA
    </span>

    <h1>
      Monitoreos
    </h1>

    <p>
      Consulta y administra los monitoreos realizados sobre los cultivos
      registrados en CoffeeLife. Desde aquí puedes revisar observaciones,
      verificar fechas de seguimiento, visualizar detalles técnicos y
      actualizar la información registrada por los expertos de campo.
    </p>

  </div>
</div>
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Finca</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {fincas.length === 0 ? (
              <tr><td colSpan={2} className="monitoreo-empty">🌱 No hay fincas registradas.</td></tr>
            ) : fincas.map((f) => {
              const cantidad = (fincaMonitoreos[f.idFinca] || []).length
              return (
                <tr key={f.idFinca}>
                  <td>
                    <span className="mon-finca-nombre">{f.nombreFinca}</span>
                    <span className="mon-finca-count">{cantidad} monitoreo{cantidad !== 1 ? 's' : ''}</span>
                  </td>
                  <td>
                    <div className="acciones-monitoreo">
                      <button
                        className="btn-mon-ver-finca"
                        onClick={() => setSelectedFinca(f)}
                      >
                        <BiShow size={14} />
                        Ver detalles
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedFinca && !detailMonitoreo && (
        <ListaMonitoreosModal
          finca={selectedFinca}
          monitoreos={fincaMonitoreos[selectedFinca.idFinca] || []}
          onBack={handleCerrarFinca}
          onVerDetalle={handleVerDetalle}
          onEditar={(m) => setEditingMonitoreo(m)}
        />
      )}

      {detailMonitoreo && (
        <DetalleMonitoreoModal
          monitoreo={detailMonitoreo}
          onBack={handleVolverLista}
        />
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
