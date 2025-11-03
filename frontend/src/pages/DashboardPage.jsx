import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Componentes
import CreateClassForm from "../components/CreateClassForm";
import EnrollClassForm from "../components/EnrollClassForm";
import UploadRubricForm from "../components/UploadRubricForm";
import RubricList from "../components/RubricList";
import AssignRubricModal from "../components/AssignRubricModal";
import EvaluationList from "../components/EvaluationList"; // <-- 1. IMPORTAMOS LA NUEVA LISTA

// --- Componente para la vista del Docente ---
function TeacherView() {
  const [classes, setClasses] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [evaluations, setEvaluations] = useState([]); // <-- 2. AÑADIMOS ESTADO PARA EVALUACIONES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // Carga todos los datos del docente (clases, rúbricas y evaluaciones)
  const fetchData = useCallback(async () => {
    try {
      // 3. ACTUALIZAMOS PROMISE.ALL PARA INCLUIR EVALUACIONES
      const [classesRes, rubricsRes, evaluationsRes] = await Promise.all([
        axios.get("/api/clases"),
        axios.get("/api/rubricas"),
        axios.get("/api/evaluaciones"), // Pide las evaluaciones creadas
      ]);
      setClasses(classesRes.data);
      setRubrics(rubricsRes.data);
      setEvaluations(evaluationsRes.data); // 4. GUARDAMOS LAS EVALUACIONES
    } catch (error) {
      console.error("Error al cargar los datos del docente:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (clase) => {
    setSelectedClass(clase);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedClass(null);
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    alert("¡Evaluación asignada con éxito!");
    fetchData(); // <-- 5. ACTUALIZAMOS LA LISTA AL CREAR UNA NUEVA
    handleCloseModal();
  };

  return (
    <div className="teacher-content">
      <hr />
      <CreateClassForm
        onClassCreated={(newClass) => setClasses([newClass, ...classes])}
      />
      <hr />

      {/* --- LISTA DE CLASES MODIFICADA CON EL BOTÓN --- */}
      <div className="class-list-container">
        <h2>Mis Clases</h2>
        {classes.length === 0 ? (
          <p>Aún no has creado ninguna clase.</p>
        ) : (
          <ul className="class-list">
            {classes.map((clase) => (
              <li key={clase.id} className="class-item">
                <span className="class-name">{clase.nombre_clase}</span>
                <div className="class-actions">
                  <span className="class-code">
                    Código: <strong>{clase.codigo_inscripcion}</strong>
                  </span>
                  <button
                    onClick={() => handleOpenModal(clase)}
                    className="class-assign-btn"
                  >
                    Asignar Evaluación
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr />

      {/* --- 6. AÑADIMOS LA LISTA DE EVALUACIONES --- */}
      <EvaluationList evaluations={evaluations} />

      <hr />
      <UploadRubricForm onUploadSuccess={fetchData} />
      <hr />
      <RubricList rubrics={rubrics} />

      {/* --- RENDERIZADO DEL MODAL (solo si está abierto) --- */}
      {isModalOpen && (
        <AssignRubricModal
          clase={selectedClass}
          rubricas={rubrics}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

// --- Componente para la vista del Estudiante ---
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
