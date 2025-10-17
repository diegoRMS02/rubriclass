import React from "react";

function LoginPage() {
  const handleLogin = () => {
    // La funcionalidad sigue siendo la misma
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Bienvenido a la Plataforma de Rúbricas</h1>
        <p>Por favor, inicia sesión para continuar.</p>

        {/* Usamos las clases de CSS que definimos en index.css */}
        <button onClick={handleLogin} className="google-login-button">
          {/* Logo de Google como SVG para que siempre funcione */}
          <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#4285F4"
              d="M17.64 9.20455c0-.63864-.05727-1.25182-.16364-1.84091H9.18182v3.48182h4.79091c-.20455 1.125-.82273 2.07818-1.77727 2.71818v2.25909h2.90909c1.70455-1.56818 2.68636-3.87273 2.68636-6.61818z"
            />
            <path
              fill="#34A853"
              d="M9.18182 18c2.43182 0 4.46364-.80591 5.95455-2.18182l-2.90909-2.25909c-.80591.54545-1.84091.87273-3.04545.87273-2.31818 0-4.28182-1.56818-5.00455-3.66818H1.27273v2.33182C2.76364 16.3125 5.75455 18 9.18182 18z"
            />
            <path
              fill="#FBBC05"
              d="M4.17727 10.7625c-.14091-.41909-.21818-.87273-.21818-1.33182s.07727-.91273.21818-1.33182V5.76818H1.27273C.46364 7.2375 0 8.6875 0 10.2375s.46364 2.99091 1.27273 4.46023l2.90455-2.26682z"
            />
            <path
              fill="#EA4335"
              d="M9.18182 3.98182c1.32273 0 2.50909.45455 3.44091 1.34545l2.58182-2.58182C13.63636.959091 11.60455 0 9.18182 0 5.75455 0 2.76364 1.6875 1.27273 4.13182l2.90455 2.26682c.72273-2.1 2.68636-3.66818 5.00455-3.66818z"
            />
          </svg>
          Iniciar Sesión con Google
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
