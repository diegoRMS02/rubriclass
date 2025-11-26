import React, { useState } from "react";
import axios from "axios";
import styles from "./LoginPage.module.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor ingresa correo y contraseña");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Enviamos credenciales al backend (Passport Local)
      await axios.post("/api/auth/login", { email, password });

      // Si es exitoso, forzamos una recarga completa para que
      // App.jsx ejecute checkUserSession() y detecte la cookie.
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      // Mostramos el mensaje que viene del backend (ej: "Contraseña incorrecta")
      setError(err.response?.data?.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>EvaluaGO 🚀</div>
        <p className={styles.subtitle}>Plataforma de Gestión Académica</p>

        {/* OPCIÓN 1: GOOGLE */}
        <a
          href="http://localhost:3001/api/auth/google"
          className={styles.googleBtn}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className={styles.googleIcon}
          />
          Continuar con Google
        </a>

        <div className={styles.divider}>o ingresa con credenciales</div>

        {/* OPCIÓN 2: LOCAL (ADMIN) */}
        <form onSubmit={handleLocalLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Correo Institucional
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="admin@escuela.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
