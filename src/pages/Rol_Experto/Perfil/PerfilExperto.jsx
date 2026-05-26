import { useState, useEffect } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import PasswordStrength from '../../../components/PasswordStrength'
import './PerfilExperto.css'

export default function PerfilExperto() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({
    nombre:        '',
    apellido:      '',
    telefono:      '',
    observaciones: '',
  })
  const [pwForm, setPwForm] = useState({
    passwordActual:  '',
    password_nueva:  '',
    password_confirm: '',
  })
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')
  const [tab,     setTab]     = useState('info')

  // ✅ Carga perfil desde /mi_perfil en lugar de leer solo el localStorage
  useEffect(() => {
    api.get('/mi-perfil')
      .then((res) => {
        const d = res.data?.data || res.data
        setForm({
          nombre:        d.nombre        || '',
          apellido:      d.apellido      || '',
          telefono:      d.telefono      || '',
          observaciones: d.observaciones || '',
        })
      })
      .catch(() => {
        // Si falla, usa los datos del contexto como fallback
        if (user) {
          setForm({
            nombre:        user.nombre        || '',
            apellido:      user.apellido      || '',
            telefono:      user.telefono      || '',
            observaciones: user.observaciones || '',
          })
        }
      })
  }, [user])

  // ✅ Guarda via PUT /mi_perfil (no /usuarios/:id)
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put('/mi-perfil', {
        nombre:        form.nombre,
        apellido:      form.apellido,
        telefono:      form.telefono,
        observaciones: form.observaciones,
      })
      setSuccess('Perfil actualizado correctamente.')
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo actualizar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  // ✅ Cambia contraseña via POST /mi_perfil/cambiar_password
  const handleChangePw = async (e) => {
    e.preventDefault()
    if (pwForm.password_nueva !== pwForm.password_confirm) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }
    if (pwForm.password_nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/mi-perfil/cambiar-password', {
        passwordActual: pwForm.passwordActual,
        nuevaPassword:  pwForm.password_nueva,
      })
      setSuccess('Contraseña actualizada correctamente.')
      setPwForm({ passwordActual: '', password_nueva: '', password_confirm: '' })
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo cambiar la contraseña.')
    } finally {
      setSaving(false)
    }
  }

  const initials = ((user?.nombre?.[0] || '') + (user?.apellido?.[0] || '')).toUpperCase() || 'E'
  const displayName = `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || user?.correo || 'Experto'

  return (
    <div className="perf-page">
      <div className="perf-header">
        <h1>Perfil del experto</h1>
        <p>Información personal y profesional</p>
      </div>

      {error   && <p className="perf-error">{error}</p>}
      {success && <p className="perf-success">{success}</p>}

      <div className="perf-content">
        {/* Tarjeta izquierda */}
        <div className="perf-card-left">
          <div className="perf-avatar-big">{initials}</div>
          <h2>{displayName}</h2>
          <p className="perf-role">Experto Agrónomo</p>
          <div className="perf-contact">
            <div className="perf-contact-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>{user?.correo || '—'}</span>
            </div>
            {(form.telefono || user?.telefono) && (
              <div className="perf-contact-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.18z"/>
                </svg>
                <span>{form.telefono || user?.telefono}</span>
              </div>
            )}
          </div>
          <div className="perf-cuenta">
            <h4>Cuenta</h4>
            <div className="perf-cuenta-row"><span>Rol</span><strong>Experto</strong></div>
            <div className="perf-cuenta-row"><span>Estado</span><span className="perf-estado-badge">Activo</span></div>
          </div>
          <button className="perf-logout" onClick={logout}>Cerrar sesión</button>
        </div>

        {/* Panel derecho */}
        <div className="perf-panel-right">
          <div className="perf-tabs">
            <button className={`perf-tab${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>
              Información personal
            </button>
            <button className={`perf-tab${tab === 'seguridad' ? ' active' : ''}`} onClick={() => setTab('seguridad')}>
              Seguridad
            </button>
          </div>

          {tab === 'info' && (
            <form className="perf-form" onSubmit={handleSave}>
              <div className="perf-form-row">
                <label>Nombre
                  <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </label>
                <label>Apellido
                  <input value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
                </label>
              </div>
              <label>Correo electrónico
                <input type="email" value={user?.correo || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </label>
              <label>Teléfono
                <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+57 310 123 4567" />
              </label>
              <label>Observaciones
                <textarea rows={3} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Especializado en sanidad vegetal…" />
              </label>
              <div className="perf-form-actions">
                <button type="submit" className="btn-guardar" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}

          {tab === 'seguridad' && (
            <form className="perf-form" onSubmit={handleChangePw}>
              <h4 className="perf-section-title">Cambiar contraseña</h4>
              <label>Contraseña actual
                <input
                  type="password"
                  value={pwForm.passwordActual}
                  onChange={e => setPwForm(f => ({ ...f, passwordActual: e.target.value }))}
                  required
                />
              </label>
              <label>Nueva contraseña
                <input
                  type="password"
                  value={pwForm.password_nueva}
                  onChange={e => setPwForm(f => ({ ...f, password_nueva: e.target.value }))}
                  required
                />
                <PasswordStrength password={pwForm.password_nueva} />
              </label>
              <label>Confirmar nueva contraseña
                <input
                  type="password"
                  value={pwForm.password_confirm}
                  onChange={e => setPwForm(f => ({ ...f, password_confirm: e.target.value }))}
                  required
                />
              </label>
              <div className="perf-form-actions">
                <button type="submit" className="btn-guardar" disabled={saving}>
                  {saving ? 'Guardando…' : 'Cambiar contraseña'}
                </button>
              </div>

              <h4 className="perf-section-title" style={{ marginTop: 24 }}>Notificaciones</h4>
              <label className="perf-toggle-label">
                <span>Recibir notificaciones por correo</span>
                <input type="checkbox" defaultChecked />
              </label>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}