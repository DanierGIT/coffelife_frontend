import { useState, useRef, useEffect } from 'react'
import {
  Info, Camera, FileText, Lightbulb, ChevronRight,
  ChevronLeft, X, ChevronDown,
  FlaskConical, Stethoscope,
} from 'lucide-react'
import api from '../../../services/api'
import { BiCheck, BiListUl, BiCamera, BiPencil, BiBulb, BiLeaf, BiX } from 'react-icons/bi'
import './NuevoMonitoreoModal.css'
import Loading from '../../../components/Loading'
import '../../../components/cargando.css'

const getColombiaDateTime = () => {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (type) => parts.find((p) => p.type === type)?.value
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}:${get('second')}`,
  }
}

const hoy = () => getColombiaDateTime().date

const toColombiaISO = (dateStr, timeStr) => {
  // dateStr: YYYY-MM-DD en zona Colombia
  // timeStr: HH:mm:ss opcional (si no se provee, usa la hora actual de Colombia)
  const time = timeStr || getColombiaDateTime().time
  return `${dateStr}T${time}-05:00`
}

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

// ─── Helpers para historial de monitoreos ──────────────────────────
export function esMonitoreoHistorico(monitoreo) {
  // Solo marca como historico si empieza con el formato exacto que genera el sistema
  return /^\[HISTORIAL — Monitoreo #\d+ — Guardado el /.test(monitoreo?.observaciones || '')
}

export function obtenerIdPadreDesdeHistorico(monitoreo) {
  const match = (monitoreo?.observaciones || '').match(/Monitoreo #(\d+)/)
  return match ? Number(match[1]) : null
}

function construirObservacionesHistorico(monitoreo, recs = [], usuario = null, catalogos = {}) {
  const { nivelesRoya = [], tiposRec = [], prioridades = [] } = catalogos
  const lineas = []
  const idPadre = monitoreo?.idMonitoreo ?? monitoreo?.id_monitoreo
  const fechaOriginal = monitoreo?.fechaMonitoreo ?? monitoreo?.fecha_monitoreo ?? '—'
  const fechaHora = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })
  const autor = usuario?.nombre
    ? `${usuario.nombre} ${usuario.apellido || ''}`.trim()
    : 'Sistema'

  // Extraer nivel de roya y texto real de las observaciones actuales
  // Buscamos el ULTIMO [ROYA:NIVEL] (el estado mas reciente)
  const obsActual = monitoreo?.observaciones || ''
  let royaIdx = -1
  let royaPos = -1
  let searchFrom = 0
  while ((royaPos = obsActual.indexOf('[ROYA:', searchFrom)) !== -1) {
    royaIdx = royaPos
    searchFrom = royaPos + 1
  }
  let nombreNivelRoya = 'No registrado'
  let obsLimpia = obsActual
  if (royaIdx !== -1) {
    const endIdx = obsActual.indexOf(']', royaIdx + 6)
    nombreNivelRoya = endIdx > royaIdx ? obsActual.slice(royaIdx + 6, endIdx) : 'No registrado'
    // Tomar solo el texto despues del ultimo [ROYA:...]
    obsLimpia = obsActual.slice(endIdx + 1)
    // Quitar lineas --- YYYY-MM-DD ---
    obsLimpia = obsLimpia.split('\n').filter(l => !/^---\s*\d{4}-\d{2}-\d{2}\s*---$/.test(l.trim())).join('\n')
    // Si hay bloques viejos de HISTORIAL DE CAMBIOS, cortar antes de ellos
    const idxViejoHist = obsLimpia.indexOf('HISTORIAL DE CAMBIOS')
    if (idxViejoHist !== -1) {
      obsLimpia = obsLimpia.slice(0, idxViejoHist)
    }
    obsLimpia = obsLimpia.trim()
  }
  // Si quedo vacio, intentar extraer de la primera linea que no sea metadata
  if (!obsLimpia) {
    obsLimpia = obsActual
      .split('\n')
      .filter(l => {
        const t = l.trim()
        return t && !t.startsWith('═') && !t.startsWith('[') && !t.startsWith('Fecha ') &&
          !t.startsWith('Nivel ') && !t.startsWith('Observaciones ') &&
          !t.startsWith('Fotos ') && !t.startsWith('Recomendaci') &&
          !t.startsWith('Tipo:') && !t.startsWith('Prioridad:') &&
          !t.startsWith('Descripci') && !t.startsWith('Fecha l') &&
          !t.startsWith('HISTORIAL') && !/^\s+\d+\./.test(t) &&
          !/^---/.test(t)
      })
      .join('\n')
      .trim() || '—'
  }

  lineas.push(`[HISTORIAL — Monitoreo #${idPadre} — Guardado el ${fechaHora} por ${autor}]`)
  lineas.push('')
  lineas.push(`Fecha del monitoreo original: ${fechaOriginal}`)
  lineas.push(`Nivel de roya: ${nombreNivelRoya}`)
  lineas.push('')
  lineas.push('Observaciones originales:')
  lineas.push(obsLimpia || '—')
  lineas.push('')

  const fotos = Array.isArray(monitoreo?.imagenes) ? monitoreo.imagenes : []
  if (fotos.length > 0) {
    lineas.push('Fotos registradas:')
    fotos.forEach((f, i) => {
      const url = f?.rutaImagen || f?.url || f?.fotoUrl || (typeof f === 'string' ? f : '')
      if (url) lineas.push(`  ${i + 1}. ${url}`)
    })
    lineas.push('')
  }

  if (recs.length > 0) {
    recs.forEach((r, idx) => {
      const tipo = tiposRec.find((t) => Number(t?.idTipo ?? t?.id_tipo) === Number(r?.idTipo ?? r?.id_tipo))
      const prioridad = prioridades.find((p) => Number(p?.idPrioridad ?? p?.id_prioridad) === Number(r?.idPrioridad ?? r?.id_prioridad))

      lineas.push(`Recomendación ${idx + 1}:`)
      lineas.push(`  Tipo: ${tipo?.nombreTipo || tipo?.nombre || r?.tipo?.nombreTipo || r?.tipo?.nombre || '—'}`)
      lineas.push(`  Prioridad: ${prioridad?.nombre || r?.prioridad?.nombre || '—'}`)
      lineas.push(`  Descripción: ${r?.descripcion || '—'}`)
      lineas.push(`  Fecha límite: ${r?.fechaLimite || r?.fecha_limite || '—'}`)

      const trats = Array.isArray(r?.tratamientos) ? r.tratamientos : []
      if (trats.length > 0) {
        lineas.push('  Tratamientos:')
        trats.forEach((t) => {
          const apl = t?.aplicacion || t
          const nombre = apl?.tratamiento?.nombre || apl?.tratamiento?.nombreTratamiento || apl?.nombre || '—'
          const insumo = apl?.insumo?.nombre || t?.insumo?.nombre || '—'
          const dosis = apl?.dosis || '—'
          const frecuencia = apl?.frecuencia || '—'
          const duracion = apl?.duracion || '—'
          lineas.push(`    - ${nombre}${insumo !== '—' ? ` (${insumo})` : ''} | Dosis: ${dosis} | Frecuencia: ${frecuencia} | Duración: ${duracion}`)
        })
      }
      lineas.push('')
    })
  }

  return lineas.join('\n')
}

