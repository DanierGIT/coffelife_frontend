import { useState, useEffect } from "react";
import {
  Mail,
  KeyRound,
} from "lucide-react";

import PasswordStrength from "../components/PasswordStrength";
import AnimatedLogo from "../components/AnimatedLogo";
import api from "../services/api";
import "./RecuperarContrasena.css";

async function apiPost(ruta, body) {
  try {
    const res = await api.post(ruta, body, { timeout: 30000 });
    return res.data;
  } catch (err) {
    console.error('[Recuperar] Error en', ruta, err.response?.status, err.response?.data, err.message)
    const serverMsg = err.response?.data
    const msg = typeof serverMsg === 'string' ? serverMsg
      : serverMsg?.message || serverMsg?.error
      || (err.code === 'ECONNABORTED' ? 'El servidor no respondió a tiempo. Intenta de nuevo.' : null)
      || (err.message === 'Network Error' ? 'No se pudo conectar con el servidor. Verifica tu conexión.' : null)
      || 'Ocurrió un error inesperado.'
    throw new Error(msg)
  }
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

      await apiPost("/recuperar-password", {
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
        <AnimatedLogo size="sm" showText={false} />
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

function PasoCodigo({ correo, onSiguiente }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const verificarCodigo = async () => {
    if (!codigo || codigo.length < 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    onSiguiente(codigo);
  };

  return (
    <div className="recuperar-card">
      <div className="recuperar-logo">
        <AnimatedLogo size="sm" showText={false} />
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
  correo,
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

      await apiPost("/restablecer-password", {
        correo,
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
        <AnimatedLogo size="sm" showText={false} />
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
        <AnimatedLogo size="sm" showText={false} />
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

  const [correo, setCorreo] = useState("");
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
          onSiguiente={(email) => {
            setCorreo(email);
            setPaso(2);
          }}
        />
      )}

      {paso === 2 && (
        <PasoCodigo
          correo={correo}
          onSiguiente={(codigo) => {
            setToken(codigo);
            setPaso(3);
          }}
        />
      )}

      {paso === 3 && (
        <PasoNuevaContrasena
          correo={correo}
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