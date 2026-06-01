import React, { useState } from 'react';
import './PerfilExperto.css';

export default function PerfilExperto({ onBack, onLogout }) {
  // Pestaña activa dentro del perfil
  const [activeTab, setActiveTab] = useState('personal');

  // Estados del formulario de información personal
  const [formData, setFormData] = useState({
    nombre: 'Jhon Anderson',
    apellido: 'Muñoz Flor',
    correo: 'ejhon2053@gmail.com',
    telefono: '3137079691',
    observaciones: 'Especializado en sanidad vegetal y optimización de cultivos de café especial de alta altitud.'
  });

  // Estados para el formulario de seguridad
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePersonal = (e) => {
    e.preventDefault();
    alert('Información personal guardada con éxito.');
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    alert('Contraseña actualizada con éxito.');
  };

  const getInitials = () => {
    const n = formData.nombre.trim().charAt(0).toUpperCase();
    const a = formData.apellido.trim().charAt(0).toUpperCase();
    return `${n}${a}` || 'EX';
  };

  return (
    <div className="cl-profile-container">
      
      {/* BARRA SUPERIOR */}
      <div className="cl-profile-top-bar">
        <div className="cl-profile-header-titles">
          <h1 className="cl-profile-main-title">Perfil del experto</h1>
          <p className="cl-profile-subtitle">Información personal y profesional dentro de la plataforma.</p>
        </div>
        
        <button 
          type="button"
          className="cl-btn-profile-back" 
          onClick={onBack}
          title="Regresar al panel de fincas"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver al panel
        </button>
      </div>

      {/* CUERPO DEL PERFIL (GRID PRINCIPAL) */}
      <div className="cl-profile-layout-grid">
        
        {/* COLUMNA IZQUIERDA: TARJETA DE IDENTIDAD */}
        <div className="cl-profile-sidebar-card">
          <div className="cl-profile-avatar-wrapper">
            <div className="cl-profile-avatar-circle">
              {getInitials()}
            </div>
          </div>

          <div className="cl-profile-identity-info">
            <h2 className="cl-profile-user-fullname">
              {formData.nombre} {formData.apellido}
            </h2>
            <span className="cl-profile-badge-role">Experto Agrónomo</span>
          </div>

          <div className="cl-profile-contact-list">
            <div className="cl-contact-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>{formData.correo}</span>
            </div>
            <div className="cl-contact-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>{formData.telefono}</span>
            </div>
          </div>

          <div className="cl-profile-meta-account">
            <h3 className="cl-meta-section-title">Cuenta</h3>
            <div className="cl-meta-row">
              <span className="cl-meta-label">Rol</span>
              <span className="cl-meta-value bold-text">Experto</span>
            </div>
            <div className="cl-meta-row">
              <span className="cl-meta-label">Estado</span>
              <span className="cl-meta-value cl-status-active">Activo</span>
            </div>
          </div>

          <button type="button" className="cl-btn-profile-logout" onClick={onLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>

        {/* COLUMNA DERECHA: PANELES DE FORMULARIOS */}
        <div className="cl-profile-main-content-card">
          
          <div className="cl-profile-tabs-nav">
            <button 
              type="button"
              className={`cl-tab-nav-btn ${activeTab === 'personal' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Información personal
            </button>
            <button 
              type="button"
              className={`cl-tab-nav-btn ${activeTab === 'seguridad' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('seguridad')}
            >
              Seguridad
            </button>
          </div>

          {/* CONTENIDO: INFORMACIÓN PERSONAL */}
          {activeTab === 'personal' && (
            <form className="cl-profile-tab-form-body" onSubmit={handleSavePersonal}>
              
              <div className="cl-profile-form-grid">
                <div className="cl-profile-form-group">
                  <label>Nombre</label>
                  <input 
                    type="text" 
                    name="nombre" 
                    value={formData.nombre} 
                    onChange={handleInputChange} 
                    required
                  />
                </div>
                <div className="cl-profile-form-group">
                  <label>Apellido</label>
                  <input 
                    type="text" 
                    name="apellido" 
                    value={formData.apellido} 
                    onChange={handleInputChange} 
                    required
                  />
                </div>
                <div className="cl-profile-form-group">
                  <label>Correo electrónico</label>
                  <input 
                    type="email" 
                    name="correo" 
                    value={formData.correo} 
                    onChange={handleInputChange} 
                    required
                  />
                </div>
                <div className="cl-profile-form-group">
                  <label>Teléfono</label>
                  <input 
                    type="tel" 
                    name="telefono" 
                    value={formData.telefono} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>

              <div className="cl-profile-form-group cl-full-width">
                <label>Observaciones</label>
                <textarea 
                  name="observaciones" 
                  value={formData.observaciones} 
                  onChange={handleInputChange} 
                  rows="4"
                />
              </div>

              <div className="cl-profile-form-actions">
                <button type="submit" className="cl-btn-brand-submit">
                  Guardar cambios
                </button>
              </div>
            </form>
          )}

          {/* CONTENIDO: SEGURIDAD */}
          {activeTab === 'seguridad' && (
            <form className="cl-profile-tab-form-body" onSubmit={handleSaveSecurity}>
              <div className="cl-profile-form-group">
                <label>Contraseña actual</label>
                <input 
                  type="password" 
                  name="currentPassword" 
                  value={securityData.currentPassword} 
                  onChange={handleSecurityChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="cl-profile-form-grid">
                <div className="cl-profile-form-group">
                  <label>Nueva contraseña</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={securityData.newPassword} 
                    onChange={handleSecurityChange}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>

                <div className="cl-profile-form-group">
                  <label>Confirmar nueva contraseña</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={securityData.confirmPassword} 
                    onChange={handleSecurityChange}
                    placeholder="Repite la contraseña"
                    required
                  />
                </div>
              </div>

              <div className="cl-profile-form-actions">
                <button type="submit" className="cl-btn-brand-submit">
                  Actualizar credenciales
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}