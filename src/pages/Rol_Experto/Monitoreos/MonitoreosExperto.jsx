import { useEffect, useState } from 'react'
import { BiCalendar, BiImage, BiShow, BiX, BiMessageDetail, BiCheck, BiAlarm, BiHistory, BiChevronDown } from 'react-icons/bi'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import NuevoMonitoreoModal, { esMonitoreoHistorico } from './NuevoMonitoreoModal'
import './MonitoreosExperto.css'
import Loading from '../../../components/Loading'
import '../../../components/cargando.css'
import { useNotificaciones } from '../../../hooks/useNotificaciones'

const fmt = (d) => {
  if (!d) return '—'
  const dt = new Date(d + (d.includes('T') ? '' : 'T12:00:00'))
  return isNaN(dt) ? '—' : dt.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Bogota' })
}

const fmtDatetime = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt) ? '—' : dt.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })
}

function ultimaObservacion(obs = '') {
  const { texto } = parsearHistorialDeObservaciones(obs)
  const lineas = texto.split('\n')
  let ultimoSep = -1
  for (let i = 0; i < lineas.length; i++) {
    if (/^---\s*\d{4}-\d{2}-\d{2}\s*---$/.test(lineas[i].trim())) {
      ultimoSep = i
    }
  }
  if (ultimoSep >= 0) {
    return lineas.slice(ultimoSep + 1).join('\n').trim()
  }
  return texto.trim()
}

function parsearHistorialDeObservaciones(obs = '') {
  const lineas = obs.split('\n')
  const entradas = []
  let textoReal = []
  let dentroDeEntrada = false
  let entradaActual = []

  for (const linea of lineas) {
    if (linea.startsWith('[HISTORIAL — Monitoreo #')) {
      if (entradaActual.length > 0) {
        entradas.push(entradaActual.join('\n'))
        entradaActual = []
      }
      dentroDeEntrada = true
      entradaActual.push(linea)
    } else if (dentroDeEntrada) {
      // Seguir acumulando hasta encontrar [ROYA: o texto normal (no metadata)
      if (linea.startsWith('[ROYA:') || (linea.trim() && !linea.startsWith('Fecha ') &&
          !linea.startsWith('Nivel ') && !linea.startsWith('Observaciones ') &&
          !linea.startsWith('Fotos ') && !linea.startsWith('Recomendaci') &&
          !linea.startsWith('Tipo:') && !linea.startsWith('Prioridad:') &&
          !linea.startsWith('Descripci') && !linea.startsWith('Fecha l') &&
          !linea.startsWith('Tratamiento') && !/^\s+\d+\./.test(linea) &&
          !linea.startsWith('  -'))) {
        // Fin del bloque de historial, comienza el texto real
        if (entradaActual.length > 0) {
          entradas.push(entradaActual.join('\n'))
        }
        dentroDeEntrada = false
        textoReal.push(linea)
      } else {
        entradaActual.push(linea)
      }
    } else {
      textoReal.push(linea)
    }
  }
  if (entradaActual.length > 0) {
    entradas.push(entradaActual.join('\n'))
  }

  // Limpiar texto real: quitar ═══, prefijo [ROYA:...] y separadores ---
  const texto = textoReal.join('\n')
    .replace(/^\[ROYA:[^\]]+\]\n*/, '')
    .split('\n')
    .filter(l => !l.startsWith('═'))
    .join('\n')
    .trim()

  return { texto, entradas }
}

function parsearObservacionesHistorico(obs = '') {
  const lineas = obs.split('\n')
  const texto = []
  const fotos = []
  let enFotos = false

  for (const linea of lineas) {
    if (linea === 'Fotos registradas:') {
      enFotos = true
      continue
    }
    if (enFotos) {
      const trimmed = linea.trimStart()
      const dotIdx = trimmed.indexOf('. ')
      if (dotIdx > 0 && /^\d+$/.test(trimmed.slice(0, dotIdx))) {
        fotos.push(trimmed.slice(dotIdx + 2))
        continue
      }
      if (linea.trim() !== '') {
        enFotos = false
      } else {
        continue
      }
    }
    texto.push(linea)
  }

  const textoLimpio = texto
    .join('\n')
    .replace('[HISTORIAL — Monitoreo #', '')
    .replace(/\d+/, '')
    .trim()

  return { texto: textoLimpio, fotos }
}

