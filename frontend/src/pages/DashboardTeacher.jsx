import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Importamos Link
import styles from "./DashboardTeacher.module.css";
import CreateClassForm from "../components/CreateClassForm";
import UploadRubricForm from "../components/UploadRubricForm";
import RubricList from "../components/RubricList";
import AssignRubricModal from "../components/AssignRubricModal";
import EvaluationList from "../components/EvaluationList";

function DashboardTeacher({ user }) {
  const [classes, setClasses] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleOpenModal = (clase) => {
    setSelectedClass(clase);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    alert("¡Evaluación asignada!");
    fetchData();
    setIsModalOpen(false);
  };

  return (
    <div className={styles.gridContainer}>
      <div className={styles.mainColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Mis Clases</h2>
          </div>

          <CreateClassForm
            onClassCreated={(c) => setClasses([c, ...classes])}
          />

          <div className={styles.classesGrid}>
            {classes.map((clase) => (
              <div key={clase.id} className={styles.classCard}>
                {/* ENLACE A LA GESTIÓN DE LA CLASE */}
                <Link
                  to={`/docente/clase/${clase.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <span
                    className={styles.className}
                    style={{ cursor: "pointer" }}
                  >
                    {clase.nombre_clase}
                  </span>
                </Link>

                <span className={styles.classCode}>
                  Código: {clase.codigo_inscripcion}
                </span>

                <button
                  className={styles.assignBtn}
                  onClick={() => handleOpenModal(clase)}
                >
                  Asignar Evaluación
                </button>
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

      {isModalOpen && (
        <AssignRubricModal
          clase={selectedClass}
          rubricas={rubrics}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default DashboardTeacher;
