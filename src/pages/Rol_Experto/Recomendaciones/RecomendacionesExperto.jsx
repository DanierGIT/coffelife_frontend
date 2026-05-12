import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './RecomendacionesExperto.css'

const fmt = (v) => v ? new Date(v).toLocaleDateString('es-CO') : '—'

export default function RecomendacionesExperto() {
  const [recomendaciones, setRecomendaciones] = useState([])
  const [selected,        setSelected]        = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [saving,          setSaving]          = useState(false)
  const [success,         setSuccess]         = useState('')
  const [error,           setError]           = useState('')
  const [confirmando,     setConfirmando]     = useState(null)
  const [confForm,        setConfForm]        = useState({
    dosis_aplicada: '', frecuencia_aplicada: '', fecha_aplicacion: '', observaciones: '',
  })

  const load = async () => {
    try {
      const res = await api.get('/recomendaciones')
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setRecomendaciones(data)
      if (data.length > 0) setSelected(data[0])
    } catch {
      setError('No se pudieron cargar las recomendaciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleConfirmar = async (aplicado) => {
    if (!confirmando) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/aplicaciones_tratamientos', {
        id_recomendacion: confirmando.idRecomendacion,
        aplico: aplicado,
        ...confForm,
      })
      setSuccess(aplicado ? '✓ Confirmado: tratamiento aplicado.' : '✗ Registrado: tratamiento no aplicado.')
      setConfirmando(null)
      setConfForm({ dosis_aplicada: '', frecuencia_aplicada: '', fecha_aplicacion: '', observaciones: '' })
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar la confirmación.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rec-page">
      <div className="rec-header">
        <div>
          <h1>Recomendaciones</h1>
          <p>Gestión de recomendaciones enviadas a caficultores</p>
        </div>
      </div>

      {error   && <p className="rec-error">{error}</p>}
      {success && <p className="rec-success">{success}</p>}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Cargando…</p>
      ) : (
        <div className="rec-content">
          {/* Lista */}
          <div className="rec-list-panel">
            <h3>Recomendaciones enviadas</h3>
            {recomendaciones.length === 0 ? (
              <p className="rec-empty">No hay recomendaciones registradas.</p>
            ) : (
              recomendaciones.map(r => (
                <div
                  key={r.idRecomendacion}
                  className={`rec-item${selected?.idRecomendacion === r.idRecomendacion ? ' active' : ''}`}
                  onClick={() => setSelected(r)}
                >
                  <div className="rec-item-header">
                    <strong>{r.nombreFinca || `Finca #${r.idFinca}`}</strong>
                    <span className={`rec-badge ${r.aplicada ? 'aplicada' : 'pendiente'}`}>
                      {r.aplicada ? 'Aplicada' : 'Pendiente'}
                    </span>
                  </div>
                  <p>{r.nombreTratamiento || r.tratamiento?.nombre || '—'}</p>
                  <span>{fmt(r.fechaRecomendacion || r.created_at)}</span>
                </div>
              ))
            )}
          </div>

          {/* Detalle */}
          {selected && (
            <div className="rec-detail-panel">
              <div className="rec-detail-section">
                <h3>Recomendación enviada</h3>
                <div className="rec-detail-grid">
                  <div className="rec-detail-row"><span>Finca</span><strong>{selected.nombreFinca || `#${selected.idFinca}`}</strong></div>
                  <div className="rec-detail-row"><span>Producto</span><strong>{selected.nombreTratamiento || selected.tratamiento?.nombre || '—'}</strong></div>
                  <div className="rec-detail-row"><span>Dosis recomendada</span><strong>{selected.dosis || '—'}</strong></div>
                  <div className="rec-detail-row"><span>Frecuencia</span><strong>{selected.frecuencia || '—'}</strong></div>
                  <div className="rec-detail-row"><span>Fecha límite</span><strong>{fmt(selected.fechaLimite)}</strong></div>
                  <div className="rec-detail-row"><span>Prioridad</span>
                    <strong className={`rec-prioridad ${(selected.prioridad || '').toLowerCase()}`}>{selected.prioridad || '—'}</strong>
                  </div>
                  {selected.notas && <div className="rec-detail-row full"><span>Notas</span><strong>{selected.notas}</strong></div>}
                </div>
              </div>

              {/* Confirmación del caficultor */}
              {selected.aplicada !== null && selected.aplicada !== undefined ? (
                <div className="rec-aplicacion-section">
                  <h3>Confirmación del caficultor</h3>
                  <div className="rec-detail-grid">
                    <div className="rec-detail-row"><span>¿Aplicó?</span>
                      <strong className={selected.aplicada ? 'verde' : 'rojo'}>{selected.aplicada ? '✓ Sí, aplicó el tratamiento' : '✗ No aplicó el tratamiento'}</strong>
                    </div>
                    {selected.dosisAplicada && <div className="rec-detail-row"><span>Dosis aplicada</span><strong>{selected.dosisAplicada}</strong></div>}
                    {selected.frecuenciaAplicada && <div className="rec-detail-row"><span>Frecuencia aplicada</span><strong>{selected.frecuenciaAplicada}</strong></div>}
                    {selected.fechaAplicacion && <div className="rec-detail-row"><span>Fecha de aplicación</span><strong>{fmt(selected.fechaAplicacion)}</strong></div>}
                    {selected.observacionesAplicacion && <div className="rec-detail-row full"><span>Observaciones</span><strong>{selected.observacionesAplicacion}</strong></div>}
                  </div>
                </div>
              ) : (
                <div className="rec-confirmar-section">
                  <h3>Registrar confirmación</h3>
                  <div className="rec-confirm-form">
                    <div className="rec-form-row">
                      <label>Dosis aplicada (L/ha)
                        <input value={confForm.dosis_aplicada} onChange={e => setConfForm(f => ({ ...f, dosis_aplicada: e.target.value }))} placeholder="0.8" />
                      </label>
                      <label>Frecuencia aplicada
                        <input value={confForm.frecuencia_aplicada} onChange={e => setConfForm(f => ({ ...f, frecuencia_aplicada: e.target.value }))} placeholder="Cada 15 días" />
                      </label>
                    </div>
                    <label>Fecha de aplicación
                      <input type="date" value={confForm.fecha_aplicacion} onChange={e => setConfForm(f => ({ ...f, fecha_aplicacion: e.target.value }))} />
                    </label>
                    <label>Observaciones (opcionales)
                      <textarea rows={2} value={confForm.observaciones} onChange={e => setConfForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Se aplicó en la mañana con buen clima…" />
                    </label>
                    <div className="rec-confirm-actions">
                      <button
                        className="btn-si"
                        onClick={() => { setConfirmando(selected); handleConfirmar(true) }}
                        disabled={saving}
                      >
                        ✓ Sí, apliqué el tratamiento
                      </button>
                      <button
                        className="btn-no"
                        onClick={() => { setConfirmando(selected); handleConfirmar(false) }}
                        disabled={saving}
                      >
                        ✗ No apliqué el tratamiento
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <p className="rec-footer">Datos utilizados: recomendaciones, recomendacion_tratamientos, aplicaciones_tratamientos</p>
    </div>
  )
}
