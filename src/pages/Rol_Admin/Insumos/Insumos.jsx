import { useEffect, useState } from 'react'
import api from '../../../services/api'
import '../Tratamientos/styles/tratamientos.css'
import '../Tratamientos/styles/formulario.css'
import '../Tratamientos/styles/tabla.css'
import '../Administrador/Administrador.css'
import '../Usuarios/Usuarios.css'
import { BiPlus, BiEdit, BiTrash } from 'react-icons/bi'
import Loading from '../../../components/Loading'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

function FormularioInsumo({ tipos, insumoEditar, limpiarEdicion, cargarDatos }) {
  const [form, setForm] = useState({
    id_tipo_insumo: '',
    nombre: '',
    descripcion: '',
  })

  useEffect(() => {
    if (insumoEditar) {
      setForm({
        id_tipo_insumo: insumoEditar.idTipoInsumo ?? insumoEditar.id_tipo_insumo ?? '',
        nombre: insumoEditar.nombre || '',
        descripcion: insumoEditar.descripcion || '',
      })
    } else {
      setForm({ id_tipo_insumo: '', nombre: '', descripcion: '' })
    }
  }, [insumoEditar])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === 'id_tipo_insumo' ? Number(value) : value })
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      alert('El nombre es obligatorio')
      return
    }
    try {
      const payload = {
        id_tipo_insumo: form.id_tipo_insumo || undefined,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
      }
      if (insumoEditar) {
        await api.put(`/insumos/${insumoEditar.idInsumo}`, payload)
        limpiarEdicion()
      } else {
        await api.post('/insumos', payload)
      }
      await cargarDatos()
      if (!insumoEditar) limpiarEdicion?.()
      setForm({ id_tipo_insumo: '', nombre: '', descripcion: '' })
    } catch (error) {
      console.error('ERROR GUARDANDO:', error)
    }
  }

  return (
    <form className="formulario" onSubmit={guardar}>
      <select name="id_tipo_insumo" value={form.id_tipo_insumo} onChange={handleChange}>
        <option value="">Selecciona un tipo</option>
        {tipos.map((t) => (
          <option key={t.idTipoInsumo} value={t.idTipoInsumo}>{t.nombre}</option>
        ))}
      </select>

      <input type="text" name="nombre" placeholder="Nombre del insumo" value={form.nombre} onChange={handleChange} required />

      <textarea name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} />

      <button type="submit">
        {insumoEditar ? 'Actualizar Insumo' : 'Guardar Insumo'}
      </button>
    </form>
  )
}

function TablaInsumos({ insumos, tipos, eliminar, editar }) {
  const getTipoNombre = (idTipo) => {
    if (!idTipo) return '—'
    const encontrado = tipos.find((t) => Number(t.idTipoInsumo) === Number(idTipo))
    return encontrado?.nombre || '—'
  }

  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {insumos.length === 0 ? (
          <tr>
            <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
              No hay insumos registrados
            </td>
          </tr>
        ) : (
          insumos.map((item) => (
            <tr key={item.idInsumo}>
              <td>{item.tipoInsumo?.nombre || getTipoNombre(item.idTipoInsumo)}</td>
              <td>{item.nombre}</td>
              <td>{item.descripcion || '—'}</td>
              <td className="acciones">
                <div className="td-actions">
                  <button className="btn-icon btn-icon-editar" onClick={() => editar(item)} title="Editar insumo">
                    <BiEdit size={16} />
                  </button>
                  <button className="btn-icon btn-icon-eliminar" onClick={() => eliminar(item.idInsumo)} title="Eliminar insumo">
                    <BiTrash size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}

export default function Insumos() {
  const [insumos, setInsumos] = useState([])
  const [tipos, setTipos] = useState([])
  const [insumoEditar, setInsumoEditar] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [showCrearModal, setShowCrearModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    try {
      const res = await api.get('/insumos')
      setInsumos(getArrayData(res.data))
    } catch { /* silencioso */ }
  }

  const cargarTipos = async () => {
    try {
      const res = await api.get('/cat_tipos_insumos')
      setTipos(getArrayData(res.data))
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    const initLoad = async () => {
      setLoading(true)
      try {
        await cargarDatos()
        await cargarTipos()
      } finally {
        setLoading(false)
      }
    }
    initLoad()
  }, [])

  const eliminar = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este insumo?')) return
    try {
      await api.delete(`/insumos/${id}`)
      cargarDatos()
    } catch (error) {
      console.error('ERROR ELIMINANDO:', error)
    }
  }

  const editar = (insumo) => {
    setInsumoEditar(insumo)
    setModalAbierto(true)
  }

  const limpiarEdicion = () => {
    setInsumoEditar(null)
    setModalAbierto(false)
  }

  if (loading) return <Loading type="content" text="Cargando..." />

  return (
    <div className="contenedor-tratamientos">
      <div className="module-header" style={{ position: 'relative' }}>
        <div className="module-header-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        <div className="module-header-content">
          <span className="module-header-badge">INSUMOS AGRÍCOLAS</span>
          <h1>Insumos</h1>
          <p>
            Administra los insumos utilizados en la producción cafetalera: fertilizantes,
            fungicidas, herbicidas y otros productos agrícolas. Desde este módulo puedes
            registrar, actualizar y consultar los insumos disponibles para tu finca.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowCrearModal(true)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
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
          Agregar insumo
        </button>
      </div>

      <div className="card">
        <div className="tabla-header">
          <h2>Lista de Insumos</h2>
          <span className="contador">
            {insumos.length} insumo{insumos.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="tabla-wrapper">
          <TablaInsumos
            insumos={insumos}
            tipos={tipos}
            eliminar={eliminar}
            editar={editar}
          />
        </div>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={limpiarEdicion}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="cerrar-modal" onClick={limpiarEdicion}>✕</button>
            <h2>Editar Insumo</h2>
            <FormularioInsumo
              tipos={tipos}
              insumoEditar={insumoEditar}
              limpiarEdicion={limpiarEdicion}
              cargarDatos={cargarDatos}
            />
          </div>
        </div>
      )}

      {showCrearModal && (
        <div className="modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="cerrar-modal" onClick={() => setShowCrearModal(false)}>✕</button>
            <h2>Nuevo Insumo</h2>
            <FormularioInsumo
              tipos={tipos}
              insumoEditar={null}
              limpiarEdicion={() => setShowCrearModal(false)}
              cargarDatos={cargarDatos}
            />
          </div>
        </div>
      )}
    </div>
  )
}
