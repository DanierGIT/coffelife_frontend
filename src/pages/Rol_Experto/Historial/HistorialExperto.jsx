import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './HistorialExperto.css'

const fmt = (v) => v ? new Date(v).toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'

const NIVEL_CLASS = (n = '') => {
  const l = n.toLowerCase()
  if (l.includes('alto')) return 'high'
  if (l.includes('medio')) return 'mid'
  return 'low'
}

export default function HistorialExperto() {
  const [analisis, setAnalisis] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [filtro,   setFiltro]   = useState('')

  useEffect(() => {
    api.get('/analisis_ia')
      .then(r => setAnalisis(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => setError('No se pudo cargar el historial.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = analisis.filter(a => {
    if (!filtro) return true
    const q = filtro.toLowerCase()
    return (
      String(a.idFinca).includes(q) ||
      (a.nombreFinca || '').toLowerCase().includes(q) ||
      (a.nivelRoya?.nombre || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="hist-page">
      <div className="hist-header">
        <div>
          <h1>Historial de análisis</h1>
          <p>Registro completo de análisis de IA realizados</p>
        </div>
        <div className="hist-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            placeholder="Buscar por finca, nivel…"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="hist-error">{error}</p>}

      <div className="hist-table-wrap">
        {loading ? (
          <p className="hist-empty">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="hist-empty">No hay resultados.</p>
        ) : (
          <table className="hist-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Finca</th>
                <th>Cultivo</th>
                <th>Nivel roya</th>
                <th>Confianza IA</th>
                <th>Estado cultivo</th>
                <th>Fecha análisis</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const nivel = a.nivelRoya?.nombre || a.nivel_roya || '—'
                const nc = NIVEL_CLASS(nivel)
                return (
                  <tr key={a.idAnalisis}>
                    <td className="hist-num">{i + 1}</td>
                    <td>{a.nombreFinca || `Finca #${a.idFinca}`}</td>
                    <td>{a.nombreCultivo || a.idCultivo || '—'}</td>
                    <td><span className={`hist-nivel ${nc}`}>{nivel}</span></td>
                    <td>
                      <div className="hist-confianza">
                        <div className="hist-conf-bar">
                          <div className="hist-conf-fill" style={{ width: `${a.porcentajeConfianza ?? 0}%` }} />
                        </div>
                        <span>{a.porcentajeConfianza ?? 0}%</span>
                      </div>
                    </td>
                    <td>{a.estadoCultivo?.nombre || 'En producción'}</td>
                    <td>{fmt(a.fechaAnalisis || a.fecha_analisis)}</td>
                    <td><span className="hist-estado completado">Completado</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="hist-footer">Datos utilizados: analisis_ia, cat_niveles_roya, cat_estados_cultivo, fincas, cultivos</p>
    </div>
  )
}
