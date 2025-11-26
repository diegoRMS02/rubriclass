import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardTeacher from "./DashboardTeacher";
import DashboardStudent from "./DashboardStudent";

function DashboardPage({ user }) {
  const navigate = useNavigate();

  // EFECTO: Si es Admin, lo mandamos a su bunker
  useEffect(() => {
    if (user.rol === "admin") {
      navigate("/admin");
    }
  }, [user, navigate]);

  // Renderizado según rol
  if (user.rol === "docente") {
    return <DashboardTeacher user={user} />;
  }

  if (user.rol === "estudiante") {
    return <DashboardStudent user={user} />;
  }

  // Si es admin, retornamos null mientras se hace la redirección
  // (o un spinner de carga si prefieres)
  return null;
}

export default DashboardPage;
