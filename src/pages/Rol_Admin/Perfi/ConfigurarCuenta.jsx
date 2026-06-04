import { useEffect, useState, useRef } from 'react'
import './miperfil.css'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import PasswordStrength from '../../../components/PasswordStrength'
import { BiEnvelope, BiCloudUpload, BiSave, BiLockAlt, BiArrowBack } from 'react-icons/bi'

function getInitials(nombre = '', apellido = '') {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase() || 'A'
}

const MailIcon = () => <BiEnvelope size={15} />

const UploadIcon = () => <BiCloudUpload size={13} />

const SaveIcon = () => <BiSave size={14} />

const LockIcon = () => <BiLockAlt size={20} />

const ArrowLeftIcon = () => <BiArrowBack size={18} />

export default function ConfigurarCuenta({ onNavigate }) {
  const { user, updateUser } = useAuth()
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [tab, setTab]                 = useState('info')
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoFile, setFotoFile]       = useState(null)
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
      updateUser({ ...user, ...updated })
      setSuccess('Perfil actualizado correctamente.')
      setFotoFile(null)
      setFotoPreview(null)
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
    } catch (err) {
      const status = err?.response?.status
      const msg    = err?.response?.data?.message || err?.response?.data?.error || ''
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

  const goBack = () => onNavigate('perfil')

  const fotoSrc     = fotoPreview || form.fotoPerfil || null

  return (
    <div className="cc-page">
      <div className="cc-header">
        <button className="cc-back-btn" onClick={goBack}>
          <ArrowLeftIcon />
          Volver al perfil
        </button>
        <div className="cc-tabs">
          <button
            className={`cc-tab${tab === 'info' ? ' active' : ''}`}
            onClick={() => { setTab('info'); setError(''); setSuccess('') }}
          >
            Información
          </button>
          <button
            className={`cc-tab${tab === 'seguridad' ? ' active' : ''}`}
            onClick={() => { setTab('seguridad'); setError(''); setSuccess(''); setPwCurrentError('') }}
          >
            Seguridad
          </button>
        </div>
      </div>

      <div className="cc-body">
        {error   && <div className="mp-alert mp-alert--error"><span>⚠</span>{error}</div>}
        {success && <div className="mp-alert mp-alert--success"><span>✓</span>{success}</div>}

        {tab === 'info' && (
          <form className="cc-form" onSubmit={handleSave}>
            <div className="mp-photo-zone" onClick={() => inputFotoRef.current?.click()}>
              <div className="mp-photo-preview">
                {fotoSrc
                  ? <img src={fotoSrc} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : getInitials(form.nombre, form.apellido)
                }
              </div>
              <div className="mp-photo-info">
                <p className="mp-photo-title">Foto de perfil</p>
                <p className="mp-photo-sub">JPG, PNG o WEBP · máx. 5 MB</p>
              </div>
              <button type="button" className="mp-photo-btn" onClick={(e) => { e.stopPropagation(); inputFotoRef.current?.click() }}>
                <UploadIcon />
                Subir foto
              </button>
            </div>
            {fotoPreview && <p className="mp-foto-hint">✓ Foto lista — guarda para subir</p>}

            <input
              ref={inputFotoRef}
              type="file"
              accept="image/jpg,image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFotoChange}
            />

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
              <button type="button" className="mp-btn-cancel" onClick={goBack}>Cancelar</button>
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
          <form className="cc-form" onSubmit={handleChangePw}>
            <div className="mp-security-info">
              <div className="mp-security-icon"><LockIcon /></div>
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
              <button type="button" className="mp-btn-cancel" onClick={goBack}>Cancelar</button>
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
  )
}
