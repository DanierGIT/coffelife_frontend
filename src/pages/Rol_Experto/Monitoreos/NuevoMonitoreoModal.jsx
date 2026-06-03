import { useState, useRef, useEffect } from 'react'
import api from '../../../services/api'
import './NuevoMonitoreoModal.css'

const hoy = () => new Date().toISOString().slice(0, 10)

const PASOS = [
  { num: 1, label: 'Información' },
  { num: 2, label: 'Fotos' },
  { num: 3, label: 'Observaciones' },
  { num: 4, label: 'Recomendaciones' },
]

// ─── Helpers ────────────────────────────────
const getArr = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  // paginación Adonis: data.data es objeto con meta+data array
  if (Array.isArray(data?.data?.data)) return data.data.data
  return []
}

// ─────────────────────────────────────────────
// INDICADOR DE PASOS
// ─────────────────────────────────────────────
function StepIndicator({ pasoActual }) {
  return (
    <div className="nmon-steps">
      {PASOS.map((p, i) => {
        const done   = pasoActual > p.num
        const active = pasoActual === p.num
        return (
          <div key={p.num} className="nmon-step-wrapper">
            <div className={`nmon-step ${active ? 'nmon-step--active' : ''} ${done ? 'nmon-step--done' : ''}`}>
              <div className="nmon-step-circle">
                {done
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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

// ─────────────────────────────────────────────
// PASO 1 — Información general
// ─────────────────────────────────────────────
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
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 2h6" />
    <rect x="4" y="4" width="16" height="18" rx="2" />
    <path d="M9 8h6" />
  </svg>
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
          <input
            className="nmon-input"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="nmon-error">{error}</p>}

      <div className="nmon-actions nmon-actions--right">
        <button className="nmon-btn nmon-btn--primary" onClick={continuar}>
          Siguiente <span className="nmon-arrow">→</span>
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PASO 2 — Registro fotográfico
// ─────────────────────────────────────────────
function Paso2({ fotos, setFotos, onNext, onBack }) {
  const inputRef = useRef()

  const handleAgregar = (e) => {
    const archivos = Array.from(e.target.files)
    const nuevas = archivos.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
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
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
</div>
      <h3 className="nmon-paso-title">Registro fotográfico</h3>
      <p className="nmon-paso-desc">Toma fotos del cultivo desde distintos ángulos. Este paso es opcional.</p>

      <div className="nmon-fotos-grid">
        <div className="nmon-foto-add" onClick={() => inputRef.current?.click()}>
          <div className="nmon-foto-add-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <span>Agregar fotos</span>
          <small>JPG, PNG, WEBP · Máx. 10 MB</small>
        </div>

        {fotos.map((foto, i) => (
          <div key={i} className="nmon-foto-preview">
            <img src={foto.preview} alt={`foto-${i}`} />
            <button className="nmon-foto-remove" onClick={() => handleQuitar(i)} type="button">✕</button>
          </div>
        ))}
      </div>

      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple style={{ display: 'none' }} onChange={handleAgregar} />

      {fotos.length > 0 && (
        <p className="nmon-fotos-count">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {fotos.length} foto{fotos.length !== 1 ? 's' : ''} lista{fotos.length !== 1 ? 's' : ''}
        </p>
      )}

      <div className="nmon-actions">
        <button className="nmon-btn nmon-btn--secondary" onClick={onBack}>← Anterior</button>
        <button className="nmon-btn nmon-btn--primary" onClick={onNext}>
          {fotos.length === 0 ? 'Omitir' : 'Siguiente'} <span className="nmon-arrow">→</span>
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PASO 3 — Observaciones
// ─────────────────────────────────────────────
function Paso3({ observaciones, setObservaciones, onNext, onBack }) {
  return (
    <div className="nmon-paso-body">
      <div className="nmon-paso-icon">
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </svg>
</div>
      <h3 className="nmon-paso-title">Observaciones del cultivo</h3>
      <p className="nmon-paso-desc">Describe el estado actual, plagas, enfermedades o cualquier aspecto relevante. Opcional.</p>

      <div className="nmon-fields">
        <div className="nmon-field">
          <label className="nmon-label">Observaciones</label>
          <textarea
            className="nmon-textarea"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="El cultivo se encuentra en buen estado, se observa..."
            rows={5}
            maxLength={1000}
          />
          <p className="nmon-char-count">{observaciones.length} / 1000</p>
        </div>
      </div>

      <div className="nmon-actions">
        <button className="nmon-btn nmon-btn--secondary" onClick={onBack}>← Anterior</button>
        <button className="nmon-btn nmon-btn--primary" onClick={onNext}>
          {observaciones.trim() === '' ? 'Omitir' : 'Siguiente'} <span className="nmon-arrow">→</span>
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PASO 4 — Recomendaciones + Guardar todo
// ─────────────────────────────────────────────
function Paso4({ cultivo, finca, fecha, fotos, observaciones, expertoId, onGuardado, onBack, onClose }) {
  const [tipos,       setTipos]       = useState([])
  const [prioridades, setPrioridades] = useState([])
  const [recForm, setRecForm] = useState({
    id_tipo:      '',
    id_prioridad: '',
    descripcion:  '',
    fecha_limite: '',
  })
  const [agregarRec, setAgregarRec] = useState(true)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [loadingCat, setLoadingCat] = useState(true)

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [tiposRes] = await Promise.all([
          api.get('/cat_tipos_recomendaciones'),
        ])
        setTipos(getArr(tiposRes.data))
        try {
          const r = await api.get('/categorias/prioridades')
          setPrioridades(getArr(r.data))
        } catch {
          const r = await api.get('/cat_prioridades')
          setPrioridades(getArr(r.data))
        }
      } catch (e) {
        console.error('Error cargando catálogos:', e)
      } finally {
        setLoadingCat(false)
      }
    }
    cargarCatalogos()
  }, [])

  const handleChange = (e) => setRecForm({ ...recForm, [e.target.name]: e.target.value })

  const handleGuardar = async () => {
    if (agregarRec && !recForm.descripcion.trim()) {
      setError('La descripción de la recomendación es obligatoria.')
      return
    }
    setError('')
    setLoading(true)

    try {
      // 1 — Crear monitoreo
      const resM = await api.post('/monitoreos', {
        id_cultivo:      Number(cultivo.idCultivo),
        id_experto:      expertoId ? Number(expertoId) : null,
        fecha_monitoreo: fecha,
        observaciones:   observaciones || null,
      })
      const idMonitoreo = resM.data?.data?.idMonitoreo ?? resM.data?.idMonitoreo

      // 2 — Subir fotos
      if (fotos.length > 0 && idMonitoreo) {
        for (const foto of fotos) {
          const fd = new FormData()
          fd.append('imagen',       foto.file)
          fd.append('id_monitoreo', String(idMonitoreo))
          await api.post('/imagenes', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
      }

      // 3 — Crear recomendación (si se marcó)
      if (agregarRec && idMonitoreo) {
        await api.post('/recomendaciones', {
          id_monitoreo:      Number(idMonitoreo),
          id_tipo:           recForm.id_tipo      ? Number(recForm.id_tipo)      : null,
          id_experto_emisor: expertoId            ? Number(expertoId)            : null,
          id_prioridad:      recForm.id_prioridad ? Number(recForm.id_prioridad) : null,
          descripcion:       recForm.descripcion,
          fecha_limite:      recForm.fecha_limite || null,
        })
      }

      onGuardado()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar el monitoreo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="nmon-paso-body">
      <div className="nmon-paso-icon">
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
    <path d="M12 2a7 7 0 0 0-4 12c.6.6 1 1.4 1 2h6c0-.6.4-1.4 1-2A7 7 0 0 0 12 2z"/>
  </svg>
</div>
      <h3 className="nmon-paso-title">Recomendaciones</h3>
      <p className="nmon-paso-desc">Agrega una recomendación para este monitoreo o guarda sin ella.</p>

      <label className="nmon-toggle-label">
        <input
          type="checkbox"
          checked={agregarRec}
          onChange={(e) => setAgregarRec(e.target.checked)}
          className="nmon-checkbox"
        />
        <span className="nmon-toggle-text">Agregar una recomendación ahora</span>
      </label>

      {agregarRec && (
        loadingCat
          ? <p className="nmon-loading-cat">Cargando catálogos...</p>
          : (
            <div className="nmon-fields nmon-fields--rec">
              <div className="nmon-field-row">
                <div className="nmon-field">
                  <label className="nmon-label">Tipo de recomendación</label>
                  <select className="nmon-select" name="id_tipo" value={recForm.id_tipo} onChange={handleChange}>
                    <option value="">Seleccionar tipo...</option>
                    {tipos.map((t) => (
                      <option key={t.idTipo} value={t.idTipo}>{t.nombreTipo}</option>
                    ))}
                  </select>
                </div>
                <div className="nmon-field">
                  <label className="nmon-label">Prioridad</label>
                  <select className="nmon-select" name="id_prioridad" value={recForm.id_prioridad} onChange={handleChange}>
                    <option value="">Seleccionar prioridad...</option>
                    {prioridades.map((p) => (
                      <option key={p.idPrioridad} value={p.idPrioridad}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="nmon-field">
                <label className="nmon-label">Fecha límite</label>
                <input className="nmon-input" type="date" name="fecha_limite" value={recForm.fecha_limite} onChange={handleChange} />
              </div>
              <div className="nmon-field">
                <label className="nmon-label">Descripción <span className="nmon-req">*</span></label>
                <textarea
                  className="nmon-textarea"
                  name="descripcion"
                  value={recForm.descripcion}
                  onChange={handleChange}
                  placeholder="Aplicar fungicida cúprico en dosis de..."
                  rows={3}
                  required
                />
              </div>
            </div>
          )
      )}

      {/* Resumen compacto */}
      <div className="nmon-resumen">
        <p className="nmon-resumen-title">Resumen del monitoreo</p>
        <div className="nmon-resumen-grid">
          <span className="nmon-resumen-key">Finca</span>
          <span className="nmon-resumen-val">{finca?.nombre || finca?.nombreFinca || '—'}</span>
          <span className="nmon-resumen-key">Cultivo</span>
          <span className="nmon-resumen-val">{cultivo?.nombreCultivo || '—'}</span>
          <span className="nmon-resumen-key">Fecha</span>
          <span className="nmon-resumen-val">
            {fecha ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          </span>
          <span className="nmon-resumen-key">Fotos</span>
          <span className="nmon-resumen-val">{fotos.length} foto{fotos.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {error && <p className="nmon-error">{error}</p>}

      <div className="nmon-actions">
        <button className="nmon-btn nmon-btn--secondary" onClick={onBack} disabled={loading}>← Anterior</button>
        <button className="nmon-btn nmon-btn--guardar" onClick={handleGuardar} disabled={loading}>
          {loading
            ? <><span className="nmon-spinner" /> Guardando...</>
            : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Guardar monitoreo</>
          }
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MODAL PRINCIPAL
// ─────────────────────────────────────────────
export default function NuevoMonitoreoModal({ cultivo, finca, expertoId, onGuardado, onClose }) {
  const [paso,         setPaso]         = useState(1)
  const [fecha,        setFecha]        = useState(hoy())
  const [fotos,        setFotos]        = useState([])
  const [observaciones, setObservaciones] = useState('')

  // Cerrar con ESC
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

        {/* Header */}
        <div className="nmon-header">
          <div className="nmon-header-left">
            <span className="nmon-header-icon">
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 20c5 0 10-5 10-10V4h-6C6 4 2 8 2 13c0 4 2 7 5 7z"/>
    <path d="M7 20c0-5 5-10 10-10"/>
  </svg>
</span>
            <div>
              <h2 className="nmon-header-title">Nuevo monitoreo</h2>
              <p className="nmon-header-sub">
                {finca?.nombre || finca?.nombreFinca || 'Finca'} · {cultivo?.nombreCultivo || 'Cultivo'}
              </p>
            </div>
          </div>
          <button className="nmon-close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Steps */}
        <StepIndicator pasoActual={paso} />

        {/* Contenido por paso */}
        <div className="nmon-content">
          {paso === 1 && (
            <Paso1 cultivo={cultivo} finca={finca} fecha={fecha} setFecha={setFecha} onNext={next} />
          )}
          {paso === 2 && (
            <Paso2 fotos={fotos} setFotos={setFotos} onNext={next} onBack={back} />
          )}
          {paso === 3 && (
            <Paso3 observaciones={observaciones} setObservaciones={setObservaciones} onNext={next} onBack={back} />
          )}
          {paso === 4 && (
            <Paso4
              cultivo={cultivo}
              finca={finca}
              fecha={fecha}
              fotos={fotos}
              observaciones={observaciones}
              expertoId={expertoId}
              onGuardado={onGuardado}
              onBack={back}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}