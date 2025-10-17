import React, { useState, useEffect } from "react";
import axios from "axios";
import CreateClassForm from "../components/CreateClassForm";

// Componente para la lista de clases
function ClassList({ classes }) {
  if (classes.length === 0) {
    return <p>Aún no has creado ninguna clase.</p>;
  }

  return (
    <div className="class-list-container">
      <h2>Mis Clases</h2>
      <ul className="class-list">
        {classes.map((clase) => (
          <li key={clase.id} className="class-item">
            <span className="class-name">{clase.nombre_clase}</span>
            <span className="class-code">
              Código: <strong>{clase.codigo_inscripcion}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashboardPage({ user }) {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (user.rol === "docente") {
      const fetchClasses = async () => {
        try {
          const response = await axios.get("/api/clases");
          setClasses(response.data);
        } catch (error) {
          console.error("Error al cargar las clases:", error);
        }
      };
      fetchClasses();
    }
  }, [user.rol]);

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  const handleClassCreated = (newClass) => {
    setClasses([newClass, ...classes]);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="welcome-header">
          <h1>Bienvenido, {user.nombre_completo}</h1>
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
        <p>
          Tu rol asignado es: <strong>{user.rol}</strong>
        </p>

        {user.rol === "docente" && (
          <div className="teacher-content">
            <hr />
            <CreateClassForm onClassCreated={handleClassCreated} />
            <hr />
            <ClassList classes={classes} />
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
