import { useEffect, useState, useRef } from 'react'
import './PerfilExperto.css'
import Loading from '../../../components/Loading'
import '../../../components/cargando.css'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { BiSave, BiCamera } from 'react-icons/bi'

export default function ConfigurarExperto({ onNavigate }) {
  const { user, updateUser } = useAuth()
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [tab, setTab]           = useState('info')
  const inputFotoRef = useRef()

  const [form, setForm] = useState({
    nombre: '', apellido: '', correo: '', telefono: '', observaciones: '', fotoPerfil: '',
  })
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)

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
          })
        }
      })
  }, [user])

  const handleChange   = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handlePwChange = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value })

  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const handleSavePersonal = async (e) => {
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
        setForm((prev) => ({ ...prev, fotoPerfil: updated.fotoPerfil }))
      }
      updateUser({ ...user, ...updated })
      setSuccess('Información personal actualizada correctamente.')
      setFotoFile(null)
      setFotoPreview(null)
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
            <div className="ep-foto-zone" onClick={() => inputFotoRef.current?.click()}>
              <div className="ep-foto-preview">
                {fotoPreview
                  ? <img src={fotoPreview} alt="preview" />
                  : form.fotoPerfil
                    ? <img src={form.fotoPerfil} alt="Foto de perfil" />
                    : <BiCamera size={28} />
                }
              </div>
              <div className="ep-foto-info">
                <p className="ep-foto-title">Foto de perfil</p>
                <p className="ep-foto-sub">JPG, PNG o WEBP · máx. 5 MB</p>
              </div>
              <button type="button" className="ep-foto-btn" onClick={(e) => { e.stopPropagation(); inputFotoRef.current?.click() }}>
                <BiCamera size={14} />
                Subir foto
              </button>
              <input ref={inputFotoRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFotoChange} />
            </div>
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
                  ? <Loading type="inline" text="Guardando…" />
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
                  ? <Loading type="inline" text="Guardando…" />
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
