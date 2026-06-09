import { useEffect, useState } from 'react'
import './PerfilExperto.css'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { BiEnvelope, BiPhone, BiFile, BiCog, BiLogOut, BiArrowBack } from 'react-icons/bi'

function getInitials(nombre = '', apellido = '') {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase() || 'EX'
}

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
            <BiArrowBack size={17} />
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
            <div className="ep-info-card-icon"><BiEnvelope size={16} /></div>
            <div>
              <p className="ep-info-card-lbl">Correo electrónico</p>
              <p className="ep-info-card-val">{form.correo || '—'}</p>
            </div>
          </div>
          <div className="ep-info-card">
            <div className="ep-info-card-icon"><BiPhone size={16} /></div>
            <div>
              <p className="ep-info-card-lbl">Teléfono</p>
              <p className="ep-info-card-val">{form.telefono || '—'}</p>
            </div>
          </div>
          <div className="ep-info-card">
            <div className="ep-info-card-icon"><BiFile size={16} /></div>
            <div>
              <p className="ep-info-card-lbl">Observaciones</p>
              <p className="ep-info-card-val">{form.observaciones || 'Sin observaciones'}</p>
            </div>
          </div>
          <div className="ep-info-card">
            <div className="ep-info-card-icon"><BiEnvelope size={16} /></div>
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
            <BiCog size={17} />
            Configurar cuenta
          </button>
          <button className="ep-btn-logout" onClick={logout}>
            <BiLogOut size={17} />
            Cerrar sesión
          </button>
        </div>

      </div>
    </div>
  )
}