async function construirTextoHistorico(monitoreo, usuario = null) {
  const idPadre = monitoreo?.idMonitoreo ?? monitoreo?.id_monitoreo
  if (!idPadre) return ''

  let recs = []
  try {
    const resRecs = await api.get('/recomendaciones', { params: { id_monitoreo: idPadre } })
    recs = Array.isArray(resRecs.data) ? resRecs.data : (resRecs.data?.data ?? [])
  } catch {
    recs = []
  }

  const [nivelesRoya, tiposRec, prioridades] = await Promise.all([
    api.get('/cat_niveles_roya').then((r) => getArr(r.data)).catch(() => []),
    api.get('/cat_tipos_recomendaciones').then((r) => getArr(r.data)).catch(() => []),
    api.get('/cat_prioridades').then((r) => getArr(r.data)).catch(() => []),
  ])

  return construirObservacionesHistorico(monitoreo, recs, usuario, {
    nivelesRoya,
    tiposRec,
    prioridades,
  })
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
function Paso1({ cultivo, finca, fecha, setFecha, onNext, tieneRoya, setTieneRoya, idNivelRoya, setIdNivelRoya, nivelesRoya }) {
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

        {/* ── Roya ── */}
        <div className="nmon-roya-section">
          <label className="nmon-label">¿El cultivo presenta roya? <span className="nmon-req">*</span></label>
          <div className="nmon-roya-radios">
            <label className={`nmon-roya-radio ${tieneRoya === true ? 'nmon-roya-radio--active' : ''}`}>
              <input type="radio" name="tieneRoya" checked={tieneRoya === true}
                onChange={() => setTieneRoya(true)} />
              <span>Sí</span>
            </label>
            <label className={`nmon-roya-radio ${tieneRoya === false ? 'nmon-roya-radio--active' : ''}`}>
              <input type="radio" name="tieneRoya" checked={tieneRoya === false}
                onChange={() => { setTieneRoya(false); setIdNivelRoya('') }} />
              <span>No</span>
            </label>
          </div>
        </div>

        {tieneRoya === true && (
          <div className="nmon-field">
            <label className="nmon-label">Nivel de roya <span className="nmon-req">*</span></label>
            <div className="nmon-select-wrap">
              <select className="nmon-select" value={idNivelRoya}
                onChange={(e) => setIdNivelRoya(e.target.value)}>
                <option value="">Seleccionar nivel...</option>
                {nivelesRoya.map((n, i) => (
                  <option key={n.idNivelRoya || n.id_nivel_roya || i} value={n.idNivelRoya || n.id_nivel_roya}>
                    {n.nombreNivel || n.nombre || n.nombre_nivel || 'Nivel'}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="nmon-select-icon" />
            </div>
          </div>
        )}
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
function Paso3({ observaciones, setObservaciones, onNext, onBack, isEditing, nuevasObservaciones, setNuevasObservaciones }) {
  if (isEditing) {
    return (
      <div className="nmon-paso-body">
        <div className="nmon-paso-icon"><BiPencil size={32} /></div>
        <h3 className="nmon-paso-title">Observaciones del cultivo</h3>
        <p className="nmon-paso-desc">Las observaciones anteriores se conservan. Agrega nuevas si es necesario.</p>
        <div className="nmon-fields">
          <div className="nmon-field">
            <label className="nmon-label">Observaciones anteriores</label>
            <div className="nmon-input nmon-input--readonly" style={{ padding: '9px 12px', whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: 13 }}>
              {observaciones || '—'}
            </div>
          </div>
          <div className="nmon-field">
            <label className="nmon-label">Nuevas observaciones</label>
            <textarea className="nmon-textarea" value={nuevasObservaciones}
              onChange={(e) => setNuevasObservaciones(e.target.value)}
              placeholder="Agrega observaciones adicionales..." rows={4} maxLength={1000} />
            <p className="nmon-char-count">{nuevasObservaciones.length} / 1000</p>
          </div>
        </div>
        <div className="nmon-actions">
          <button className="nmon-btn nmon-btn--secondary" onClick={onBack}><ChevronLeft size={15} /> Anterior</button>
          <button className="nmon-btn nmon-btn--primary" onClick={onNext}>Siguiente <ChevronRight size={15} /></button>
        </div>
      </div>
    )
  }
  return (
    <div className="nmon-paso-body">
      <div className="nmon-paso-icon"><BiPencil size={32} /></div>
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
        <button className="nmon-btn nmon-btn--secondary" onClick={onBack}><ChevronLeft size={15} /> Anterior</button>
        <button className="nmon-btn nmon-btn--primary" onClick={onNext}>
          {observaciones.trim() === '' ? 'Omitir' : 'Siguiente'} <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Paso 4 ──────────────────────────────────
function Paso4({ cultivo, finca, fecha, fotos, observaciones, nuevasObservaciones, expertoId, userId, onGuardado, onBack, tieneRoya, idNivelRoya, isEditing, editMonitoreoId, editMonitoreo, nivelesRoya }) {
  const [tipos,           setTipos]         = useState([])
  const [prioridades,     setPrioridades]   = useState([])
  const [tratamientos,    setTratamientos]  = useState([])
  const [insumos,         setInsumos]       = useState([])
  const [loadingCat,      setLoadingCat]    = useState(true)
  const [loading,         setLoading]       = useState(false)
  const [error,           setError]         = useState('')

  const [agregarRec,  setAgregarRec]  = useState(true)
  const [agregarTrat, setAgregarTrat] = useState(!!tieneRoya)
  const [esPersonalizada, setEsPersonalizada] = useState(false)

  const [recForm, setRecForm] = useState({
    id_tipo: '', id_prioridad: '', descripcion: '', fecha_limite: hoy(),
  })
  const [tipoPersonalizado, setTipoPersonalizado] = useState('')
  const [tratamientosList, setTratamientosList] = useState([
    { id_tratamiento: '', id_insumo: '', observaciones: '', dosis: '', frecuencia: '', duracion: '' },
  ])

  const handleRecChange = (e) => setRecForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleTratChange = (idx, field, value) => {
    setTratamientosList((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const agregarTratamiento = () => {
    setTratamientosList((prev) => [...prev, { id_tratamiento: '', id_insumo: '', observaciones: '', dosis: '', frecuencia: '', duracion: '' }])
  }

  const eliminarTratamiento = (idx) => {
    setTratamientosList((prev) => prev.filter((_, i) => i !== idx))
  }

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

  const handleGuardar = async () => {
    if (agregarRec && esPersonalizada && !tipoPersonalizado.trim()) {
      setError('Escribe un nombre para la recomendación personalizada.'); return
    }
    if (agregarRec && !esPersonalizada && !recForm.id_tipo) {
      setError('Selecciona un tipo de recomendación.'); return
    }
    if (agregarRec && !recForm.descripcion.trim()) {
      setError('La descripción de la recomendación es obligatoria.'); return
    }
    const tratValidos = agregarTrat ? tratamientosList.filter((t) => t.id_tratamiento) : []
    if (tieneRoya && tratValidos.length === 0) {
      setError('El cultivo presenta roya — es obligatorio agregar al menos un tratamiento.'); return
    }
    if (agregarTrat && tratValidos.length === 0) {
      setError('Agrega al menos un tratamiento o desmarca la opción.'); return
    }
    setError('')
    setLoading(true)
    let createdMonitoreoId = null
    try {
      // Extraer solo el texto real de observaciones, sin historial previo
      let textoRealObs = observaciones || ''
      const ultimoHist = textoRealObs.lastIndexOf('[HISTORIAL — Monitoreo #')
      if (ultimoHist !== -1) {
        const desdeHist = textoRealObs.slice(ultimoHist)
        const idxRoya = desdeHist.indexOf('\n[ROYA:')
        if (idxRoya !== -1) {
          textoRealObs = desdeHist.slice(idxRoya + 1).trim()
        }
      }
      // Limpiar lineas de metadata sueltas (═, Fecha, Nivel, Fotos, Recomendacion, etc.)
      textoRealObs = textoRealObs
        .split('\n')
        .filter(l => {
          const t = l.trim()
          return !/^═+$/.test(t) && !t.startsWith('HISTORIAL DE CAMBIOS') &&
            !t.startsWith('[HISTORIAL') && !t.startsWith('Fecha ') &&
            !t.startsWith('Nivel ') && !t.startsWith('Observaciones ') &&
            !t.startsWith('Fotos ') && !t.startsWith('Recomendaci') &&
            !t.startsWith('Tipo:') && !t.startsWith('Prioridad:') &&
            !t.startsWith('Descripci') && !t.startsWith('Fecha l') &&
            !t.startsWith('Tratamiento') && !/^\s+\d+\./.test(t) &&
            !t.startsWith('  -') && !/^---/.test(t)
        })
        .join('\n')
        .trim()

      const obsRaw = isEditing && nuevasObservaciones?.trim()
        ? `${textoRealObs}\n\n--- ${new Date().toISOString().slice(0, 10)} ---\n${nuevasObservaciones.trim()}`
        : (textoRealObs || null)

      // Incrustar nivel de roya en las observaciones con prefijo [ROYA:NIVEL]
      let royaPrefijo = ''
      if (tieneRoya && idNivelRoya) {
        const nivel = nivelesRoya.find((n) => Number(n.idNivelRoya ?? n.id_nivel_roya) === Number(idNivelRoya))
        const nombreNivel = nivel?.nombre || nivel?.nombreNivel || idNivelRoya
        royaPrefijo = `[ROYA:${nombreNivel}]\n\n`
      }
      // Limpiar prefijos anteriores de roya
      let obsLimpia = (obsRaw || '').replace(/\[ROYA:.+?\]\n*/g, '')
      const obsFinal = royaPrefijo ? `${royaPrefijo}${obsLimpia}` : (obsLimpia || null)

      let idMonitoreo
      if (isEditing) {
        const textoHistorico = await construirTextoHistorico(editMonitoreo, { idUsuario: expertoId })
        const obsConHistorial = textoHistorico
          ? `\n\n${'═'.repeat(40)}\nHISTORIAL DE CAMBIOS\n${'═'.repeat(40)}\n\n${textoHistorico}` + (obsFinal || '')
          : (obsFinal || '')
        // Preservar la hora original del monitoreo (no sobrescribir con la hora actual)
        const originalTime = (editMonitoreo?.fechaMonitoreo ?? editMonitoreo?.fecha_monitoreo ?? '').slice(11, 19)
        await api.put(`/monitoreos/${editMonitoreoId}`, {
          observaciones: obsConHistorial || null,
          fecha_monitoreo: toColombiaISO(fecha, originalTime),
          id_nivel_roya: tieneRoya && idNivelRoya ? Number(idNivelRoya) : null,
        })
        idMonitoreo = editMonitoreoId
      } else {
        const payload = {
          id_cultivo:      Number(cultivo.idCultivo),
          id_experto:      expertoId ? Number(expertoId) : null,
          fecha_monitoreo: toColombiaISO(fecha),
          observaciones:   obsFinal,
          id_nivel_roya:   tieneRoya && idNivelRoya ? Number(idNivelRoya) : null,
        }
        const resM = await api.post('/monitoreos', payload)
        idMonitoreo = resM.data?.data?.idMonitoreo ?? resM.data?.idMonitoreo
        createdMonitoreoId = idMonitoreo
      }

      // 2 — Fotos (solo en creación o nuevas)
      if (fotos.length > 0 && idMonitoreo) {
        for (const foto of fotos) {
          const fd = new FormData()
          fd.append('imagen', foto.file)
          fd.append('id_monitoreo', String(idMonitoreo))
          await api.post('/imagenes', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
      }

      // 3 — Recomendación
      if (agregarRec && idMonitoreo) {
        let desc = recForm.descripcion.trim()
        if (esPersonalizada && tipoPersonalizado.trim()) {
          desc = `[${tipoPersonalizado.trim()}] ${desc}`
        }
        const recPayload = {
          id_monitoreo:      Number(idMonitoreo),
          id_tipo:           esPersonalizada ? null : (recForm.id_tipo ? Number(recForm.id_tipo) : null),
          id_experto_emisor: expertoId        ? Number(expertoId) : null,
          id_prioridad:      recForm.id_prioridad ? Number(recForm.id_prioridad) : null,
          id_tratamiento:    tratValidos.length > 0 ? Number(tratValidos[0].id_tratamiento) : null,
          descripcion:       desc,
          fecha_limite:      recForm.fecha_limite || null,
        }

        let idRecomendacion
        if (isEditing) {
          let recExistenteId = null
          try {
            const resRecs = await api.get('/recomendaciones', { params: { id_monitoreo: idMonitoreo } })
            const recs = Array.isArray(resRecs.data) ? resRecs.data : (resRecs.data?.data ?? [])
            if (recs.length > 0) {
              recExistenteId = recs[0].idRecomendacion ?? recs[0].id_recomendacion
            }
          } catch {}
          if (recExistenteId) {
            await api.put(`/recomendaciones/${recExistenteId}`, recPayload)
            idRecomendacion = recExistenteId
          } else {
            const resRec = await api.post('/recomendaciones', recPayload)
            idRecomendacion = resRec.data?.data?.idRecomendacion ?? resRec.data?.idRecomendacion
          }
        } else {
          const resRec = await api.post('/recomendaciones', recPayload)
          idRecomendacion = resRec.data?.data?.idRecomendacion ?? resRec.data?.idRecomendacion
        }

        // 4 — Aplicaciones tratamiento (una por cada tratamiento)
        if (idRecomendacion && tratValidos.length > 0) {
          const fechaApl = fecha ? toColombiaISO(fecha) : toColombiaISO(hoy())
          for (const t of tratValidos) {
            const insumo = t.id_insumo ? insumos.find((i) => Number(i.idInsumo) === Number(t.id_insumo)) : null
            const dVal = t.dosis?.trim() || ''
            const fVal = t.frecuencia?.trim() || ''
            const xVal = t.duracion?.trim() || ''
            const obsTexto = t.observaciones?.trim() || ''
            // Formato pipe-delimited: [Insumo|Dosis|Frecuencia|Duracion] texto
            const header = `[${insumo?.nombre || ''}|${dVal}|${fVal}|${xVal}]`
            const obs = obsTexto ? `${header} ${obsTexto}` : header
            await api.post('/aplicaciones_tratamientos', {
              id_tratamiento:   Number(t.id_tratamiento),
              id_monitoreo:     Number(idMonitoreo),
              id_usuario:       userId ? Number(userId) : null,
              fecha_aplicacion: fechaApl,
              observacion:      obs,
              dosis:            t.dosis?.trim() || null,
              frecuencia:       t.frecuencia?.trim() || null,
              duracion:         t.duracion?.trim() || null,
            })
          }
        }
      }

      onGuardado()
    } catch (err) {
      console.error('Error al guardar monitoreo:', err?.response?.data || err)
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
              {/* ── Tipo vs personalizada ── */}
              <div className="nmon-field-row">
                <div className="nmon-field">
                  {esPersonalizada ? (
                    <>
                      <label className="nmon-label">Título personalizado</label>
                      <input className="nmon-input" type="text" value={tipoPersonalizado}
                        onChange={(e) => setTipoPersonalizado(e.target.value)}
                        placeholder="Ej: Recomendación del experto" />
                    </>
                  ) : (
                    <>
                      <label className="nmon-label">Tipo</label>
                      <div className="nmon-select-wrap">
                        <select className="nmon-select" name="id_tipo" value={recForm.id_tipo} onChange={handleRecChange}>
                          <option value="">Seleccionar tipo...</option>
                          {tipos.map((t) => <option key={t.idTipo} value={t.idTipo}>{t.nombreTipo}</option>)}
                        </select>
                        <ChevronDown size={13} className="nmon-select-icon" />
                      </div>
                    </>
                  )}
                </div>
                <div className="nmon-field">
                  <label className="nmon-label">&nbsp;</label>
                  <label className="nmon-toggle-personalizada">
                    <input type="checkbox" checked={esPersonalizada}
                      onChange={(e) => setEsPersonalizada(e.target.checked)} />
                    <span>Recomendación personalizada</span>
                  </label>
                </div>
              </div>
              <div className="nmon-field-row">
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
                <div className="nmon-field">
                  <label className="nmon-label">Fecha de la recomendación</label>
                  <input className="nmon-input" type="date" name="fecha_limite" value={recForm.fecha_limite || hoy()} readOnly />
                </div>
              </div>
              <div className="nmon-field">
                <label className="nmon-label">Descripción <span className="nmon-req">*</span></label>
                <textarea className="nmon-textarea" name="descripcion"
                  value={recForm.descripcion} onChange={handleRecChange}
                  placeholder="Aplicar fungicida cúprico en dosis de..." rows={3} />
              </div>

              {/* ── Toggle tratamiento (anidado) ── */}
              {tieneRoya && (
                <div className="nmon-roya-banner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>Este cultivo presenta roya — el tratamiento es obligatorio.</span>
                </div>
              )}
              <div className="nmon-section-toggle nmon-section-toggle--inner">
                <label className="nmon-toggle-label">
                  <input type="checkbox" className="nmon-checkbox" checked={agregarTrat}
                    disabled={tieneRoya}
                    onChange={(e) => setAgregarTrat(e.target.checked)} />
                  <div className="nmon-toggle-header">
                    <div className="nmon-toggle-icon nmon-toggle-icon--sm">
                      <FlaskConical size={13} strokeWidth={2} />
                    </div>
                    <div>
                      <span className="nmon-toggle-title">Asociar tratamiento(s)</span>
                      <span className="nmon-toggle-desc">Especifica los productos a aplicar</span>
                    </div>
                  </div>
                </label>

                {agregarTrat && tratamientosList.map((trat, idx) => {
                  const idsUsados = tratamientosList
                    .map((t, i) => i !== idx ? t.id_tratamiento : null)
                    .filter(Boolean)
                  return (
                  <div key={idx} className="nmon-trat-fields">
                    <div className="nmon-trat-header-row">
                      <span className="nmon-trat-num">Tratamiento #{idx + 1}</span>
                      {idx > 0 && (
                        <button type="button" className="nmon-trat-remove" onClick={() => eliminarTratamiento(idx)}>
                          <BiX size={16} />
                        </button>
                      )}
                    </div>
                    <div className="nmon-field-row">
                      <div className="nmon-field">
                        <label className="nmon-label">Tratamiento <span className="nmon-req">*</span></label>
                        <div className="nmon-select-wrap">
                          <select className="nmon-select" value={trat.id_tratamiento}
                            onChange={(e) => handleTratChange(idx, 'id_tratamiento', e.target.value)}>
                            <option value="">Seleccionar tratamiento...</option>
                            {tratamientos.map((t) => (
                              <option key={t.idTratamiento} value={t.idTratamiento}
                                disabled={idsUsados.includes(String(t.idTratamiento))}>
                                {t.nombre}{t.insumo?.nombre ? ` — ${t.insumo.nombre}` : ''}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={13} className="nmon-select-icon" />
                        </div>
                      </div>
                      <div className="nmon-field">
                        <label className="nmon-label">Producto a aplicar (Insumo)</label>
                        <div className="nmon-select-wrap">
                          <select className="nmon-select" value={trat.id_insumo}
                            onChange={(e) => handleTratChange(idx, 'id_insumo', e.target.value)}>
                            <option value="">Seleccionar insumo...</option>
                            {insumos.map((ins) => (
                              <option key={ins.idInsumo} value={ins.idInsumo}>{ins.nombre}</option>
                            ))}
                          </select>
                          <ChevronDown size={13} className="nmon-select-icon" />
                        </div>
                      </div>
                    </div>
                    <div className="nmon-field">
                      <label className="nmon-label">Observaciones</label>
                      <input className="nmon-input" type="text" value={trat.observaciones}
                        onChange={(e) => handleTratChange(idx, 'observaciones', e.target.value)}
                        placeholder="Ej: Aplicar en la mañana" />
                    </div>
                    <div className="nmon-field-row">
                      <div className="nmon-field">
                        <label className="nmon-label">Dosis</label>
                        <input className="nmon-input" type="text" value={trat.dosis}
                          onChange={(e) => handleTratChange(idx, 'dosis', e.target.value)}
                          placeholder="Ej: 5 ml / L" />
                      </div>
                      <div className="nmon-field">
                        <label className="nmon-label">Cada cuánto</label>
                        <input className="nmon-input" type="text" value={trat.frecuencia}
                          onChange={(e) => handleTratChange(idx, 'frecuencia', e.target.value)}
                          placeholder="Ej: Cada 15 días" />
                      </div>
                      <div className="nmon-field">
                        <label className="nmon-label">Por cuánto tiempo</label>
                        <input className="nmon-input" type="text" value={trat.duracion}
                          onChange={(e) => handleTratChange(idx, 'duracion', e.target.value)}
                          placeholder="Ej: 3 meses" />
                      </div>
                    </div>
                  </div>
                  )
                })}
                {agregarTrat && (
                  <button type="button" className="nmon-btn nmon-btn--add-trat" onClick={agregarTratamiento}>
                    + Agregar otro tratamiento
                  </button>
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
          <span className="nmon-resumen-key">Roya</span>
          <span className="nmon-resumen-val">{tieneRoya ? 'Sí' : 'No'}</span>
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
            : <><BiCheck size={15} /> {isEditing ? 'Actualizar monitoreo' : 'Guardar monitoreo'}</>
          }
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MODAL PRINCIPAL
// ─────────────────────────────────────────────
export default function NuevoMonitoreoModal({ cultivo, finca, expertoId, userId, onGuardado, onClose, editMonitoreo }) {
  const isEditing = !!editMonitoreo
  const [paso,          setPaso]          = useState(1)
  const [fecha,         setFecha]         = useState(() => {
    if (editMonitoreo) {
      const f = editMonitoreo.fechaMonitoreo ?? editMonitoreo.fecha_monitoreo ?? ''
      return f.slice(0, 10)
    }
    return hoy()
  })
  const [fotos,         setFotos]         = useState([])
  const [observaciones, setObservaciones] = useState(() => editMonitoreo?.observaciones || '')
  const [nuevasObservaciones, setNuevasObservaciones] = useState('')
  const [tieneRoya,     setTieneRoya]     = useState(() => {
    if (editMonitoreo) return !!editMonitoreo.id_nivel_roya
    return null
  })
  const [idNivelRoya,   setIdNivelRoya]   = useState(() => {
    if (editMonitoreo) return editMonitoreo.id_nivel_roya ?? ''
    return ''
  })
  const [nivelesRoya,   setNivelesRoya]   = useState([])

  useEffect(() => {
    api.get('/cat_niveles_roya')
      .then((res) => setNivelesRoya(getArr(res.data)))
      .catch(() => setNivelesRoya([]))
  }, [])

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
              <h2 className="nmon-header-title">{isEditing ? 'Editar monitoreo' : 'Nuevo monitoreo'}</h2>
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
          {paso === 1 && <Paso1 cultivo={cultivo} finca={finca} fecha={fecha} setFecha={setFecha} onNext={next}
            tieneRoya={tieneRoya} setTieneRoya={setTieneRoya}
            idNivelRoya={idNivelRoya} setIdNivelRoya={setIdNivelRoya}
            nivelesRoya={nivelesRoya} />}
          {paso === 2 && <Paso2 fotos={fotos} setFotos={setFotos} onNext={next} onBack={back} />}
          {paso === 3 && <Paso3 observaciones={observaciones} setObservaciones={setObservaciones} onNext={next} onBack={back} isEditing={!!editMonitoreo} nuevasObservaciones={nuevasObservaciones} setNuevasObservaciones={setNuevasObservaciones} />}
          {paso === 4 && (
            <Paso4
              cultivo={cultivo} finca={finca} fecha={fecha}
              fotos={fotos} observaciones={observaciones}
              nuevasObservaciones={nuevasObservaciones}
              expertoId={expertoId} userId={userId}
              onGuardado={onGuardado} onBack={back}
              tieneRoya={tieneRoya} idNivelRoya={idNivelRoya}
              isEditing={isEditing}
              editMonitoreoId={editMonitoreo ? (editMonitoreo.idMonitoreo ?? editMonitoreo.id_monitoreo) : null}
              editMonitoreo={editMonitoreo}
              nivelesRoya={nivelesRoya}
            />
          )}
        </div>
      </div>
    </div>
  )
}