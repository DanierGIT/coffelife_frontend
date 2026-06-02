import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Camera,
  Leaf,
  Calendar,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Image,
} from 'lucide-react'

import api from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'

import './MonitoreosExperto.css'

const hoy = () =>
  new Date()
    .toISOString()
    .slice(0, 10)

export default function MonitoreosExperto({
  cultivo,
  finca,
}) {
  const { user } = useAuth()

  const expertoId =
    user?.idUsuario ??
    user?.id ??
    null

  const [vistaMonitoreo, setVistaMonitoreo] =
    useState('lista')

  const [monitoreos, setMonitoreos] =
    useState([])

  const [loading, setLoading] =
    useState(false)

  const [fecha, setFecha] =
    useState(hoy())

  const [observaciones, setObservaciones] =
    useState('')

  const [fotos, setFotos] =
    useState([])

  const [error, setError] =
    useState('')

  const [saving, setSaving] =
    useState(false)

  const inputFileRef = useRef()

  const fetchMonitoreos = async () => {
    if (!cultivo?.idCultivo) return

    setLoading(true)

    try {
      const res = await api.get(
        '/monitoreos',
        {
          params: {
            id_cultivo:
              cultivo.idCultivo,
          },
        }
      )

      const data = Array.isArray(
        res.data
      )
        ? res.data
        : res.data?.data ?? []

      setMonitoreos(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonitoreos()
  }, [cultivo])

  const handleFotoAgregar = (e) => {
    const archivos = Array.from(
      e.target.files
    )

    const nuevas = archivos.map(
      (file) => ({
        file,
        preview:
          URL.createObjectURL(file),
      })
    )

    setFotos((prev) => [
      ...prev,
      ...nuevas,
    ])

    e.target.value = ''
  }

  const handleFotoQuitar = (index) => {
    setFotos((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    )
  }

  const handleGuardar = async () => {
    setSaving(true)

    try {
      const res = await api.post(
        '/monitoreos',
        {
          id_cultivo: Number(
            cultivo.idCultivo
          ),

          id_experto: expertoId,

          fecha_monitoreo: fecha,

          observaciones:
            observaciones || null,
        }
      )

      const idMonitoreo =
        res.data?.data
          ?.idMonitoreo ??
        res.data?.idMonitoreo

      if (
        fotos.length > 0 &&
        idMonitoreo
      ) {
        for (const foto of fotos) {
          const formData =
            new FormData()

          formData.append(
            'imagen',
            foto.file
          )

          formData.append(
            'id_monitoreo',
            String(idMonitoreo)
          )

          await api.post(
            '/imagenes',
            formData,
            {
              headers: {
                'Content-Type':
                  'multipart/form-data',
              },
            }
          )
        }
      }

      fetchMonitoreos()

      setVistaMonitoreo('lista')

      setFecha(hoy())
      setObservaciones('')
      setFotos([])
    } catch (err) {
      setError(
        err?.response?.data
          ?.message ||
          'Error al guardar.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (vistaMonitoreo === 'nuevo') {
    return (
      <div className="monitoreo-page">

        <div className="monitoreo-topbar">

          <div>

            <div className="monitoreo-breadcrumb">

              <span>
                Mis fincas
              </span>

              <ChevronRight size={14} />

              <span>
                {finca?.nombre}
              </span>

              <ChevronRight size={14} />

              <span>
                {
                  cultivo?.nombreCultivo
                }
              </span>

              <ChevronRight size={14} />

              <strong>
                Nuevo monitoreo
              </strong>
            </div>

            <div className="monitoreo-title-wrap">

              <div className="monitoreo-icon">
                <Leaf
                  size={34}
                  strokeWidth={2.4}
                />
              </div>

              <div>

                <h1>
                  Nuevo monitoreo
                  de Café
                </h1>

                <p>
                  Registra el estado
                  actual del cultivo,
                  toma fotos, agrega
                  recomendaciones y
                  define tratamientos.
                </p>
              </div>
            </div>
          </div>

          <button
            className="btn-outline"
            onClick={() =>
              setVistaMonitoreo(
                'lista'
              )
            }
          >
            <ArrowLeft size={18} />
            Volver a cultivos
          </button>
        </div>

        <div className="monitoreo-layout">

          <div className="monitoreo-main">

            <div className="mon-card">

              <div className="section-number">
                1
              </div>

              <div className="section-content">

                <h2>
                  Información general
                </h2>

                <div className="mon-grid">

                  <div className="field">
                    <label>
                      Finca
                    </label>

                    <input
                      type="text"
                      readOnly
                      value={
                        finca?.nombre ||
                        ''
                      }
                    />
                  </div>

                  <div className="field">
                    <label>
                      Cultivo
                    </label>

                    <input
                      type="text"
                      readOnly
                      value={
                        cultivo?.nombreCultivo ||
                        ''
                      }
                    />
                  </div>

                  <div className="field">
                    <label>
                      Responsable
                    </label>

                    <input
                      type="text"
                      readOnly
                      value={
                        user?.nombre ||
                        'Experto'
                      }
                    />
                  </div>

                  <div className="field">
                    <label>
                      Fecha
                    </label>

                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) =>
                        setFecha(
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mon-card">

              <div className="section-number">
                2
              </div>

              <div className="section-content">

                <h2>
                  Registro fotográfico
                </h2>

                <p className="section-desc">
                  Toma fotos del cultivo
                  desde diferentes
                  ángulos y detalles
                  relevantes.
                </p>

                <div className="photos-grid">

                  <div
                    className="photo-upload"
                    onClick={() =>
                      inputFileRef.current?.click()
                    }
                  >

                    <div className="upload-icon">
                      <Camera size={38} />
                    </div>

                    <h4>
                      Agregar fotos
                    </h4>

                    <span>
                      JPG, PNG
                      (Máx. 10MB)
                    </span>
                  </div>

                  {fotos.map(
                    (foto, i) => (
                      <div
                        key={i}
                        className="photo-card"
                      >
                        <img
                          src={
                            foto.preview
                          }
                          alt=""
                        />

                        <button
                          className="photo-remove"
                          onClick={() =>
                            handleFotoQuitar(
                              i
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>

                <input
                  ref={inputFileRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp"
                  hidden
                  onChange={
                    handleFotoAgregar
                  }
                />
              </div>
            </div>

            <div className="mon-card">

              <div className="section-number">
                3
              </div>

              <div className="section-content">

                <h2>
                  Observaciones del
                  cultivo
                </h2>

                <p className="section-desc">
                  Describe el estado
                  del cultivo, plagas,
                  enfermedades o
                  cualquier aspecto
                  relevante.
                </p>

                <textarea
                  value={
                    observaciones
                  }
                  onChange={(e) =>
                    setObservaciones(
                      e.target.value
                    )
                  }
                  className="textarea"
                  rows={7}
                />

                <div className="char-counter">
                  {
                    observaciones.length
                  }
                  /1000
                </div>
              </div>
            </div>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <div className="bottom-actions">

              <button
                className="btn-cancel"
                onClick={() =>
                  setVistaMonitoreo(
                    'lista'
                  )
                }
              >
                Cancelar
              </button>

              <button
                className="btn-save"
                onClick={
                  handleGuardar
                }
                disabled={saving}
              >
                {saving
                  ? 'Guardando...'
                  : 'Guardar monitoreo'}
              </button>
            </div>
          </div>

          <div className="monitoreo-sidebar">

            <div className="sidebar-card">

              <h3>
                Resumen del
                monitoreo
              </h3>

              <div className="summary-item">

                <span className="summary-label">
                  <Leaf size={16} />
                  Finca
                </span>

                <strong>
                  {finca?.nombre}
                </strong>
              </div>

              <div className="summary-item">

                <span className="summary-label">
                  <Leaf size={16} />
                  Cultivo
                </span>

                <strong>
                  {
                    cultivo?.nombreCultivo
                  }
                </strong>
              </div>

              <div className="summary-item">

                <span className="summary-label">
                  <Calendar size={16} />
                  Fecha
                </span>

                <strong>
                  {fecha}
                </strong>
              </div>

              <div className="summary-item">

                <span className="summary-label">
                  <Image size={16} />
                  Fotos
                </span>

                <strong>
                  {fotos.length}
                </strong>
              </div>

              <div className="divider" />

              <h4>
                Observaciones
              </h4>

              <p className="sidebar-obs">
                {observaciones ||
                  'Sin observaciones todavía.'}
              </p>

              {fotos.length > 0 && (
                <>
                  <div className="divider" />

                  <div className="mini-photos">
                    {fotos.map(
                      (
                        foto,
                        index
                      ) => (
                        <img
                          key={index}
                          src={
                            foto.preview
                          }
                          alt=""
                        />
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="help-card">

              <div className="help-icon">
                <BookOpen size={30} />
              </div>

              <div>

                <h4>
                  ¿Necesitas ayuda?
                </h4>

                <p>
                  Consulta nuestra
                  guía de monitoreo
                  para obtener mejores
                  resultados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="monitoreo-list-page">

      <div className="list-topbar">

        <div>

          <h2>
            Monitoreos registrados
          </h2>

          <p>
            Gestiona y revisa todos
            los monitoreos del
            cultivo.
          </p>
        </div>

        <button
          className="btn-save"
          onClick={() =>
            setVistaMonitoreo(
              'nuevo'
            )
          }
        >
          Nuevo monitoreo
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          Cargando monitoreos...
        </div>
      ) : monitoreos.length === 0 ? (
        <div className="empty-state">
          No hay monitoreos registrados.
        </div>
      ) : (
        <div className="monitor-grid">

          {monitoreos.map((m) => (
            <div
              key={m.idMonitoreo}
              className="monitor-card"
            >

              <div className="monitor-date">

                <Calendar size={16} />

                {
                  m.fechaMonitoreo
                }
              </div>

              <div className="monitor-body">

                <p>
                  {m.observaciones ||
                    'Sin observaciones'}
                </p>

                <div className="monitor-footer">

                  <Image size={15} />

                  {m.imagenes
                    ?.length || 0}
                  {' '}
                  fotos
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

