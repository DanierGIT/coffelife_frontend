import { useState, useRef, useEffect } from 'react'
import {
  Info, Camera, FileText, Lightbulb, ChevronRight,
  ChevronLeft, X, Loader2, ChevronDown,
  FlaskConical, Stethoscope,
} from 'lucide-react'
import api from '../../../services/api'
import { BiCheck, BiListUl, BiCamera, BiPencil, BiBulb, BiLeaf, BiX } from 'react-icons/bi'
import './NuevoMonitoreoModal.css'
import Loading from '../../../components/Loading'
import '../../../components/cargando.css'

const hoy = () => new Date().toISOString().slice(0, 10)

const PASOS = [
  { num: 1, label: 'Información',      icon: Info       },
  { num: 2, label: 'Fotos',            icon: Camera     },
  { num: 3, label: 'Observaciones',    icon: FileText   },
  { num: 4, label: 'Recomendaciones',  icon: Lightbulb  },
]

const getArr = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.data?.data)) return data.data.data
  return []
}

// ─── Step indicator ──────────────────────────
function StepIndicator({ pasoActual }) {
  return (
    <div className="nmon-steps">
      {PASOS.map((p, i) => {
        const done   = pasoActual > p.num
        const active = pasoActual === p.num
        const Icon   = p.icon
        return (
          <div key={p.num} className="nmon-step-wrapper">
            <div className={`nmon-step ${active ? 'nmon-step--active' : ''} ${done ? 'nmon-step--done' : ''}`}>
              <div className="nmon-step-circle">
                {done
                  ? <BiCheck size={14} />
                  : <span>{p.num}</span>
                }
              </div>
              <span className="nmon-step-label">{p.label}</span>
            </div>
            {i < PASOS.length - 1 && (
              <div className={`nmon-step-line ${done ? 'nmon-step-line--done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Paso 1 ──────────────────────────────────
function Paso1({ cultivo, finca, fecha, setFecha, onNext }) {
  const [error, setError] = useState('')
  const continuar = () => {
    if (!fecha) { setError('Selecciona la fecha del monitoreo.'); return }
    setError('')
    onNext()
  }
  return (
    <div className="nmon-paso-body">
      <div className="nmon-paso-icon">
  <BiListUl size={32} />
</div>
      <h3 className="nmon-paso-title">Información general</h3>
      <p className="nmon-paso-desc">Confirma los datos básicos de este monitoreo.</p>

      <div className="nmon-fields">
        <div className="nmon-field-row">
          <div className="nmon-field">
            <label className="nmon-label">Finca</label>
            <input className="nmon-input nmon-input--readonly" type="text"
              value={finca?.nombre || finca?.nombreFinca || '—'} readOnly />
          </div>
          <div className="nmon-field">
            <label className="nmon-label">Cultivo</label>
            <input className="nmon-input nmon-input--readonly" type="text"
              value={cultivo?.nombreCultivo || '—'} readOnly />
          </div>
        </div>
        <div className="nmon-field">
          <label className="nmon-label">Fecha del monitoreo <span className="nmon-req">*</span></label>
          <input className="nmon-input" type="date" value={fecha}
            onChange={(e) => setFecha(e.target.value)} required />
        </div>
      </div>
      {error && <div className="nmon-alert nmon-alert--error">{error}</div>}
      <div className="nmon-actions nmon-actions--right">
        <button className="nmon-btn nmon-btn--primary" onClick={continuar}>
          Siguiente <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Paso 2 ──────────────────────────────────
function Paso2({ fotos, setFotos, onNext, onBack }) {
  const inputRef = useRef()
  const handleAgregar = (e) => {
    const nuevas = Array.from(e.target.files).map((file) => ({
      file, preview: URL.createObjectURL(file),
    }))
    setFotos((prev) => [...prev, ...nuevas])
    e.target.value = ''
  }
  const handleQuitar = (i) => {
    setFotos((prev) => {
      URL.revokeObjectURL(prev[i].preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }
  return (
    <div className="nmon-paso-body">
      <div className="nmon-paso-icon">
  <BiCamera size={32} />
</div>
      <h3 className="nmon-paso-title">Registro fotográfico</h3>
      <p className="nmon-paso-desc">Toma fotos del cultivo desde distintos ángulos. Este paso es opcional.</p>

      <div className="nmon-fotos-grid">
        <div className="nmon-foto-add" onClick={() => inputRef.current?.click()}>
          <div className="nmon-foto-add-icon">
            <BiCamera size={28} />
          </div>
          <span>Agregar fotos</span>
          <small>JPG, PNG, WEBP · Máx. 10 MB</small>
        </div>
        {fotos.map((foto, i) => (
          <div key={i} className="nmon-foto-preview">
            <img src={foto.preview} alt={`foto-${i}`} />
            <button className="nmon-foto-remove" onClick={() => handleQuitar(i)} type="button">
              <X size={10} strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp"
        multiple style={{ display: 'none' }} onChange={handleAgregar} />
      {fotos.length > 0 && (
        <p className="nmon-fotos-count">
          <BiCheck size={13} />
          {fotos.length} foto{fotos.length !== 1 ? 's' : ''} lista{fotos.length !== 1 ? 's' : ''}
        </p>
      )}
      <div className="nmon-actions">
        <button className="nmon-btn nmon-btn--secondary" onClick={onBack}>
          <ChevronLeft size={15} /> Anterior
        </button>
        <button className="nmon-btn nmon-btn--primary" onClick={onNext}>
          {fotos.length === 0 ? 'Omitir' : 'Siguiente'} <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Paso 3 ──────────────────────────────────
function Paso3({ observaciones, setObservaciones, onNext, onBack }) {
  return (
    <div className="nmon-paso-body">
      <div className="nmon-paso-icon">
  <BiPencil size={32} />
</div>
      <h3 className="nmon-paso-title">Observaciones del cultivo</h3>
      <p className="nmon-paso-desc">Describe el estado actual, plagas, enfermedades o cualquier aspecto relevante. Opcional.</p>

      <div className="nmon-fields">
        <div className="nmon-field">
          <label className="nmon-label">Observaciones</label>
          <textarea className="nmon-textarea" value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="El cultivo se encuentra en buen estado, se observa..." rows={5} maxLength={1000} />
          <p className="nmon-char-count">{observaciones.length} / 1000</p>
        </div>
      </div>
      <div className="nmon-actions">
        <button className="nmon-btn nmon-btn--secondary" onClick={onBack}>
          <ChevronLeft size={15} /> Anterior
        </button>
        <button className="nmon-btn nmon-btn--primary" onClick={onNext}>
          {observaciones.trim() === '' ? 'Omitir' : 'Siguiente'} <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Paso 4 ──────────────────────────────────
function Paso4({ cultivo, finca, fecha, fotos, observaciones, expertoId, userId, onGuardado, onBack }) {
  const [tipos,           setTipos]         = useState([])
  const [prioridades,     setPrioridades]   = useState([])
  const [tratamientos,    setTratamientos]  = useState([])
  const [insumos,         setInsumos]       = useState([])
  const [loadingCat,      setLoadingCat]    = useState(true)
  const [loading,         setLoading]       = useState(false)
  const [error,           setError]         = useState('')

  const [agregarRec,  setAgregarRec]  = useState(true)
  const [agregarTrat, setAgregarTrat] = useState(false)

  const [recForm, setRecForm] = useState({
    id_tipo: '', id_prioridad: '', descripcion: '', fecha_limite: '',
  })
  const [tratForm, setTratForm] = useState({
    id_tratamiento: '', id_insumo: '', dosis: '', frecuencia: '', observaciones: '',
  })

  useEffect(() => {
    const cargar = async () => {
      try {
        const [tiposRes, tratRes, insumosRes] = await Promise.all([
          api.get('/cat_tipos_recomendaciones'),
          api.get('/tratamientos'),
          api.get('/insumos'),
        ])
        setTipos(getArr(tiposRes.data))
        setTratamientos(getArr(tratRes.data))
        setInsumos(getArr(insumosRes.data))
        try {
          const r = await api.get('/categorias/prioridades')
          setPrioridades(getArr(r.data))
        } catch {
          const r = await api.get('/cat_prioridades')
          setPrioridades(getArr(r.data))
        }
      } catch (e) {
        console.error('Error catálogos:', e)
      } finally {
        setLoadingCat(false)
      }
    }
    cargar()
  }, [])

  const handleRecChange  = (e) => setRecForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const handleTratChange = (e) => setTratForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleGuardar = async () => {
    if (agregarRec && !recForm.descripcion.trim()) {
      setError('La descripción de la recomendación es obligatoria.'); return
    }
    if (agregarTrat && !tratForm.id_tratamiento) {
      setError('Selecciona un tratamiento o desmarca la opción.'); return
    }
    if (agregarTrat && !tratForm.dosis.trim()) {
      setError('La dosis es obligatoria para el tratamiento.'); return
    }
    setError('')
    setLoading(true)
    let createdMonitoreoId = null
    try {
      // 1 — Monitoreo
      const resM = await api.post('/monitoreos', {
        id_cultivo:      Number(cultivo.idCultivo),
        id_experto:      expertoId ? Number(expertoId) : null,
        fecha_monitoreo: fecha,
        observaciones:   observaciones || null,
      })
      const idMonitoreo = resM.data?.data?.idMonitoreo ?? resM.data?.idMonitoreo
      createdMonitoreoId = idMonitoreo

      // 2 — Fotos
      if (fotos.length > 0 && idMonitoreo) {
        for (const foto of fotos) {
          const fd = new FormData()
          fd.append('imagen', foto.file)
          fd.append('id_monitoreo', String(idMonitoreo))
          await api.post('/imagenes', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
      }

      // 3 — Recomendación + tratamiento
      if (agregarRec && idMonitoreo) {
        const resRec = await api.post('/recomendaciones', {
          id_monitoreo:      Number(idMonitoreo),
          id_tipo:           recForm.id_tipo      ? Number(recForm.id_tipo)      : null,
          id_experto_emisor: expertoId            ? Number(expertoId)            : null,
          id_prioridad:      recForm.id_prioridad ? Number(recForm.id_prioridad) : null,
          id_tratamiento:    agregarTrat && tratForm.id_tratamiento ? Number(tratForm.id_tratamiento) : null,
          descripcion:       recForm.descripcion.trim(),
          fecha_limite:      recForm.fecha_limite || null,
        })
        const idRecomendacion =
          resRec.data?.data?.idRecomendacion ?? resRec.data?.idRecomendacion

        if (agregarTrat && idRecomendacion) {
          const hoy = new Date().toISOString().slice(0, 10)
          const insumo = tratForm.id_insumo ? insumos.find(i => Number(i.idInsumo) === Number(tratForm.id_insumo)) : null
          let obs = tratForm.observaciones?.trim() || null
          if (insumo) {
            obs = obs ? `[${insumo.nombre}] ${obs}` : `[${insumo.nombre}]`
          }
          await api.post('/aplicaciones_tratamientos', {
            id_tratamiento:   Number(tratForm.id_tratamiento),
            id_usuario:       userId ? Number(userId) : null,
            fecha_aplicacion: hoy,
            observacion:      obs,
          })
        }
      }

      onGuardado()
    } catch (err) {
      console.error('Error al guardar monitoreo:', err?.response?.data || err)
      // Si el monitoreo ya se creó pero falló un paso posterior, lo eliminamos para evitar duplicados
      if (createdMonitoreoId) {
        try { await api.delete(`/monitoreos/${createdMonitoreoId}`) } catch {}
      }
      const detail = err?.response?.data?.error
      setError(detail || err?.response?.data?.message || 'No se pudo guardar el monitoreo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="nmon-paso-body">
      <div className="nmon-paso-icon">
  <BiBulb size={32} />
</div>
      <h3 className="nmon-paso-title">Recomendaciones</h3>
      <p className="nmon-paso-desc">Agrega una recomendación para este monitoreo o guarda sin ella.</p>

      {/* ── Toggle recomendación ── */}
      <div className="nmon-section-toggle">
        <label className="nmon-toggle-label">
          <input type="checkbox" className="nmon-checkbox" checked={agregarRec}
            onChange={(e) => { setAgregarRec(e.target.checked); if (!e.target.checked) setAgregarTrat(false) }} />
          <div className="nmon-toggle-header">
            <div className="nmon-toggle-icon"><Stethoscope size={14} strokeWidth={2} /></div>
            <div>
              <span className="nmon-toggle-title">Agregar recomendación</span>
              <span className="nmon-toggle-desc">Indica qué acción debe tomarse con el cultivo</span>
            </div>
          </div>
        </label>
      </div>

      {agregarRec && (
        loadingCat
          ? <Loading type="content" size="sm" text="Cargando catálogos..." />
          : (
            <div className="nmon-fields nmon-fields--rec">
              <div className="nmon-field-row">
                <div className="nmon-field">
                  <label className="nmon-label">Tipo</label>
                  <div className="nmon-select-wrap">
                    <select className="nmon-select" name="id_tipo" value={recForm.id_tipo} onChange={handleRecChange}>
                      <option value="">Seleccionar tipo...</option>
                      {tipos.map((t) => <option key={t.idTipo} value={t.idTipo}>{t.nombreTipo}</option>)}
                    </select>
                    <ChevronDown size={13} className="nmon-select-icon" />
                  </div>
                </div>
                <div className="nmon-field">
                  <label className="nmon-label">Prioridad</label>
                  <div className="nmon-select-wrap">
                    <select className="nmon-select" name="id_prioridad" value={recForm.id_prioridad} onChange={handleRecChange}>
                      <option value="">Seleccionar...</option>
                      {prioridades.map((p) => <option key={p.idPrioridad} value={p.idPrioridad}>{p.nombre}</option>)}
                    </select>
                    <ChevronDown size={13} className="nmon-select-icon" />
                  </div>
                </div>
              </div>
              <div className="nmon-field">
                <label className="nmon-label">Fecha límite</label>
                <input className="nmon-input" type="date" name="fecha_limite"
                  value={recForm.fecha_limite} onChange={handleRecChange} />
              </div>
              <div className="nmon-field">
                <label className="nmon-label">Descripción <span className="nmon-req">*</span></label>
                <textarea className="nmon-textarea" name="descripcion"
                  value={recForm.descripcion} onChange={handleRecChange}
                  placeholder="Aplicar fungicida cúprico en dosis de..." rows={3} />
              </div>

              {/* ── Toggle tratamiento (anidado) ── */}
              <div className="nmon-section-toggle nmon-section-toggle--inner">
                <label className="nmon-toggle-label">
                  <input type="checkbox" className="nmon-checkbox" checked={agregarTrat}
                    onChange={(e) => setAgregarTrat(e.target.checked)} />
                  <div className="nmon-toggle-header">
                    <div className="nmon-toggle-icon nmon-toggle-icon--sm">
                      <FlaskConical size={13} strokeWidth={2} />
                    </div>
                    <div>
                      <span className="nmon-toggle-title">Asociar tratamiento</span>
                      <span className="nmon-toggle-desc">Especifica el producto y dosis</span>
                    </div>
                  </div>
                </label>

                {agregarTrat && (
                  <div className="nmon-trat-fields">
                    <div className="nmon-field-row">
                      <div className="nmon-field">
                        <label className="nmon-label">Tratamiento <span className="nmon-req">*</span></label>
                        <div className="nmon-select-wrap">
                          <select className="nmon-select" name="id_tratamiento"
                            value={tratForm.id_tratamiento} onChange={handleTratChange}>
                            <option value="">Seleccionar tratamiento...</option>
                            {tratamientos.map((t) => (
                              <option key={t.idTratamiento} value={t.idTratamiento}>
                                {t.nombre}{t.insumo?.nombre ? ` — ${t.insumo.nombre}` : ''}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={13} className="nmon-select-icon" />
                        </div>
                      </div>
                      <div className="nmon-field">
                        <label className="nmon-label">Dosis <span className="nmon-req">*</span></label>
                        <input className="nmon-input" type="text" name="dosis"
                          value={tratForm.dosis} onChange={handleTratChange} placeholder="Ej: 0.8 L/ha" />
                      </div>
                    </div>
                    <div className="nmon-field-row">
                      <div className="nmon-field">
                        <label className="nmon-label">Frecuencia</label>
                        <input className="nmon-input" type="text" name="frecuencia"
                          value={tratForm.frecuencia} onChange={handleTratChange} placeholder="Ej: Cada 15 días" />
                      </div>
                      <div className="nmon-field">
                        <label className="nmon-label">Observaciones</label>
                        <input className="nmon-input" type="text" name="observaciones"
                          value={tratForm.observaciones} onChange={handleTratChange} placeholder="Ej: Aplicar en la mañana" />
                      </div>
                    </div>
                    <div className="nmon-field-row">
                      <div className="nmon-field">
                        <label className="nmon-label">Producto a aplicar (Insumo)</label>
                        <div className="nmon-select-wrap">
                          <select className="nmon-select" name="id_insumo"
                            value={tratForm.id_insumo} onChange={handleTratChange}>
                            <option value="">Seleccionar insumo...</option>
                            {insumos.map((ins) => (
                              <option key={ins.idInsumo} value={ins.idInsumo}>{ins.nombre}</option>
                            ))}
                          </select>
                          <ChevronDown size={13} className="nmon-select-icon" />
                        </div>
                      </div>
                      <div className="nmon-field" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
      )}

      {/* ── Resumen ── */}
      <div className="nmon-resumen">
        <p className="nmon-resumen-title">Resumen</p>
        <div className="nmon-resumen-grid">
          <span className="nmon-resumen-key">Finca</span>
          <span className="nmon-resumen-val">{finca?.nombre || finca?.nombreFinca || '—'}</span>
          <span className="nmon-resumen-key">Cultivo</span>
          <span className="nmon-resumen-val">{cultivo?.nombreCultivo || '—'}</span>
          <span className="nmon-resumen-key">Fecha</span>
          <span className="nmon-resumen-val">
            {fecha ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
              day: 'numeric', month: 'long', year: 'numeric',
            }) : '—'}
          </span>
          <span className="nmon-resumen-key">Fotos</span>
          <span className="nmon-resumen-val">{fotos.length} foto{fotos.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {error && <div className="nmon-alert nmon-alert--error">{error}</div>}

      <div className="nmon-actions">
        <button className="nmon-btn nmon-btn--secondary" onClick={onBack} disabled={loading}>
          <ChevronLeft size={15} /> Anterior
        </button>
        <button className="nmon-btn nmon-btn--guardar" onClick={handleGuardar} disabled={loading}>
          {loading
            ? <Loading type="inline" text="Guardando..." />
            : <><BiCheck size={15} /> Guardar monitoreo</>
          }
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MODAL PRINCIPAL
// ─────────────────────────────────────────────
export default function NuevoMonitoreoModal({ cultivo, finca, expertoId, userId, onGuardado, onClose }) {
  const [paso,          setPaso]          = useState(1)
  const [fecha,         setFecha]         = useState(hoy())
  const [fotos,         setFotos]         = useState([])
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const next = () => setPaso((p) => Math.min(p + 1, 4))
  const back = () => setPaso((p) => Math.max(p - 1, 1))

  return (
    <div className="nmon-overlay" onClick={onClose}>
      <div className="nmon-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nmon-header">
          <div className="nmon-header-left">
            <span className="nmon-header-icon">
  <BiLeaf size={30} />
</span>
            <div>
              <h2 className="nmon-header-title">Nuevo monitoreo</h2>
              <p className="nmon-header-sub">
                {finca?.nombre || finca?.nombreFinca || 'Finca'} · {cultivo?.nombreCultivo || 'Cultivo'}
              </p>
            </div>
          </div>
          <button className="nmon-close" onClick={onClose} aria-label="Cerrar">
            <BiX size={18} />
          </button>
        </div>

        <StepIndicator pasoActual={paso} />

        <div className="nmon-content">
          {paso === 1 && <Paso1 cultivo={cultivo} finca={finca} fecha={fecha} setFecha={setFecha} onNext={next} />}
          {paso === 2 && <Paso2 fotos={fotos} setFotos={setFotos} onNext={next} onBack={back} />}
          {paso === 3 && <Paso3 observaciones={observaciones} setObservaciones={setObservaciones} onNext={next} onBack={back} />}
          {paso === 4 && (
            <Paso4
              cultivo={cultivo} finca={finca} fecha={fecha}
              fotos={fotos} observaciones={observaciones}
              expertoId={expertoId} userId={userId}
              onGuardado={onGuardado} onBack={back}
            />
          )}
        </div>
      </div>
    </div>
  )
}