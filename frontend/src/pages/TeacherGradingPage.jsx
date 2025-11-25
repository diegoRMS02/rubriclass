import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import "moment/locale/es";
import styles from "./TeacherGradingPage.module.css";
import GradingModal from "../components/GradingModal";

moment.locale("es");

function TeacherGradingPage() {
  const { id: evaluationId } = useParams();
  const [evaluationInfo, setEvaluationInfo] = useState(null);
  const [rubric, setRubric] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const infoRes = await axios.get(`/api/evaluaciones/${evaluationId}`);
      setEvaluationInfo(infoRes.data.evaluacion);
      setRubric(infoRes.data.rubrica || []);

      const studentsRes = await axios.get(
        `/api/evaluaciones/${evaluationId}/entregas_docente`
      );
      setStudents(studentsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [evaluationId]);

  const handleRateClick = (student) => {
    setSelectedStudent(student);
  };

  const handleRateSuccess = () => {
    alert("¡Calificación guardada!");
    setSelectedStudent(null);
    fetchData();
  };

  const getStatusBadge = (student) => {
    if (student.calificacion_id)
      return { label: "Calificada", style: styles.statusGraded };
    if (student.entrega_id)
      return { label: "Entregada", style: styles.statusSubmitted };
    return { label: "Pendiente", style: styles.statusPending };
  };

  const getSubmissionAction = (student, tipoEntrega) => {
    if (
      !student.entrega_id ||
      (!student.enlace_url &&
        !student.url_para_ver &&
        tipoEntrega !== "archivo")
    ) {
      return { label: "Sin Entrega", link: null, disabled: true };
    }

    const url = student.url_para_ver || student.enlace_url;

    if (tipoEntrega === "archivo")
      return { label: "Ver Archivo", link: url, disabled: false };
    if (tipoEntrega === "enlace")
      return { label: "Abrir Enlace", link: url, disabled: false };

    return { label: "Solo Rúbrica", link: null, disabled: true };
  };

  if (loading)
    return (
      <div
        className={styles.container}
        style={{ textAlign: "center", paddingTop: "50px" }}
      >
        Cargando...
      </div>
    );
  if (!evaluationInfo)
    return <div className={styles.container}>Error: No encontrada</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>
          Calificar: {evaluationInfo.nombre_evaluacion}
        </h1>
        <p className={styles.metadata}>
          Clase: <strong>{evaluationInfo.nombre_clase}</strong> | Tipo:{" "}
          {evaluationInfo.tipo_evaluacion}
        </p>
        <div style={{ marginTop: "1rem" }}>
          <Link
            to="/dashboard"
            style={{ textDecoration: "none", color: "#1a73e8" }}
          >
            ← Volver al Dashboard
          </Link>
        </div>
      </div>

      <div className={styles.studentListCard}>
        <div className={styles.tableHeader}>
          <span>Estudiante</span>
          <span>Estado</span>
          <span>Fecha Entrega</span>
          <span>Nota</span>
          <span style={{ textAlign: "center" }}>Ver Entrega</span>
          <span style={{ textAlign: "center" }}>Calificación</span>
        </div>

        {students.map((student) => {
          const status = getStatusBadge(student);
          const submissionAction = getSubmissionAction(
            student,
            evaluationInfo.tipo_entrega
          );

          const fechaEntrega = student.fecha_entrega ? (
            moment(student.fecha_entrega).format("D MMM, HH:mm")
          ) : (
            <span className={styles.noSubmissionText}>Sin entrega</span>
          );

          const notaFloat = parseFloat(student.nota);
          const notaDisplay =
            student.nota !== null
              ? isNaN(notaFloat)
                ? student.nota
                : notaFloat.toFixed(1)
              : student.calificacion_id
              ? "--"
              : "N/A";

          const canRate = !!student.entrega_id;

          return (
            <div key={student.usuario_id} className={styles.studentRow}>
              <div className={styles.studentInfo}>
                <span className={styles.studentName}>
                  {student.nombre_estudiante}
                </span>
                <span className={styles.studentEmail}>
                  {student.email_estudiante}
                </span>
              </div>
              <span className={status.style}>{status.label}</span>
              <span>{fechaEntrega}</span>
              <strong
                style={{ color: student.calificacion_id ? "#34a853" : "#666" }}
              >
                {notaDisplay}
              </strong>

              {/* Botón Ver Archivo (Estilo Secundario) */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                {submissionAction.link ? (
                  <a
                    href={submissionAction.link}
                    target="_blank"
                    rel="noreferrer"
                    className={`${styles.actionsBtn} ${styles.btnSecondary}`}
                  >
                    {submissionAction.label}
                  </a>
                ) : (
                  <span
                    className={`${styles.actionsBtn} ${styles.disabledBtn}`}
                  >
                    {submissionAction.label}
                  </span>
                )}
              </div>

              {/* Botón Calificar (Estilo Primario) */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                {canRate ? (
                  <button
                    onClick={() => handleRateClick(student)}
                    className={`${styles.actionsBtn} ${styles.btnPrimary}`}
                  >
                    {student.calificacion_id ? "Editar Nota" : "Calificar"}
                  </button>
                ) : (
                  <span
                    className={`${styles.actionsBtn} ${styles.disabledBtn}`}
                  >
                    N/A
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedStudent && (
        <GradingModal
          student={selectedStudent}
          rubric={rubric}
          onClose={() => setSelectedStudent(null)}
          onSuccess={handleRateSuccess}
        />
      )}
    </div>
  );
}

export default TeacherGradingPage;
