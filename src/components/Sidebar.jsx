import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { BiGrid, BiHome, BiGroup, BiCheckSquare, BiChat, BiBriefcase, BiX, BiLogOut, BiUser, BiListUl } from 'react-icons/bi'
import './Sidebar.css'
import AnimatedLogo from './AnimatedLogo'

const ALL_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    roles: ['administrador', 'experto', 'cafetero'],
    icon: <BiGrid size={20} />,
  },
  // {
  //   key: 'administrador',
  //   label: 'Administrador',
  //   roles: ['administrador'],
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  //     </svg>
  //   ),
  // },
  // {
  //   key: 'experto',
  //   label: 'Experto',
  //   roles: ['administrador'],
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  //     </svg>
  //   ),
  // },
  // {
  //   key: 'cafetero',
  //   label: 'Cafetero',
  //   roles: ['administrador', 'experto'],
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
  //       <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
  //       <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
  //     </svg>
  //   ),
  // },
  {
    key: 'fincas',
    label: 'Fincas',
    roles: ['administrador', 'experto', 'cafetero'],
    icon: <BiHome size={20} />,
  },
  {
    key: 'roles',
    label: 'Roles',
    roles: ['administrador'],
    icon: <BiGroup size={20} />,
  },
  {
    key: 'monitoreos',
    label: 'Monitoreos',
    roles: ['administrador', 'experto', 'cafetero'],
    icon: <BiCheckSquare size={20} />,
  },
  // {
  //   key: 'usuarios',
  //   label: 'Usuarios',
  //   roles: ['administrador'],
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
  //       <circle cx="12" cy="7" r="4" />
  //     </svg>
  //   ),
  // },
  // {
  //   key: 'prioridades',
  //   label: 'Prioridades',
  //   roles: ['administrador'],
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M3 3h18v4H3z" /><path d="M3 10h12v4H3z" /><path d="M3 17h6v4H3z" />
  //     </svg>
  //   ),
  // },
  // {
  //   key: 'analisisIA',
  //   label: 'Análisis IA',
  //   roles: ['administrador', 'experto'],
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  //       <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
  //     </svg>
  //   ),
  // },
  {
    key: 'recomendaciones',
    label: 'Recomendaciones',
    roles: ['administrador', 'experto'],
    icon: <BiChat size={20} />,
  },
  // {
  //   key: 'imagenes',
  //   label: 'Imágenes',
  //   roles: ['administrador', 'experto', 'cafetero'],
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  //       <circle cx="8.5" cy="8.5" r="1.5" />
  //       <polyline points="21 15 16 10 5 21" />
  //     </svg>
  //   ),
  // },
  {
    key: 'tratamientos',
    label: 'Tratamientos',
    roles: ['administrador', 'experto'],
    icon: <BiBriefcase size={20} />,
  },
  // {
  //   key: 'cultivos',
  //   label: 'Cultivos',
  //   roles: ['administrador', 'experto', 'cafetero'],
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M12 2a9 9 0 0 1 9 9c0 5-9 13-9 13S3 16 3 11a9 9 0 0 1 9-9z"/>
  //       <circle cx="12" cy="11" r="3"/>
  //     </svg>
  //   ),
  // },
  // {
  //   key: 'aplicacion',
  //   label: 'Aplicación Tratamientos',
  //   roles: ['administrador', 'experto'],
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
  //     </svg>
  //   ),
  // },
]

const CAT_ITEMS = [
  { key: 'cultivo',     label: 'Estados de Cultivo' },
  { key: 'analisis',    label: 'Estados de Análisis' },
  { key: 'roya',        label: 'Niveles de Roya' },
  { key: 'prioridad',   label: 'Prioridades' },
  { key: 'tratamiento', label: 'Tipos de Tratamiento' },
  { key: 'tipos',       label: 'Tipos de Recomendación' },
]

const USU_ITEMS = [
  { key: 'administrador', label: 'Administrador' },
  { key: 'experto',       label: 'Experto' },
  { key: 'cafetero',      label: 'Cafetero' },
]

