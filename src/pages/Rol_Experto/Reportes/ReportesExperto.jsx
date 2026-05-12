import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './ReportesExperto.css'

export default function ReportesExperto() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/monitoreos'),
      api.get('/analisis_ia'),
      api.get('/recomendaciones'),
      api.get('/fincas'),
    ]).then(([mRes, aRes, rRes, fRes]) => {
      const mon  = mRes.status === 'fulfilled' ? (Array.isArray(mRes.value.data) ? mRes.value.data : mRes.value.data?.data ?? []) : []
      const anal = aRes.status === 'fulfilled' ? (Array.isArray(aRes.value.data) ? aRes.value.data : aRes.value.data?.data ?? []) : []
      const rec  = rRes.status === 'fulfilled' ? (Array.isArray(rRes.value.data) ? rRes.value.data : rRes.value.data?.data ?? []) : []
      const fin  = fRes.status === 'fulfilled' ? (Array.isArray(fRes.value.data) ? fRes.value.data : fRes.value.data?.data ?? []) : []
      setStats({
        monitoreos:      mon.length,
        analisis:        anal.length,
        recomendaciones: rec.length,
        fincas:          fin.length,
        altaRoya:        anal.filter(a => (a.nivelRoya?.nombre || '').toLowerCase().includes('alto')).length,
        mediaRoya:       anal.filter(a => (a.nivelRoya?.nombre || '').toLowerCase().includes('medio')).length,
        bajaRoya:        anal.filter(a => (a.nivelRoya?.nombre || '').toLowerCase().includes('bajo')).length,
        recAplicadas:    rec.filter(r => r.aplicada).length,
        confMedia:       anal.length > 0 ? Math.round(anal.reduce((s, a) => s + (a.porcentajeConfianza || 0), 0) / anal.length) : 0,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: '#9ca3af', fontSize: 14 }}>Cargando reportes…</p>
  if (!stats) return null

  const total = stats.altaRoya + stats.mediaRoya + stats.bajaRoya || 1

  return (
    <div className="rep-page">
      <div className="rep-header">
        <div>
          <h1>Reportes</h1>
          <p>Resumen estadístico de la actividad del experto</p>
        </div>
        <span className="rep-date">
          {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Métricas generales */}
      <div className="rep-cards">
        {[
          { label: 'Fincas supervisadas', value: stats.fincas, color: 'green', icon: '🌿' },
          { label: 'Monitoreos realizados', value: stats.monitoreos, color: 'blue', icon: '📋' },
          { label: 'Análisis IA completados', value: stats.analisis, color: 'purple', icon: '🤖' },
          { label: 'Recomendaciones enviadas', value: stats.recomendaciones, color: 'orange', icon: '💬' },
        ].map(c => (
          <div key={c.label} className={`rep-card rep-card-${c.color}`}>
            <span className="rep-card-icon">{c.icon}</span>
            <p className="rep-card-value">{c.value}</p>
            <p className="rep-card-label">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rep-row">
        {/* Distribución roya */}
        <div className="rep-section">
          <h3>Distribución nivel de roya</h3>
          <div className="rep-roya-bars">
            {[
              { label: 'Alto riesgo', count: stats.altaRoya,  color: '#dc2626', bg: '#fee2e2' },
              { label: 'Medio riesgo', count: stats.mediaRoya, color: '#d97706', bg: '#fef3c7' },
              { label: 'Bajo riesgo', count: stats.bajaRoya,  color: '#16a34a', bg: '#dcfce7' },
            ].map(b => (
              <div key={b.label} className="rep-bar-row">
                <div className="rep-bar-label">
                  <span style={{ color: b.color }}>{b.label}</span>
                  <strong style={{ color: b.color }}>{b.count} análisis ({Math.round(b.count / total * 100)}%)</strong>
                </div>
                <div className="rep-bar-track">
                  <div className="rep-bar-fill" style={{ width: `${b.count / total * 100}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Efectividad */}
        <div className="rep-section">
          <h3>Efectividad</h3>
          <div className="rep-efectividad">
            <div className="rep-ef-item">
              <div className="rep-donut-small">
                <svg viewBox="0 0 60 60" width="80" height="80">
                  <circle cx="30" cy="30" r="22" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                  <circle cx="30" cy="30" r="22" fill="none" stroke="#2e7d32" strokeWidth="8"
                    strokeDasharray={`${stats.recAplicadas / (stats.recomendaciones || 1) * 138} 138`}
                    strokeDashoffset="34.5" transform="rotate(-90 30 30)"/>
                  <text x="30" y="35" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2e7d32">
                    {stats.recomendaciones > 0 ? Math.round(stats.recAplicadas / stats.recomendaciones * 100) : 0}%
                  </text>
                </svg>
              </div>
              <div>
                <p className="rep-ef-label">Tasa de aplicación</p>
                <span>{stats.recAplicadas} de {stats.recomendaciones} recomendaciones aplicadas</span>
              </div>
            </div>
            <div className="rep-ef-item">
              <div className="rep-donut-small">
                <svg viewBox="0 0 60 60" width="80" height="80">
                  <circle cx="30" cy="30" r="22" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                  <circle cx="30" cy="30" r="22" fill="none" stroke="#0369a1" strokeWidth="8"
                    strokeDasharray={`${stats.confMedia / 100 * 138} 138`}
                    strokeDashoffset="34.5" transform="rotate(-90 30 30)"/>
                  <text x="30" y="35" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0369a1">
                    {stats.confMedia}%
                  </text>
                </svg>
              </div>
              <div>
                <p className="rep-ef-label">Confianza promedio IA</p>
                <span>Promedio de {stats.analisis} análisis</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="rep-footer">Datos utilizados: monitoreos, analisis_ia, recomendaciones, fincas, aplicaciones_tratamientos</p>
    </div>
  )
}
