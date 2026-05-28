import { useEffect, useState, useRef } from 'react'
import './miperfil.css'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import PasswordStrength from '../../../components/PasswordStrength'

function getInitials(nombre = '', apellido = '') {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase() || 'A'
}

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.18z"/>
  </svg>
)

const CameraIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const UploadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)

const SaveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function MiPerfil() {
  const { user, logout } = useAuth()
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [tab, setTab]                 = useState('info')
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoFile, setFotoFile]       = useState(null)
  const [panelOpen, setPanelOpen]     = useState(false)
  const inputFotoRef                  = useRef(null)

  const [form, setForm] = useState({
    nombre: '', apellido: '', correo: '', telefono: '', observaciones: '', fotoPerfil: '',
  })

  const [pwForm, setPwForm] = useState({
    passwordActual: '', passwordNueva: '', passwordConfirm: '',
  })
  const [pwCurrentError, setPwCurrentError] = useState('')

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
            nombre:        user.nombre        || '',
            apellido:      user.apellido      || '',
            correo:        user.correo        || '',
            telefono:      user.telefono      || '',
            observaciones: '',
            fotoPerfil:    '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [user])

  const handleChange   = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handlePwChange = (e) => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value })
    if (e.target.name === 'passwordActual') setPwCurrentError('')
  }

  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const formData = new FormData()
      formData.append('nombre',        form.nombre)
      formData.append('apellido',      form.apellido)
      formData.append('telefono',      form.telefono)
      formData.append('observaciones', form.observaciones)
      if (fotoFile) formData.append('foto_perfil', fotoFile)

      const res = await api.put('/mi-perfil', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const updated = res.data?.data || res.data
      if (updated?.fotoPerfil) {
        setForm(prev => ({ ...prev, fotoPerfil: updated.fotoPerfil }))
      }
      setSuccess('Perfil actualizado correctamente.')
      setFotoFile(null)
      setFotoPreview(null)
      // Cerrar panel tras guardar con pequeño delay para que el user vea el éxito
      setTimeout(() => {
        setPanelOpen(false)
        setSuccess('')
      }, 1500)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo actualizar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePw = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!pwForm.passwordActual.trim()) {
      setError('Debes ingresar tu contraseña actual.')
      return
    }
    if (pwForm.passwordNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (pwForm.passwordNueva === pwForm.passwordActual) {
      setError('La nueva contraseña debe ser diferente a la actual.')
      return
    }
    if (pwForm.passwordNueva !== pwForm.passwordConfirm) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }
    setSaving(true)
    try {
      await api.post('/mi-perfil/cambiar-password', {
        passwordActual: pwForm.passwordActual,
        nuevaPassword:  pwForm.passwordNueva,
      })
      setSuccess('Contraseña actualizada correctamente.')
      setPwForm({ passwordActual: '', passwordNueva: '', passwordConfirm: '' })
      setTimeout(() => {
        setPanelOpen(false)
        setSuccess('')
      }, 1500)
    } catch (err) {
      const status = err?.response?.status
      const msg = err?.response?.data?.message || err?.response?.data?.error || ''
      if (status === 401 || status === 400) {
        setPwCurrentError(msg || 'Contraseña actual incorrecta.')
        setError('')
      } else if (msg) {
        setError(msg)
      } else if (status === 422) {
        setError('La nueva contraseña no cumple los requisitos.')
      } else if (status === 404) {
        setError('El servicio de cambio de contraseña no está disponible.')
      } else {
        setError('No se pudo cambiar la contraseña. Intenta de nuevo.')
      }
    } finally {
      setSaving(false)
    }
  }

  const openPanel = () => {
    setError('')
    setSuccess('')
    setPanelOpen(true)
  }

  const closePanel = () => {
    setError('')
    setSuccess('')
    setPanelOpen(false)
  }

  if (loading) return (
    <div className="mp-loading">
      <div className="mp-spinner" />
      <p>Cargando perfil...</p>
    </div>
  )

  const displayName = `${form.nombre} ${form.apellido}`.trim() || form.correo || 'Administrador'
  const fotoSrc     = fotoPreview || form.fotoPerfil || null

  return (
    <div className="mp-page">

      <div className="mp-header">
        <div>
          <h1>Mi Perfil</h1>
          <p>Administra tu información personal y seguridad de la cuenta</p>
        </div>
      </div>

      {/* Alertas globales (solo visibles cuando panel está abierto) */}
      {panelOpen && error   && <div className="mp-alert mp-alert--error"><span>⚠</span>{error}</div>}
      {panelOpen && success && <div className="mp-alert mp-alert--success"><span>✓</span>{success}</div>}

      {/* ── Tarjeta de perfil + Panel ── */}
      <div className={`mp-body${panelOpen ? ' mp-body--open' : ''}`}>

        {/* ── Tarjeta de perfil ── */}
        <aside className="mp-sidebar">
          <div className="mp-sidebar-cover">
            <div className="mp-cover-pattern" />
            {/* Botón engranaje */}
            <button
              className={`mp-gear-btn${panelOpen ? ' mp-gear-btn--active' : ''}`}
              onClick={panelOpen ? closePanel : openPanel}
              title={panelOpen ? 'Cerrar configuración' : 'Configurar perfil'}
            >
              <span className={`mp-gear-icon${panelOpen ? ' mp-gear-icon--spin' : ''}`}>
                {panelOpen ? <CloseIcon /> : <GearIcon />}
              </span>
            </button>
          </div>

          <div className="mp-avatar-wrap">
            <div
              className="mp-avatar"
              onClick={() => panelOpen && inputFotoRef.current?.click()}
              title={panelOpen ? 'Cambiar foto de perfil' : ''}
              style={{ cursor: panelOpen ? 'pointer' : 'default' }}
            >
              {fotoSrc
                ? <img src={fotoSrc} alt="Foto de perfil" className="mp-avatar-img" />
                : getInitials(form.nombre, form.apellido)
              }
              {panelOpen && (
                <div className="mp-avatar-overlay">
                  <CameraIcon />
                  <span>Cambiar</span>
                </div>
              )}
            </div>
            {panelOpen && (
              <div className="mp-cam-badge" onClick={() => inputFotoRef.current?.click()}>
                <CameraIcon />
              </div>
            )}
          </div>

          <input
            ref={inputFotoRef}
            type="file"
            accept="image/jpg,image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFotoChange}
          />

          {fotoPreview && (
            <p className="mp-foto-hint">✓ Foto lista — guarda para subir</p>
          )}

          <h2 className="mp-name">{displayName}</h2>
          <span className="mp-role-pill">Administrador</span>

          <div className="mp-divider" />

          <div className="mp-contact">
            <div className="mp-contact-row">
              <div className="mp-contact-icon"><MailIcon /></div>
              <span>{form.correo || '—'}</span>
            </div>
            {form.telefono && (
              <div className="mp-contact-row">
                <div className="mp-contact-icon"><PhoneIcon /></div>
                <span>{form.telefono}</span>
              </div>
            )}
          </div>

          <div className="mp-divider" />

          <div className="mp-stat-grid">
            <div className="mp-stat-card">
              <p className="mp-stat-label">Rol</p>
              <p className="mp-stat-val">Admin</p>
            </div>
            <div className="mp-stat-card">
              <p className="mp-stat-label">Estado</p>
              <span className="mp-badge">
                <span className="mp-badge-dot" />
                Activo
              </span>
            </div>
          </div>

          <button className="mp-logout" onClick={logout}>
            <LogoutIcon />
            Cerrar sesión
          </button>
        </aside>

        {/* ── Panel de configuración (desliza desde la derecha) ── */}
        <div className={`mp-panel${panelOpen ? ' mp-panel--visible' : ''}`}>
          <div className="mp-panel-header">
            <p className="mp-panel-title">Configuración de cuenta</p>
            <div className="mp-tabs">
              <button
                className={`mp-tab${tab === 'info' ? ' active' : ''}`}
                onClick={() => { setTab('info'); setError(''); setSuccess('') }}
              >
                Información personal
              </button>
              <button
                className={`mp-tab${tab === 'seguridad' ? ' active' : ''}`}
                onClick={() => { setTab('seguridad'); setError(''); setSuccess(''); setPwCurrentError('') }}
              >
                Seguridad
              </button>
            </div>
          </div>

          {tab === 'info' && (
            <form className="mp-form" onSubmit={handleSave}>

              <div className="mp-photo-zone" onClick={() => inputFotoRef.current?.click()}>
                <div className="mp-photo-preview">
                  {fotoSrc
                    ? <img src={fotoSrc} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : getInitials(form.nombre, form.apellido)
                  }
                </div>
                <div className="mp-photo-info">
                  <p className="mp-photo-title">Foto de perfil</p>
                  <p className="mp-photo-sub">JPG, PNG o WEBP · máx. 5 MB · haz clic para cambiar</p>
                </div>
                <button type="button" className="mp-photo-btn" onClick={(e) => { e.stopPropagation(); inputFotoRef.current?.click() }}>
                  <UploadIcon />
                  Subir foto
                </button>
              </div>

              <div className="mp-section-label">Datos personales</div>

              <div className="mp-form-row">
                <div className="mp-field">
                  <label>Nombre</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre" />
                </div>
                <div className="mp-field">
                  <label>Apellido</label>
                  <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Tu apellido" />
                </div>
              </div>

              <div className="mp-field">
                <label>Correo electrónico</label>
                <div className="mp-input-locked">
                  <span className="mp-lock-icon"><MailIcon /></span>
                  <input type="email" value={form.correo} disabled />
                  <span className="mp-locked-badge">No editable</span>
                </div>
              </div>

              <div className="mp-field">
                <label>Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+57 310 123 4567" />
              </div>

              <div className="mp-field">
                <label>Observaciones</label>
                <textarea name="observaciones" rows={3} value={form.observaciones} onChange={handleChange} placeholder="Notas adicionales..." />
              </div>

              <div className="mp-form-actions">
                <button type="button" className="mp-btn-cancel" onClick={closePanel}>
                  Cancelar
                </button>
                <button type="submit" className="mp-btn-save" disabled={saving}>
                  {saving
                    ? <><span className="mp-btn-spinner" />Guardando…</>
                    : <><SaveIcon />Guardar cambios</>
                  }
                </button>
              </div>
            </form>
          )}

          {tab === 'seguridad' && (
            <form className="mp-form" onSubmit={handleChangePw}>

              <div className="mp-security-info">
                <div className="mp-security-icon">🔐</div>
                <div>
                  <p className="mp-security-title">Cambiar contraseña</p>
                  <p className="mp-security-sub">Elige una contraseña segura de al menos 6 caracteres.</p>
                </div>
              </div>

              <div className="mp-field">
                <label>Contraseña actual <span className="mp-req">*</span></label>
                <input
                  type="password"
                  name="passwordActual"
                  value={pwForm.passwordActual}
                  onChange={handlePwChange}
                  placeholder="••••••••"
                  className={pwCurrentError ? 'mp-input-error' : ''}
                  required
                />
                {pwCurrentError && <span className="mp-pw-hint mp-pw-hint--error">{pwCurrentError}</span>}
              </div>

              <div className="mp-field">
                <label>Nueva contraseña <span className="mp-req">*</span></label>
                <input type="password" name="passwordNueva" value={pwForm.passwordNueva} onChange={handlePwChange} placeholder="••••••••" minLength={6} required />
                <PasswordStrength password={pwForm.passwordNueva} />
              </div>

              <div className="mp-field">
                <label>Confirmar nueva contraseña <span className="mp-req">*</span></label>
                <div className="mp-pw-confirm-wrap">
                  <input type="password" name="passwordConfirm" value={pwForm.passwordConfirm} onChange={handlePwChange} placeholder="••••••••" required />
                  {pwForm.passwordConfirm && (
                    <span className={`mp-pw-match-icon${pwForm.passwordNueva === pwForm.passwordConfirm ? ' mp-pw-match' : ''}`}>
                      {pwForm.passwordNueva === pwForm.passwordConfirm ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                {pwForm.passwordConfirm && pwForm.passwordNueva !== pwForm.passwordConfirm && (
                  <span className="mp-pw-hint mp-pw-hint--error">Las contraseñas no coinciden</span>
                )}
                {pwForm.passwordConfirm && pwForm.passwordNueva === pwForm.passwordConfirm && (
                  <span className="mp-pw-hint mp-pw-hint--ok">Las contraseñas coinciden</span>
                )}
              </div>

              <div className="mp-form-actions">
                <button type="button" className="mp-btn-cancel" onClick={closePanel}>
                  Cancelar
                </button>
                <button type="submit" className="mp-btn-save" disabled={saving}>
                  {saving
                    ? <><span className="mp-btn-spinner" />Guardando…</>
                    : <><SaveIcon />Cambiar contraseña</>
                  }
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}