export default function Sidebar({ activePage, onNavigate, sidebarOpen, onToggle }) {
  const { user, logout } = useAuth()
  const [catOpen, setCatOpen] = useState(activePage === 'categorias')
  const [usuOpen, setUsuOpen] = useState(
    activePage === 'administrador' || activePage === 'experto' || activePage === 'cafetero'
  )

  const rawRole = (
  user?.rol?.nombreRol ||
  user?.rol?.nombre_rol ||
  user?.rol?.nombre ||
  user?.rol ||
  ''
).toString().toLowerCase().trim()

const roleAliases = {
  admin: 'administrador',
  administrador: 'administrador',
  experto: 'experto',
  caficultor: 'cafetero',
  cafetero: 'cafetero',
  productor: 'cafetero',
}

const role = roleAliases[rawRole] || rawRole
const NAV_ITEMS = ALL_ITEMS.filter((item) => item.roles.includes(role))

  const initials = ((user?.nombre?.[0] ?? '') + (user?.apellido?.[0] ?? '')).toUpperCase() ||
                   (user?.correo?.[0] ?? 'A').toUpperCase()

  const displayName = user?.nombre
    ? `${user.nombre} ${user.apellido ?? ''}`.trim()
    : (user?.correo ?? 'Usuario')

  const isCategoriasActive = activePage === 'categorias'
  const isUsuariosActive =
    activePage === 'administrador' ||
    activePage === 'experto' ||
    activePage === 'cafetero'

  return (
    <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
      <button className="sidebar-close" onClick={onToggle} aria-label="Cerrar menú">
        <BiX size={22} />
      </button>
        <div className="sidebar-logo">
          <AnimatedLogo size="md" horizontal />
        </div>

      <div className="sidebar-profile">
        <div className="sidebar-avatar">
          {user?.fotoPerfil
            ? <img src={user.fotoPerfil} alt="Foto" className="sidebar-avatar-img" />
            : initials
          }
        </div>
        <div className="sidebar-profile-info">
          <p className="sidebar-profile-name">{displayName}</p>
          <p className="sidebar-profile-role">{role}</p>
        </div>
        <button className="sidebar-profile-logout" onClick={logout} title="Cerrar sesión">
          <BiLogOut size={16} />
        </button>
      </div>

      <button
        className={`sidebar-perfil-link${activePage === 'perfil' ? ' active' : ''}`}
        onClick={() => onNavigate('perfil')}
        title="Mi Perfil"
      >
        <BiUser size={16} />
        <span>Mi Perfil</span>
      </button>

      <hr className="sidebar-divider" />

      <nav className="sidebar-nav">
        {/* Dashboard - always first */}
        {NAV_ITEMS.slice(0, 1).map(item => (
          <button
            key={item.key}
            className={`sidebar-nav-item${activePage === item.key ? ' active' : ''}`}
            onClick={() => { onNavigate(item.key); setCatOpen(false); setUsuOpen(false) }}
            title={item.label}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
          </button>
        ))}

        {/* Usuarios - right after Dashboard */}
        {role === 'administrador' && (
          <>
            <button
              className={`sidebar-nav-item${isUsuariosActive ? ' active' : ''}`}
              onClick={() => setUsuOpen(!usuOpen)}
              title="Usuarios"
            >
              <span className="sidebar-nav-icon">
                <BiUser size={20} />
              </span>
              <span className="sidebar-nav-label">Usuarios</span>
              <span className={`sidebar-arrow${usuOpen ? ' open' : ''}`}>▾</span>
            </button>
            {usuOpen && (
              <div className="sidebar-submenu">
                {USU_ITEMS.map(sub => (
                  <button
                    key={sub.key}
                    className={`sidebar-submenu-item${activePage === sub.key ? ' active' : ''}`}
                    onClick={() => { onNavigate(sub.key); setCatOpen(false) }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Rest of nav items (after Dashboard) */}
        {NAV_ITEMS.slice(1).map(item => (
          <button
            key={item.key}
            className={`sidebar-nav-item${activePage === item.key ? ' active' : ''}`}
            onClick={() => { onNavigate(item.key); setCatOpen(false); setUsuOpen(false) }}
            title={item.label}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
          </button>
        ))}

        {role === 'administrador' && (
          <>
            <button
              className={`sidebar-nav-item${isCategoriasActive ? ' active' : ''}`}
              onClick={() => setCatOpen(!catOpen)}
              title="Categorías"
            >
              <span className="sidebar-nav-icon">
                <BiListUl size={20} />
              </span>
              <span className="sidebar-nav-label">Categorías</span>
              <span className={`sidebar-arrow${catOpen ? ' open' : ''}`}>▾</span>
            </button>

            {catOpen && (
              <div className="sidebar-submenu">
                {CAT_ITEMS.map(sub => (
                  <button
                    key={sub.key}
                    className={`sidebar-submenu-item${activePage === 'categorias' ? ' active' : ''}`}
                    onClick={() => onNavigate('categorias', sub.key)}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  )
}