import { useState, useEffect } from 'react'
import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import './PerfilExperto.css'

export default function PerfilExperto() {

  // ✅ AGREGADO updateUser
  const { user, logout, updateUser } = useAuth()

  const [form, setForm] = useState({

    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    empresa: '',
    años_exp: '',
    observaciones: '',

  })

  const [pwForm, setPwForm] = useState({

    password_actual: '',
    password_nueva: '',
    password_confirm: '',

  })

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState('info')

  // =========================================
  // CARGAR DATOS DEL USUARIO
  // =========================================

  useEffect(() => {

    if (user) {

      setForm({

        nombre: user.nombre || '',
        apellido: user.apellido || '',
        correo: user.correo || '',
        telefono: user.telefono || '',
        empresa: user.empresa || '',
        años_exp: user.años_exp || '',
        observaciones: user.observaciones || '',

      })

    }

  }, [user])

  // =========================================
  // GUARDAR PERFIL
  // =========================================

  const handleSave = async (e) => {

    e.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {

      // 
      await api.put(

        `/usuarios/${user.idUsuario}`,
        form

      )

      // 
      const updatedUser = {

        ...user,
        ...form,

      }

      updateUser(updatedUser)

      setSuccess(
        'Perfil actualizado correctamente.'
      )

    } catch (err) {

      setError(

        err?.response?.data?.message ||
        'No se pudo actualizar el perfil.'

      )

    } finally {

      setSaving(false)

    }

  }

  // =========================================
  // CAMBIAR PASSWORD
  // =========================================

  const handleChangePw = async (e) => {

    e.preventDefault()

    if (
      pwForm.password_nueva !==
      pwForm.password_confirm
    ) {

      setError(
        'Las contraseñas nuevas no coinciden.'
      )

      return

    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {

      await api.put(

        `/usuarios/${user.idUsuario}/password`,

        {

          password_actual:
            pwForm.password_actual,

          password_nueva:
            pwForm.password_nueva,

        }

      )

      setSuccess(
        'Contraseña actualizada correctamente.'
      )

      setPwForm({

        password_actual: '',
        password_nueva: '',
        password_confirm: '',

      })

    } catch (err) {

      setError(

        err?.response?.data?.message ||
        'No se pudo cambiar la contraseña.'

      )

    } finally {

      setSaving(false)

    }

  }

  // =========================================
  // DATOS VISUALES
  // =========================================

  const initials = (

    (user?.nombre?.[0] || '') +
    (user?.apellido?.[0] || '')

  ).toUpperCase() || 'E'

  const displayName =

    `${user?.nombre || ''} ${user?.apellido || ''}`.trim() ||
    user?.correo ||
    'Experto'

  // =========================================
  // JSX
  // =========================================

  return (

    <div className="perf-page">

      <div className="perf-header">

        <h1>
          Perfil del experto
        </h1>

        <p>
          Información personal y profesional
        </p>

      </div>

      {error && (

        <p className="perf-error">
          {error}
        </p>

      )}

      {success && (

        <p className="perf-success">
          {success}
        </p>

      )}

      <div className="perf-content">

        {/* ========================================= */}
        {/* TARJETA IZQUIERDA */}
        {/* ========================================= */}

        <div className="perf-card-left">

          <div className="perf-avatar-big">
            {initials}
          </div>

          <h2>
            {displayName}
          </h2>

          <p className="perf-role">
            Experto Agrónomo
          </p>

          <div className="perf-contact">

            <div className="perf-contact-row">

              <span>
                {user?.correo || '—'}
              </span>

            </div>

            {user?.telefono && (

              <div className="perf-contact-row">

                <span>
                  {user.telefono}
                </span>

              </div>

            )}

          </div>

          <div className="perf-cuenta">

            <h4>
              Cuenta
            </h4>

            <div className="perf-cuenta-row">

              <span>
                Rol
              </span>

              <strong>
                Experto
              </strong>

            </div>

            <div className="perf-cuenta-row">

              <span>
                Estado
              </span>

              <span className="perf-estado-badge">
                Activo
              </span>

            </div>

          </div>

          <button
            className="perf-logout"
            onClick={logout}
          >

            Cerrar sesión

          </button>

        </div>

        {/* ========================================= */}
        {/* PANEL DERECHO */}
        {/* ========================================= */}

        <div className="perf-panel-right">

          <div className="perf-tabs">

            <button
              className={`perf-tab ${
                tab === 'info'
                  ? ' active'
                  : ''
              }`}
              onClick={() => setTab('info')}
            >

              Información personal

            </button>

            <button
              className={`perf-tab ${
                tab === 'seguridad'
                  ? ' active'
                  : ''
              }`}
              onClick={() => setTab('seguridad')}
            >

              Seguridad

            </button>

          </div>

          {/* ========================================= */}
          {/* TAB INFO */}
          {/* ========================================= */}

          {tab === 'info' && (

            <form
              className="perf-form"
              onSubmit={handleSave}
            >

              <div className="perf-form-row">

                <label>

                  Nombre

                  <input
                    value={form.nombre}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        nombre: e.target.value,
                      }))
                    }
                  />

                </label>

                <label>

                  Apellido

                  <input
                    value={form.apellido}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        apellido: e.target.value,
                      }))
                    }
                  />

                </label>

              </div>

              <label>

                Correo electrónico

                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      correo: e.target.value,
                    }))
                  }
                />

              </label>

              <label>

                Teléfono

                <input
                  value={form.telefono}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      telefono: e.target.value,
                    }))
                  }
                />

              </label>

              <div className="perf-form-actions">

                <button
                  type="submit"
                  className="btn-guardar"
                  disabled={saving}
                >

                  {

                    saving
                      ? 'Guardando…'
                      : 'Editar perfil'

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