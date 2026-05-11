import Formulario from './Formulario'

export default function CatPrioridades() {
  return (
    <Formulario
      title="Prioridades"
      endpoint="/cat_prioridades"
      idField="idPrioridad"
      fields={[
        { name: 'idPrioridad', label: 'ID',          readOnly: true },
        { name: 'nombre',      label: 'Nombre' },
        { name: 'nivelOrden',  label: 'Nivel Orden' },
      ]}
    />
  )
}