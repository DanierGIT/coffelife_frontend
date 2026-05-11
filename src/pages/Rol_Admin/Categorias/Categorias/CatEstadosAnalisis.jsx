import Formulario from './Formulario'

export default function CatEstadosAnalisis() {
  return (
    <Formulario
      title="Estados de Análisis"
      endpoint="/cat_estados_analisis"
      idField="idEstado"
      fields={[
        { name: 'idEstado',     label: 'ID',           readOnly: true },
        { name: 'nombreEstado', label: 'Nombre Estado' },
        { name: 'descripcion',  label: 'Descripción' },
      ]}
    />
  )
}