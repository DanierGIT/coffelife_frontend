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

import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import './AdminLayout.css'

export default function AdminLayout({ activePage, onNavigate, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNavigate = (page, subkey) => {
    setSidebarOpen(false)
    onNavigate(page, subkey)
  }

  return (
    <div className="admin-layout">
      <button className="sidebar-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar activePage={activePage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      <main className="admin-content">
        {children}
      </main>
    </div>
  )
}
