import './AnimatedLogo.css'

export default function AnimatedLogo({ size = 'md', horizontal = false, showText = true, showTagline = false, className = '' }) {
  return (
    <div className={`al-root al-${size} ${horizontal ? 'al-horizontal' : ''} ${className}`}>
      <div className="al-icon-area">
        <div className="al-ring al-ring-1" />
        <div className="al-ring al-ring-2" />
        <div className="al-icon-bg">
          <div className="al-scan-line" />
          <div className="al-corner al-corner-tl" />
          <div className="al-corner al-corner-tr" />
          <div className="al-corner al-corner-bl" />
          <div className="al-corner al-corner-br" />
          <svg className="al-leaf-svg" viewBox="0 0 68 80" fill="none">
            <path d="M34 4 C20 4 8 18 8 36 C8 54 20 72 34 76 C48 72 60 54 60 36 C60 18 48 4 34 4Z" fill="#2e7d32" />
            <path d="M34 12 C22 12 14 22 14 36 C14 50 22 66 34 70 C46 66 54 50 54 36 C54 22 46 12 34 12Z" fill="#388e3c" />
            <line x1="34" y1="8" x2="34" y2="74" stroke="#1b5e20" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="34" y1="28" x2="18" y2="40" stroke="#1b5e20" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="34" y1="42" x2="16" y2="52" stroke="#1b5e20" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="34" y1="56" x2="20" y2="63" stroke="#1b5e20" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="34" y1="28" x2="50" y2="40" stroke="#1b5e20" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="34" y1="42" x2="52" y2="52" stroke="#1b5e20" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="34" y1="56" x2="48" y2="63" stroke="#1b5e20" strokeWidth="1.2" strokeLinecap="round" />
            <circle className="al-roya al-roya-1" cx="22" cy="44" />
            <circle className="al-roya al-roya-2" cx="28" cy="54" />
            <circle className="al-roya al-roya-3" cx="46" cy="36" />
            <g className="al-reticle">
              <circle cx="22" cy="44" r="9" fill="none" stroke="#ffea00" strokeWidth="1.4" />
              <line x1="22" y1="32" x2="22" y2="36" stroke="#ffea00" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="22" y1="52" x2="22" y2="56" stroke="#ffea00" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="10" y1="44" x2="14" y2="44" stroke="#ffea00" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="30" y1="44" x2="34" y2="44" stroke="#ffea00" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </div>
      {showText && (
        <div className="al-text-area">
          <div className="al-name">Coffe<span>Life</span></div>
          <div className="al-accent" />
          {showTagline && <div className="al-tag">Cuida tu cultivo, hoja a hoja</div>}
        </div>
      )}
    </div>
  )
}
