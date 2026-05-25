import { useState, useEffect } from "react";
import {
  Coffee,
  Mail,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

import PasswordStrength from "../components/PasswordStrength";
import "./RecuperarContrasena.css";

const API_BASE_URL = "http://localhost:3333";

async function apiFetch(ruta, body) {
  const response = await fetch(`${API_BASE_URL}${ruta}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Ocurrió un error en el servidor"
    );
  }

  return data;
}

/* =========================================================
   PASO 1 — ENVIAR CORREO
========================================================= */

function PasoEmail({ onSiguiente }) {
  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const enviarCodigo = async () => {
    if (!correo.includes("@")) {
      setError("Ingresa un correo válido");
      return;
    }

    try {
      setCargando(true);
      setError("");

      await apiFetch("/recuperar-password", {
        correo,
      });

      onSiguiente(correo);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="recuperar-card">
      <div className="recuperar-logo">
        <Coffee size={34} />
      </div>

      <h2 className="recuperar-titulo">
        Recuperar contraseña
      </h2>

      <p className="recuperar-subtitulo">
        Ingresa tu correo electrónico y te enviaremos
        un código de recuperación.
      </p>

      <div className="recuperar-campo">
        <label>Correo electrónico</label>

        <div className="recuperar-input-group">
          <Mail size={18} />

          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={cargando}
          />
        </div>
      </div>

      {error && (
        <div className="recuperar-error">
          {error}
        </div>
      )}

      <button
        className="recuperar-boton"
        onClick={enviarCodigo}
        disabled={cargando}
      >
        {cargando
          ? "Enviando código..."
          : "Enviar código"}
      </button>
    </div>
  );
}

/* =========================================================
   PASO 2 — INGRESAR CÓDIGO
========================================================= */

function PasoCodigo({ onSiguiente }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const verificarCodigo = async () => {
    if (!codigo || codigo.length < 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    try {
      setCargando(true);
      setError("");

      // ✅ Verificar el token contra el backend antes de avanzar
      await apiFetch("/verificar-token", { token: codigo });

      onSiguiente(codigo);
    } catch (err) {
      setError(err.message); // Mostrará "Código inválido" o "El código ha expirado"
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="recuperar-card">
      <div className="recuperar-logo">
        <ShieldCheck size={34} />
      </div>

      <h2 className="recuperar-titulo">Verificación</h2>

      <p className="recuperar-subtitulo">
        Revisa tu correo e ingresa el código de recuperación.
      </p>

      <div className="recuperar-campo">
        <label>Código</label>
        <div className="recuperar-input-group">
          <KeyRound size={18} />
          <input
            type="text"
            className="codigo-input"
            placeholder="123456"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            maxLength={6}
            disabled={cargando}
          />
        </div>
      </div>

      {error && <div className="recuperar-error">{error}</div>}

      <button
        className="recuperar-boton"
        onClick={verificarCodigo}
        disabled={cargando}
      >
        {cargando ? "Verificando..." : "Continuar"}
      </button>
    </div>
  );
}

/* =========================================================
   PASO 3 — NUEVA CONTRASEÑA
========================================================= */

function PasoNuevaContrasena({
  token,
  onExito,
}) {
  const [nuevaPassword, setNuevaPassword] =
    useState("");

  const [confirmar, setConfirmar] =
    useState("");

  const [error, setError] = useState("");

  const [cargando, setCargando] =
    useState(false);

  const cambiarPassword = async () => {
    if (nuevaPassword.length < 6) {
      setError(
        "La contraseña debe tener mínimo 6 caracteres"
      );
      return;
    }

    if (nuevaPassword !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      setCargando(true);
      setError("");

      await apiFetch("/restablecer-password", {
        token,
        nuevaPassword,
      });

      onExito();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="recuperar-card">
      <div className="recuperar-logo">
        <KeyRound size={34} />
      </div>

      <h2 className="recuperar-titulo">
        Nueva contraseña
      </h2>

      <p className="recuperar-subtitulo">
        Crea una contraseña segura para tu cuenta.
      </p>

      <div className="recuperar-campo">
        <label>Nueva contraseña</label>

        <div className="recuperar-input-group">
          <input
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={nuevaPassword}
            onChange={(e) =>
              setNuevaPassword(e.target.value)
            }
          />
        </div>
        <PasswordStrength password={nuevaPassword} />
      </div>

      <div className="recuperar-campo">
        <label>Confirmar contraseña</label>

        <div className="recuperar-input-group">
          <input
            type="password"
            placeholder="Repite tu contraseña"
            value={confirmar}
            onChange={(e) =>
              setConfirmar(e.target.value)
            }
          />
        </div>
      </div>

      {error && (
        <div className="recuperar-error">
          {error}
        </div>
      )}

      <button
        className="recuperar-boton"
        onClick={cambiarPassword}
        disabled={cargando}
      >
        {cargando
          ? "Actualizando..."
          : "Cambiar contraseña"}
      </button>
    </div>
  );
}

/* =========================================================
   PASO 4 — ÉXITO
========================================================= */

function PasoExito({ onIrAlLogin }) {
  return (
    <div className="recuperar-card exito-card">
      <div className="recuperar-logo exito-logo">
        <CheckCircle2 size={42} />
      </div>

      <h2 className="recuperar-titulo">
        Contraseña actualizada
      </h2>

      <p className="recuperar-subtitulo">
        Tu contraseña fue actualizada exitosamente.
      </p>

      <button
        className="recuperar-boton"
        onClick={onIrAlLogin}
      >
        Volver al inicio de sesión
      </button>
    </div>
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function RecuperarContrasena({
  onIrAlLogin,
}) {
  const [paso, setPaso] = useState(1);

  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const tokenUrl = params.get("token");

    if (tokenUrl) {
      setToken(tokenUrl);
      setPaso(3);
    }
  }, []);

  return (
    <div className="recuperar-container">
      {paso === 1 && (
        <PasoEmail
          onSiguiente={() => setPaso(2)}
        />
      )}

      {paso === 2 && (
        <PasoCodigo
          onSiguiente={(codigo) => {
            setToken(codigo);
            setPaso(3);
          }}
        />
      )}

      {paso === 3 && (
        <PasoNuevaContrasena
          token={token}
          onExito={() => setPaso(4)}
        />
      )}

      {paso === 4 && (
        <PasoExito
          onIrAlLogin={onIrAlLogin}
        />
      )}
    </div>
  );
}