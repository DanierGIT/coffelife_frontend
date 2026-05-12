import { useState, useEffect } from 'react'
import api from '../../../services/api'
import './ProductoresExperto.css'

export default function ProductoresExperto() {
  const [productores, setProductores] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [filtro,      setFiltro]      = useState('')

  useEffect(() => {
    api.get('/usuarios')
      .then(r => {
        const all = Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
        // Filtrar solo caficultores/productores (rol 3 o similar)
        setProductores(all.filter(u => {
          const rol = (u.rol || u.idRol || '').toString().toLowerCase()
          return rol.includes('caficultor') || rol.includes('productor') || rol === '3'
        }))
      })
      .catch(() => {
        // Si no hay endpoint de usuarios, intentar con cafeteros
        api.get('/cafeteros').then(r => {
          setProductores(Array.isArray(r.data) ? r.data : (r.data?.data ?? []))
        }).catch(() => setError('No se pudieron cargar los productores.'))
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = productores.filter(p => {
    if (!filtro) return true
    const q = filtro.toLowerCase()
    const nombre = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase()
    return nombre.includes(q) || (p.correo || '').toLowerCase().includes(q)
  })

  return (
    <div className="prod-page">
      <div className="prod-header">
        <div>
          <h1>Productores</h1>
          <p>Caficultores registrados en el sistema</p>
        </div>
        <div className="prod-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Buscar productor…" value={filtro} onChange={e => setFiltro(e.target.value)} />
        </div>
      </div>

      {error && <p className="prod-error">{error}</p>}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="prod-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <p>{filtro ? 'No se encontraron productores con ese criterio.' : 'No hay productores registrados.'}</p>
        </div>
      ) : (
        <div className="prod-grid">
          {filtered.map((p) => {
            const nombre = `${p.nombre || ''} ${p.apellido || ''}`.trim() || p.correo || `Usuario #${p.idUsuario}`
            const initials = ((p.nombre?.[0] || '') + (p.apellido?.[0] || '')).toUpperCase() || (p.correo?.[0] || 'P').toUpperCase()
            return (
              <div key={p.idUsuario || p.idCafetero} className="prod-card">
                <div className="prod-avatar">{initials}</div>
                <div className="prod-info">
                  <h3>{nombre}</h3>
                  <p>{p.correo || '—'}</p>
                  {p.telefono && <span>📞 {p.telefono}</span>}
                  {p.municipio && <span>📍 {p.municipio}</span>}
                </div>
                <div className="prod-fincas">
                  <span className="prod-finca-badge">
                    {p.cantidadFincas ?? '—'} fincas
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="prod-footer">Datos utilizados: usuarios, cat_roles</p>
    </div>
  )
}
