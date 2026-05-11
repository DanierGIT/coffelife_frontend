import Formulario from './Formulario'

export default function CatTiposRecomendacion() {
  return (
    <Formulario
      title="Tipos de Recomendación"
      endpoint="/cat_tipos_recomendacion"
      idField="idTipo"
      fields={[
        { name: 'idTipo',      label: 'ID',          readOnly: true },
        { name: 'nombreTipo',  label: 'Nombre Tipo' },
        { name: 'descripcion', label: 'Descripción' },
      ]}
    />
  )
}