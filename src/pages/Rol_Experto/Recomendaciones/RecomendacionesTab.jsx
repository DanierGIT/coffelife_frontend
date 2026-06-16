import { useEffect, useState } from 'react'
import {
  Lightbulb, Calendar, MessageSquare, CheckCircle,
  AlertCircle, Tag, Clock, ChevronDown, Plus,
  Loader2, FlaskConical, Stethoscope,
} from 'lucide-react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { BiPlus, BiCheck, BiMessageDetail, BiCalendar, BiTimeFive } from 'react-icons/bi'
import './RecomendacionesTab.css'
import Loading from '../../../components/Loading'
import '../../../components/cargando.css'

const getArr = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.data?.data)) return data.data.data
  return []
}
const normalizeDate = (v) => (!v ? '' : v.toString().slice(0, 10))
const PRIORIDAD_COLORS = {
  alta:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  media: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  baja:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
}
const getPrioridadStyle = (nombre) => {
  if (!nombre) return {}
  return PRIORIDAD_COLORS[nombre.toLowerCase()] || { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' }
}

// ─────────────────────────────────────────────
// FORMULARIO
// ─────────────────────────────────────────────
function NuevaRecomendacionForm({ monitoreos, tipos, prioridades, tratamientos, expertoId, userId, onGuardado }) {
  const [form, setForm] = useState({
    id_monitoreo: '', id_tipo: '', id_prioridad: '',
    descripcion: '', fecha_limite: '',
  })
  const [tratForm, setTratForm] = useState({
    id_tratamiento: '', dosis: '', frecuencia: '', observaciones: '',
  })
  const [agregarTrat, setAgregarTrat] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState('')
  const [success, setSuccess]   = useState('')

  const handleChange     = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const handleTratChange = (e) => setTratForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.id_monitoreo)        { setError('Selecciona un monitoreo.'); return }
    if (!form.descripcion.trim())  { setError('La descripción es obligatoria.'); return }
    if (agregarTrat && !tratForm.id_tratamiento) { setError('Selecciona un tratamiento o desmarca la opción.'); return }
    if (agregarTrat && !tratForm.dosis.trim())   { setError('La dosis es obligatoria para el tratamiento.'); return }
    setError('')
    setLoading(true)
    try {
      // 1 — Crear recomendación
      const resRec = await api.post('/recomendaciones', {
        id_monitoreo:      Number(form.id_monitoreo),
        id_tipo:           form.id_tipo      ? Number(form.id_tipo)      : null,
        id_experto_emisor: expertoId         ? Number(expertoId)         : null,
        id_prioridad:      form.id_prioridad ? Number(form.id_prioridad) : null,
        descripcion:       form.descripcion.trim(),
        fecha_limite:      form.fecha_limite || null,
      })
      const idRecomendacion =
        resRec.data?.data?.idRecomendacion ?? resRec.data?.idRecomendacion

      // 2 — Crear aplicacion_tratamiento + recomendacion_tratamiento
      if (agregarTrat && idRecomendacion) {
        const resApl = await api.post('/aplicaciones_tratamientos', {
          id_tratamiento: Number(tratForm.id_tratamiento),
          id_usuario:     userId ? Number(userId) : null,
          dosis:          tratForm.dosis.trim(),
          frecuencia:     tratForm.frecuencia    || null,
          observaciones:  tratForm.observaciones || null,
        })
        const idAplicacion =
          resApl.data?.data?.idAplicacion ?? resApl.data?.idAplicacion

        if (idAplicacion) {
          await api.post('/recomendacion_tratamientos', {
            id_recomendacion: Number(idRecomendacion),
            id_aplicacion:    Number(idAplicacion),
            dosis_ajustada:   tratForm.dosis.trim() || null,
            notas:            tratForm.observaciones || null,
          })
        }
      }

      setForm({ id_monitoreo: '', id_tipo: '', id_prioridad: '', descripcion: '', fecha_limite: '' })
      setTratForm({ id_tratamiento: '', dosis: '', frecuencia: '', observaciones: '' })
      setAgregarTrat(false)
      setSuccess('Recomendación registrada correctamente.')
      setTimeout(() => setSuccess(''), 3500)
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
        <BiPlus size={16} />
        Nueva recomendación
      </h3>

      {/* ── Recomendación ── */}
      <div className="rtab-section">
        <p className="rtab-section-label"><Stethoscope size={12} strokeWidth={2} /> Datos de la recomendación</p>
        <div className="rtab-row">
          <div className="rtab-field">
            <label className="rtab-label">Monitoreo <span className="rtab-req">*</span></label>
            <div className="rtab-select-wrap">
              <select className="rtab-select" name="id_monitoreo" value={form.id_monitoreo} onChange={handleChange} required>
                <option value="">Seleccionar monitoreo...</option>
                {monitoreos.map((m) => (
                  <option key={m.idMonitoreo} value={m.idMonitoreo}>
                    #{m.idMonitoreo} — {normalizeDate(m.fechaMonitoreo)}
                    {m.observaciones ? ` · ${m.observaciones.slice(0, 25)}...` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="rtab-select-icon" />
            </div>
          </div>
          <div className="rtab-field">
            <label className="rtab-label">Tipo</label>
            <div className="rtab-select-wrap">
              <select className="rtab-select" name="id_tipo" value={form.id_tipo} onChange={handleChange}>
                <option value="">Seleccionar tipo...</option>
                {tipos.map((t) => <option key={t.idTipo} value={t.idTipo}>{t.nombreTipo}</option>)}
              </select>
              <ChevronDown size={13} className="rtab-select-icon" />
            </div>
          </div>
        </div>
        <div className="rtab-row">
          <div className="rtab-field">
            <label className="rtab-label">Prioridad</label>
            <div className="rtab-select-wrap">
              <select className="rtab-select" name="id_prioridad" value={form.id_prioridad} onChange={handleChange}>
                <option value="">Seleccionar prioridad...</option>
                {prioridades.map((p) => <option key={p.idPrioridad} value={p.idPrioridad}>{p.nombre}</option>)}
              </select>
              <ChevronDown size={13} className="rtab-select-icon" />
            </div>
          </div>
          <div className="rtab-field">
            <label className="rtab-label">Fecha límite</label>
            <input className="rtab-input" type="date" name="fecha_limite" value={form.fecha_limite} onChange={handleChange} />
          </div>
        </div>
        <div className="rtab-field">
          <label className="rtab-label">Descripción <span className="rtab-req">*</span></label>
          <textarea className="rtab-textarea" name="descripcion" value={form.descripcion}
            onChange={handleChange} placeholder="Describe la acción recomendada..." rows={3} required />
        </div>
      </div>

      {/* ── Tratamiento opcional ── */}
      <div className="rtab-section rtab-section--trat">
        <label className="rtab-toggle-label">
          <input type="checkbox" className="rtab-checkbox" checked={agregarTrat}
            onChange={(e) => setAgregarTrat(e.target.checked)} />
          <div className="rtab-toggle-header">
            <div className="rtab-toggle-icon"><FlaskConical size={14} strokeWidth={2} /></div>
            <div>
              <span className="rtab-toggle-title">Asociar tratamiento</span>
              <span className="rtab-toggle-desc">Especifica el producto y dosis a aplicar</span>
            </div>
          </div>
        </label>

        {agregarTrat && (
          <div className="rtab-trat-fields">
            <div className="rtab-row">
              <div className="rtab-field">
                <label className="rtab-label">Tratamiento <span className="rtab-req">*</span></label>
                <div className="rtab-select-wrap">
                  <select className="rtab-select" name="id_tratamiento" value={tratForm.id_tratamiento}
                    onChange={handleTratChange} required={agregarTrat}>
                    <option value="">Seleccionar tratamiento...</option>
                    {tratamientos.map((t) => (
                      <option key={t.idTratamiento} value={t.idTratamiento}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="rtab-select-icon" />
                </div>
              </div>
              <div className="rtab-field">
                <label className="rtab-label">Dosis <span className="rtab-req">*</span></label>
                <input className="rtab-input" type="text" name="dosis" value={tratForm.dosis}
                  onChange={handleTratChange} placeholder="Ej: 0.8 L/ha" required={agregarTrat} />
              </div>
            </div>
            <div className="rtab-row">
              <div className="rtab-field">
                <label className="rtab-label">Frecuencia</label>
                <input className="rtab-input" type="text" name="frecuencia" value={tratForm.frecuencia}
                  onChange={handleTratChange} placeholder="Ej: Cada 15 días" />
              </div>
              <div className="rtab-field">
                <label className="rtab-label">Observaciones de aplicación</label>
                <input className="rtab-input" type="text" name="observaciones" value={tratForm.observaciones}
                  onChange={handleTratChange} placeholder="Ej: Aplicar en la mañana" />
              </div>
            </div>
          </div>
        )}
      </div>

      {error   && <p className="rtab-error">{error}</p>}
      {success && (
        <p className="rtab-success">
          <BiCheck size={14} />
          {success}
        </p>
      )}

      <div className="rtab-form-actions">
        <button type="submit" className="rtab-btn-guardar" disabled={loading}>
          {loading
            ? <Loading type="inline" text="Registrando..." />
            : <>
                <BiCheck size={14} />
                Registrar recomendación
              </>
          }
        </button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────
// PRINCIPAL
// ─────────────────────────────────────────────
export default function RecomendacionesTab({ cultivo }) {
  const { user } = useAuth()
  const expertoId = user?.idUsuario ?? user?.id ?? null
  const userId    = user?.idUsuario ?? user?.id ?? null

  const [monitoreos,      setMonitoreos]      = useState([])
  const [tipos,           setTipos]           = useState([])
  const [prioridades,     setPrioridades]     = useState([])
  const [tratamientos,    setTratamientos]    = useState([])
  const [recomendaciones, setRecomendaciones] = useState([])
  const [loadingData,     setLoadingData]     = useState(true)
  const [error,           setError]           = useState('')

  const cargarDatos = async () => {
    if (!cultivo?.idCultivo) return
    setLoadingData(true)
    try {
      const [monRes, tiposRes, recRes, tratRes] = await Promise.all([
        api.get('/monitoreos', { params: { id_cultivo: cultivo.idCultivo } }),
        api.get('/cat_tipos_recomendaciones'),
        api.get('/recomendaciones'),
        api.get('/tratamientos'),
      ])
      const todosMonitoreos = Array.isArray(monRes.data)
        ? monRes.data : (monRes.data?.data ?? [])
      setMonitoreos(todosMonitoreos)
      setTipos(getArr(tiposRes.data))
      setTratamientos(getArr(tratRes.data))
      const idsMonitoreos = todosMonitoreos.map((m) => m.idMonitoreo)
      setRecomendaciones(
        getArr(recRes.data).filter((r) => idsMonitoreos.includes(Number(r.idMonitoreo)))
      )
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

  useEffect(() => { cargarDatos() }, [cultivo])

  const getTipoNombre = (r) => {
    if (r.tipo?.nombreTipo) return r.tipo.nombreTipo
    return tipos.find((t) => Number(t.idTipo) === Number(r.idTipo))?.nombreTipo || null
  }
  const getPrioridadNombre = (r) => {
    return prioridades.find((p) => Number(p.idPrioridad) === Number(r.idPrioridad))?.nombre || null
  }
  const getMonitoreoFecha = (r) => {
    const m = monitoreos.find((m) => Number(m.idMonitoreo) === Number(r.idMonitoreo))
    return m ? normalizeDate(m.fechaMonitoreo) : '—'
  }
  const getTratNombre = (r) => {
    const trats = r.tratamientos || []
    if (!trats.length) return null
    const apl = trats[0]?.aplicacion
    if (apl?.tratamiento?.nombre) return apl.tratamiento.nombre
    const id = trats[0]?.idAplicacion
    return tratamientos.find((t) => Number(t.idTratamiento) === Number(id))?.nombre || null
  }

  if (loadingData) {
    return <Loading type="content" size="sm" text="Cargando recomendaciones..." />
  }

  return (
    <div className="detalle-tab-content rtab-wrap">
      {monitoreos.length === 0 ? (
        <div className="rtab-empty-form">
          <div className="rtab-empty-form-icon"><Lightbulb size={26} strokeWidth={1.5} /></div>
          <p className="rtab-empty-title">Sin monitoreos disponibles</p>
          <p className="rtab-empty-desc">
            Registra al menos un monitoreo en la pestaña <strong>Monitoreo</strong> para agregar recomendaciones.
          </p>
        </div>
      ) : (
        <NuevaRecomendacionForm
          monitoreos={monitoreos} tipos={tipos} prioridades={prioridades}
          tratamientos={tratamientos} expertoId={expertoId} userId={userId}
          onGuardado={cargarDatos}
        />
      )}

      {error && <div className="rtab-alert rtab-alert--error"><AlertCircle size={14} /><span>{error}</span></div>}

      <div className="rtab-list-section">
        <div className="rtab-list-header">
          <MessageSquare size={14} strokeWidth={2} />
          <h3 className="rtab-list-title">Recomendaciones registradas</h3>
          {recomendaciones.length > 0 && <span className="rtab-count">{recomendaciones.length}</span>}
        </div>
        {recomendaciones.length === 0 ? (
          <div className="rtab-list-empty">
            <BiMessageDetail size={32} color="#d1d5db" />
            <p>No hay recomendaciones para este cultivo aún.</p>
          </div>
        ) : (
          <div className="rtab-cards">
            {recomendaciones.map((r) => {
              const prioNombre = getPrioridadNombre(r)
              const tipoNombre = getTipoNombre(r)
              const tratNombre = getTratNombre(r)
              const prioStyle  = getPrioridadStyle(prioNombre)
              return (
                <div key={r.idRecomendacion} className="rtab-card">
                  <div className="rtab-card-top">
                    <div className="rtab-card-meta">
                      {tipoNombre && (
                        <span className="rtab-card-tipo"><Tag size={10} strokeWidth={2.5} />{tipoNombre}</span>
                      )}
                      <span className="rtab-card-fecha">
                        <BiCalendar size={12} />
                        Monitoreo {getMonitoreoFecha(r)}
                      </span>
                    </div>
                    {prioNombre && (
                      <span className="rtab-prio-badge" style={{
                        background: prioStyle.bg, color: prioStyle.color, borderColor: prioStyle.border,
                      }}>{prioNombre}</span>
                    )}
                  </div>
                  <p className="rtab-card-desc">{r.descripcion}</p>
                  {tratNombre && (
                    <div className="rtab-card-trat">
                      <FlaskConical size={11} strokeWidth={2} />
                      <span>Tratamiento: <strong>{tratNombre}</strong></span>
                      {r.tratamientos?.[0]?.aplicacion?.dosis && (
                        <span className="rtab-card-dosis">· {r.tratamientos[0].aplicacion.dosis}</span>
                      )}
                    </div>
                  )}
                  {r.fechaLimite && (
                    <p className="rtab-card-limite">
                      <BiTimeFive size={12} />
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