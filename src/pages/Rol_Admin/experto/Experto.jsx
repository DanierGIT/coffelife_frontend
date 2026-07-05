import { useEffect, useState, useMemo } from 'react'
import { getExpertos, createExperto, updateExperto } from './api'
import PasswordStrength from '../../../components/PasswordStrength'
import { validatePassword } from '../../../utils/passwordValidator'
import "../Administrador/Administrador.css";
import "../Usuarios/Usuarios.css";
import { BiPlus, BiShow, BiEdit, BiStar } from 'react-icons/bi'
import ToggleSwitch from '../../../components/ToggleSwitch'
import Loading from '../../../components/Loading'

const POR_PAGINA = 10

const EMPTY_FORM = {
  nombre: '', apellido: '', correo: '', telefono: '',
  password: '', confirmPassword: '', observaciones: '', activo: true,
}

function DetalleUsuarioModal({ usuario, onClose }) {
  if (!usuario) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title">Detalle del experto</h2>
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

function EditModal({ experto, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:        experto.nombre        || '',
    apellido:      experto.apellido      || '',
    correo:        experto.correo        || '',
    telefono:      experto.telefono      || '',
    observaciones: experto.observaciones || '',
    activo:        Boolean(experto.activo),
    password:      '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === 'activo' ? value === 'true' : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        nombre: form.nombre, apellido: form.apellido,
        correo: form.correo, telefono: form.telefono,
        observaciones: form.observaciones, activo: form.activo,
      }
      if (form.password) payload.password = form.password
      const id = experto.idUsuario || experto.id_usuario || experto.id
      await updateExperto(id, payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar los cambios.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar experto</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <label>Nombre   <input name="nombre"   value={form.nombre}   onChange={handleChange} required /></label>
            <label>Apellido <input name="apellido" value={form.apellido} onChange={handleChange} /></label>
          </div>
          <div className="modal-row">
            <label>Correo   <input name="correo"   type="email" value={form.correo}   onChange={handleChange} required /></label>
            <label>Teléfono <input name="telefono" value={form.telefono} onChange={handleChange} /></label>
          </div>
          <label>
            Contraseña <span className="modal-hint">(dejar vacío para no cambiar)</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} />
            <PasswordStrength password={form.password} />
          </label>
          <label>
            Observaciones
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={2}
              style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14,
                       background:'#fafafa', resize:'vertical', fontFamily:'inherit' }} />
          </label>
          <label>
            Estado
            <select name="activo" value={String(form.activo)} onChange={handleChange}
              style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14, background:'#fafafa' }}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loading type="inline" text="Guardando..." /> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Experto() {
  const [expertos,        setExpertos]        = useState([])
  const [editingExperto,  setEditingExperto]  = useState(null)
  const [detalleExperto,  setDetalleExperto]  = useState(null)
  const [form,            setForm]            = useState(EMPTY_FORM)
  const [loading,         setLoading]         = useState(false)
  const [pageLoading,     setPageLoading]     = useState(true)
  const [error,           setError]           = useState('')
  const [success,         setSuccess]         = useState('')
  const [showCrearModal,  setShowCrearModal]  = useState(false)
  const [pagina, setPagina] = useState(1)

  const totalPaginas = Math.max(1, Math.ceil(expertos.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)

  const expertosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * POR_PAGINA
    return expertos.slice(inicio, inicio + POR_PAGINA)
  }, [expertos, paginaActual])

  const obtenerExpertos = async () => {
    setPageLoading(true)
    try {
      const data = await getExpertos({ limit: 1000 })
      setExpertos(Array.isArray(data) ? data : (data?.data ?? []))
      setPagina(1)
    } catch (err) {
      console.error('Error al obtener expertos', err)
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { obtenerExpertos() }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === 'activo' ? value === 'true' : value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const roleName = 'experto'
    const { isValid, errors: pwErrors } = validatePassword(form.password, roleName)
    if (!isValid) {
      setError(`Contraseña inválida: ${pwErrors.join(', ')}`)
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await createExperto({
        nombre:        form.nombre,
        apellido:      form.apellido,
        correo:        form.correo,
        telefono:      form.telefono,
        password:      form.password,
        observaciones: form.observaciones,
        activo:        form.activo,
      })
      setForm(EMPTY_FORM)
      setSuccess('Experto creado correctamente.')
      setShowCrearModal(false)
      obtenerExpertos()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear el experto.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActivo = async (exp) => {
    try {
      await updateExperto(exp.idUsuario, { activo: !exp.activo })
      obtenerExpertos()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo cambiar el estado.')
    }
  }

  if (pageLoading) return <Loading type="content" text="Cargando..." />

  return (
    <>
      <div className="section-header-card" style={{ position: 'relative' }}>
        <div className="section-header-icon">
          <BiStar size={22} />
        </div>
        <div className="section-header-text">
          <span className="section-header-badge">Administrador</span>
          <h1 className="section-header-title">Expertos</h1>
          <p className="section-header-description">
            Gestiona los usuarios con rol de Experto dentro del sistema. Desde aquí puedes registrar nuevos expertos, editar su información personal, y activar o desactivar su acceso a la plataforma CoffeeLife.
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
          Agregar experto
        </button>
      </div>

      <div className="admin-table-card">
        <div className="table-toolbar" style={{ justifyContent: 'flex-end' }}>
          <span className="contador">
            {expertos.length} experto{expertos.length !== 1 ? 's' : ''} registrado{expertos.length !== 1 ? 's' : ''}
          </span>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Nombre</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expertos.length === 0 ? (
              <tr><td colSpan={4} className="finca-empty">No hay expertos registrados.</td></tr>
            ) : expertosPaginados.map((exp, idx) => (
              <tr key={exp.idUsuario || exp.id} className={exp.activo ? '' : 'fila-inactiva'}>
                <td>{(paginaActual - 1) * POR_PAGINA + idx + 1}</td>
                <td>{exp.nombre} {exp.apellido}</td>
                <td>
                  <span
                    className={`usuario-status ${exp.activo ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleActivo(exp)}
                    title={exp.activo ? 'Desactivar experto' : 'Activar experto'}
                  >
                    {exp.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="td-actions">
                    <button
                      className="btn-icon btn-icon-ver"
                      onClick={() => setDetalleExperto(exp)}
                      title="Ver detalle"
                    >
                      <BiShow size={16} />
                    </button>
                    <button
                      className="btn-icon btn-icon-editar"
                      onClick={() => setEditingExperto(exp)}
                      title="Editar experto"
                    >
                      <BiEdit size={16} />
                    </button>
                    <ToggleSwitch
                      active={exp.activo}
                      onClick={() => handleToggleActivo(exp)}
                      title={exp.activo ? 'Desactivar' : 'Activar'}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {expertos.length > POR_PAGINA && (
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
          <span className="pagination-info">{expertos.length} registros</span>
        </div>
      )}

      {detalleExperto && (
        <DetalleUsuarioModal
          usuario={detalleExperto}
          onClose={() => setDetalleExperto(null)}
        />
      )}

      {editingExperto && (
        <EditModal
          experto={editingExperto}
          onClose={() => setEditingExperto(null)}
          onSaved={obtenerExpertos}
        />
      )}

      {showCrearModal && (
        <div className="modal-overlay" onClick={() => { setShowCrearModal(false); setError(''); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Crear experto</h2>
              <button className="modal-close" onClick={() => { setShowCrearModal(false); setError(''); }}>x</button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="modal-row">
                <label>Nombre   <input name="nombre"   value={form.nombre}   onChange={handleChange} placeholder="Nombre" required /></label>
                <label>Apellido <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" /></label>
              </div>
              <div className="modal-row">
                <label>Correo   <input name="correo"   type="email" value={form.correo}   onChange={handleChange} placeholder="Correo" required /></label>
                <label>Teléfono <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" /></label>
              </div>
              <div style={{ position: 'relative' }}>
                <label>Contraseña <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Contraseña" required /></label>
                <PasswordStrength password={form.password} role="experto" />
              </div>
              <div style={{ position: 'relative' }}>
                <label>Confirmar contraseña <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirmar contraseña" required /></label>
              </div>
              <label>Observaciones <textarea name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Observaciones" style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14, background:'#fafafa', resize:'vertical', fontFamily:'inherit' }} /></label>
              <label>Estado
                <select name="activo" value={String(form.activo)} onChange={handleChange} style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #d1d5db', fontSize:14, background:'#fafafa' }}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>
              {error && <p className="modal-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowCrearModal(false); setError(''); }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <Loading type="inline" text="Creando…" /> : 'Crear experto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
