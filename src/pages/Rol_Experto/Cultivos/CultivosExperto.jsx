import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './CultivosExperto.css'

export default function CultivosExperto({ finca, onNavigate }) {
  const [cultivos, setCultivos] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [estados, setEstados] = useState([])
  const [form, setForm] = useState({
    nombre_cultivo: '',
    tipo_cultivo: '',
    id_estado_cultivo: '',
  })

  useEffect(() => {
    if (!finca?.idFinca) return
    const fetchData = async () => {
      try {
        const [cultivosRes, estadosRes, monitoreosRes] = await Promise.all([
          api.get('/cultivos'),
          api.get('/cat_estados_cultivo'),
          api.get('/monitoreos'),
        ])

        const todos = Array.isArray(cultivosRes.data) ? cultivosRes.data : (cultivosRes.data?.data ?? [])
        const filtrados = todos.filter((c) => Number(c.idFinca) === Number(finca.idFinca))
        setCultivos(filtrados)

        const est = Array.isArray(estadosRes.data) ? estadosRes.data : (estadosRes.data?.data ?? [])
        setEstados(est)

        const monitoreos = Array.isArray(monitoreosRes.data) ? monitoreosRes.data : (monitoreosRes.data?.data ?? [])
        const statsMap = {}
        filtrados.forEach((c) => {
          const deCultivo = monitoreos.filter((m) => Number(m.idCultivo) === Number(c.idCultivo))
          let totalImagenes = 0
          deCultivo.forEach((m) => {
            totalImagenes += (m.imagenes?.length || 0)
          })
          statsMap[c.idCultivo] = {
            monitoreos: deCultivo.length,
            imagenes: totalImagenes,
          }
        })
        setStats(statsMap)
      } catch {
        setError('No se pudieron cargar los cultivos.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [finca])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleEditClick = (cultivo) => {
    setEditando(cultivo)
    setForm({
      nombre_cultivo: cultivo.nombreCultivo || cultivo.nombre_cultivo || '',
      tipo_cultivo: cultivo.tipoCultivo || cultivo.tipo_cultivo || '',
      id_estado_cultivo: cultivo.idEstado ? String(cultivo.idEstado) : (cultivo.id_estado_cultivo ? String(cultivo.id_estado_cultivo) : ''),
    })
    setShowModal(true)
  }

  const handleCancelEdit = () => {
    setEditando(null)
    setForm({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        id_finca: finca.idFinca,
        nombre_cultivo: form.nombre_cultivo.trim(),
        tipo_cultivo: form.tipo_cultivo.trim(),
        id_estado_cultivo: form.id_estado_cultivo ? Number(form.id_estado_cultivo) : undefined,
      }
      if (editando) {
        await api.put(`/cultivos/${editando.idCultivo}`, payload)
      } else {
        await api.post('/cultivos', payload)
      }
      const res = await api.get('/cultivos')
      const todos = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setCultivos(todos.filter((c) => Number(c.idFinca) === Number(finca.idFinca)))
      setForm({ nombre_cultivo: '', tipo_cultivo: '', id_estado_cultivo: '' })
      setEditando(null)
      setShowModal(false)
    } catch (err) {
      setFormError(err?.response?.data?.message || 'No se pudo registrar el cultivo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cult-exp-page">
      <div className="cult-exp-header">
        <button className="back-btn" onClick={() => onNavigate('dashboard')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </button>
        <div>
          <h1>Cultivos de {finca?.nombre || 'la finca'}</h1>
          <p>{finca?.municipio}, {finca?.departamento}</p>
        </div>
      </div>

      <div className="cult-finca-card">
        <div className="cult-finca-img">
          <img
            src="https://www.tomplanmytrip.com/wp-content/uploads/2021/10/Daniels-house-1.jpg"
            alt="Finca"
          />
        </div>
        <div className="cult-finca-info">
          <div className="cult-finca-row">
            <div className="cult-finca-item">
              <span className="cult-finca-label">Nombre</span>
              <span className="cult-finca-value">{finca?.nombre || '—'}</span>
            </div>
            <div className="cult-finca-item">
              <span className="cult-finca-label">Ubicaci&oacute;n</span>
              <span className="cult-finca-value">{finca?.municipio || '—'}, {finca?.departamento || '—'}</span>
            </div>
          </div>
          <div className="cult-finca-row">
            <div className="cult-finca-item">
              <span className="cult-finca-label">Altitud</span>
              <span className="cult-finca-value">{finca?.altitud ? `${finca.altitud} msnm` : '—'}</span>
            </div>
            <div className="cult-finca-item">
              <span className="cult-finca-label">&Aacute;rea</span>
              <span className="cult-finca-value">{finca?.area ? `${finca.area} ha` : '—'}</span>
            </div>
          </div>
          <div className="cult-finca-row">
            <div className="cult-finca-item">
              <span className="cult-finca-label">Cultivos</span>
              <span className="cult-finca-value">{finca?.totalCultivos ?? '—'}</span>
            </div>
            <div className="cult-finca-item">
              <span className="cult-finca-label">Cafetero</span>
              <span className="cult-finca-value">{finca?.nombreCafetero || '—'}</span>
            </div>
          </div>
          <div className="cult-finca-row">
            <div className="cult-finca-item">
              <span className="cult-finca-label">Experto asignado</span>
              <span className="cult-finca-value">{finca?.nombreExperto || '—'}</span>
            </div>
            <div className="cult-finca-item">
              <span className="cult-finca-label">Asignada</span>
              <span className="cult-finca-value">{finca?.fechaAsignada || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cult-section-header">
        <h2 className="cult-section-title">Cultivos de la finca</h2>
        <button className="cult-btn-agregar" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar cultivos
        </button>
      </div>

      {loading ? (
        <p className="cult-exp-empty">Cargando cultivos...</p>
      ) : error ? (
        <p className="cult-exp-error">{error}</p>
      ) : cultivos.length === 0 ? (
        <p className="cult-exp-empty">Esta finca no tiene cultivos registrados.</p>
      ) : (
        <div className="cult-cards-grid">
          {cultivos.map((c) => {
            const s = stats[c.idCultivo] || { monitoreos: 0, imagenes: 0 }
            return (
              <div key={c.idCultivo} className="cult-card">
                <div className="cult-card-img-wrap">
                  <div className="cult-card-img">
                    <img
                      src="https://colombiaverde.com.co/wp-content/uploads/2023/05/cultivos-de-cafe-en-colombia-1200x800.jpg"
                      alt="Cultivo"
                    />
                  </div>
                  <button className="cult-card-edit" title="Editar cultivo" onClick={() => handleEditClick(c)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
                <div className="cult-card-body">
                  <div className="cult-card-header">
                    <h3 className="cult-card-nombre">{c.nombreCultivo || c.nombre_cultivo || '—'}</h3>
                    <span className="cult-card-estado-badge">
                      {c.estadoCultivo?.nombreEstado || '—'}
                    </span>
                  </div>
                  <p className="cult-card-tipo">{c.tipoCultivo || c.tipo_cultivo || '—'}</p>
                  <div className="cult-card-stats">
                    <div className="cult-card-stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      {s.monitoreos} monitoreos
                    </div>
                    <div className="cult-card-stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      {s.imagenes} im&aacute;genes
                    </div>
                  </div>
                  <button className="cult-card-btn" onClick={() => onNavigate('detalle_cultivo', c)}>
                    Ver detalles del cultivo
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); handleCancelEdit() }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editando ? 'Editar cultivo' : 'Registrar cultivo'}</h2>
            <form className="finca-form" onSubmit={handleCreate}>
              <div className="finca-form-row">
                <input name="nombre_cultivo" value={form.nombre_cultivo} onChange={handleChange} placeholder="Nombre del cultivo" required />
                <input name="tipo_cultivo" value={form.tipo_cultivo} onChange={handleChange} placeholder="Tipo de cultivo" required />
                <select name="id_estado_cultivo" value={form.id_estado_cultivo} onChange={handleChange} className="finca-select">
                  <option value="">--- Sin estado ---</option>
                  {estados.map((est) => (
                    <option key={est.idEstado} value={est.idEstado}>{est.nombreEstado}</option>
                  ))}
                </select>
              </div>
              {formError && <p className="modal-error">{formError}</p>}
              <div className="finca-form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editando ? 'Actualizar cultivo' : 'Registrar cultivo'}
                </button>
                {editando && (
                  <button type="button" className="btn-secondary" onClick={() => { handleCancelEdit(); setShowModal(false) }}>
                    Cancelar edici&oacute;n
                  </button>
                )}
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); handleCancelEdit() }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
