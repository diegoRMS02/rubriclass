import React from "react";
import DashboardTeacher from "./DashboardTeacher";
import DashboardStudent from "./DashboardStudent";

function DashboardPage({ user }) {
  if (!user) return null;

  // Simplemente decidimos qué componente mostrar según el rol
  return (
    <>
      {user.rol === "docente" && <DashboardTeacher user={user} />}
      {user.rol === "estudiante" && <DashboardStudent user={user} />}
    </>
  );
}

export default DashboardPage;
