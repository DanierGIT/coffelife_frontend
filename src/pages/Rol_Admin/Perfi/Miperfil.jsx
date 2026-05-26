import { useEffect, useState } from 'react'
import './miperfil.css'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import PasswordStrength from '../../../components/PasswordStrength'

function getInitials(nombre = '', apellido = '') {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase() || 'A'
}

const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.18z"/>
  </svg>
)

export default function MiPerfil() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState('info')

  const [form, setForm] = useState({
    nombre: '', apellido: '', correo: '', telefono: '', observaciones: '',
  })

  const [pwForm, setPwForm] = useState({
    passwordActual: '', passwordNueva: '', passwordConfirm: '',
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
        })
      })
      .catch(() => {
        if (user) {
          setForm({
            nombre:        user.nombre        || '',
            apellido:      user.apellido      || '',
            correo:        user.correo        || '',
            telefono:      user.telefono      || '',
            observaciones: '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [user])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handlePwChange = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put('/mi-perfil', {
        nombre: form.nombre, apellido: form.apellido,
        telefono: form.telefono, observaciones: form.observaciones,
      })
      setSuccess('Perfil actualizado correctamente.')
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo actualizar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePw = async (e) => {
    e.preventDefault()
    if (pwForm.passwordNueva !== pwForm.passwordConfirm) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }
    if (pwForm.passwordNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/mi-perfil/cambiar-password', {
        passwordActual: pwForm.passwordActual,
        nuevaPassword: pwForm.passwordNueva,
      })
      setSuccess('Contraseña actualizada correctamente.')
      setPwForm({ passwordActual: '', passwordNueva: '', passwordConfirm: '' })
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo cambiar la contraseña.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="mp-loading">Cargando perfil...</p>

  const displayName = `${form.nombre} ${form.apellido}`.trim() || form.correo || 'Administrador'

  return (
    <div className="mp-page">
      <div className="mp-header">
        <h1>Mi Perfil</h1>
        <p>Información personal y configuración de la cuenta</p>
      </div>

      {error   && <p className="mp-message mp-message--error">{error}</p>}
      {success && <p className="mp-message mp-message--success">{success}</p>}

      <div className="mp-content">
        {/* ── Tarjeta lateral ── */}
        <aside className="mp-sidebar">
          <div className="mp-sidebar-cover" />
          <div className="mp-avatar">{getInitials(form.nombre, form.apellido)}</div>
          <h2 className="mp-name">{displayName}</h2>
          <span className="mp-role">Administrador</span>

          <div className="mp-contact">
            <div className="mp-contact-row">
              <MailIcon />
              <span>{form.correo || '—'}</span>
            </div>
            {form.telefono && (
              <div className="mp-contact-row">
                <PhoneIcon />
                <span>{form.telefono}</span>
              </div>
            )}
          </div>

          <div className="mp-account">
            <h4>Cuenta</h4>
            <div className="mp-account-row">
              <span>Rol</span>
              <strong>Administrador</strong>
            </div>
            <div className="mp-account-row">
              <span>Estado</span>
              <span className="mp-badge">Activo</span>
            </div>
          </div>

          <button className="mp-logout" onClick={logout}>
            Cerrar sesión
          </button>
        </aside>

        {/* ── Panel principal ── */}
        <div className="mp-panel">
          <div className="mp-tabs">
            <button
              className={`mp-tab${tab === 'info' ? ' active' : ''}`}
              onClick={() => setTab('info')}
            >
              Información personal
            </button>
            <button
              className={`mp-tab${tab === 'seguridad' ? ' active' : ''}`}
              onClick={() => setTab('seguridad')}
            >
              Seguridad
            </button>
          </div>

          {tab === 'info' && (
            <form className="mp-form" onSubmit={handleSave}>
              <div className="mp-form-row">
                <label>
                  Nombre
                  <input name="nombre" value={form.nombre} onChange={handleChange} />
                </label>
                <label>
                  Apellido
                  <input name="apellido" value={form.apellido} onChange={handleChange} />
                </label>
              </div>
              <label>
                Correo electrónico
                <input type="email" value={form.correo} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </label>
              <label>
                Teléfono
                <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+57 310 123 4567" />
              </label>
              <label>
                Observaciones
                <textarea name="observaciones" rows={3} value={form.observaciones} onChange={handleChange} placeholder="Notas adicionales..." />
              </label>
              <div className="mp-form-actions">
                <button type="submit" className="mp-btn-save" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}

          {tab === 'seguridad' && (
            <form className="mp-form" onSubmit={handleChangePw}>
              <h4 className="mp-section-title">Cambiar contraseña</h4>
              <label>
                Contraseña actual
                <input
                  type="password"
                  name="passwordActual"
                  value={pwForm.passwordActual}
                  onChange={handlePwChange}
                  required
                />
              </label>
              <label>
                Nueva contraseña
                <input
                  type="password"
                  name="passwordNueva"
                  value={pwForm.passwordNueva}
                  onChange={handlePwChange}
                  required
                />
                <PasswordStrength password={pwForm.passwordNueva} />
              </label>
              <label>
                Confirmar nueva contraseña
                <input
                  type="password"
                  name="passwordConfirm"
                  value={pwForm.passwordConfirm}
                  onChange={handlePwChange}
                  required
                />
              </label>
              <div className="mp-form-actions">
                <button type="submit" className="mp-btn-save" disabled={saving}>
                  {saving ? 'Guardando…' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
