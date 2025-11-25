import { useState, useEffect } from "react";
import axios from "axios";
import { Routes, Route, Navigate } from "react-router-dom";

// Importamos el componente mágico
import ScrollToTop from "./components/ScrollToTop";

// Importamos nuestras páginas
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EvaluationPage from "./pages/EvaluationPage";
import TeacherGradingPage from "./pages/TeacherGradingPage";
import StudentClassPage from "./pages/StudentClassPage";
import TeacherClassPage from "./pages/TeacherClassPage";
import CalendarPage from "./pages/CalendarPage";
import TeacherGradebookPage from "./pages/TeacherGradebookPage";

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
    <>
      {/* 👇 AQUÍ VA EL SCROLL TO TOP (Se ejecutará en cada cambio de ruta) */}
      <ScrollToTop />

      <Routes>
        {/* Ruta 1: Dashboard Principal */}
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

        {/* Ruta 2: Login */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* Ruta 3: Evaluación (Estudiante) */}
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

        {/* Ruta 4: Calificación (Docente) */}
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

        {/* Ruta 5: Aula Virtual (Estudiante) */}
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

        {/* Ruta 6: Gestión de Clase (Docente) */}
        <Route
          path="/docente/clase/:id"
          element={
            user && user.rol === "docente" ? (
              <MainLayout user={user}>
                <TeacherClassPage />
              </MainLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Ruta 7: Calendario Académico */}
        <Route
          path="/calendario"
          element={
            user ? (
              <MainLayout user={user}>
                <CalendarPage />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Ruta 8: Gradebook Global */}
        <Route
          path="/docente/gradebook/:id"
          element={
            user && user.rol === "docente" ? (
              <MainLayout user={user}>
                <TeacherGradebookPage />
              </MainLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </>
  );
}

export default App;
