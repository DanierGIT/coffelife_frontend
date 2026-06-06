import { useEffect, useState } from 'react'
import './miperfil.css'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { BiEnvelope, BiPhone, BiCog, BiLogOut } from 'react-icons/bi'

function getInitials(nombre = '', apellido = '') {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase() || 'A'
}

const MailIcon = () => <BiEnvelope size={16} />

const PhoneIcon = () => <BiPhone size={16} />

const SettingsIcon = () => <BiCog size={17} />

const LogoutIcon = () => <BiLogOut size={17} />

export default function MiPerfil({ onNavigate }) {
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
    <div className="mp-loading">
      <div className="mp-spinner" />
      <p>Cargando perfil...</p>
    </div>
  )

  const displayName = `${form.nombre} ${form.apellido}`.trim() || form.correo || 'Administrador'
  const fotoSrc     = form.fotoPerfil || null

  return (
    <div className="mp-page">

      <div className="mp-top">
        <div className="mp-top-bg">
          <div className="mp-top-pattern" />
        </div>
        <div className="mp-top-content">
          <div className="mp-avatar">
            {fotoSrc
              ? <img src={fotoSrc} alt="Foto de perfil" className="mp-avatar-img" />
              : getInitials(form.nombre, form.apellido)
            }
          </div>
          <div className="mp-top-info">
            <h1 className="mp-user-name">{displayName}</h1>
            <span className="mp-role-pill">Administrador</span>
          </div>
        </div>
      </div>

      <div className="mp-body">

        <div className="mp-cards-grid">
          <div className="mp-info-card">
            <div className="mp-info-card-icon"><MailIcon /></div>
            <div>
              <p className="mp-info-card-lbl">Correo electrónico</p>
              <p className="mp-info-card-val">{form.correo || '—'}</p>
            </div>
          </div>
          <div className="mp-info-card">
            <div className="mp-info-card-icon"><PhoneIcon /></div>
            <div>
              <p className="mp-info-card-lbl">Teléfono</p>
              <p className="mp-info-card-val">{form.telefono || '—'}</p>
            </div>
          </div>
          <div className="mp-info-card">
            <div className="mp-info-card-icon"><MailIcon /></div>
            <div>
              <p className="mp-info-card-lbl">Rol</p>
              <p className="mp-info-card-val">Admin</p>
            </div>
          </div>
          <div className="mp-info-card">
            <div className="mp-info-card-icon">
              <span className="mp-status-dot-lg" />
            </div>
            <div>
              <p className="mp-info-card-lbl">Estado</p>
              <p className="mp-info-card-val mp-status-text">Activo</p>
            </div>
          </div>
        </div>

        <div className="mp-actions">
          <button className="mp-btn-config" onClick={() => onNavigate('configurar')}>
            <SettingsIcon />
            Configurar cuenta
          </button>
          <button className="mp-btn-logout" onClick={logout}>
            <LogoutIcon />
            Cerrar sesión
          </button>
        </div>

      </div>
    </div>
  )
}
