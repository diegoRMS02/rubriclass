import { useState, useEffect } from "react";
import axios from "axios";
// 1. Importamos las herramientas de React Router
import { Routes, Route, Navigate } from "react-router-dom";

// Importamos nuestras páginas
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EvaluationPage from "./pages/EvaluationPage"; // <-- La nueva página

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const response = await axios.get("/api/auth/profile");
        setUser(response.data);
      } catch (error) {
        console.log("No hay sesión de usuario activa.");
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  // Mientras verificamos la sesión, mostramos "Cargando..."
  if (loading) {
    return <div>Cargando...</div>;
  }

  // --- 2. AQUÍ ESTÁ LA NUEVA LÓGICA DE RUTAS ---
  return (
    <Routes>
      {/* Ruta 1: La raíz ("/") */}
      <Route
        path="/"
        element={
          // Si el usuario ESTÁ logueado, muestra el Dashboard.
          user ? (
            <DashboardPage user={user} />
          ) : (
            // Si NO está logueado, redirige a /login.
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Ruta 2: La página de Login ("/login") */}
      <Route
        path="/login"
        element={
          // Si el usuario ESTÁ logueado, redirige al Dashboard.
          user ? (
            <Navigate to="/" replace />
          ) : (
            // Si NO está logueado, muestra la página de Login.
            <LoginPage />
          )
        }
      />

      {/* Ruta 3: La nueva página de Evaluación */}
      <Route
        path="/evaluacion/:id"
        element={
          // Si el usuario ESTÁ logueado, muestra la página de Evaluación.
          user ? (
            <EvaluationPage user={user} />
          ) : (
            // Si NO está logueado, lo patea al Login.
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
