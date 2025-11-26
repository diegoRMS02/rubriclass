import { useState, useEffect } from "react";
import axios from "axios";
import { Routes, Route, Navigate } from "react-router-dom";

// Importamos el componente mágico de scroll
import ScrollToTop from "./components/ScrollToTop";

// --- PÁGINAS EXISTENTES (Docente/Estudiante) ---
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EvaluationPage from "./pages/EvaluationPage";
import TeacherGradingPage from "./pages/TeacherGradingPage";
import StudentClassPage from "./pages/StudentClassPage";
import TeacherClassPage from "./pages/TeacherClassPage";
import CalendarPage from "./pages/CalendarPage";
import TeacherGradebookPage from "./pages/TeacherGradebookPage";

// --- PÁGINAS DE ADMINISTRADOR (NUEVAS) ---
import AdminDashboard from "./pages/AdminDashboard";
// Nota: Ajusta la ruta si moviste este archivo a la carpeta 'admin'
import UserManagementPage from "./pages/UserManagementPage";
// 👇 NUEVO IMPORT
import ClassManagementPage from "./pages/ClassManagementPage";

// --- LAYOUTS ---
import MainLayout from "./layout/MainLayout";
import AdminLayout from "./layout/AdminLayout"; // Layout oscuro

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
      {/* ScrollToTop se ejecuta en cada cambio de ruta */}
      <ScrollToTop />

      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* --- RUTAS PRINCIPALES (Redirección inteligente) --- */}
        <Route
          path="/"
          element={
            user ? (
              // Si es admin, el componente DashboardPage lo redirigirá a /admin
              <MainLayout user={user}>
                <DashboardPage user={user} />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* --- RUTAS DE DOCENTE / ESTUDIANTE --- */}
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

        {/* --- ZONA DE ADMINISTRADOR --- */}

        {/* Dashboard Admin */}
        <Route
          path="/admin"
          element={
            user && user.rol === "admin" ? (
              <AdminLayout user={user}>
                <AdminDashboard />
              </AdminLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Gestión de Usuarios (Tabla) */}
        <Route
          path="/admin/usuarios"
          element={
            user && user.rol === "admin" ? (
              <AdminLayout user={user}>
                <UserManagementPage />
              </AdminLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* 👇 GESTIÓN DE CLASES (NUEVA RUTA) */}
        <Route
          path="/admin/clases"
          element={
            user && user.rol === "admin" ? (
              <AdminLayout user={user}>
                <ClassManagementPage />
              </AdminLayout>
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
