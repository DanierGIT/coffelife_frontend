import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './TratamientosExperto.css'

export default function TratamientosExperto() {
  const [monitoreos,   setMonitoreos]   = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [selected,     setSelected]     = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [success,      setSuccess]      = useState('')
  const [error,        setError]        = useState('')

  const [form, setForm] = useState({
    id_monitoreo:   '',
    id_tratamiento: '',
    producto:        '',
    dosis:           '',
    frecuencia:      '',
    fecha_limite:    '',
    hora_recomendada:'',
    notas:           '',
    prioridad:       'Alta',
  })

  useEffect(() => {
    Promise.allSettled([
      api.get('/monitoreos'),
      api.get('/tratamientos'),
    ]).then(([mRes, tRes]) => {
      const m = mRes.status === 'fulfilled'
        ? (Array.isArray(mRes.value.data) ? mRes.value.data : mRes.value.data?.data ?? [])
        : []
      const t = tRes.status === 'fulfilled'
        ? (Array.isArray(tRes.value.data) ? tRes.value.data : tRes.value.data?.data ?? [])
        : []
      setMonitoreos(m)
      setTratamientos(t)
      if (m.length > 0) {
        setSelected(m[0])
        setForm(f => ({ ...f, id_monitoreo: m[0].idMonitoreo }))
      }
    }).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/recomendaciones', {
        id_monitoreo:   form.id_monitoreo,
        id_tratamiento: form.id_tratamiento,
        notas:           form.notas,
        prioridad:       form.prioridad,
        fecha_limite:    form.fecha_limite,
      })
      setSuccess('Recomendación enviada exitosamente.')
      setForm(f => ({ ...f, notas: '', fecha_limite: '', prioridad: 'Alta' }))
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo enviar la recomendación.')
    } finally {
      setSaving(false)
    }
  }

  const selMon = selected || monitoreos[0]

  return (
    <div className="trat-page">
      <div className="trat-header">
        <div>
          <h1>Asignar tratamiento</h1>
          <p>Crea una recomendación para el monitoreo seleccionado</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Cargando…</p>
      ) : (
        <div className="trat-content">
          {/* Panel izquierdo: selección de monitoreo */}
          <div className="trat-mon-panel">
            <h3>Información del monitoreo</h3>
            {monitoreos.length === 0 ? (
              <p className="trat-empty">No hay monitoreos disponibles.</p>
            ) : (
              <>
                <div className="trat-mon-select">
                  <label>Seleccionar monitoreo
                    <select value={form.id_monitoreo} onChange={e => {
                      const id = Number(e.target.value)
                      setForm(f => ({ ...f, id_monitoreo: id }))
                      setSelected(monitoreos.find(m => m.idMonitoreo === id))
                    }}>
                      {monitoreos.map(m => (
                        <option key={m.idMonitoreo} value={m.idMonitoreo}>
                          #{m.idMonitoreo} — Finca #{m.idFinca}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {selMon && (
                  <div className="trat-mon-detail">
                    <div className="trat-detail-row"><span>Finca</span><strong>{selMon.nombreFinca || `#${selMon.idFinca}`}</strong></div>
                    <div className="trat-detail-row"><span>Cultivo</span><strong>{selMon.nombreCultivo || selMon.idCultivo || '—'}</strong></div>
                    <div className="trat-detail-row"><span>Fecha</span><strong>{selMon.fechaMonitoreo ? new Date(selMon.fechaMonitoreo).toLocaleDateString('es-CO') : '—'}</strong></div>
                    <div className="trat-detail-row"><span>Nivel de roya</span>
                      <strong className={`trat-nivel ${
                        (selMon.nivelRoya?.nombre || '').toLowerCase().includes('alto') ? 'high'
                        : (selMon.nivelRoya?.nombre || '').toLowerCase().includes('medio') ? 'mid' : 'low'
                      }`}>
                        {selMon.nivelRoya?.nombre || '—'}
                      </strong>
                    </div>
                    <div className="trat-detail-row"><span>Observaciones</span><strong>{selMon.observaciones || '—'}</strong></div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Panel derecho: formulario */}
          <div className="trat-form-panel">
            <h3>Recomendación (experto)</h3>

            {success && <p className="trat-success">{success}</p>}
            {error   && <p className="trat-error">{error}</p>}

            <form className="trat-form" onSubmit={handleSubmit}>
              <div className="trat-form-row">
                <label>Producto recomendado
                  <select value={form.id_tratamiento} onChange={e => setForm(f => ({ ...f, id_tratamiento: e.target.value }))} required>
                    <option value="">Seleccionar…</option>
                    {tratamientos.map(t => (
                      <option key={t.idTratamiento} value={t.idTratamiento}>{t.nombreTratamiento || t.nombre}</option>
                    ))}
                  </select>
                </label>
                <label>Prioridad
                  <select value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))}>
                    <option>Alta</option>
                    <option>Media</option>
                    <option>Baja</option>
                  </select>
                </label>
              </div>

              <div className="trat-form-row">
                <label>Dosis ajustada
                  <input placeholder="Ej: 0.8 L/ha" value={form.dosis} onChange={e => setForm(f => ({ ...f, dosis: e.target.value }))} />
                </label>
                <label>Frecuencia
                  <input placeholder="Ej: Cada 15 días" value={form.frecuencia} onChange={e => setForm(f => ({ ...f, frecuencia: e.target.value }))} />
                </label>
              </div>

              <div className="trat-form-row">
                <label>Temperatura ideal
                  <input placeholder="Ej: 18–24 °C" value={form.temp} onChange={e => setForm(f => ({ ...f, temp: e.target.value }))} />
                </label>
                <label>Humedad ideal
                  <input placeholder="Ej: 70–85%" value={form.humedad} onChange={e => setForm(f => ({ ...f, humedad: e.target.value }))} />
                </label>
              </div>

              <div className="trat-form-row">
                <label>Hora recomendada
                  <input placeholder="Ej: 6:00–9:00 a.m." value={form.hora_recomendada} onChange={e => setForm(f => ({ ...f, hora_recomendada: e.target.value }))} />
                </label>
                <label>Fecha límite de aplicación
                  <input type="date" value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} />
                </label>
              </div>

              <label>Notas / Observaciones
                <textarea rows={3} placeholder="Aplicar con buen cubrimiento en el envés de la hoja…" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </label>

              <div className="trat-form-actions">
                <button type="submit" className="btn-enviar" disabled={saving || !form.id_tratamiento}>
                  {saving ? 'Enviando…' : 'Enviar recomendación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <p className="trat-footer">Datos utilizados: recomendaciones, recomendacion_tratamientos, cat_prioridades</p>
    </div>
  )
}
