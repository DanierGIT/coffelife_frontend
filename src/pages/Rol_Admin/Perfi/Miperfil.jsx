/**
 * MiPerfil.jsx
 * Conectado al backend: carga los datos del usuario logueado desde localStorage
 * y permite actualizar via PUT /usuarios/:id
 */

import { useEffect, useRef, useState } from 'react'
import './miperfil.css'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'

const DEFAULT_PROFILE = {
  nombre: '', apellido: '', correo: '', telefono: '', observaciones: '',
}

function getInitials(nombre = '', apellido = '') {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase() || '?'
}

export default function MiPerfil() {
  const { user } = useAuth()
  const [loading,   setLoading]   = useState(true)
  const [profile,   setProfile]   = useState(DEFAULT_PROFILE)
  const [modalOpen, setModalOpen] = useState(false)
  const [form,      setForm]      = useState(DEFAULT_PROFILE)
  const [message,   setMessage]   = useState('')
  const overlayRef = useRef(null)

  const userId = user?.idUsuario

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    api.get(`/usuarios/${userId}`)
      .then((res) => {
        const d = res.data
        setProfile({
          nombre:        d.nombre        || '',
          apellido:      d.apellido      || '',
          correo:        d.correo        || '',
          telefono:      d.telefono      || '',
          observaciones: d.observaciones || '',
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  const openModal = () => {
    setForm({ ...profile, password: '' })
    setMessage('')
    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)

  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async () => {
    setMessage('')
    try {
      const payload = {
        nombre:        form.nombre,
        apellido:      form.apellido,
        correo:        form.correo,
        telefono:      form.telefono,
        observaciones: form.observaciones,
      }
      if (form.password) payload.password = form.password
      await api.put(`/usuarios/${userId}`, payload)
      setProfile({ ...payload })
      setMessage('✅ Perfil actualizado correctamente')
      closeModal()
    } catch (err) {
      setMessage('❌ ' + (err?.response?.data?.message || 'Error al actualizar perfil'))
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) closeModal()
  }

  if (loading) return <p className="profile-loading">Cargando perfil...</p>

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-cover" />

        <div className="profile-avatar-row">
          <div className="profile-avatar">
            {getInitials(profile.nombre, profile.apellido)}
          </div>
          <button className="profile-edit-btn" onClick={openModal}>
            Editar perfil
          </button>
        </div>

        <div className="profile-info">
          <p className="profile-name">{profile.nombre} {profile.apellido}</p>
          <p className="profile-handle">@{profile.correo?.split('@')[0] || 'usuario'}</p>

          <div className="profile-fields">
            <div className="profile-field">
              <span className="field-label">Correo</span>
              <span className="field-value">{profile.correo || '—'}</span>
            </div>
            <div className="profile-field">
              <span className="field-label">Teléfono</span>
              <span className="field-value">{profile.telefono || '—'}</span>
            </div>
            <div className="profile-field">
              <span className="field-label">Observaciones</span>
              <span className="field-value">{profile.observaciones || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {message && <p className="profile-message">{message}</p>}

      {modalOpen && (
        <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>Editar perfil</h2>
              <button className="modal-close" onClick={closeModal}>&#x2715;</button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre</label>
                  <input name="nombre" value={form.nombre} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Apellido</label>
                  <input name="apellido" value={form.apellido} onChange={handleFormChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Correo electrónico</label>
                  <input name="correo" type="email" value={form.correo} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input name="telefono" value={form.telefono} onChange={handleFormChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Observaciones</label>
                <textarea name="observaciones" rows={3} value={form.observaciones} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Nueva contraseña <span style={{opacity:.6, fontWeight:400}}>(dejar vacío para no cambiar)</span></label>
                <input name="password" type="password" value={form.password || ''} onChange={handleFormChange} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Cancelar</button>
              <button className="btn-save"   onClick={handleSave}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
