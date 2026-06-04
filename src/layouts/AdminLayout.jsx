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
import { BiMenu } from 'react-icons/bi'
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
        <BiMenu size={24} />
      </button>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar activePage={activePage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      <main className="admin-content">
        {children}
      </main>
    </div>
  )
}
