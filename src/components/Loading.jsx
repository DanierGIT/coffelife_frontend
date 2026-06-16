import './cargando.css'

export default function Loading({ type = 'content', text, size }) {
  const containerClass =
    type === 'overlay' ? 'loader-overlay' :
    type === 'inline' ? 'loader-inline' :
    'loader-content'

  const sizeClass = size === 'sm' ? 'loader-sm' : size === 'lg' ? 'loader-lg' : ''

  return (
    <div className={`${containerClass} ${sizeClass}`}>
      <div className="loader" />
      {text && <p>{text}</p>}
    </div>
  )
}
