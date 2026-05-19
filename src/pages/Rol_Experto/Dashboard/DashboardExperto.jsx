import { useEffect, useState } from 'react'
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

const getTokenRole = () => {
  const payload = decodeTokenPayload()
  return (
    payload?.rol?.nombreRol ||
    payload?.rol?.nombre_rol ||
    payload?.rol ||
    ''
  ).toString().trim()
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
    monitoreo?.cultivo?.finca?.idFinca ||
    monitoreo?.cultivo?.finca?.id_finca ||
    null
  )
}

export default function DashboardExperto() {
  const [stats, setStats] = useState({
    fincas: 0,
    pendientes: 0,
    alto: 0,
    medio: 0,
    bajo: 0,
  })

  const [recientes, setRecientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')

      const rolToken = getTokenRole()
      const rolNormalizado = rolToken.toLowerCase()

      if (!['admin', 'experto', 'cafetero'].includes(rolNormalizado)) {
        setError(
          rolToken
            ? `Tu token tiene el rol "${rolToken}", pero el backend solo permite "experto" para este panel. Cierra sesion y vuelve a ingresar. Si sigue igual, revisa que el rol en la base de datos se llame exactamente "experto".`
            : 'No se encontro un rol valido en el token. Cierra sesion y vuelve a ingresar.'
        )
        setLoading(false)
        return
      }

      try {
        const [monitoreosRes, analisisRes] = await Promise.all([
          api.get('/monitoreos'),
          api.get('/analisis_ia'),
        ])

        const mon = getArrayData(monitoreosRes.data)
        const anal = getArrayData(analisisRes.data)

        const fincasUnicas = new Set(
          mon.map((m) => getFincaIdFromMonitoreo(m)).filter(Boolean)
        ).size

        const alto = anal.filter((a) => {
          const nivel = getNivelNombre(a)
          return a.idNivelRoya === 1 || nivel.includes('alto')
        }).length

        const medio = anal.filter((a) => {
          const nivel = getNivelNombre(a)
          return a.idNivelRoya === 2 || nivel.includes('medio')
        }).length

        const bajo = anal.filter((a) => {
          const nivel = getNivelNombre(a)
          return a.idNivelRoya === 3 || nivel.includes('bajo')
        }).length

        setStats({
          fincas: fincasUnicas || mon.length,
          pendientes: mon.filter((m) => !m.idEstado || m.idEstado === 1).length,
          alto,
          medio,
          bajo,
        })

        setRecientes(mon.slice(0, 5))
      } catch (err) {
        if (err?.response?.status === 403) {
          const backendRole = err.response.data?.tuRol
          setError(
            backendRole
              ? `Acceso denegado por backend. Tu token llega con rol "${backendRole}". El backend exige "experto". Cierra sesion y vuelve a ingresar; si continua, corrige el nombre del rol en la base de datos.`
              : 'Acceso denegado por backend. Tu usuario no tiene permiso para consultar monitoreos o analisis IA.'
          )
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

  return (
    <div className="dash-exp">
      <div className="dash-exp-header">
        <div>
          <h1 className="dash-exp-title">Dashboard</h1>
          <p className="dash-exp-subtitle">Resumen general de fincas y monitoreos asignados</p>
        </div>

        <p className="dash-exp-date">
          Ultima actualizacion: {new Date().toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {error && (
        <div className="dash-exp-alert">
          {error}
        </div>
      )}

      <div className="dash-exp-cards">
        <div className="dash-exp-card">
          <p className="dash-exp-card-label">Fincas asignadas</p>
          <p className="dash-exp-card-value">{loading ? '...' : stats.fincas}</p>
          <p className="dash-exp-card-note">Total fincas</p>
        </div>

        <div className="dash-exp-card">
          <p className="dash-exp-card-label">Monitoreos pendientes</p>
          <p className="dash-exp-card-value pending">{loading ? '...' : stats.pendientes}</p>
          <p className="dash-exp-card-note">Por revisar</p>
        </div>

        <div className="dash-exp-card risk-high">
          <p className="dash-exp-card-label">Riesgo alto</p>
          <p className="dash-exp-card-value">{loading ? '...' : stats.alto}</p>
          <p className="dash-exp-card-note">Fincas</p>
        </div>

        <div className="dash-exp-card risk-mid">
          <p className="dash-exp-card-label">Riesgo medio</p>
          <p className="dash-exp-card-value">{loading ? '...' : stats.medio}</p>
          <p className="dash-exp-card-note">Fincas</p>
        </div>

        <div className="dash-exp-card risk-low">
          <p className="dash-exp-card-label">Riesgo bajo</p>
          <p className="dash-exp-card-value">{loading ? '...' : stats.bajo}</p>
          <p className="dash-exp-card-note">Fincas</p>
        </div>
      </div>

      <div className="dash-exp-row">
        <div className="dash-exp-section roya-section">
          <h2 className="dash-exp-section-title">Indice de roya</h2>

          <div className="roya-chart">
            <div className="roya-donut">
              <svg viewBox="0 0 120 120" width="140" height="140">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="18" />

                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="18"
                  strokeDasharray={`${pctAlto * 3.14} 314`}
                  strokeDashoffset="0"
                  transform="rotate(-90 60 60)"
                />

                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="18"
                  strokeDasharray={`${pctMedio * 3.14} 314`}
                  strokeDashoffset={`${-pctAlto * 3.14}`}
                  transform="rotate(-90 60 60)"
                />

                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#4caf50"
                  strokeWidth="18"
                  strokeDasharray={`${pctBajo * 3.14} 314`}
                  strokeDashoffset={`${-(pctAlto + pctMedio) * 3.14}`}
                  transform="rotate(-90 60 60)"
                />

                <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1b5e20">
                  {loading ? '...' : totalRoya}
                </text>
                <text x="60" y="70" textAnchor="middle" fontSize="10" fill="#6b7280">Analisis</text>
              </svg>
            </div>

            <div className="roya-legend">
              <div className="roya-legend-item">
                <span className="roya-dot red" />
                <span>Alto riesgo</span>
                <strong>{pctAlto}% ({stats.alto})</strong>
              </div>

              <div className="roya-legend-item">
                <span className="roya-dot yellow" />
                <span>Medio riesgo</span>
                <strong>{pctMedio}% ({stats.medio})</strong>
              </div>

              <div className="roya-legend-item">
                <span className="roya-dot green" />
                <span>Bajo riesgo</span>
                <strong>{pctBajo}% ({stats.bajo})</strong>
              </div>
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
              {error ? 'No se pudieron cargar los monitoreos.' : 'No hay monitoreos registrados.'}
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
                      Finca #{getFincaIdFromMonitoreo(m) || '-'}
                    </p>
                    <p className="reciente-fecha">
                      {m.fechaMonitoreo ? new Date(m.fechaMonitoreo).toLocaleDateString('es-CO') : '-'}
                    </p>
                  </div>

                  <div className="reciente-obs">
                    {m.observaciones || '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}