import Formulario from './Formulario'

export default function CatEstadosCultivo() {
  return (
    <Formulario
      title="Estados de Cultivo"
      endpoint="/cat_estados_cultivo"
      idField="idEstado"
      fields={[
        { name: 'idEstado',     label: 'ID',          readOnly: true },
        { name: 'nombreEstado', label: 'Nombre Estado' },
        { name: 'descripcion',  label: 'Descripción' },
      ]}
    />
  )
}