import Formulario from './Formulario'

export default function CatTiposTratamiento() {
  return (
    <Formulario
      title="Tipos de Tratamiento"
      endpoint="/cat_tipos_tratamiento"
      idField="idTipo"
      fields={[
        { name: 'idTipo',      label: 'ID',          readOnly: true },
        { name: 'nombreTipo',  label: 'Nombre Tipo' },
        { name: 'descripcion', label: 'Descripción' },
      ]}
    />
  )
}