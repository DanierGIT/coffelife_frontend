import { useEffect, useMemo, useState } from 'react'
import api from '../../../services/api'
import './DashboardExperto.css'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const decodeTokenPayload = () => {
  try {
    const token = localStorage.getItem('cl_token')
    if (!token) return null

    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(base64))
  } catch {
    return null
  }
}

const getNivelNombre = (analisis) => {
  return (
    analisis?.nivelRoya?.nombreNivel ||
    analisis?.nivelRoya?.nombre ||
    analisis?.nivel?.nombreNivel ||
    analisis?.nivel?.nombre ||
    ''
  ).toString().toLowerCase()
}

const getFincaIdFromMonitoreo = (monitoreo) => {
  return (
    monitoreo?.idFinca ||
    monitoreo?.cultivo?.idFinca ||
    monitoreo?.cultivo?.id_finca ||
    monitoreo?.cultivo?.finca?.idFinca ||
    monitoreo?.cultivo?.finca?.id_finca ||
    null
  )
}

const getMonitoreoIdFromAnalisis = (analisis) => {
  return analisis?.imagen?.idMonitoreo || analisis?.imagen?.id_monitoreo || null
}

export default function DashboardExperto() {
  const [stats, setStats] = useState({
    fincas: 0,
    monitoreos: 0,
    pendientes: 0,
    recomendaciones: 0,
    alto: 0,
    medio: 0,
    bajo: 0,
  })

  const [recientes, setRecientes] = useState([])
  const [fincasAsignadas, setFincasAsignadas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')

      try {
        const payload = decodeTokenPayload()
        const idExperto = payload?.id

        if (!idExperto) {
          setError('No se encontro el usuario experto en la sesion. Cierra sesion e ingresa nuevamente.')
          return
        }

        const [asignacionesRes, monitoreosRes, analisisRes, recomendacionesRes] = await Promise.all([
          api.get('/asignaciones_expertos'),
          api.get('/monitoreos'),
          api.get('/analisis_ia'),
          api.get('/recomendaciones'),
        ])

        const asignaciones = getArrayData(asignacionesRes.data).filter(
          (a) => Number(a.idExperto) === Number(idExperto)
        )

        const fincas = asignaciones
          .map((a) => {
            const f = a.finca || {}
            return {
              idFinca: f.idFinca || a.idFinca,
              nombre: f.nombreFinca || `Finca #${f.idFinca || a.idFinca || '-'}`,
              municipio: f.municipio || '-',
              departamento: f.departamento || '-',
              fechaAsignada: a.fechaAsignada,
            }
          })
          .filter((f) => f.idFinca)

        const fincaIds = new Set(fincas.map((f) => Number(f.idFinca)))
        const monitoreos = getArrayData(monitoreosRes.data)
          .filter((m) => {
            const fincaId = getFincaIdFromMonitoreo(m)
            const esFincaAsignada = fincaId && fincaIds.has(Number(fincaId))
            const esExperto = Number(m.idExperto) === Number(idExperto)
            return esFincaAsignada || esExperto
          })
          .sort((a, b) => new Date(b.fechaMonitoreo || 0) - new Date(a.fechaMonitoreo || 0))

        const monitoreoIds = new Set(monitoreos.map((m) => Number(m.idMonitoreo)))
        const analisis = getArrayData(analisisRes.data).filter((a) => {
          const idMonitoreo = getMonitoreoIdFromAnalisis(a)
          return idMonitoreo && monitoreoIds.has(Number(idMonitoreo))
        })

        const recomendaciones = getArrayData(recomendacionesRes.data).filter((r) =>
          monitoreoIds.has(Number(r.idMonitoreo))
        )
        const monitoreosConRecomendacion = new Set(
          recomendaciones.map((r) => Number(r.idMonitoreo)).filter(Boolean)
        )

        const alto = analisis.filter((a) => {
          const nivel = getNivelNombre(a)
          return Number(a.idNivelRoya) === 1 || nivel.includes('alto')
        }).length

        const medio = analisis.filter((a) => {
          const nivel = getNivelNombre(a)
          return Number(a.idNivelRoya) === 2 || nivel.includes('medio')
        }).length

        const bajo = analisis.filter((a) => {
          const nivel = getNivelNombre(a)
          return Number(a.idNivelRoya) === 3 || nivel.includes('bajo')
        }).length

        setFincasAsignadas(fincas)
        setRecientes(monitoreos.slice(0, 5))
        setStats({
          fincas: fincas.length,
          monitoreos: monitoreos.length,
          pendientes: monitoreos.filter((m) => !monitoreosConRecomendacion.has(Number(m.idMonitoreo))).length,
          recomendaciones: recomendaciones.length,
          alto,
          medio,
          bajo,
        })
      } catch (err) {
        if (err?.response?.status === 403) {
          setError('Acceso denegado por backend. Verifica que tu usuario tenga rol experto.')
        } else {
          setError(err?.response?.data?.message || 'No se pudo cargar el dashboard.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalRoya = stats.alto + stats.medio + stats.bajo
  const total = totalRoya || 1
  const pctAlto = Math.round((stats.alto / total) * 100)
  const pctMedio = Math.round((stats.medio / total) * 100)
  const pctBajo = Math.round((stats.bajo / total) * 100)

  const resumenAsignaciones = useMemo(() => {
    if (loading) return 'Cargando informacion asignada...'
    if (fincasAsignadas.length === 0) return 'Aun no tienes fincas asignadas.'
    return `${fincasAsignadas.length} finca(s) asignada(s) para seguimiento.`
  }, [fincasAsignadas.length, loading])

  return (
    <div className="dash-exp">
      <div className="dash-exp-header">
        <div>
          <h1 className="dash-exp-title">Dashboard</h1>
          <p className="dash-exp-subtitle">{resumenAsignaciones}</p>
        </div>

        <p className="dash-exp-date">
          Ultima actualizacion: {new Date().toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {error && <div className="dash-exp-alert">{error}</div>}

      <div className="dash-exp-cards">
        <div className="dash-exp-card">
          <p className="dash-exp-card-label">Fincas asignadas</p>
          <p className="dash-exp-card-value">{loading ? '...' : stats.fincas}</p>
          <p className="dash-exp-card-note">Asignaciones activas</p>
        </div>

        <div className="dash-exp-card">
          <p className="dash-exp-card-label">Monitoreos</p>
          <p className="dash-exp-card-value">{loading ? '...' : stats.monitoreos}</p>
          <p className="dash-exp-card-note">De tus fincas</p>
        </div>

        <div className="dash-exp-card">
          <p className="dash-exp-card-label">Pendientes</p>
          <p className="dash-exp-card-value pending">{loading ? '...' : stats.pendientes}</p>
          <p className="dash-exp-card-note">Sin recomendacion</p>
        </div>

        <div className="dash-exp-card risk-high">
          <p className="dash-exp-card-label">Riesgo alto</p>
          <p className="dash-exp-card-value">{loading ? '...' : stats.alto}</p>
          <p className="dash-exp-card-note">Analisis IA</p>
        </div>

        <div className="dash-exp-card risk-mid">
          <p className="dash-exp-card-label">Riesgo medio</p>
          <p className="dash-exp-card-value">{loading ? '...' : stats.medio}</p>
          <p className="dash-exp-card-note">Analisis IA</p>
        </div>

        <div className="dash-exp-card risk-low">
          <p className="dash-exp-card-label">Riesgo bajo</p>
          <p className="dash-exp-card-value">{loading ? '...' : stats.bajo}</p>
          <p className="dash-exp-card-note">Analisis IA</p>
        </div>
      </div>

      <div className="dash-exp-row">
        <div className="dash-exp-section roya-section">
          <h2 className="dash-exp-section-title">Indice de roya</h2>

          <div className="roya-chart">
            <div className="roya-donut">
              <svg viewBox="0 0 120 120" width="140" height="140">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="18" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#ef4444" strokeWidth="18" strokeDasharray={`${pctAlto * 3.14} 314`} strokeDashoffset="0" transform="rotate(-90 60 60)" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f59e0b" strokeWidth="18" strokeDasharray={`${pctMedio * 3.14} 314`} strokeDashoffset={`${-pctAlto * 3.14}`} transform="rotate(-90 60 60)" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#4caf50" strokeWidth="18" strokeDasharray={`${pctBajo * 3.14} 314`} strokeDashoffset={`${-(pctAlto + pctMedio) * 3.14}`} transform="rotate(-90 60 60)" />
                <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1b5e20">{loading ? '...' : totalRoya}</text>
                <text x="60" y="70" textAnchor="middle" fontSize="10" fill="#6b7280">Analisis</text>
              </svg>
            </div>

            <div className="roya-legend">
              <div className="roya-legend-item"><span className="roya-dot red" /><span>Alto riesgo</span><strong>{pctAlto}% ({stats.alto})</strong></div>
              <div className="roya-legend-item"><span className="roya-dot yellow" /><span>Medio riesgo</span><strong>{pctMedio}% ({stats.medio})</strong></div>
              <div className="roya-legend-item"><span className="roya-dot green" /><span>Bajo riesgo</span><strong>{pctBajo}% ({stats.bajo})</strong></div>
            </div>
          </div>
        </div>

        <div className="dash-exp-section recientes-section">
          <div className="recientes-header">
            <h2 className="dash-exp-section-title">Monitoreos recientes</h2>
          </div>

          {loading ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Cargando...</p>
          ) : recientes.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>
              {error ? 'No se pudieron cargar los monitoreos.' : 'No hay monitoreos para tus fincas asignadas.'}
            </p>
          ) : (
            <div className="recientes-list">
              {recientes.map((m) => (
                <div key={m.idMonitoreo} className="reciente-item">
                  <div className="reciente-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a9 9 0 0 1 9 9c0 5-9 13-9 13S3 16 3 11a9 9 0 0 1 9-9z" />
                      <circle cx="12" cy="11" r="3" />
                    </svg>
                  </div>

                  <div className="reciente-info">
                    <p className="reciente-finca">
                      {m.cultivo?.finca?.nombreFinca || m.cultivo?.nombreCultivo || `Finca #${getFincaIdFromMonitoreo(m) || '-'}`}
                    </p>
                    <p className="reciente-fecha">
                      {m.fechaMonitoreo ? new Date(m.fechaMonitoreo).toLocaleDateString('es-CO') : '-'}
                    </p>
                  </div>

                  <div className="reciente-obs">{m.observaciones || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dash-exp-section" style={{ marginTop: '24px' }}>
        <h2 className="dash-exp-section-title">Mis fincas asignadas</h2>
        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Cargando...</p>
        ) : fincasAsignadas.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No hay fincas asignadas para este experto.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="fincas-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>Finca</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>Ubicacion</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>Fecha asignacion</th>
                </tr>
              </thead>
              <tbody>
                {fincasAsignadas.map((f) => (
                  <tr key={f.idFinca}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 500 }}>{f.nombre}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{f.municipio}, {f.departamento}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{f.fechaAsignada || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}