/**
 * AdminLayout.jsx
 * ──────────────────────────────────────────────
 * Layout principal del panel de administración.
 * Incluye el Sidebar vertical + área de contenido.
 *
 * Props:
 *  - activePage  → página activa actual (string)
 *  - onNavigate  → función para cambiar de página
 *  - children    → contenido de la página activa
 */

import React from 'react'
import Sidebar from '../components/Sidebar'
import './AdminLayout.css'

export default function AdminLayout({ activePage, onNavigate, children }) {
  return (
    <div className="admin-layout">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <main className="admin-content">
        {children}
      </main>
    </div>
  )
}
