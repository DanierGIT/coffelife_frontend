import "./login.css";

function Login({ goToRegister }) {

  return (

    <div className="login-container">

      {/* IZQUIERDA */}

      <div className="login-left">

        <div className="logo">

          <span className="logo-icon">🌱</span>
          <h1>CoffeeLife</h1>

        </div>

        <div className="hero-content">

          <h2>
            Cada acción cuenta,
            <br />
            cada hábito <span>transforma.</span>
          </h2>

          <p>
            Únete a CoffeeLife y sé parte de una comunidad
            que construye un futuro más sostenible.
          </p>

          <div className="benefits">

            <div className="benefit-item">

              <div className="benefit-icon">🌿</div>

              <div>

                <h4>Impacto real</h4>

                <p>
                  Tus acciones generan un cambio positivo.
                </p>

              </div>

            </div>

            <div className="benefit-item">

              <div className="benefit-icon">👥</div>

              <div>

                <h4>Comunidad activa</h4>

                <p>
                  Conecta y comparte experiencias.
                </p>

              </div>

            </div>

            <div className="benefit-item">

              <div className="benefit-icon">🎁</div>

              <div>

                <h4>Recompensas verdes</h4>

                <p>
                  Gana puntos y desbloquea beneficios.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* DERECHA */}

      <div className="login-right">

        <div className="login-card">

          <div className="login-logo">
            🌱
          </div>

          <h2>¡Bienvenido de nuevo!</h2>

          <p>
            Inicia sesión para continuar
            con tu experiencia en CoffeeLife.
          </p>

          <form className="login-form">

            <input
              type="email"
              placeholder="Correo electrónico"
            />

            <input
              type="password"
              placeholder="Contraseña"
            />

            <div className="login-options">

              <label>

                <input type="checkbox" />
                Recordarme

              </label>

              <a href="#">
                ¿Olvidaste tu contraseña?
              </a>

            </div>

            <button type="submit">
              Iniciar sesión →
            </button>

          </form>

          <div className="divider">

            <span>o continúa con</span>

          </div>

          <button className="social-btn">
            Continuar con Google
          </button>

          <button className="social-btn">
            Continuar con Microsoft
          </button>

          <p className="register-text">

            ¿No tienes una cuenta?

            <span
              onClick={goToRegister}
              style={{ cursor: "pointer" }}
            >
              {" "}Regístrate
            </span>

          </p>

        </div>

      </div>

    </div>

  );

}

export default Login;