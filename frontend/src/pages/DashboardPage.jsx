import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// Componentes
import CreateClassForm from "../components/CreateClassForm";
import EnrollClassForm from "../components/EnrollClassForm";
import UploadRubricForm from "../components/UploadRubricForm";
import RubricList from "../components/RubricList";
import AssignRubricModal from "../components/AssignRubricModal";
import EvaluationList from "../components/EvaluationList";

// --- Componente para la vista del Docente ---
function TeacherView({ user }) {
  const [classes, setClasses] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [classesRes, rubricsRes, evaluationsRes] = await Promise.all([
        axios.get("/api/clases"),
        axios.get("/api/rubricas"),
        axios.get("/api/evaluaciones"),
      ]);
      setClasses(classesRes.data);
      setRubrics(rubricsRes.data);
      setEvaluations(evaluationsRes.data);
    } catch (error) {
      console.error("Error al cargar los datos del docente:", error);
    }
  }, [user]);

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
    fetchData();
    handleCloseModal();
  };

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
      <EvaluationList evaluations={evaluations} />
      <hr />
      <UploadRubricForm onUploadSuccess={fetchData} />
      <hr />
      <RubricList rubrics={rubrics} />
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
  const [evaluacionesPendientes, setEvaluacionesPendientes] = useState([]);
  // --- 1. NUEVO ESTADO PARA LAS TAREAS ENTREGADAS ---
  const [evaluacionesEntregadas, setEvaluacionesEntregadas] = useState([]);

  const fetchStudentData = useCallback(async () => {
    if (!user) return;
    try {
      // --- 2. PEDIMOS LOS 3 DATOS AL MISMO TIEMPO ---
      const [classesRes, pendientesRes, entregadasRes] = await Promise.all([
        axios.get("/api/clases/inscripciones"),
        axios.get("/api/evaluaciones/pendientes"), // Tareas pendientes
        axios.get("/api/evaluaciones/entregadas"), // Tareas ya entregadas
      ]);
      setClasses(classesRes.data);
      setEvaluacionesPendientes(pendientesRes.data);
      // --- 3. GUARDAMOS LA NUEVA LISTA ---
      setEvaluacionesEntregadas(entregadasRes.data);
    } catch (error) {
      console.error("Error al cargar los datos del estudiante:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  return (
    <div className="student-content">
      <hr />
      <EnrollClassForm onClassEnrolled={fetchStudentData} />
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
      <hr />

      {/* --- LISTA DE EVALUACIONES PENDIENTES (SIN CAMBIOS) --- */}
      <div className="evaluation-list-container">
        <h2>Evaluaciones Pendientes</h2>
        {evaluacionesPendientes.length === 0 ? (
          <p>¡Genial! No tienes evaluaciones pendientes.</p>
        ) : (
          <ul className="evaluation-list">
            {evaluacionesPendientes.map((evaluacion) => (
              <li key={evaluacion.id} className="evaluation-item">
                <div className="evaluation-header">
                  <Link
                    to={`/evaluacion/${evaluacion.id}`}
                    className="evaluation-title-link"
                  >
                    {evaluacion.nombre_evaluacion}
                  </Link>
                </div>
                <div className="evaluation-details">
                  <p>
                    <strong>Clase:</strong> {evaluacion.nombre_clase}
                  </p>
                  {evaluacion.fecha_fin ? (
                    <div className="evaluation-due-date">
                      <strong>Fecha Límite:</strong>{" "}
                      {new Date(evaluacion.fecha_fin).toLocaleString("es-ES")}
                    </div>
                  ) : (
                    <p>Sin fecha límite</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr />

      {/* --- 4. NUEVA LISTA DE EVALUACIONES ENTREGADAS --- */}
      <div className="evaluation-list-container">
        <h2>Evaluaciones Entregadas</h2>
        {evaluacionesEntregadas.length === 0 ? (
          <p>Aún no has completado ninguna evaluación.</p>
        ) : (
          <ul className="evaluation-list">
            {evaluacionesEntregadas.map((evaluacion) => (
              <li key={evaluacion.id} className="evaluation-item delivered">
                <div className="evaluation-header">
                  {/* El enlace lleva al mismo sitio (Modo Vista) */}
                  <Link
                    to={`/evaluacion/${evaluacion.id}`}
                    className="evaluation-title-link"
                  >
                    {evaluacion.nombre_evaluacion}
                  </Link>
                </div>
                <div className="evaluation-details">
                  <p>
                    <strong>Clase:</strong> {evaluacion.nombre_clase}
                  </p>
                  <div className="evaluation-delivered-date">
                    <strong>Entregado:</strong>{" "}
                    {new Date(evaluacion.fecha_entrega).toLocaleString("es-ES")}
                  </div>
                </div>
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

        {user.rol === "docente" && <TeacherView user={user} />}
        {user.rol === "estudiante" && <StudentView user={user} />}
      </div>
    </div>
  );
}

export default DashboardPage;
