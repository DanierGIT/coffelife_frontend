import { useEffect, useState } from 'react'
import './PerfilExperto.css'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { BiSave, BiArrowBack } from 'react-icons/bi'

export default function ConfigurarExperto({ onNavigate }) {
  const { user } = useAuth()
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [tab, setTab]           = useState('info')

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
            nombre:   user.nombre   || '',
            apellido: user.apellido || '',
            correo:   user.correo   || '',
            telefono: user.telefono || '',
            observaciones: '',
          })
        }
      })
  }, [user])

  const handleChange   = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handlePwChange = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value })

  const handleSavePersonal = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put('/mi-perfil', {
        nombre: form.nombre, apellido: form.apellido,
        telefono: form.telefono, observaciones: form.observaciones,
      })
      setSuccess('Información personal actualizada correctamente.')
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo actualizar la información.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSecurity = async (e) => {
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
    if (pwForm.passwordNueva !== pwForm.passwordConfirm) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }
    setSaving(true)
    try {
      await api.post('/mi-perfil/cambiar-password', {
        passwordActual: pwForm.passwordActual,
        nuevaPassword: pwForm.passwordNueva,
      })
      setSuccess('Contraseña actualizada correctamente.')
      setPwForm({ passwordActual: '', passwordNueva: '', passwordConfirm: '' })
    } catch (err) {
      const msg = err?.response?.data?.message || 'No se pudo cambiar la contraseña.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const goBack = () => onNavigate('perfil')

  return (
    <div className="ec-page">
      <div className="ec-header">
        <button className="ec-back-btn" onClick={goBack}>
          <BiArrowBack size={18} />
          Volver al perfil
        </button>
        <div className="ec-tabs">
          <button
            className={`ec-tab${tab === 'info' ? ' active' : ''}`}
            onClick={() => { setTab('info'); setError(''); setSuccess('') }}
          >
            Información personal
          </button>
          <button
            className={`ec-tab${tab === 'seguridad' ? ' active' : ''}`}
            onClick={() => { setTab('seguridad'); setError(''); setSuccess('') }}
          >
            Seguridad
          </button>
        </div>
      </div>

      <div className="ec-body">
        {error   && <div className="ep-alert ep-alert--error">⚠ {error}</div>}
        {success && <div className="ep-alert ep-alert--success">✓ {success}</div>}

        {tab === 'info' && (
          <form className="ec-form" onSubmit={handleSavePersonal}>
            <div className="ep-section-label">Datos personales</div>

            <div className="ep-form-row">
              <div className="ep-field">
                <label>Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre" />
              </div>
              <div className="ep-field">
                <label>Apellido</label>
                <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Tu apellido" />
              </div>
            </div>

            <div className="ep-field">
              <label>Correo electrónico</label>
              <div className="ep-input-locked">
                <input type="email" value={form.correo} disabled />
                <span className="ep-locked-badge">No editable</span>
              </div>
            </div>

            <div className="ep-field">
              <label>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+57 310 123 4567" />
            </div>

            <div className="ep-field">
              <label>Observaciones</label>
              <textarea name="observaciones" rows={3} value={form.observaciones} onChange={handleChange} placeholder="Notas adicionales..." />
            </div>

            <div className="ep-form-actions">
              <button type="button" className="ep-btn-cancel" onClick={goBack}>Cancelar</button>
              <button type="submit" className="ep-btn-save" disabled={saving}>
                {saving
                  ? <><span className="ep-btn-spinner" />Guardando…</>
                  : <><BiSave size={14} />Guardar cambios</>
                }
              </button>
            </div>
          </form>
        )}

        {tab === 'seguridad' && (
          <form className="ec-form" onSubmit={handleSaveSecurity}>
            <div className="ep-section-label">Cambiar contraseña</div>

            <div className="ep-field">
              <label>Contraseña actual <span className="ep-req">*</span></label>
              <input type="password" name="passwordActual" value={pwForm.passwordActual} onChange={handlePwChange} placeholder="••••••••" required />
            </div>

            <div className="ep-form-row">
              <div className="ep-field">
                <label>Nueva contraseña <span className="ep-req">*</span></label>
                <input type="password" name="passwordNueva" value={pwForm.passwordNueva} onChange={handlePwChange} placeholder="Mín. 6 caracteres" minLength={6} required />
              </div>
              <div className="ep-field">
                <label>Confirmar <span className="ep-req">*</span></label>
                <input type="password" name="passwordConfirm" value={pwForm.passwordConfirm} onChange={handlePwChange} placeholder="Repite la contraseña" required />
              </div>
            </div>

            <div className="ep-form-actions">
              <button type="button" className="ep-btn-cancel" onClick={goBack}>Cancelar</button>
              <button type="submit" className="ep-btn-save" disabled={saving}>
                {saving
                  ? <><span className="ep-btn-spinner" />Guardando…</>
                  : <><BiSave size={14} />Actualizar contraseña</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
