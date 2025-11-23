import { useState, useEffect } from "react";
import axios from "axios";
import { Routes, Route, Navigate } from "react-router-dom";

// Importamos nuestras páginas
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EvaluationPage from "./pages/EvaluationPage";
import TeacherGradingPage from "./pages/TeacherGradingPage";
import StudentClassPage from "./pages/StudentClassPage"; // <-- IMPORTAMOS LA NUEVA PÁGINA

// Importamos el Layout Principal
import MainLayout from "./layout/MainLayout";

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

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "50px" }}
      >
        Cargando EvaluaGO...
      </div>
    );
  }

  return (
    <Routes>
      {/* Ruta 1: La raíz ("/") - Dashboard */}
      <Route
        path="/"
        element={
          user ? (
            <MainLayout user={user}>
              <DashboardPage user={user} />
            </MainLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Ruta 2: La página de Login ("/login") - SIN LAYOUT */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Ruta 3: Página de Evaluación (Para el Estudiante) */}
      <Route
        path="/evaluacion/:id"
        element={
          user ? (
            <MainLayout user={user}>
              <EvaluationPage user={user} />
            </MainLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Ruta 4: Panel de Calificación (Solo para Docentes) */}
      <Route
        path="/docente/evaluacion/:id"
        element={
          user && user.rol === "docente" ? (
            <MainLayout user={user}>
              <TeacherGradingPage />
            </MainLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Ruta 5: Aula Virtual del Curso (Solo para Estudiantes) */}
      <Route
        path="/clase/:id"
        element={
          user ? (
            <MainLayout user={user}>
              <StudentClassPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
