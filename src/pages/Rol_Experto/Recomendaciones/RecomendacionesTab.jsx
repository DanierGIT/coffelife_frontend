import { useEffect, useState } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './RecomendacionesTab.css'

// ─── Helpers ────────────────────────────────
const getArr = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.data?.data)) return data.data.data
  return []
}

const normalizeDate = (value) => {
  if (!value) return ''
  return value.toString().slice(0, 10)
}

const PRIORIDAD_COLORS = {
  alta:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  media:  { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  baja:   { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
}

const getPrioridadStyle = (nombre) => {
  if (!nombre) return {}
  const key = nombre.toLowerCase()
  return PRIORIDAD_COLORS[key] || { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' }
}

// ─────────────────────────────────────────────
// FORMULARIO NUEVA RECOMENDACIÓN
// ─────────────────────────────────────────────
function NuevaRecomendacionForm({ monitoreos, tipos, prioridades, expertoId, onGuardado }) {
  const [form, setForm] = useState({
    id_monitoreo: '',
    id_tipo:      '',
    id_prioridad: '',
    descripcion:  '',
    fecha_limite: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.id_monitoreo) { setError('Selecciona un monitoreo.'); return }
    if (!form.descripcion.trim()) { setError('La descripción es obligatoria.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/recomendaciones', {
        id_monitoreo:      Number(form.id_monitoreo),
        id_tipo:           form.id_tipo      ? Number(form.id_tipo)      : null,
        id_experto_emisor: expertoId         ? Number(expertoId)         : null,
        id_prioridad:      form.id_prioridad ? Number(form.id_prioridad) : null,
        descripcion:       form.descripcion.trim(),
        fecha_limite:      form.fecha_limite || null,
      })
      setForm({ id_monitoreo: '', id_tipo: '', id_prioridad: '', descripcion: '', fecha_limite: '' })
      setSuccess('Recomendación registrada correctamente.')
      setTimeout(() => setSuccess(''), 3000)
      onGuardado()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo registrar la recomendación.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="rtab-form" onSubmit={handleSubmit}>
      <h3 className="rtab-form-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nueva recomendación
      </h3>

      {/* Fila 1 — Monitoreo + Tipo */}
      <div className="rtab-row">
        <div className="rtab-field">
          <label className="rtab-label">
            Monitoreo <span className="rtab-req">*</span>
          </label>
          <select
            className="rtab-select"
            name="id_monitoreo"
            value={form.id_monitoreo}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar monitoreo...</option>
            {monitoreos.map((m) => (
              <option key={m.idMonitoreo} value={m.idMonitoreo}>
                #{m.idMonitoreo} — {normalizeDate(m.fechaMonitoreo)}
                {m.observaciones ? ` · ${m.observaciones.slice(0, 30)}...` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="rtab-field">
          <label className="rtab-label">Tipo de recomendación</label>
          <select
            className="rtab-select"
            name="id_tipo"
            value={form.id_tipo}
            onChange={handleChange}
          >
            <option value="">Seleccionar tipo...</option>
            {tipos.map((t) => (
              <option key={t.idTipo} value={t.idTipo}>{t.nombreTipo}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila 2 — Prioridad + Fecha límite */}
      <div className="rtab-row">
        <div className="rtab-field">
          <label className="rtab-label">Prioridad</label>
          <select
            className="rtab-select"
            name="id_prioridad"
            value={form.id_prioridad}
            onChange={handleChange}
          >
            <option value="">Seleccionar prioridad...</option>
            {prioridades.map((p) => (
              <option key={p.idPrioridad} value={p.idPrioridad}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="rtab-field">
          <label className="rtab-label">Fecha límite</label>
          <input
            className="rtab-input"
            type="date"
            name="fecha_limite"
            value={form.fecha_limite}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Descripción */}
      <div className="rtab-field">
        <label className="rtab-label">
          Descripción <span className="rtab-req">*</span>
        </label>
        <textarea
          className="rtab-textarea"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Aplicar fungicida cúprico en dosis de..."
          rows={3}
          required
        />
      </div>

      {error   && <p className="rtab-error">{error}</p>}
      {success && (
        <p className="rtab-success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {success}
        </p>
      )}

      <div className="rtab-form-actions">
        <button type="submit" className="rtab-btn-guardar" disabled={loading}>
          {loading
            ? <><span className="rtab-spinner" /> Registrando...</>
            : <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Registrar recomendación
              </>
          }
        </button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function RecomendacionesTab({ cultivo, finca }) {
  const { user } = useAuth()
  const expertoId = user?.idUsuario ?? user?.id ?? null

  const [monitoreos,      setMonitoreos]      = useState([])
  const [tipos,           setTipos]           = useState([])
  const [prioridades,     setPrioridades]     = useState([])
  const [recomendaciones, setRecomendaciones] = useState([])
  const [loadingData,     setLoadingData]     = useState(true)
  const [error,           setError]           = useState('')

  // ── Carga inicial ──
  const cargarDatos = async () => {
    if (!cultivo?.idCultivo) return
    setLoadingData(true)
    try {
      const [monRes, tiposRes, recRes] = await Promise.all([
        api.get('/monitoreos', { params: { id_cultivo: cultivo.idCultivo } }),
        api.get('/cat_tipos_recomendaciones'),
        api.get('/recomendaciones'),
      ])

      const todosMonitoreos = Array.isArray(monRes.data)
        ? monRes.data
        : (monRes.data?.data ?? [])

      setMonitoreos(todosMonitoreos)
      setTipos(getArr(tiposRes.data))

      // Filtra recomendaciones solo de los monitoreos de este cultivo
      const idsMonitoreos = todosMonitoreos.map((m) => m.idMonitoreo)
      const todasRec      = getArr(recRes.data)
      setRecomendaciones(
        todasRec.filter((r) => idsMonitoreos.includes(Number(r.idMonitoreo)))
      )

      // Prioridades — intenta dos rutas
      try {
        const r = await api.get('/categorias/prioridades')
        setPrioridades(getArr(r.data))
      } catch {
        const r = await api.get('/cat_prioridades')
        setPrioridades(getArr(r.data))
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar los datos.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [cultivo])

  // ── Helpers de display ──
  const getTipoNombre = (r) => {
    if (r.tipo?.nombreTipo) return r.tipo.nombreTipo
    const t = tipos.find((t) => Number(t.idTipo) === Number(r.idTipo))
    return t?.nombreTipo || '—'
  }

  const getPrioridadNombre = (r) => {
    const p = prioridades.find((p) => Number(p.idPrioridad) === Number(r.idPrioridad))
    return p?.nombre || null
  }

  const getMonitoreoFecha = (r) => {
    const m = monitoreos.find((m) => Number(m.idMonitoreo) === Number(r.idMonitoreo))
    return m ? normalizeDate(m.fechaMonitoreo) : '—'
  }

  if (loadingData) {
    return (
      <div className="detalle-tab-content">
        <p className="detalle-empty">Cargando recomendaciones...</p>
      </div>
    )
  }

  return (
    <div className="detalle-tab-content rtab-wrap">

      {/* ── Formulario nueva recomendación ── */}
      {monitoreos.length === 0 ? (
        <div className="rtab-empty-form">
          <div className="rtab-empty-icon">💡</div>
          <p className="rtab-empty-title">Sin monitoreos disponibles</p>
          <p className="rtab-empty-desc">
            Para agregar una recomendación primero debes registrar al menos un monitoreo
            en la pestaña <strong>Monitoreo</strong>.
          </p>
        </div>
      ) : (
        <NuevaRecomendacionForm
          monitoreos={monitoreos}
          tipos={tipos}
          prioridades={prioridades}
          expertoId={expertoId}
          onGuardado={cargarDatos}
        />
      )}

      {error && <p className="rtab-error">{error}</p>}

      {/* ── Lista de recomendaciones ── */}
      <div className="rtab-list-section">
        <h3 className="rtab-list-title">
          Recomendaciones registradas
          {recomendaciones.length > 0 && (
            <span className="rtab-count">{recomendaciones.length}</span>
          )}
        </h3>

        {recomendaciones.length === 0 ? (
          <div className="rtab-list-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>No hay recomendaciones para este cultivo aún.</p>
          </div>
        ) : (
          <div className="rtab-cards">
            {recomendaciones.map((r) => {
              const prioNombre = getPrioridadNombre(r)
              const prioStyle  = getPrioridadStyle(prioNombre)
              return (
                <div key={r.idRecomendacion} className="rtab-card">
                  <div className="rtab-card-top">
                    <div className="rtab-card-meta">
                      <span className="rtab-card-tipo">{getTipoNombre(r)}</span>
                      <span className="rtab-card-fecha">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        Monitoreo {getMonitoreoFecha(r)}
                      </span>
                    </div>
                    {prioNombre && (
                      <span
                        className="rtab-prio-badge"
                        style={{
                          background:   prioStyle.bg,
                          color:        prioStyle.color,
                          borderColor:  prioStyle.border,
                        }}
                      >
                        {prioNombre}
                      </span>
                    )}
                  </div>

                  <p className="rtab-card-desc">{r.descripcion}</p>

                  {r.fechaLimite && (
                    <p className="rtab-card-limite">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Fecha límite: {normalizeDate(r.fechaLimite)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}