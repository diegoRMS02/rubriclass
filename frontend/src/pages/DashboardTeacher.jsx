import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import styles from "./DashboardTeacher.module.css";

// IMPORTAMOS EL NUEVO MODAL
import CreateClassModal from "../components/CreateClassModal";

import UploadRubricForm from "../components/UploadRubricForm";
import RubricList from "../components/RubricList";
import AssignRubricModal from "../components/AssignRubricModal";
import EvaluationList from "../components/EvaluationList";

function DashboardTeacher({ user }) {
  const [classes, setClasses] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  // Estados para modales
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);

  const [selectedClass, setSelectedClass] = useState(null);

  const fetchData = useCallback(async () => {
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
      console.error("Error al cargar datos:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAssignModal = (clase) => {
    setSelectedClass(clase);
    setIsAssignModalOpen(true);
  };

  const handleAssignSuccess = () => {
    alert("¡Evaluación asignada!");
    fetchData();
    setIsAssignModalOpen(false);
  };

  const handleCreateClassSuccess = () => {
    fetchData(); // Recargar lista de clases
    setIsCreateClassModalOpen(false); // Cerrar modal
  };

  return (
    <div className={styles.gridContainer}>
      <div className={styles.mainColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Mis Clases</h2>
            {/* BOTÓN PARA ABRIR EL NUEVO MODAL */}
            <button
              className={styles.assignBtn} // Reusamos estilo o crea uno nuevo
              style={{ background: "#28a745" }}
              onClick={() => setIsCreateClassModalOpen(true)}
            >
              + Nueva Clase
            </button>
          </div>

          <div className={styles.classesGrid}>
            {classes.map((clase) => (
              <div key={clase.id} className={styles.classCard}>
                <Link
                  to={`/docente/clase/${clase.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ cursor: "pointer" }}>
                    <span className={styles.className}>
                      {clase.nombre_clase}
                      {/* Mostrar Sección si existe */}
                      {clase.seccion && (
                        <span
                          style={{
                            fontSize: "0.8em",
                            color: "#666",
                            marginLeft: "8px",
                          }}
                        >
                          ({clase.seccion})
                        </span>
                      )}
                    </span>

                    {/* Mostrar Horario si existe */}
                    {(clase.dias || clase.hora_inicio) && (
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#555",
                          marginTop: "5px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        📅 {clase.dias && <span>{clase.dias}</span>}
                        {clase.hora_inicio && (
                          <span>
                            • {clase.hora_inicio.slice(0, 5)} -{" "}
                            {clase.hora_fin?.slice(0, 5)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>

                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className={styles.classCode}>
                    Cód: {clase.codigo_inscripcion}
                  </span>

                  <button
                    className={styles.assignBtn}
                    onClick={() => handleOpenAssignModal(clase)}
                    style={{ padding: "5px 10px", fontSize: "0.8rem" }}
                  >
                    Asignar Eval.
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Evaluaciones Asignadas</h2>
          <EvaluationList evaluations={evaluations} />
        </div>
      </div>

      <div className={styles.sideColumn}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Banco de Rúbricas</h2>
          <UploadRubricForm onUploadSuccess={fetchData} />
          <div style={{ marginTop: "1rem" }}>
            <RubricList rubrics={rubrics} />
          </div>
        </div>
      </div>

      {/* MODAL DE ASIGNAR EVALUACIÓN */}
      {isAssignModalOpen && (
        <AssignRubricModal
          clase={selectedClass}
          rubricas={rubrics}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* MODAL DE CREAR CLASE (NUEVO) */}
      {isCreateClassModalOpen && (
        <CreateClassModal
          onClose={() => setIsCreateClassModalOpen(false)}
          onSuccess={handleCreateClassSuccess}
        />
      )}
    </div>
  );
}

export default DashboardTeacher;
