import { useEffect, useState } from 'react'
import './PerfilExperto.css'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'

function getInitials(nombre = '', apellido = '') {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase() || 'EX'
}

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.18z"/>
  </svg>
)

const NoteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
)

export default function PerfilExperto({ onNavigate }) {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    nombre: '', apellido: '', correo: '', telefono: '', observaciones: '', fotoPerfil: '',
  })

  useEffect(() => {
    api.get('/mi-perfil')
      .then((res) => {
        const d = res.data?.data || res.data
        setForm({
          nombre:        d.nombre        || '',
          apellido:      d.apellido      || '',
          correo:        d.correo        || '',
          telefono:      d.telefono      || '',
          observaciones: d.observaciones || '',
          fotoPerfil:    d.fotoPerfil    || '',
        })
      })
      .catch(() => {
        if (user) {
          setForm({
            nombre:   user.nombre   || '',
            apellido: user.apellido || '',
            correo:   user.correo   || '',
            telefono: user.telefono || '',
            observaciones: '',
            fotoPerfil: '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <div className="ep-loading">
      <div className="ep-spinner" />
      <p>Cargando perfil...</p>
    </div>
  )

  const displayName = `${form.nombre} ${form.apellido}`.trim() || form.correo || 'Experto'
  const fotoSrc     = form.fotoPerfil || null

  return (
    <div className="ep-page">

      <div className="ep-top">
        <div className="ep-top-bg">
          <div className="ep-top-pattern" />
        </div>
        <div className="ep-top-content">
          <button className="ep-back-btn" onClick={() => onNavigate('dashboard')} title="Volver al panel">
            <ArrowLeftIcon />
            Volver
          </button>
        </div>
        <div className="ep-profile-info">
          <div className="ep-avatar">
            {fotoSrc
              ? <img src={fotoSrc} alt="Foto de perfil" className="ep-avatar-img" />
              : getInitials(form.nombre, form.apellido)
            }
          </div>
          <div className="ep-name-section">
            <h1 className="ep-user-name">{displayName}</h1>
            <span className="ep-role-pill">Experto Agrónomo</span>
          </div>
        </div>
      </div>

      <div className="ep-body">

        <div className="ep-cards-grid">
          <div className="ep-info-card">
            <div className="ep-info-card-icon"><MailIcon /></div>
            <div>
              <p className="ep-info-card-lbl">Correo electrónico</p>
              <p className="ep-info-card-val">{form.correo || '—'}</p>
            </div>
          </div>
          <div className="ep-info-card">
            <div className="ep-info-card-icon"><PhoneIcon /></div>
            <div>
              <p className="ep-info-card-lbl">Teléfono</p>
              <p className="ep-info-card-val">{form.telefono || '—'}</p>
            </div>
          </div>
          <div className="ep-info-card">
            <div className="ep-info-card-icon"><NoteIcon /></div>
            <div>
              <p className="ep-info-card-lbl">Observaciones</p>
              <p className="ep-info-card-val">{form.observaciones || 'Sin observaciones'}</p>
            </div>
          </div>
          <div className="ep-info-card">
            <div className="ep-info-card-icon"><MailIcon /></div>
            <div>
              <p className="ep-info-card-lbl">Rol</p>
              <p className="ep-info-card-val">Experto</p>
            </div>
          </div>
          <div className="ep-info-card">
            <div className="ep-info-card-icon">
              <span className="ep-status-dot-lg" />
            </div>
            <div>
              <p className="ep-info-card-lbl">Estado</p>
              <p className="ep-info-card-val ep-status-text">Activo</p>
            </div>
          </div>
        </div>

        <div className="ep-actions">
          <button className="ep-btn-config" onClick={() => onNavigate('configurar-experto')}>
            <SettingsIcon />
            Configurar cuenta
          </button>
          <button className="ep-btn-logout" onClick={logout}>
            <LogoutIcon />
            Cerrar sesión
          </button>
        </div>

      </div>
    </div>
  )
}
