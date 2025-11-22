import { useState, useEffect } from "react";
import axios from "axios";
// 1. Importamos las herramientas de React Router
import { Routes, Route, Navigate } from "react-router-dom";

// Importamos nuestras páginas
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EvaluationPage from "./pages/EvaluationPage";
import TeacherGradingPage from "./pages/TeacherGradingPage"; // <-- NUEVA IMPORTACIÓN

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

  return (
    <Routes>
      {/* Ruta 1: La raíz ("/") - Dashboard */}
      <Route
        path="/"
        element={
          user ? (
            <DashboardPage user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Ruta 2: La página de Login ("/login") */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Ruta 3: Página de Evaluación (Para el Estudiante) */}
      <Route
        path="/evaluacion/:id"
        element={
          user ? (
            <EvaluationPage user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Ruta 4: Panel de Calificación (NUEVA - Solo para Docentes) */}
      <Route
        path="/docente/evaluacion/:id"
        element={
          user && user.rol === "docente" ? (
            <TeacherGradingPage />
          ) : (
            // Si no es docente o no está logueado, lo mandamos al inicio
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
