import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import CreateClassForm from "../components/CreateClassForm";
import EnrollClassForm from "../components/EnrollClassForm";

// --- Componente para la vista del Docente ---
function TeacherView({ user, classes, onClassCreated }) {
  return (
    <div className="teacher-content">
      <hr />
      <CreateClassForm onClassCreated={onClassCreated} />
      <hr />
      <div className="class-list-container">
        <h2>Mis Clases</h2>
        {classes.length === 0 ? (
          <p>Aún no has creado ninguna clase.</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}

// --- Componente para la vista del Estudiante ---
function StudentView({ user, classes, onClassEnrolled }) {
  return (
    <div className="student-content">
      <hr />
      <EnrollClassForm onClassEnrolled={onClassEnrolled} />
      <hr />
      <div className="class-list-container">
        <h2>Mis Clases Inscritas</h2>
        {classes.length === 0 ? (
          <p>Aún no te has inscrito a ninguna clase.</p>
        ) : (
          <ul className="class-list">
            {classes.map((clase) => (
              <li key={clase.id} className="class-item">
                <span className="class-name">{clase.nombre_clase}</span>
                <span className="teacher-name">
                  Docente: {clase.nombre_docente}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- Componente Principal del Dashboard ---
function DashboardPage({ user }) {
  const [classes, setClasses] = useState([]);

  const fetchClasses = useCallback(async () => {
    try {
      let response;
      if (user.rol === "docente") {
        response = await axios.get("/api/clases");
      } else if (user.rol === "estudiante") {
        response = await axios.get("/api/clases/inscripciones");
      }
      if (response) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error("Error al cargar las clases:", error);
    }
  }, [user.rol]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
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
          <TeacherView
            user={user}
            classes={classes}
            onClassCreated={(newClass) => setClasses([newClass, ...classes])}
          />
        )}

        {user.rol === "estudiante" && (
          <StudentView
            user={user}
            classes={classes}
            onClassEnrolled={fetchClasses}
          />
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
