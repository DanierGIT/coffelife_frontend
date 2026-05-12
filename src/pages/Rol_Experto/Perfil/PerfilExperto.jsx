import { useState, useEffect } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './PerfilExperto.css'

export default function PerfilExperto() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({
    nombre:   '',
    apellido: '',
    correo:   '',
    telefono: '',
    empresa:  '',
    años_exp: '',
    observaciones: '',
  })
  const [pwForm, setPwForm] = useState({ password_actual: '', password_nueva: '', password_confirm: '' })
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')
  const [tab,     setTab]     = useState('info')

  useEffect(() => {
    if (user) {
      setForm({
        nombre:   user.nombre   || '',
        apellido: user.apellido || '',
        correo:   user.correo   || '',
        telefono: user.telefono || '',
        empresa:  user.empresa  || '',
        años_exp: user.años_exp || '',
        observaciones: user.observaciones || '',
      })
    }
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put(`/usuarios/${user.idUsuario}`, form)
      setSuccess('Perfil actualizado correctamente.')
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo actualizar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePw = async (e) => {
    e.preventDefault()
    if (pwForm.password_nueva !== pwForm.password_confirm) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put(`/usuarios/${user.idUsuario}/password`, {
        password_actual: pwForm.password_actual,
        password_nueva:  pwForm.password_nueva,
      })
      setSuccess('Contraseña actualizada correctamente.')
      setPwForm({ password_actual: '', password_nueva: '', password_confirm: '' })
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>{user?.correo || '—'}</span>
            </div>
            {user?.telefono && (
              <div className="perf-contact-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.18z"/></svg>
                <span>{user.telefono}</span>
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
            <button className={`perf-tab${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>Información personal</button>
            <button className={`perf-tab${tab === 'seguridad' ? ' active' : ''}`} onClick={() => setTab('seguridad')}>Seguridad</button>
          </div>

          {tab === 'info' && (
            <form className="perf-form" onSubmit={handleSave}>
              <div className="perf-form-row">
                <label>Nombre
                  <input value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} />
                </label>
                <label>Apellido
                  <input value={form.apellido} onChange={e => setForm(f => ({...f, apellido: e.target.value}))} />
                </label>
              </div>
              <label>Correo electrónico
                <input type="email" value={form.correo} onChange={e => setForm(f => ({...f, correo: e.target.value}))} />
              </label>
              <label>Teléfono
                <input value={form.telefono} onChange={e => setForm(f => ({...f, telefono: e.target.value}))} placeholder="+57 310 123 4567" />
              </label>

              <h4 className="perf-section-title">Información profesional</h4>
              <div className="perf-form-row">
                <label>Entidad / Empresa
                  <input value={form.empresa} onChange={e => setForm(f => ({...f, empresa: e.target.value}))} placeholder="AgroConsultores SAS" />
                </label>
                <label>Años de experiencia
                  <input type="number" value={form.años_exp} onChange={e => setForm(f => ({...f, años_exp: e.target.value}))} placeholder="10" />
                </label>
              </div>
              <label>Observaciones
                <textarea rows={3} value={form.observaciones} onChange={e => setForm(f => ({...f, observaciones: e.target.value}))} placeholder="Especializado en sanidad vegetal…" />
              </label>

              <div className="perf-form-actions">
                <button type="submit" className="btn-guardar" disabled={saving}>{saving ? 'Guardando…' : 'Editar perfil'}</button>
              </div>
            </form>
          )}

          {tab === 'seguridad' && (
            <form className="perf-form" onSubmit={handleChangePw}>
              <h4 className="perf-section-title">Cambiar contraseña</h4>
              <label>Contraseña actual
                <input type="password" value={pwForm.password_actual} onChange={e => setPwForm(f => ({...f, password_actual: e.target.value}))} required />
              </label>
              <label>Nueva contraseña
                <input type="password" value={pwForm.password_nueva} onChange={e => setPwForm(f => ({...f, password_nueva: e.target.value}))} required />
              </label>
              <label>Confirmar nueva contraseña
                <input type="password" value={pwForm.password_confirm} onChange={e => setPwForm(f => ({...f, password_confirm: e.target.value}))} required />
              </label>
              <div className="perf-form-actions">
                <button type="submit" className="btn-guardar" disabled={saving}>{saving ? 'Guardando…' : 'Cambiar contraseña'}</button>
              </div>

              <h4 className="perf-section-title" style={{ marginTop: 24 }}>Sincronización de datos</h4>
              <p style={{ fontSize: 13, color: '#6b7280' }}>Los datos se sincronizan automáticamente con el servidor.</p>

              <h4 className="perf-section-title" style={{ marginTop: 16 }}>Notificaciones</h4>
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
