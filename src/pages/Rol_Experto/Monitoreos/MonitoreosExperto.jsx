import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './MonitoreosExperto.css'

const fmt = (v) => v ? new Date(v).toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

const NIVEL_CLASS = (n = '') => {
  const l = n.toLowerCase()
  if (l.includes('alto')) return 'high'
  if (l.includes('medio')) return 'mid'
  if (l.includes('bajo')) return 'low'
  return ''
}

export default function MonitoreosExperto() {
  const [monitoreos, setMonitoreos] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // Filtros
  const [filtros, setFiltros] = useState({
    finca:   'Todos',
    cultivo: 'Todos',
    nivel:   'Todos',
    estado:  'Todos',
    desde:   '01/05/2024',
    hasta:   '25/05/2024',
  })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    id_cultivo: '', id_experto: '', fecha_monitoreo: '', observaciones: '',
  })
  const [saving, setSaving] = useState(false)

  const getMonitoreos = async () => {
    try {
      const res = await api.get('/monitoreos')
      setMonitoreos(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch {
      setError('No se pudieron cargar los monitoreos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { getMonitoreos() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/monitoreos', form)
      setShowForm(false)
      setForm({ id_cultivo: '', id_experto: '', fecha_monitoreo: '', observaciones: '' })
      getMonitoreos()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear el monitoreo.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (m) => {
    const nuevoActivo = m.activo === undefined || m.activo === null ? false : !m.activo
    try {
      await api.put(`/monitoreos/${m.idMonitoreo}`, { activo: nuevoActivo })
      setMonitoreos((prev) =>
        prev.map((mon) =>
          mon.idMonitoreo === m.idMonitoreo ? { ...mon, activo: nuevoActivo } : mon
        )
      )
    } catch {
      setError('No se pudo cambiar el estado.')
    }
  }

  const activo = (m) => m.activo !== undefined && m.activo !== null ? m.activo : true

  const filtered = monitoreos.filter(m => {
    if (filtros.finca !== 'Todos' && String(m.idFinca) !== filtros.finca) return false
    if (filtros.nivel !== 'Todos') {
      const n = m.nivelRoya?.nombre || m.nivel_roya || ''
      if (!n.toLowerCase().includes(filtros.nivel.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="mon-exp-page">
      <div className="mon-exp-header">
        <div>
          <h1>Monitoreos <span className="mon-exp-sub">(Historial)</span></h1>
          <p>Consulta el historial de monitoreos realizados</p>
        </div>
        <button className="btn-nuevo-mon" onClick={() => setShowForm(true)}>
          + Nuevo monitoreo
        </button>
      </div>

      {error && <p className="mon-exp-error">{error}</p>}

      {/* Filtros */}
      <div className="mon-exp-filtros">
        {[
          { label: 'Finca', key: 'finca', opts: ['Todos'] },
          { label: 'Cultivo', key: 'cultivo', opts: ['Todos'] },
          { label: 'Nivel de roya', key: 'nivel', opts: ['Todos', 'Alto', 'Medio', 'Bajo'] },
          { label: 'Estado', key: 'estado', opts: ['Todos', 'Completado', 'Pendiente'] },
        ].map(f => (
          <label key={f.key} className="mon-exp-filtro">
            {f.label}
            <select value={filtros[f.key]} onChange={e => setFiltros({...filtros, [f.key]: e.target.value})}>
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label className="mon-exp-filtro">
          Desde
          <input type="text" value={filtros.desde} onChange={e => setFiltros({...filtros, desde: e.target.value})} placeholder="dd/mm/aaaa" />
        </label>
        <label className="mon-exp-filtro">
          Hasta
          <input type="text" value={filtros.hasta} onChange={e => setFiltros({...filtros, hasta: e.target.value})} placeholder="dd/mm/aaaa" />
        </label>
        <button className="btn-filtrar">Filtrar</button>
      </div>

      {/* Tabla */}
      <div className="mon-exp-table-wrap">
        {loading ? (
          <p className="mon-exp-empty">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="mon-exp-empty">No hay monitoreos que coincidan con los filtros.</p>
        ) : (
          <table className="mon-exp-table">
            <thead>
              <tr>
                <th>Fecha monitoreo</th>
                <th>Finca</th>
                <th>Cultivo</th>
                <th>Nivel de roya</th>
                <th>Estado cultivo</th>
                <th>Experto</th>
                <th>Estado análisis</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const nivel = m.nivelRoya?.nombre || m.nivel_roya || '—'
                const nc = NIVEL_CLASS(nivel)
                return (
                  <tr key={m.idMonitoreo}>
                    <td>{fmt(m.fechaMonitoreo || m.fecha_monitoreo)}</td>
                    <td>{m.nombreFinca || `Finca #${m.idFinca}`}</td>
                    <td>{m.nombreCultivo || m.idCultivo || '—'}</td>
                    <td><span className={`mon-nivel ${nc}`}>{nivel}</span></td>
                    <td>{m.estadoCultivo?.nombre || m.estado_cultivo || 'En producción'}</td>
                    <td>{m.nombreExperto || m.idExperto || '—'}</td>
                    <td>
                      <span className={`mon-estado ${m.idEstadoAnalisis === 1 || !m.idEstadoAnalisis ? 'completado' : 'pendiente'}`}>
                        {m.estadoAnalisis?.nombre || (m.idEstadoAnalisis === 1 ? 'Completado' : 'Pendiente')}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn-toggle ${activo(m) ? 'toggle-on' : 'toggle-off'}`}
                        onClick={() => handleToggleActivo(m)}
                        title={activo(m) ? 'Desactivar' : 'Activar'}
                      >
                        {activo(m) ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info */}
      <p className="mon-exp-footer">Datos utilizados: monitoreos, cultivos, cat_estados_cultivo, cat_estados_análisis, usuarios</p>

      {/* Modal nuevo monitoreo */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nuevo monitoreo</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="modal-row">
                <label>ID Cultivo
                  <input name="id_cultivo" type="number" value={form.id_cultivo} onChange={e => setForm({...form, id_cultivo: e.target.value})} required />
                </label>
                <label>ID Experto
                  <input name="id_experto" type="number" value={form.id_experto} onChange={e => setForm({...form, id_experto: e.target.value})} required />
                </label>
              </div>
              <label>Fecha de monitoreo
                <input name="fecha_monitoreo" type="date" value={form.fecha_monitoreo} onChange={e => setForm({...form, fecha_monitoreo: e.target.value})} required />
              </label>
              <label>Observaciones
                <textarea name="observaciones" value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} rows={3} />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Crear monitoreo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
