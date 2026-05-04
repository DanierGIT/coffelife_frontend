import { useEffect, useRef, useState } from "react";
import "./MiPerfil.css";
import api from "../../services/api"

const DEFAULT_PROFILE = {
  username: "",
  email: "",
  phone: "",
  location: "",
  bio: "",
  avatarUrl: "",
};
 
function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "?";
}
 
export default function MiPerfil() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_PROFILE);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const fileRef = useRef(null);
  const overlayRef = useRef(null);
 
  useEffect(() => {
    loadProfile();
  }, []);
 
  const loadProfile = async () => {
    try {
      const res = await api.get("/profile");
      const data = {
        username: res.data.username || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        location: res.data.location || "",
        bio: res.data.bio || "",
        avatarUrl: res.data.avatarUrl || "",
      };
      setProfile(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
 
  const openModal = () => {
    setForm({ ...profile });
    setPreviewUrl(profile.avatarUrl);
    setMessage("");
    setModalOpen(true);
  };
 
  const closeModal = () => {
    setModalOpen(false);
    setPreviewUrl("");
  };
 
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
 
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);
  };
 
  const handleSave = async () => {
    setMessage("");
    try {
      const payload = { ...form };
      if (previewUrl && previewUrl !== profile.avatarUrl) {
        payload.avatarUrl = previewUrl;
      }
      await api.put("/profile", payload);
      setProfile({ ...payload });
      setMessage("✅ Perfil actualizado correctamente");
      closeModal();
    } catch (error) {
      console.error(error);
      setMessage("❌ Error al actualizar perfil");
    }
  };
 
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) closeModal();
  };
 
  if (loading) return <p className="profile-loading">Cargando perfil...</p>;
 
  return (
    <div className="profile-page">
      {/* ── Profile card ── */}
      <div className="profile-card">
        <div className="profile-cover" />
 
        <div className="profile-avatar-row">
          <div className="profile-avatar">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Foto de perfil" />
            ) : (
              getInitials(profile.username)
            )}
          </div>
          <button className="profile-edit-btn" onClick={openModal}>
            Editar perfil
          </button>
        </div>
 
        <div className="profile-info">
          <p className="profile-name">{profile.username || "Sin nombre"}</p>
          <p className="profile-handle">@{profile.username?.toLowerCase().replace(/\s+/g, ".") || "usuario"}</p>
 
          <div className="profile-fields">
            <div className="profile-field">
              <span className="field-label">Correo</span>
              <span className="field-value">{profile.email || "—"}</span>
            </div>
            <div className="profile-field">
              <span className="field-label">Teléfono</span>
              <span className="field-value">{profile.phone || "—"}</span>
            </div>
            <div className="profile-field">
              <span className="field-label">Ubicación</span>
              <span className="field-value">{profile.location || "—"}</span>
            </div>
            <div className="profile-field">
              <span className="field-label">Descripción</span>
              <span className="field-value">{profile.bio || "—"}</span>
            </div>
          </div>
        </div>
      </div>
 
      {message && <p className="profile-message">{message}</p>}
 
      {/* ── Edit modal ── */}
      {modalOpen && (
        <div
          className="modal-overlay"
          ref={overlayRef}
          onClick={handleOverlayClick}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-label="Editar perfil">
            <div className="modal-header">
              <h2>Editar perfil</h2>
              <button className="modal-close" onClick={closeModal} aria-label="Cerrar">
                &#x2715;
              </button>
            </div>
 
            <div className="modal-body">
              {/* Avatar upload */}
              <div className="avatar-upload-row">
                <div className="avatar-preview">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Vista previa" />
                  ) : (
                    getInitials(form.username)
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    className="upload-btn"
                    onClick={() => fileRef.current?.click()}
                  >
                    Cambiar foto
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                  <p className="upload-hint">JPG, PNG o GIF. Máx 5 MB</p>
                </div>
              </div>
 
              {/* Fields */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="f-username">Nombre</label>
                  <input
                    id="f-username"
                    name="username"
                    value={form.username}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="f-email">Correo electrónico</label>
                  <input
                    id="f-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
 
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="f-phone">Teléfono</label>
                  <input
                    id="f-phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="f-location">Ubicación</label>
                  <input
                    id="f-location"
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
 
              <div className="form-group">
                <label htmlFor="f-bio">Descripción</label>
                <textarea
                  id="f-bio"
                  name="bio"
                  rows={3}
                  value={form.bio}
                  onChange={handleFormChange}
                />
              </div>
            </div>
 
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>
                Cancelar
              </button>
              <button className="btn-save" onClick={handleSave}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
