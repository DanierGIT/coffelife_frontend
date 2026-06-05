import Formulario from './Formulario'

export default function CatPrioridades() {
  return (
    <>
      <div className="module-header">
        <div className="module-header-icon">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        <div className="module-header-content">
          <span className="module-header-badge">
            CONFIGURACIÓN DEL SISTEMA
          </span>

          <h1>Prioridades</h1>

          <p>
            Administra los niveles de prioridad utilizados en CoffeeLife para
            clasificar recomendaciones, alertas, análisis y actividades
            agrícolas. Estas prioridades permiten establecer el orden de
            atención y la importancia de cada proceso dentro de la plataforma.
          </p>
        </div>
      </div>

      <Formulario
        title="Prioridades"
        endpoint="/cat_prioridades"
        idField="idPrioridad"
        fields={[
          { name: 'idPrioridad', label: 'ID', readOnly: true },
          { name: 'nombre', label: 'Nombre' },
          { name: 'nivelOrden', label: 'Nivel Orden' },
        ]}
      />
    </>
  )
}