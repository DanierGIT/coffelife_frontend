/**
 * MiPerfil.jsx
 * Diseño PREMIUM profesional — Estilo Coffee Life ☕
 * Estructura limpia de dos columnas sin modales invasivos para la edición.
 */

import { useEffect, useRef, useState } from 'react'
import './miperfil.css'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'

const DEFAULT_PROFILE = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  observaciones: '',
  fotoPerfil: '',
}

function getInitials(nombre = '', apellido = '') {
  return (
    ((nombre[0] || '') + (apellido[0] || '')).toUpperCase() || '?'
  )
}

export default function MiPerfil() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [form, setForm] = useState(DEFAULT_PROFILE)
  const [activeTab, setActiveTab] = useState('personales') // 'personales' | 'seguridad'
  const [imageModal, setImageModal] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [preview, setPreview] = useState('')
  const [foto, setFoto] = useState(null)
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef(null)
  const userId = user?.id || user?.idUsuario

  // =========================================
  // LOAD PROFILE
  // =========================================
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return;
    }

    api
      .get(`/usuarios/${userId}`)
      .then((res) => {
        const d = res.data
        const userData = {
          nombre: d.nombre || '',
          apellido: d.apellido || '',
          correo: d.correo || '',
          telefono: d.telefono || '',
          observaciones: d.observaciones || '',
          fotoPerfil: d.fotoPerfil || '',
        }
        setProfile(userData)
        setForm({ ...userData, password: '' })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  // =========================================
  // INPUTS
  // =========================================
  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  // =========================================
  // IMAGE MANAGEMENT
  // =========================================
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFoto(file)
    setPreview(URL.createObjectURL(file))
    setMessage('Imagen seleccionada. No olvides guardar los cambios.')
  }

  const openFileSelector = (e) => {
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  // =========================================
  // SAVE DATA
  // =========================================
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('nombre', form.nombre)
      formData.append('apellido', form.apellido)
      formData.append('correo', form.correo)
      formData.append('telefono', form.telefono)
      formData.append('observaciones', form.observaciones)

      if (form.password) {
        formData.append('password', form.password)
      }

      if (foto) {
        formData.append('foto_perfil', foto)
      }

      const res = await api.put(`/usuarios/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const updatedData = res.data.data
      setProfile(updatedData)
      setForm({ ...updatedData, password: '' })
      setPreview('')
      setFoto(null)
      setMessage('Perfil actualizado correctamente')
    } catch (err) {
      console.error(err)
      setErrorMsg(
        err?.response?.data?.message || 'Error al actualizar el perfil'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="profile-loading">Cargando perfil...</div>
  }

  return (
    <>
      <div className="perfil-header-top">
        <h1 className="admin-page-title">Perfil del Experto</h1>
        <p className="admin-page-subtitle">Gestiona tu información de usuario y credenciales de acceso</p>
      </div>

      <div className="perfil-layout-container">
        
        {/* ─── COLUMNA IZQUIERDA: TARJETA DE IDENTIDAD ─── */}
        <div className="perfil-sidebar-card">
          <div 
            className="profile-avatar-wrapper"
            onClick={() => {
              if (profile.fotoPerfil || preview) {
                setImageModal(true)
              }
            }}
          >
            {preview || profile.fotoPerfil ? (
              <img
                src={preview || profile.fotoPerfil}
                alt="Perfil"
                className="profile-avatar-img"
              />
            ) : (
              <div className="avatar-iniciales">
                {getInitials(profile.nombre, profile.apellido)}
              </div>
            )}
            
            <button className="avatar-camera-overlay" onClick={openFileSelector} type="button">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>

          <h2 className="perfil-nombre-title">
            {profile.nombre} {profile.apellido}
          </h2>
          <span className="perfil-badge-rol">Experto Agrónomo</span>

          <div className="perfil-info-contacto-list">
            <div className="perfil-contacto-item">
              <span>✉️</span> {profile.correo || '—'}
            </div>
            <div className="perfil-contacto-item">
              <span>📞</span> {profile.telefono || '—'}
            </div>
          </div>

          <div className="perfil-meta-cuenta-box">
            <h3 className="perfil-meta-titulo">Estado de Cuenta</h3>
            <div className="perfil-meta-row">
              <span className="perfil-meta-label">ID Usuario</span>
              <span className="perfil-meta-value">#{userId}</span>
            </div>
            <div className="perfil-meta-row">
              <span className="perfil-meta-label">Estatus</span>
              <span className="perfil-meta-value badge-activo-status">Activo</span>
            </div>
          </div>
        </div>

        {/* ─── COLUMNA DERECHA: PANEL PRINCIPAL CON PESTAÑAS ─── */}
        <div className="perfil-main-card">
          <div className="perfil-tabs-header">
            <button
              className={`perfil-tab-btn ${activeTab === 'personales' ? 'active' : ''}`}
              onClick={() => setActiveTab('personales')}
            >
              Información Personal
            </button>
            <button
              className={`perfil-tab-btn ${activeTab === 'seguridad' ? 'active' : ''}`}
              onClick={() => setActiveTab('seguridad')}
            >
              Seguridad y Acceso
            </button>
          </div>

          <div className="perfil-tabs-content">
            <form onSubmit={handleSave} className="perfil-grid-form">
              
              {/* VISTA 1: DATOS PERSONALES */}
              {activeTab === 'personales' && (
                <>
                  <div className="perfil-form-row">
                    <div className="perfil-input-group">
                      <label>Nombre</label>
                      <input
                        name="nombre"
                        type="text"
                        value={form.nombre}
                        onChange={handleFormChange}
                        placeholder="Ingresa tu nombre"
                        required
                      />
                    </div>
                    <div className="perfil-input-group">
                      <label>Apellido</label>
                      <input
                        name="apellido"
                        type="text"
                        value={form.apellido}
                        onChange={handleFormChange}
                        placeholder="Ingresa tu apellido"
                        required
                      />
                    </div>
                  </div>

                  <div className="perfil-form-row">
                    <div className="perfil-input-group">
                      <label>Correo Electrónico</label>
                      <input
                        name="correo"
                        type="email"
                        value={form.correo}
                        onChange={handleFormChange}
                        placeholder="ejemplo@coffeelife.com"
                        required
                      />
                    </div>
                    <div className="perfil-input-group">
                      <label>Teléfono Celular</label>
                      <input
                        name="telefono"
                        type="text"
                        value={form.telefono}
                        onChange={handleFormChange}
                        placeholder="Ej: 3125896558"
                      />
                    </div>
                  </div>

                  <div className="perfil-input-group">
                    <label>Observaciones Profesionales</label>
                    <textarea
                      name="observaciones"
                      rows="4"
                      value={form.observaciones}
                      onChange={handleFormChange}
                      placeholder="Agrega descripciones o apuntes de tu perfil de experto agrónomo..."
                    />
                  </div>
                </>
              )}

              {/* VISTA 2: SEGURIDAD (CONTRASEÑA) */}
              {activeTab === 'seguridad' && (
                <div className="perfil-seguridad-wrapper">
                  <div className="perfil-input-group security-input">
                    <label>Nueva Contraseña</label>
                    <input
                      name="password"
                      type="password"
                      value={form.password || ''}
                      onChange={handleFormChange}
                      placeholder="Dejar en blanco para no cambiar"
                    />
                    <small className="input-help-text">
                      Si no deseas modificar tu contraseña de acceso actual, mantén este campo totalmente vacío.
                    </small>
                  </div>
                </div>
              )}

              {/* ALERTAS DE RESPUESTA */}
              {message && <div className="perfil-alert-success">{message}</div>}
              {errorMsg && <div className="perfil-alert-danger">{errorMsg}</div>}

              {/* BOTÓN FLOTANTE INTEGRADO */}
              <div className="perfil-form-actions">
                <button type="submit" className="btn-guardar-perfil" disabled={saving}>
                  {saving ? 'Guardando cambios...' : 'Guardar cambios'}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

      {/* MODAL FULLSCREEN PARA VER FOTO DE PERFIL */}
      {imageModal && (
        <div className="image-modal-overlay" onClick={() => setImageModal(false)}>
          <div className="image-modal-wrapper">
            <img
              src={preview || profile.fotoPerfil}
              alt="Visualización ampliada"
              className="image-modal-img"
            />
            <button className="close-image-modal">✕</button>
          </div>
        </div>
      )}
    </>
  )
}