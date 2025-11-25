import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import styles from "./DashboardTeacher.module.css";

// Componentes
import CreateClassModal from "../components/CreateClassModal";
import UploadRubricForm from "../components/UploadRubricForm";
import RubricList from "../components/RubricList";
import AssignRubricModal from "../components/AssignRubricModal";
import EvaluationList from "../components/EvaluationList";

const getClassColor = (id) => {
  const colors = [
    "#4285F4",
    "#34A853",
    "#FBBC05",
    "#EA4335",
    "#673AB7",
    "#E91E63",
    "#009688",
  ];
  return colors[id % colors.length] || colors[0];
};

function DashboardTeacher({ user }) {
  const [classes, setClasses] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  // Estados para modales
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);

  // Estados para EDICIÓN
  const [classToEdit, setClassToEdit] = useState(null);
  const [evaluationToEdit, setEvaluationToEdit] = useState(null);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      // La ruta /api/clases ahora devuelve student_count
      const [classesRes, rubricsRes, evaluationsRes] = await Promise.all([
        axios.get("/api/clases"),
        axios.get("/api/rubricas"),
        axios.get("/api/evaluaciones"),
      ]);
      setClasses(classesRes.data);
      setRubrics(rubricsRes.data);
      setEvaluations(evaluationsRes.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLERS PARA CLASES ---
  const handleCreateClassClick = () => {
    setClassToEdit(null);
    setIsCreateClassModalOpen(true);
  };

  const handleEditClassClick = (clase) => {
    setClassToEdit(clase);
    setIsCreateClassModalOpen(true);
  };

  const handleClassModalSuccess = () => {
    fetchData();
    setIsCreateClassModalOpen(false);
    setClassToEdit(null);
  };

  // --- HANDLERS PARA EVALUACIONES ---
  const handleOpenAssignModal = (clase) => {
    setSelectedClassForAssign(clase);
    setEvaluationToEdit(null);
    setIsAssignModalOpen(true);
  };

  const handleEditEvaluation = (evaluation) => {
    setEvaluationToEdit(evaluation);
    setSelectedClassForAssign(null);
    setIsAssignModalOpen(true);
  };

  const handleAssignSuccess = () => {
    alert(
      evaluationToEdit ? "¡Evaluación actualizada!" : "¡Evaluación asignada!"
    );
    fetchData();
    setIsAssignModalOpen(false);
    setEvaluationToEdit(null);
  };

  return (
    <div className={styles.gridContainer}>
      <div className={styles.mainColumn}>
        {/* SECCIÓN DE CLASES */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Mis Clases</h2>
            <button
              className={styles.createClassBtn}
              onClick={handleCreateClassClick}
            >
              <span>+</span> Nueva Clase
            </button>
          </div>

          {classes.length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              No has creado ninguna clase aún.
            </p>
          ) : (
            <div className={styles.classesGrid}>
              {classes.map((clase) => {
                const color = getClassColor(clase.id);
                return (
                  <div key={clase.id} className={styles.classCard}>
                    <div
                      className={styles.colorBar}
                      style={{ backgroundColor: color }}
                    ></div>

                    <div className={styles.cardContent}>
                      {/* Cabecera de la tarjeta con botón EDITAR */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Link
                          to={`/docente/clase/${clase.id}`}
                          className={styles.className}
                        >
                          {clase.nombre_clase}
                        </Link>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleEditClassClick(clase)}
                          title="Editar Clase"
                          style={{
                            width: "24px",
                            height: "24px",
                            fontSize: "0.8rem",
                            border: "none",
                          }}
                        >
                          ✏️
                        </button>
                      </div>

                      <div className={styles.classMeta}>
                        {clase.seccion && (
                          <div className={styles.metaRow}>
                            <span>
                              🏷️ Sección: <strong>{clase.seccion}</strong>
                            </span>
                          </div>
                        )}
                        {(clase.dias || clase.hora_inicio) && (
                          <div className={styles.metaRow}>
                            <span>
                              ⏰ {clase.dias}{" "}
                              {clase.hora_inicio
                                ? `(${clase.hora_inicio.slice(0, 5)})`
                                : ""}
                            </span>
                          </div>
                        )}
                        {/* AHORA MUESTRA EL CONTEO REAL DE ALUMNOS */}
                        <div className={styles.metaRow}>
                          <span>
                            👥 Alumnos inscritos:{" "}
                            <strong>{clase.student_count || 0}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.classFooter}>
                      <span
                        className={styles.classCode}
                        title="Código de inscripción"
                      >
                        {clase.codigo_inscripcion}
                      </span>

                      <div className={styles.cardActions}>
                        <Link
                          to={`/docente/gradebook/${clase.id}`}
                          className={styles.gradebookBtn}
                          title="Ver Libro de Notas"
                        >
                          📊 Notas
                        </Link>

                        <button
                          className={styles.iconBtn}
                          onClick={() => handleOpenAssignModal(clase)}
                          title="Asignar Nueva Tarea"
                        >
                          ➕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECCIÓN DE EVALUACIONES */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Evaluaciones Recientes</h2>
          <EvaluationList
            evaluations={evaluations}
            onDeleteSuccess={fetchData}
            onEdit={handleEditEvaluation}
          />
        </div>
      </div>

      <div className={styles.sideColumn}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Banco de Rúbricas</h2>
          <UploadRubricForm onUploadSuccess={fetchData} />
          <div style={{ marginTop: "1rem" }}>
            <RubricList rubrics={rubrics} onDeleteSuccess={fetchData} />
          </div>
        </div>
      </div>

      {/* MODAL DE ASIGNAR / EDITAR EVALUACIÓN */}
      {isAssignModalOpen && (
        <AssignRubricModal
          clase={selectedClassForAssign}
          rubricas={rubrics}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={handleAssignSuccess}
          evaluationToEdit={evaluationToEdit}
        />
      )}

      {/* MODAL DE CREAR / EDITAR CLASE */}
      {isCreateClassModalOpen && (
        <CreateClassModal
          onClose={() => setIsCreateClassModalOpen(false)}
          onSuccess={handleClassModalSuccess}
          classToEdit={classToEdit}
        />
      )}
    </div>
  );
}

export default DashboardTeacher;
