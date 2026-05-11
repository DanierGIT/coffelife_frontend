import Formulario from './Formulario'

export default function CatNivelesRoya() {
  return (
    <Formulario
      title="Niveles de Roya"
      endpoint="/cat_niveles_roya"
      idField="idNivel"
      fields={[
        { name: 'idNivel',     label: 'ID',          readOnly: true },
        { name: 'nombreNivel', label: 'Nombre Nivel' },
        { name: 'descripcion', label: 'Descripción' },
      ]}
    />
  )
}