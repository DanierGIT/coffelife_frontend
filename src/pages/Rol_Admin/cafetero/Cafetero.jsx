import { useState, useEffect, useMemo } from "react"
import api from "../../../services/api"
import PasswordStrength from "../../../components/PasswordStrength"
import { validatePassword } from "../../../utils/passwordValidator"
import "./styles/cafeteros.css"
import "../Administrador/Administrador.css"
import "../Usuarios/Usuarios.css"
import { BiPlus, BiShow, BiEdit, BiCoffeeTogo } from 'react-icons/bi'
import ToggleSwitch from '../../../components/ToggleSwitch'
import Loading from '../../../components/Loading'

const POR_PAGINA = 10

function DetalleUsuarioModal({ usuario, onClose }) {
  if (!usuario) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title">Detalle del cafetero</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="detalle-usuario-body">
          <div className="detalle-row">
            <span className="detalle-label">Nombre</span>
            <span className="detalle-value">{usuario.nombre} {usuario.apellido}</span>
          </div>
          <div className="detalle-row">
            <span className="detalle-label">Correo</span>
            <span className="detalle-value">{usuario.correo || '—'}</span>
          </div>
          <div className="detalle-row">
            <span className="detalle-label">Teléfono</span>
            <span className="detalle-value">{usuario.telefono || '—'}</span>
          </div>
          <div className="detalle-row">
            <span className="detalle-label">Rol</span>
            <span className="detalle-value">{usuario.rol?.nombreRol || '—'}</span>
          </div>
          <div className="detalle-row">
            <span className="detalle-label">Estado</span>
            <span className={`detalle-value ${usuario.activo ? 'text-green' : 'text-red'}`}>
              {usuario.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {usuario.observaciones && (
            <div className="detalle-row">
              <span className="detalle-label">Observaciones</span>
              <span className="detalle-value">{usuario.observaciones}</span>
            </div>
          )}
          {usuario.fechaRegistro && (
            <div className="detalle-row">
              <span className="detalle-label">Fecha registro</span>
              <span className="detalle-value">{new Date(usuario.fechaRegistro).toLocaleDateString('es-CO')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditModal({ cafetero, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:        cafetero.nombre        || "",
    apellido:      cafetero.apellido      || "",
    correo:        cafetero.correo        || "",
    telefono:      cafetero.telefono      || "",
    password:      "",
    observaciones: cafetero.observaciones || "",
    activo:        cafetero.activo ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === "activo" ? value === "true" : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      await api.put(`/cafeteros/${cafetero.idUsuario}`, payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo guardar. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar cafetero</h2>
          <button className="modal-close" onClick={onClose} title="Cerrar">✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>Nombre
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required />
            </label>
            <label>Apellido
              <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required />
            </label>
          </div>

          <label>Correo
            <input name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="correo@ejemplo.com" required />
          </label>

          <label>Teléfono
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" />
          </label>

          <label>Observaciones
            <input name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Observaciones" />
          </label>

          <label>Estado
            <select name="activo" value={String(form.activo)} onChange={handleChange}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>

          <label>
            Nueva contraseña
            <span className="modal-hint"> (dejar en blanco para no cambiarla)</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
            <PasswordStrength password={form.password} />
          </label>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loading type="inline" text="Guardando…" /> : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Cafetero() {
  const [cafeteros,       setCafeteros] = useState([])
  const [editingCafetero, setEditing]   = useState(null)
  const [detalleCafetero, setDetalle]   = useState(null)
  const [loading,         setLoading]   = useState(false)
  const [pageLoading,     setPageLoading] = useState(true)
  const [error,           setError]     = useState("")
  const [success,         setSuccess]   = useState("")
  const [showCrearModal,  setShowCrearModal] = useState(false)
  const [pagina, setPagina] = useState(1)

  const totalPaginas = Math.max(1, Math.ceil(cafeteros.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)

  const cafeterosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * POR_PAGINA
    return cafeteros.slice(inicio, inicio + POR_PAGINA)
  }, [cafeteros, paginaActual])

  const [form, setForm] = useState({
    nombre: "", apellido: "", correo: "", telefono: "",
    password: "", confirmPassword: "", observaciones: "", activo: true,
  })

  const getCafeteros = async () => {
    setPageLoading(true)
    try {
      const res = await api.get("/cafeteros", { params: { limit: 1000 } })
      setCafeteros(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
      setPagina(1)
    } catch (err) {
      setError("No se pudieron cargar los cafeteros.")
      console.error("Error al obtener cafeteros:", err)
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { getCafeteros() }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === "activo" ? value === "true" : value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const roleName = "cafetero"
    const { isValid, errors: pwErrors } = validatePassword(form.password, roleName)
    if (!isValid) {
      setError(`Contraseña inválida: ${pwErrors.join(", ")}`)
      return
    }
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setLoading(true)
    try {
      await api.post("/cafeteros", form)
      setForm({ nombre: "", apellido: "", correo: "", telefono: "", password: "", confirmPassword: "", observaciones: "", activo: true })
      setSuccess("Cafetero creado correctamente.")
      setShowCrearModal(false)
      getCafeteros()
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo crear el cafetero.")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActivo = async (cafetero) => {
    try {
      await api.put(`/cafeteros/${cafetero.idUsuario}`, { activo: !cafetero.activo })
      getCafeteros()
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo cambiar el estado.")
    }
  }

  if (pageLoading) return <Loading type="content" text="Cargando..." />

  return (
    <div className="admin-page">

      <div className="section-header-card" style={{ position: 'relative' }}>
        <div className="section-header-icon">
          <BiCoffeeTogo size={22} />
        </div>
        <div className="section-header-text">
          <span className="section-header-badge">Administrador</span>
          <h1 className="section-header-title">Cafeteros</h1>
          <p className="section-header-description">
            Gestiona los usuarios con rol de Cafetero dentro del sistema. Desde aquí puedes registrar nuevos cafeteros, editar su información personal, y activar o desactivar su acceso a la plataforma CoffeeLife.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowCrearModal(true)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#097300',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <BiPlus size={18} />
          Agregar cafetero
        </button>
      </div>

      <div className="admin-table-card">
        <div className="table-toolbar" style={{ justifyContent: 'flex-end' }}>
          <span className="contador">
            {cafeteros.length} cafetero{cafeteros.length !== 1 ? 's' : ''} registrado{cafeteros.length !== 1 ? 's' : ''}
          </span>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Nombre</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cafeteros.length === 0 ? (
              <tr>
                <td colSpan={4} className="finca-empty">No hay cafeteros registrados.</td>
              </tr>
            ) : (
              cafeterosPaginados.map((c, idx) => (
                <tr key={c.idUsuario} className={c.activo ? '' : 'fila-inactiva'}>
                  <td>{(paginaActual - 1) * POR_PAGINA + idx + 1}</td>
                  <td>{c.nombre} {c.apellido}</td>
                  <td>
                    <span
                      className={`usuario-status ${c.activo ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleActivo(c)}
                      title={c.activo ? 'Desactivar cafetero' : 'Activar cafetero'}
                    >
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button
                        className="btn-icon btn-icon-ver"
                        onClick={() => setDetalle(c)}
                        title="Ver detalle"
                      >
                        <BiShow size={16} />
                      </button>
                      <button
                        className="btn-icon btn-icon-editar"
                        onClick={() => setEditing(c)}
                        title="Editar cafetero"
                      >
                        <BiEdit size={16} />
                      </button>
                      <ToggleSwitch
                        active={c.activo}
                        onClick={() => handleToggleActivo(c)}
                        title={c.activo ? 'Desactivar' : 'Activar'}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {cafeteros.length > POR_PAGINA && (
        <div className="pagination">
          <button disabled={paginaActual <= 1} onClick={() => setPagina(paginaActual - 1)}>Anterior</button>
          {Array.from({ length: totalPaginas }, (_, i) => {
            const page = i + 1
            return (
              <button key={page} className={paginaActual === page ? 'active' : ''} onClick={() => setPagina(page)}>
                {page}
              </button>
            )
          })}
          <button disabled={paginaActual >= totalPaginas} onClick={() => setPagina(paginaActual + 1)}>Siguiente</button>
          <span className="pagination-info">{cafeteros.length} registros</span>
        </div>
      )}

      {detalleCafetero && (
        <DetalleUsuarioModal
          usuario={detalleCafetero}
          onClose={() => setDetalle(null)}
        />
      )}

      {editingCafetero && (
        <EditModal
          cafetero={editingCafetero}
          onClose={() => setEditing(null)}
          onSaved={getCafeteros}
        />
      )}

      {showCrearModal && (
        <div className="modal-overlay" onClick={() => { setShowCrearModal(false); setError(''); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Crear cafetero</h2>
              <button className="modal-close" onClick={() => { setShowCrearModal(false); setError(''); }}>x</button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="modal-row">
                <label>Nombre   <input name="nombre"   value={form.nombre}   onChange={handleChange} placeholder="Nombre" required /></label>
                <label>Apellido <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required /></label>
              </div>
              <label>Correo   <input name="correo"   type="email" value={form.correo}   onChange={handleChange} placeholder="Correo" required /></label>
              <label>Teléfono <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" /></label>
              <label>Observaciones <textarea name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Observaciones" style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14, background:'#fafafa', resize:'vertical', fontFamily:'inherit', width:'100%' }} /></label>
              <label>Estado
                <select name="activo" value={String(form.activo)} onChange={handleChange} style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14, background:'#fafafa' }}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>
              <div style={{ position: 'relative' }}>
                <label>Contraseña <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Contraseña (mín. 6)" required /></label>
                <PasswordStrength password={form.password} role="cafetero" />
              </div>
              <div style={{ position: 'relative' }}>
                <label>Confirmar contraseña <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirmar contraseña" required /></label>
              </div>
              {error && <p className="modal-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowCrearModal(false); setError(''); }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <Loading type="inline" text="Creando…" /> : 'Crear cafetero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
