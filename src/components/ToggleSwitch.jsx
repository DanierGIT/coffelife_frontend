export default function ToggleSwitch({ active, onClick, title }) {
  const handleClick = (e) => {
    const next = !active
    if (onClick) onClick(e, next)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      style={{
        position: 'relative',
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        background: active ? '#2e7d32' : '#dc2626',
        transition: 'background 0.25s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'transform 0.25s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
          transform: active ? 'translateX(18px)' : 'translateX(0)',
        }}
      />
    </button>
  )
}
