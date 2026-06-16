import { useEffect, useState, useRef } from 'react'
import './miperfil.css'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import PasswordStrength from '../../../components/PasswordStrength'
import Loading from '../../../components/Loading'
import {
  BiEnvelope, BiPhone, BiUser, BiLogOut,
  BiCloudUpload, BiSave, BiLockAlt,
  BiEdit, BiCheck, BiX, BiShield,
} from 'react-icons/bi'

function getInitials(nombre = '', apellido = '') {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase() || 'U'
}
//.
export default function MiPerfil() {
  const { user, logout, updateUser } = useAuth()

  const [loading,      setLoading]      = useState(true)
  const [editando,     setEditando]     = useState(false)
  const [savingInfo,   setSavingInfo]   = useState(false)
  const [savingPw,     setSavingPw]     = useState(false)
  const [errorInfo,    setErrorInfo]    = useState('')
  const [successInfo,  setSuccessInfo]  = useState('')
  const [errorPw,      setErrorPw]      = useState('')
  const [successPw,    setSuccessPw]    = useState('')
  const [pwCurrentErr, setPwCurrentErr] = useState('')
  const [fotoPreview,  setFotoPreview]  = useState(null)
  const [fotoFile,     setFotoFile]     = useState(null)
  const inputFotoRef = useRef(null)

  // ── Estado para controlar la pestaña activa en responsivo ──
  const [activeTab, setActiveTab] = useState('datos') // 'datos' o 'seguridad'

  // Datos guardados (solo lectura)
  const [data, setData] = useState({
    nombre: '', apellido: '', correo: '', telefono: '', fotoPerfil: '',
  })
  // Copia editable del formulario
  const [form, setForm] = useState({ ...data })

  const [pwForm, setPwForm] = useState({
    passwordActual: '', passwordNueva: '', passwordConfirm: '',
  })

  // ── Carga inicial ──
  useEffect(() => {
    api.get('/mi-perfil')
      .then((res) => {
        const d = res.data?.data || res.data
        const parsed = {
          nombre:     d.nombre     || '',
          apellido:   d.apellido   || '',
          correo:     d.correo     || '',
          telefono:   d.telefono   || '',
          fotoPerfil: d.fotoPerfil || '',
        }
        setData(parsed)
        setForm(parsed)
      })
      .catch(() => {
        if (user) {
          const fallback = {
            nombre:     user.nombre   || '',
            apellido:   user.apellido || '',
            correo:     user.correo   || '',
            telefono:   user.telefono || '',
            fotoPerfil: '',
          }
          setData(fallback)
          setForm(fallback)
        }
      })
      .finally(() => setLoading(false))
  }, [user])

  // ── Activar edición ──
  const handleStartEdit = () => {
    setForm({ ...data })
    setFotoPreview(null)
    setFotoFile(null)
    setErrorInfo('')
    setSuccessInfo('')
    setEditando(true)
  }

  // ── Cancelar edición ──
  const handleCancelEdit = () => {
    setForm({ ...data })
    setFotoPreview(null)
    setFotoFile(null)
    setErrorInfo('')
    setEditando(false)
  }

  // ── Guardar info personal ──
  const handleSaveInfo = async (e) => {
    e.preventDefault()
    setSavingInfo(true)
    setErrorInfo('')
    setSuccessInfo('')
    try {
      const fd = new FormData()
      fd.append('nombre',   form.nombre)
      fd.append('apellido', form.apellido)
      fd.append('telefono', form.telefono)
      if (fotoFile) fd.append('foto_perfil', fotoFile)
      const res     = await api.put('/mi-perfil', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const updated = res.data?.data || res.data
      const newData = {
        ...data,
        nombre:     form.nombre,
        apellido:   form.apellido,
        telefono:   form.telefono,
        fotoPerfil: updated?.fotoPerfil || data.fotoPerfil,
      }
      setData(newData)
      setForm(newData)
      setFotoFile(null)
      setFotoPreview(null)
      updateUser?.({ ...user, ...updated })
      setSuccessInfo('Perfil actualizado correctamente.')
      setEditando(false)
    } catch (err) {
      setErrorInfo(err?.response?.data?.message || 'No se pudo actualizar el perfil.')
    } finally {
      setSavingInfo(false)
    }
  }

  // ── Cambiar contraseña ──
  const handleChangePw = async (e) => {
    e.preventDefault()
    setErrorPw('')
    setSuccessPw('')
    setPwCurrentErr('')
    if (!pwForm.passwordActual.trim())                  { setErrorPw('Ingresa tu contraseña actual.'); return }
    if (pwForm.passwordNueva.length < 6)                { setErrorPw('Mínimo 6 caracteres.'); return }
    if (pwForm.passwordNueva === pwForm.passwordActual) { setErrorPw('La nueva contraseña debe ser diferente.'); return }
    if (pwForm.passwordNueva !== pwForm.passwordConfirm){ setErrorPw('Las contraseñas no coinciden.'); return }
    setSavingPw(true)
    try {
      await api.post('/mi-perfil/cambiar-password', {
        passwordActual: pwForm.passwordActual,
        nuevaPassword:  pwForm.passwordNueva,
      })
      setSuccessPw('Contraseña actualizada correctamente.')
      setPwForm({ passwordActual: '', passwordNueva: '', passwordConfirm: '' })
    } catch (err) {
      const status = err?.response?.status
      const msg    = err?.response?.data?.message || err?.response?.data?.error || ''
      if (status === 401 || status === 400) {
        setPwCurrentErr(msg || 'Contraseña actual incorrecta.')
      } else {
        setErrorPw(msg || 'No se pudo cambiar la contraseña.')
      }
    } finally {
      setSavingPw(false)
    }
  }

  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  if (loading) return <Loading type="content" text="Cargando perfil..." />

  const displayName = `${data.nombre} ${data.apellido}`.trim() || data.correo || 'Usuario'
  const fotoSrc     = fotoPreview || data.fotoPerfil || null
  const initials    = getInitials(data.nombre, data.apellido)

  return (
    <div className="mp-page">

      {/* ── Franja verde ── */}
      <div className="mp-top animate-left">
        <div className="mp-top-bg">
          <div className="mp-top-pattern" />
        </div>
        <div className="mp-top-content">

          {/* Avatar — clickeable solo cuando se edita */}
          <div
            className={`mp-avatar${editando ? ' mp-avatar--editable' : ''}`}
            onClick={() => editando && inputFotoRef.current?.click()}
            title={editando ? 'Cambiar foto' : undefined}
          >
            {fotoSrc
              ? <img src={fotoSrc} alt="Foto de perfil" className="mp-avatar-img" />
              : initials
            }
            {editando && (
              <div className="mp-avatar-overlay">
                <BiCloudUpload size={20} />
              </div>
            )}
          </div>

          <div className="mp-top-info">
            <h1 className="mp-user-name">{displayName}</h1>
            <span className="mp-role-pill">Administrador</span>
          </div>
        </div>
      </div>

      <input ref={inputFotoRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp"
        style={{ display: 'none' }} onChange={handleFotoChange} />

      {/* ── Cuerpo ── */}
      <div className="mp-body">

        {/* Barra de pestañas (Oculta en Desktop, visible al minimizar) */}
        <div className="mp-tabs-container">
          <button 
            type="button"
            className={`mp-tab-btn ${activeTab === 'datos' ? 'active' : ''}`}
            onClick={() => setActiveTab('datos')}
          >
            <BiUser size={16} /> Mis datos
          </button>
          <button 
            type="button"
            className={`mp-tab-btn ${activeTab === 'seguridad' ? 'active' : ''}`}
            onClick={() => setActiveTab('seguridad')}
          >
            <BiShield size={16} /> Cambiar contraseña
          </button>
        </div>

        {/* Dos columnas con clase dinámica para controlar responsivo */}
        <div className={`mp-two-col tab-active-${activeTab}`}>

          {/* ══ TARJETA IZQUIERDA — Mis datos ══ */}
          <div className="mp-card mp-card-datos animate-bottom delay-1">
            <div className="mp-card-header">
              <div className="mp-card-header-left">
                <div className="mp-card-icon"><BiUser size={17} /></div>
                <h3 className="mp-card-title">Mis datos</h3>
              </div>
              {!editando ? (
                <button type="button" className="mp-btn-edit" onClick={handleStartEdit}>
                  <BiEdit size={14} /> Editar
                </button>
              ) : (
                <button type="button" className="mp-btn-cancel-sm" onClick={handleCancelEdit}>
                  <BiX size={14} /> Cancelar
                </button>
              )}
            </div>

            {fotoPreview && editando && (
              <p className="mp-foto-hint">
                <BiCheck size={12} /> Foto lista — guarda para aplicar
              </p>
            )}

            {errorInfo   && <div className="mp-alert mp-alert--error"><BiX size={14} />{errorInfo}</div>}
            {successInfo && <div className="mp-alert mp-alert--success"><BiCheck size={14} />{successInfo}</div>}

            <form onSubmit={handleSaveInfo}>
              <div className="mp-fields">

                <div className="mp-field-row">
                  <div className="mp-field">
                    <label className="mp-field-label">Nombre</label>
                    {editando
                      ? <input className="mp-input" name="nombre" value={form.nombre}
                          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                          placeholder="Tu nombre" />
                      : <p className="mp-field-val">{data.nombre || '—'}</p>
                    }
                  </div>
                  <div className="mp-field">
                    <label className="mp-field-label">Apellido</label>
                    {editando
                      ? <input className="mp-input" name="apellido" value={form.apellido}
                          onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                          placeholder="Tu apellido" />
                      : <p className="mp-field-val">{data.apellido || '—'}</p>
                    }
                  </div>
                </div>

                <div className="mp-field">
                  <label className="mp-field-label">
                    <BiEnvelope size={13} /> Correo electrónico
                  </label>
                  {editando
                    ? (
                      <div className="mp-input-locked">
                        <input type="email" value={form.correo} disabled />
                        <span className="mp-locked-badge">No editable</span>
                      </div>
                    )
                    : <p className="mp-field-val">{data.correo || '—'}</p>
                  }
                </div>

                <div className="mp-field">
                  <label className="mp-field-label">
                    <BiPhone size={13} /> Teléfono
                  </label>
                  {editando
                    ? <input className="mp-input" name="telefono" value={form.telefono}
                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                        placeholder="+57 310 123 4567" />
                    : <p className="mp-field-val">{data.telefono || '—'}</p>
                  }
                </div>

                <div className="mp-field">
                  <label className="mp-field-label">Rol</label>
                  <p className="mp-field-val mp-field-val--badge">Administrador</p>
                </div>

                <div className="mp-field">
                  <label className="mp-field-label">Estado</label>
                  <p className="mp-field-val mp-field-val--active">
                    <span className="mp-status-dot" /> Activo
                  </p>
                </div>
              </div>

              {editando && (
                <div className="mp-card-actions">
                  <button type="submit" className="mp-btn-save" disabled={savingInfo}>
                    {savingInfo
                      ? <><span className="mp-btn-spinner" /> Guardando...</>
                      : <><BiSave size={14} /> Guardar cambios</>
                    }
                  </button>
                </div>
              )}

              {!editando && (
                <div className="mp-card-actions mp-card-actions--bottom">
                  <button type="button" className="mp-btn-logout" onClick={logout}>
                    <BiLogOut size={15} /> Cerrar sesión
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* ══ TARJETA DERECHA — Cambiar contraseña ══ */}
          <div className="mp-card mp-card-seguridad animate-bottom delay-2">
            <div className="mp-card-header">
              <div className="mp-card-header-left">
                <div className="mp-card-icon"><BiShield size={17} /></div>
                <h3 className="mp-card-title">Seguridad</h3>
              </div>
            </div>

            <div className="mp-security-info">
              <BiLockAlt size={20} className="mp-security-icon-inline" />
              <div>
                <p className="mp-security-title">Cambiar contraseña</p>
                <p className="mp-security-sub">Mínimo 6 caracteres. Elige una contraseña segura.</p>
              </div>
            </div>

            {errorPw   && <div className="mp-alert mp-alert--error"><BiX size={14} />{errorPw}</div>}
            {successPw && <div className="mp-alert mp-alert--success"><BiCheck size={14} />{successPw}</div>}

            <form onSubmit={handleChangePw}>
              <div className="mp-fields">
                <div className="mp-field">
                  <label className="mp-field-label">Contraseña actual <span className="mp-req">*</span></label>
                  <input
                    className={`mp-input${pwCurrentErr ? ' mp-input--error' : ''}`}
                    type="password" name="passwordActual"
                    value={pwForm.passwordActual}
                    onChange={(e) => { setPwForm({ ...pwForm, passwordActual: e.target.value }); setPwCurrentErr('') }}
                    placeholder="••••••••" required
                  />
                  {pwCurrentErr && <span className="mp-hint mp-hint--error">{pwCurrentErr}</span>}
                </div>

                <div className="mp-field">
                  <label className="mp-field-label">Nueva contraseña <span className="mp-req">*</span></label>
                  <input
                    className="mp-input"
                    type="password" name="passwordNueva"
                    value={pwForm.passwordNueva}
                    onChange={(e) => setPwForm({ ...pwForm, passwordNueva: e.target.value })}
                    placeholder="••••••••" minLength={6} required
                  />
                  <PasswordStrength password={pwForm.passwordNueva} />
                </div>

                <div className="mp-field">
                  <label className="mp-field-label">Confirmar contraseña <span className="mp-req">*</span></label>
                  <div className="mp-pw-wrap">
                    <input
                      className="mp-input"
                      type="password" name="passwordConfirm"
                      value={pwForm.passwordConfirm}
                      onChange={(e) => setPwForm({ ...pwForm, passwordConfirm: e.target.value })}
                      placeholder="••••••••" required
                    />
                    {pwForm.passwordConfirm && (
                      <span className={`mp-pw-icon${pwForm.passwordNueva === pwForm.passwordConfirm ? ' mp-pw-icon--ok' : ''}`}>
                        {pwForm.passwordNueva === pwForm.passwordConfirm
                          ? <BiCheck size={15} />
                          : <BiX size={15} />
                        }
                      </span>
                    )}
                  </div>
                  {pwForm.passwordConfirm && pwForm.passwordNueva !== pwForm.passwordConfirm && (
                    <span className="mp-hint mp-hint--error">Las contraseñas no coinciden</span>
                  )}
                  {pwForm.passwordConfirm && pwForm.passwordNueva === pwForm.passwordConfirm && (
                    <span className="mp-hint mp-hint--ok">Las contraseñas coinciden</span>
                  )}
                </div>
              </div>

              <div className="mp-card-actions">
                <button type="submit" className="mp-btn-save" disabled={savingPw}>
                  {savingPw
                    ? <><span className="mp-btn-spinner" /> Guardando...</>
                    : <><BiSave size={14} /> Cambiar contraseña</>
                  }
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}