function HistorialItem({ textoHistorico, idx }) {
  const [expandido, setExpandido] = useState(false)
  const { texto, fotos } = parsearObservacionesHistorico(textoHistorico)
  const headerMatch = textoHistorico.match(/HISTORIAL.*Guardado el (.*?) por (.*?)\]/)
  const guardadoEl = headerMatch ? headerMatch[1] : '—'
  const autor = headerMatch ? headerMatch[2] : '—'

  return (
    <div className="mon-detalle-rec-card" style={{ marginBottom: 10 }}>
      <button
        type="button"
        className="mon-detalle-rec-header"
        onClick={() => setExpandido(!expandido)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <BiHistory size={14} />
        <span>Versión anterior {idx + 1}</span>
        <span className="mon-detalle-rec-version">{guardadoEl}</span>
        <BiChevronDown size={16} style={{ marginLeft: 'auto', transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
      </button>
      {expandido && (
        <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '0 0 8px 8px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280' }}>
            Guardado por: <strong>{autor}</strong>
          </p>
          {texto && (
            <div className="mon-detalle-value" style={{ whiteSpace: 'pre-line', fontSize: 13, lineHeight: 1.5 }}>
              {texto}
            </div>
          )}
          {fotos.length > 0 && (
            <div className="mon-detalle-fotos" style={{ marginTop: texto ? 12 : 0 }}>
              <span className="mon-detalle-label">Fotos de esta versión ({fotos.length})</span>
              <div className="mon-detalle-fotos-grid">
                {fotos.map((url, i) => (
                  <img key={i} src={url} alt={`Foto histórica ${i+1}`} className="mon-detalle-foto" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getArr(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

function parsearObservacionAplicacion(obsCruda = '') {
  // Formato: [Insumo|Dosis|Frecuencia|Duracion] texto observacion
  const match = obsCruda.match(/^\[([^|]*)(?:\|([^|]*))?(?:\|([^|]*))?(?:\|([^|]*))?\]\s*/)
  if (!match) {
    return { insumo: 'No especificado', dosis: '', frecuencia: '', duracion: '', texto: obsCruda }
  }
  return {
    insumo: match[1] || 'No especificado',
    dosis: match[2] || '',
    frecuencia: match[3] || '',
    duracion: match[4] || '',
    texto: obsCruda.slice(match[0].length).trim(),
  }
}

function resolverAplicaciones(recomendacion, tratamientosCat = [], insumosCat = [], aplicacionesMonitoreo = []) {
  const aplicaciones = []

  const buscarTratamiento = (id) =>
    id ? tratamientosCat.find((tr) => Number(tr?.idTratamiento ?? tr?.id_tratamiento) === Number(id)) : null
  const buscarInsumo = (id) =>
    id ? insumosCat.find((ins) => Number(ins?.idInsumo ?? ins?.id_insumo) === Number(id)) : null

  // Caso 1: array tratamientos con aplicacion anidada
  if (Array.isArray(recomendacion?.tratamientos)) {
    recomendacion.tratamientos.forEach((t) => {
      const apl = t?.aplicacion || t
      const trat = apl?.tratamiento || {}
      const obsCruda = apl?.observacion || apl?.observaciones || ''
      const parsed = parsearObservacionAplicacion(obsCruda)

      aplicaciones.push({
        nombreTratamiento: trat?.nombre || trat?.nombreTratamiento || (apl?.id_tratamiento ? `Tratamiento #${apl.id_tratamiento}` : 'Tratamiento'),
        nombreInsumo: parsed.insumo,
        dosis: parsed.dosis,
        frecuencia: parsed.frecuencia,
        duracion: parsed.duracion,
        observacion: parsed.texto,
        fechaAplicacion: apl?.fecha_aplicacion || apl?.fechaAplicacion || apl?.fechaAplicacion || null,
      })
    })
  }

  // Caso 2: array aplicaciones directas
  if (Array.isArray(recomendacion?.aplicaciones)) {
    recomendacion.aplicaciones.forEach((apl) => {
      const trat = apl?.tratamiento || {}
      const obsCruda = apl?.observacion || apl?.observaciones || ''
      const parsed = parsearObservacionAplicacion(obsCruda)

      aplicaciones.push({
        nombreTratamiento: trat?.nombre || trat?.nombreTratamiento || (apl?.id_tratamiento ? `Tratamiento #${apl.id_tratamiento}` : 'Tratamiento'),
        nombreInsumo: parsed.insumo,
        dosis: parsed.dosis,
        frecuencia: parsed.frecuencia,
        duracion: parsed.duracion,
        observacion: parsed.texto,
        fechaAplicacion: apl?.fecha_aplicacion || apl?.fechaAplicacion || null,
      })
    })
  }

  // Caso 3: los datos estan en aplicaciones_tratamientos (tabla separada).
  // Unimos por id_recomendacion (el campo que tiene cada aplicacion).
  if (aplicaciones.length === 0 && aplicacionesMonitoreo.length > 0) {
    const recId = recomendacion?.idRecomendacion ?? recomendacion?.id_recomendacion
    let aplsFiltradas

    if (recId) {
      aplsFiltradas = aplicacionesMonitoreo.filter(
        (a) => Number(a.idRecomendacion ?? a.id_recomendacion) === Number(recId)
      )
    }

    // Fallback: si no hay recId o no hay aplicaciones con ese id, filtrar por nombre del tratamiento
    if (!aplsFiltradas || aplsFiltradas.length === 0) {
      const recoTratNombre = recomendacion?.tratamiento
      if (recoTratNombre) {
        const tratEncontrado = tratamientosCat.find(
          (tr) => (tr?.nombre || '').toLowerCase().trim() === recoTratNombre.toLowerCase().trim()
        )
        if (tratEncontrado) {
          const idTrat = Number(tratEncontrado.idTratamiento ?? tratEncontrado.id_tratamiento)
          aplsFiltradas = aplicacionesMonitoreo.filter((a) => Number(a.idTratamiento ?? a.id_tratamiento) === idTrat)
        }
      }
    }

    // Si aun no hay resultados, mostrar datos del catalogo de tratamientos
    if (!aplsFiltradas || aplsFiltradas.length === 0) {
      const recoTratNombre = recomendacion?.tratamiento
      if (recoTratNombre) {
        const tratEncontrado = tratamientosCat.find(
          (tr) => (tr?.nombre || '').toLowerCase().trim() === recoTratNombre.toLowerCase().trim()
        )
        if (tratEncontrado) {
          aplicaciones.push({
            nombreTratamiento: tratEncontrado.nombre,
            nombreInsumo: 'No especificado',
            dosis: '',
            frecuencia: '',
            duracion: '',
            observacion: '',
            fechaAplicacion: null,
          })
        }
      }
      return aplicaciones
    }

    // Ordenar por idAplicacion DESC y deduplicar por id_tratamiento
    const aplsUnicas = []
    const vistos = new Set()
    aplsFiltradas
      .sort((a, b) => (b?.idAplicacion || 0) - (a?.idAplicacion || 0))
      .forEach((apl) => {
        const tid = apl?.idTratamiento || apl?.id_tratamiento
        if (!vistos.has(tid)) {
          vistos.add(tid)
          aplsUnicas.push(apl)
        }
      })

    aplsUnicas.forEach((apl) => {
      const trat = apl?.tratamiento || {}
      const obsCruda = apl?.observacion || ''
      const parsed = parsearObservacionAplicacion(obsCruda)

      aplicaciones.push({
        nombreTratamiento: trat?.nombre || trat?.nombreTratamiento || `Tratamiento #${apl?.idTratamiento}`,
        nombreInsumo: parsed.insumo,
        dosis: parsed.dosis,
        frecuencia: parsed.frecuencia,
        duracion: parsed.duracion,
        observacion: parsed.texto,
        fechaAplicacion: apl?.fechaAplicacion || null,
      })
    })
  }

  // Caso 4 (fallback): la recomendacion trae los datos directamente
  // (idTratamiento, idInsumo, dosis, etc.). Solo si no se encontraron
  // aplicaciones reales por las vias anteriores.
  if (aplicaciones.length === 0) {
    const idTrat = recomendacion?.id_tratamiento ?? recomendacion?.idTratamiento ?? recomendacion?.id_tratamiento_recomendacion
    const trat = buscarTratamiento(idTrat)

    if (idTrat) {
      aplicaciones.push({
        nombreTratamiento: recomendacion?.tratamiento?.nombre || recomendacion?.nombreTratamiento || trat?.nombre || trat?.nombreTratamiento || `Tratamiento #${idTrat}`,
        nombreInsumo: 'No especificado',
        dosis: '',
        frecuencia: '',
        duracion: '',
        observacion: '',
        fechaAplicacion: null,
      })
    }
  }

  return aplicaciones
}

function limpiarPrefijoRoya(obs) {
  let text = obs || ''
  let idx
  while ((idx = text.indexOf('[ROYA:')) !== -1) {
    const endIdx = text.indexOf(']\n', idx)
    if (endIdx !== -1) {
      text = text.slice(0, idx) + text.slice(endIdx + 2)
    } else {
      const endIdx2 = text.indexOf(']', idx)
      if (endIdx2 !== -1) {
        text = text.slice(0, idx) + text.slice(endIdx2 + 1)
      } else {
        break
      }
    }
  }
  return text
}

function DetalleMonitoreoModal({ monitoreo, onBack, onEditar, cultivo }) {
  const fotos = Array.isArray(monitoreo.imagenes) ? monitoreo.imagenes : []
  const [recs, setRecs] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(true)
  const [historialExpandido, setHistorialExpandido] = useState(false)
  const [tratamientosCat, setTratamientosCat] = useState([])
  const [insumosCat, setInsumosCat] = useState([])
  const [aplicaciones, setAplicaciones] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/tratamientos', { params: { limit: 1000 } }).then((r) => setTratamientosCat(getArr(r.data))).catch(() => []),
      api.get('/insumos').then((r) => setInsumosCat(getArr(r.data))).catch(() => []),
    ])
  }, [])

  useEffect(() => {
    const id = monitoreo.idMonitoreo ?? monitoreo.id_monitoreo
    if (!id) { setLoadingRecs(false); return }
    setLoadingRecs(true)

    Promise.all([
      api.get('/recomendaciones', { params: { limit: 1000 } }).then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
        return data.filter((r) => {
          const rid = r.idMonitoreo ?? r.id_monitoreo ?? r.idMonitoreoFk ?? r.id_monitoreo_fk
          return Number(rid) === Number(id)
        })
      }).catch(() => []),
      api.get('/aplicaciones_tratamientos', { params: { limit: 1000 } }).then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
        return data
      }).catch(() => []),
    ])
      .then(([recsData, aplsData]) => {
        setRecs(recsData)
        setAplicaciones(aplsData)
      })
      .catch(() => {
        setRecs([])
        setAplicaciones([])
      })
      .finally(() => setLoadingRecs(false))
  }, [monitoreo])

  const historial = parsearHistorialDeObservaciones(monitoreo.observaciones || '').entradas

  return (
    <div className="mon-detalle-overlay" onClick={onBack}>
      <div className="mon-detalle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mon-detalle-header">
          <h3>Detalle del monitoreo</h3>
          <button className="mon-detalle-close" onClick={onBack}><BiX size={20} /></button>
        </div>
        <div className="mon-detalle-body">
          <div className="mon-detalle-row">
            <span className="mon-detalle-label">Fecha</span>
            <span className="mon-detalle-value">{fmt(monitoreo.fechaMonitoreo ?? monitoreo.fecha_monitoreo)}</span>
            {(monitoreo.observaciones || '').includes('HISTORIAL DE CAMBIOS') && <span className="editado-badge">Editado</span>}
          </div>
          <div className="mon-detalle-row">
            <span className="mon-detalle-label">Experto</span>
            <span className="mon-detalle-value">
              {monitoreo.usuario ? `${monitoreo.usuario.nombre || ''} ${monitoreo.usuario.apellido || ''}`.trim() : '—'}
            </span>
          </div>
          <div className="mon-detalle-row">
            <span className="mon-detalle-label">Observaciones</span>
            <span className="mon-detalle-value" style={{ whiteSpace: 'pre-line' }}>{ultimaObservacion(monitoreo.observaciones) || '—'}</span>
          </div>
          <div className="mon-detalle-row">
            <span className="mon-detalle-label">Registrado</span>
            <span className="mon-detalle-value">{fmtDatetime(monitoreo.fechaRegistro ?? monitoreo.fecha_registro)}</span>
          </div>

          {(() => {
            const fotosHist = {}
            historial.forEach((entry, i) => {
              const { fotos: fotosEntry } = parsearObservacionesHistorico(entry)
              if (fotosEntry.length > 0) {
                fotosHist[i] = fotosEntry
              }
            })
            const todasFotosHist = Object.values(fotosHist).flat().map(u => u.trim())
            const urlFoto = (f) => ((f?.rutaImagen || f?.url || f?.fotoUrl || (typeof f === 'string' ? f : '')) + '').trim()
            const fotosNuevas = fotos.filter((f) => !todasFotosHist.includes(urlFoto(f)))
            const tieneFotos = fotos.length > 0 || Object.keys(fotosHist).length > 0
            if (!tieneFotos) return null
            return (
              <div className="mon-detalle-fotos">
                {fotosNuevas.length > 0 && (
                  <>
                    <span className="mon-detalle-label">Fotos ({fotosNuevas.length})</span>
                    <div className="mon-detalle-fotos-grid">
                      {fotosNuevas.map((f, i) => (
                        <img key={i} src={urlFoto(f)} alt={`Foto ${i+1}`} className="mon-detalle-foto" />
                      ))}
                    </div>
                  </>
                )}
                {Object.keys(fotosHist).length > 0 && (
                  <div style={{ marginTop: fotosNuevas.length > 0 ? 16 : 0 }}>
                    <span className="mon-detalle-label" style={{ marginBottom: 8, display: 'block' }}>
                      Imágenes anteriores ({todasFotosHist.length})
                    </span>
                    {Object.entries(fotosHist).map(([vIdx, urls]) => (
                      <div key={vIdx} style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>Versión {Number(vIdx) + 1}</span>
                        <div className="mon-detalle-fotos-grid" style={{ marginTop: 4 }}>
                          {urls.map((url, i) => (
                            <img key={i} src={url} alt={`Histórica v${Number(vIdx)+1}-${i+1}`} className="mon-detalle-foto" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Recomendaciones y tratamientos */}
          <div className="mon-detalle-section">
            <span className="mon-detalle-label">
              <BiMessageDetail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Recomendaciones y tratamientos
              {recs.length > 1 && <span style={{ color: '#2f7d32', marginLeft: 6 }}>({recs.length} registros)</span>}
            </span>
            {loadingRecs ? (
              <Loading type="inline" text="Cargando..." />
            ) : recs.length === 0 ? (
              <p className="mon-detalle-empty">No hay recomendaciones asociadas a este monitoreo.</p>
            ) : (
              <div className="mon-detalle-recs-list">
                {recs.map((r, idx) => {
                  const aplicacionesResueltas = resolverAplicaciones(r, tratamientosCat, insumosCat, aplicaciones)
                  return (
                    <div key={r.idRecomendacion ?? r.id_recomendacion} className="mon-detalle-rec-card">
                      <div className="mon-detalle-rec-header">
                        <BiCheck size={14} />
                        <span>{r.tipo?.nombreTipo || r.tipo?.nombre || 'Recomendación'}</span>
                        {r.prioridad?.nombre && (
                          <span className="mon-detalle-rec-prio">{r.prioridad.nombre}</span>
                        )}
                        {recs.length > 1 && (
                          <span className="mon-detalle-rec-version">V{idx + 1}</span>
                        )}
                      </div>

                      <p className="mon-detalle-rec-desc">{r.descripcion || 'Sin descripción'}</p>

                      {r.fechaLimite && (
                        <div className="mon-detalle-rec-meta">
                          <BiAlarm size={12} />
                          <span>Fecha de la recomendación: {fmt(r.fechaLimite)}</span>
                        </div>
                      )}

                      {aplicacionesResueltas.length > 0 ? (
                        <div className="mon-detalle-trats">
                          <span className="mon-detalle-trat-label">Tratamiento indicado:</span>
                                {aplicacionesResueltas.map((apl, i) => {
                                  const tieneDatos = apl.nombreInsumo && apl.nombreInsumo !== 'No especificado'
                                  const tieneCampos = tieneDatos || apl.dosis || apl.frecuencia || apl.duracion || apl.fechaAplicacion
                                  return (
                            <div
                              key={i}
                              className="mon-detalle-trat-item"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '6px 12px',
                                padding: '10px 12px',
                                background: '#f9fafb',
                                borderRadius: 8,
                                marginTop: 8,
                              }}
                            >
                              <div style={{ gridColumnStart: 1, gridColumnEnd: -1 }}>
                                <span style={{ fontWeight: 700, color: '#1b5e20', fontSize: 13 }}>{apl.nombreTratamiento}</span>
                              </div>
                              {tieneDatos && (
                                <div>
                                  <span style={{ color: '#6b7280', fontSize: 12 }}>Insumo:</span>
                                  <div style={{ fontSize: 13, color: '#111827' }}>{apl.nombreInsumo}</div>
                                </div>
                              )}
                              {apl.dosis && (
                                <div>
                                  <span style={{ color: '#6b7280', fontSize: 12 }}>Dosis:</span>
                                  <div style={{ fontSize: 13, color: '#111827' }}>{apl.dosis}</div>
                                </div>
                              )}
                              {apl.frecuencia && (
                                <div>
                                  <span style={{ color: '#6b7280', fontSize: 12 }}>Frecuencia:</span>
                                  <div style={{ fontSize: 13, color: '#111827' }}>{apl.frecuencia}</div>
                                </div>
                              )}
                              {apl.duracion && (
                                <div>
                                  <span style={{ color: '#6b7280', fontSize: 12 }}>Duración:</span>
                                  <div style={{ fontSize: 13, color: '#111827' }}>{apl.duracion}</div>
                                </div>
                              )}
                              {apl.fechaAplicacion && (
                                <div>
                                  <span style={{ color: '#6b7280', fontSize: 12 }}>Aplicado:</span>
                                  <div style={{ fontSize: 13, color: '#111827' }}>{fmt(apl.fechaAplicacion)}</div>
                                </div>
                              )}
                              {apl.observacion && !tieneCampos && (
                                <div style={{ gridColumnStart: 1, gridColumnEnd: -1 }}>
                                  <div style={{ fontSize: 13, color: '#111827', whiteSpace: 'pre-line' }}>{apl.observacion}</div>
                                </div>
                              )}
                              {apl.observacion && tieneCampos && (
                              <div style={{ gridColumnStart: 1, gridColumnEnd: -1 }}>
                                  <span style={{ color: '#6b7280', fontSize: 12 }}>Observación:</span>
                                  <div style={{ fontSize: 13, color: '#111827', whiteSpace: 'pre-line' }}>{apl.observacion}</div>
                                </div>
                              )}
                            </div>
                                  )
                                })}
                        </div>
                      ) : (
                        <div className="mon-detalle-trats">
                          <span className="mon-detalle-trat-label">Tratamiento:</span>
                          <div
                            style={{
                              padding: '10px 12px',
                              background: '#f9fafb',
                              borderRadius: 8,
                              marginTop: 8,
                              fontSize: 13,
                              color: '#6b7280',
                            }}
                          >
                            No se encontraron datos del tratamiento.
                          </div>
                        </div>
                      )}
                </div>
              )
            })}
          </div>
          )}
        </div>

          {/* Historial de versiones */}
          {historial.length > 0 && (
            <div className="mon-detalle-section">
              <button
                type="button"
                className="mon-detalle-label"
                onClick={() => setHistorialExpandido(!historialExpandido)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                <BiHistory size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Historial de versiones
                <span style={{ color: '#2f7d32', marginLeft: 6 }}>({historial.length})</span>
                <BiChevronDown size={16} style={{ marginLeft: 'auto', transform: historialExpandido ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
              </button>
              {historialExpandido && (
                <div className="mon-detalle-recs-list" style={{ marginTop: 10 }}>
                  {historial.map((texto, idx) => (
                    <HistorialItem key={idx} textoHistorico={texto} idx={idx} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mon-detalle-actions">
          <button className="mon-detalle-btn mon-detalle-btn--primary" onClick={() => onEditar(monitoreo)}>
            <BiCheck size={14} style={{ marginRight: 6 }} />
            Editar monitoreo
          </button>
          <button className="mon-detalle-btn" onClick={onBack}>
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MonitoreosExperto({ cultivo, finca, showNuevoModal, onCloseNuevoModal }) {
  const { user } = useAuth()
  const expertoId = user?.idUsuario ?? user?.id ?? null
  const userId    = user?.idUsuario ?? user?.id ?? null

  const [monitoreos, setMonitoreos] = useState([])
  const [loading,    setLoading]    = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [detalle,    setDetalle]    = useState(null)
  const [editMonitoreo, setEditMonitoreo] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const ITEMS_POR_PAGINA = 10

  const notificacionKey = useNotificaciones(userId)

  const modalAbierto = showNuevoModal || showModal || editMonitoreo
  const cerrarModal = () => {
    setShowModal(false)
    setEditMonitoreo(null)
    onCloseNuevoModal?.()
  }

function colorRoya(monitoreo) {
  const obs = monitoreo.observaciones || ''
  // Buscar el ULTIMO [ROYA:NIVEL] (el mas reciente)
  let idx = -1
  let pos = -1
  let nombre = ''
  let searchFrom = 0
  while ((pos = obs.indexOf('[ROYA:', searchFrom)) !== -1) {
    idx = pos
    searchFrom = pos + 1
  }
  if (idx === -1) return '#9ca3af'
  const endIdx = obs.indexOf(']', idx + 6)
  nombre = (endIdx > idx ? obs.slice(idx + 6, endIdx) : '').toLowerCase()
  if (nombre.includes('critico')) return '#991b1b'
  if (nombre.includes('alto')) return '#dc2626'
  if (nombre.includes('medio')) return '#d97706'
  if (nombre.includes('bajo')) return '#2e7d32'
  return '#9ca3af'
}

function textoRoya(monitoreo) {
  const obs = monitoreo.observaciones || ''
  // Buscar el ULTIMO [ROYA:NIVEL]
  let idx = -1
  let pos = -1
  let searchFrom = 0
  while ((pos = obs.indexOf('[ROYA:', searchFrom)) !== -1) {
    idx = pos
    searchFrom = pos + 1
  }
  if (idx === -1) return 'Sin roya'
  const endIdx = obs.indexOf(']', idx + 6)
  return endIdx > idx ? obs.slice(idx + 6, endIdx) : 'Sin roya'
}

  const fetchMonitoreos = async () => {
    setLoading(true)
    try {
      const params = { limit: 1000 }
      if (cultivo?.idCultivo) params.id_cultivo = cultivo.idCultivo
      const res  = await api.get('/monitoreos', { params })
      const body = res.data?.data ?? res.data
      const data = Array.isArray(body) ? body : []
      const filtrados = data
        .filter((m) => {
          if (!cultivo?.idCultivo) return !esMonitoreoHistorico(m)
          const id = Number(m.idCultivo ?? m.id_cultivo)
          return id === Number(cultivo.idCultivo) && !esMonitoreoHistorico(m)
        })
        .sort((a, b) => new Date(b.fechaMonitoreo ?? b.fecha_monitoreo) - new Date(a.fechaMonitoreo ?? a.fecha_monitoreo))
      setMonitoreos(filtrados)
      setTotalPaginas(Math.max(1, Math.ceil(filtrados.length / ITEMS_POR_PAGINA)))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const monitoreosPagina = monitoreos.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA)

  const irPagina = (p) => {
    if (p < 1 || p > totalPaginas) return
    console.log('irPagina', { p, totalPaginas, monitoreosLength: monitoreos.length, slice: monitoreos.slice((p - 1) * ITEMS_POR_PAGINA, p * ITEMS_POR_PAGINA).length })
    setPagina(p)
  }

  useEffect(() => { fetchMonitoreos(); setPagina(1) }, [cultivo?.idCultivo, notificacionKey])

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1)
  }, [pagina, totalPaginas])

  return (
    <div className="monitoreo-list-page">
      <div className="list-topbar">
        <div>
          <h2 style={{ fontSize: 20, margin: 0 }}>Monitoreos registrados</h2>
        </div>
      </div>

      {loading ? (
        <Loading type="content" text="Cargando monitoreos..." />
      ) : monitoreos.length === 0 ? (
        <div className="empty-state">No hay monitoreos registrados.</div>
      ) : monitoreosPagina.length === 0 ? (
        <div className="empty-state">No hay monitoreos en esta página.</div>
      ) : (
        <div className="monitor-grid-sm">
          {monitoreosPagina.map((m, idx) => {
            try {
              const mid = m.idMonitoreo ?? m.id_monitoreo ?? `mon-${idx}`
              const fotos = Array.isArray(m.imagenes) ? m.imagenes : []
              const color = colorRoya(m)
              return (
                <div
                  key={mid}
                  className="monitor-card-sm"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <div className="monitor-card-sm-top">
                    <div className="monitor-card-sm-date">
                      <BiCalendar size={14} />
                      {fmt(m.fechaMonitoreo ?? m.fecha_monitoreo)}
                      {(m.observaciones || '').includes('HISTORIAL DE CAMBIOS') && <span className="editado-badge">Editado</span>}
                    </div>
                    <span
                      className="monitor-card-sm-date"
                      style={{ color, fontWeight: 600, fontSize: 11 }}
                    >
                      {textoRoya(m)}
                    </span>
                    <button className="monitor-card-sm-eye" onClick={() => setDetalle(m)} title="Ver detalle">
                      <BiShow size={18} />
                    </button>
                  </div>
                  <p className="monitor-card-sm-obs">
                    {(() => {
                      const obs = ultimaObservacion(m.observaciones)
                      return obs.length > 80 ? obs.slice(0, 80) + '...' : (obs || 'Sin observaciones')
                    })()}
                  </p>
                  <div className="monitor-card-sm-footer">
                    <BiImage size={14} />
                    {fotos.length} foto{fotos.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            } catch (e) {
              console.error('Error al renderizar monitoreo', m?.idMonitoreo ?? m?.id_monitoreo, e)
              return <div key={`err-${idx}`} className="monitor-card-sm" style={{ borderLeft: '4px solid #9ca3af', opacity: 0.5 }}><p style={{ padding: 12, fontSize: 12, color: '#999' }}>Error al cargar este monitoreo</p></div>
            }
          })}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="pagination">
          <button disabled={pagina <= 1} onClick={() => irPagina(pagina - 1)}>Anterior</button>
          {Array.from({ length: totalPaginas }, (_, i) => (
            <button key={i + 1} className={pagina === i + 1 ? 'active' : ''} onClick={() => irPagina(i + 1)}>{i + 1}</button>
          ))}
          <button disabled={pagina >= totalPaginas} onClick={() => irPagina(pagina + 1)}>Siguiente</button>
        </div>
      )}

      {modalAbierto && (
        <NuevoMonitoreoModal
          cultivo={cultivo}
          finca={finca}
          expertoId={expertoId}
          userId={userId}
          editMonitoreo={editMonitoreo}
          onGuardado={() => {
            cerrarModal()
            fetchMonitoreos()
          }}
          onClose={cerrarModal}
        />
      )}

      {detalle && (
        <DetalleMonitoreoModal
          monitoreo={detalle}
          cultivo={cultivo}
          onBack={() => setDetalle(null)}
          onEditar={(m) => {
            setEditMonitoreo(m)
            setDetalle(null)
            setShowModal(true)
          }}
        />
      )}
    </div>
  )
}
