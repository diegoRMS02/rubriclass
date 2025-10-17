import React from "react";

// Este componente recibe los datos del usuario a través de "props"
function DashboardPage({ user }) {
  const handleLogout = () => {
    // Al hacer clic, redirigimos al endpoint de logout del backend
    window.location.href = "/api/auth/logout";
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1>Bienvenido, {user.nombre_completo}</h1>
        <p>Has iniciado sesión correctamente.</p>
        <p>
          Tu rol asignado es: <strong>{user.rol}</strong>
        </p>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
