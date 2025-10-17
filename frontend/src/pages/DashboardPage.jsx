import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Componentes existentes
import CreateClassForm from "../components/CreateClassForm";
import EnrollClassForm from "../components/EnrollClassForm";
import UploadRubricForm from "../components/UploadRubricForm";
// Nuevo componente que vamos a crear en el siguiente paso
import RubricList from "../components/RubricList";

// --- Componente para la vista del Docente ---
function TeacherView() {
  const [classes, setClasses] = useState([]);
  const [rubrics, setRubrics] = useState([]);

  // Función para cargar todos los datos del docente (clases y rúbricas)
  const fetchData = useCallback(async () => {
    try {
      // Hacemos ambas peticiones al mismo tiempo para más eficiencia
      const [classesRes, rubricsRes] = await Promise.all([
        axios.get("/api/clases"),
        axios.get("/api/rubricas"),
      ]);
      setClasses(classesRes.data);
      setRubrics(rubricsRes.data);
    } catch (error) {
      console.error("Error al cargar los datos del docente:", error);
    }
  }, []);

  // useEffect para cargar los datos cuando el componente se monta por primera vez
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="teacher-content">
      <hr />
      <CreateClassForm
        onClassCreated={(newClass) => setClasses([newClass, ...classes])}
      />
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
      <hr />
      {/* Cuando se sube una rúbrica, llamamos a fetchData para recargar la lista */}
      <UploadRubricForm onUploadSuccess={fetchData} />
      <hr />
      <RubricList rubrics={rubrics} />
    </div>
  );
}

// --- Componente para la vista del Estudiante ---
// (Este componente no tiene cambios en esta feature)
function StudentView({ user }) {
  const [classes, setClasses] = useState([]);
  const fetchClasses = useCallback(async () => {
    try {
      const response = await axios.get("/api/clases/inscripciones");
      setClasses(response.data);
    } catch (error) {
      console.error("Error al cargar las clases:", error);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return (
    <div className="student-content">
      <hr />
      <EnrollClassForm onClassEnrolled={fetchClasses} />
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

        {/* Renderizado condicional basado en el rol del usuario */}
        {user.rol === "docente" && <TeacherView />}
        {user.rol === "estudiante" && <StudentView user={user} />}
      </div>
    </div>
  );
}

export default DashboardPage;
