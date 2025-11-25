import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale/es"; // Para formatear fechas bonito
import EnrollClassForm from "../components/EnrollClassForm";
import styles from "./DashboardStudent.module.css";

function DashboardStudent({ user }) {
  const [classes, setClasses] = useState([]);
  const [evaluacionesPendientes, setEvaluacionesPendientes] = useState([]);
  const [evaluacionesEntregadas, setEvaluacionesEntregadas] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [clasesRes, pendientesRes, entregadasRes] = await Promise.all([
        axios.get("/api/clases/inscripciones"),
        axios.get("/api/evaluaciones/pendientes"),
        axios.get("/api/evaluaciones/entregadas"),
      ]);
      setClasses(clasesRes.data);
      setEvaluacionesPendientes(pendientesRes.data);
      setEvaluacionesEntregadas(entregadasRes.data);
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Función auxiliar para formatear fecha corta (ej: 05 nov)
  const formatDate = (dateString) => {
    if (!dateString) return "Sin fecha";
    return format(new Date(dateString), "dd MMM", { locale: es });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.welcome}>
          Hola, {user.nombre_completo.split(" ")[0]} 👋
        </h1>
        <p className={styles.subtitle}>Bienvenido a tu aula virtual</p>
      </div>

      <div className={styles.enrollSection}>
        <EnrollClassForm onClassEnrolled={fetchData} />
      </div>

      {/* MIS CURSOS */}
      <h2 className={styles.sectionTitle}>📚 Mis Cursos</h2>
      <div className={styles.grid}>
        {classes.length === 0 && (
          <p className={styles.emptyText}>
            No estás inscrito en ningún curso aún.
          </p>
        )}

        {classes.map((clase) => (
          <Link
            key={clase.id}
            to={`/clase/${clase.id}`}
            className={styles.courseCard}
          >
            <div className={styles.courseImage}>
              <div className={styles.courseImageOverlay}></div>
            </div>
            <div className={styles.courseInfo}>
              <div>
                <h3 className={styles.courseName}>{clase.nombre_clase}</h3>
                <p className={styles.docenteName}>{clase.nombre_docente}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* TAREAS PENDIENTES */}
      <h2 className={styles.sectionTitle} style={{ marginTop: "3rem" }}>
        🔥 Próximas Entregas
      </h2>
      <div className={styles.taskList}>
        {evaluacionesPendientes.length === 0 && (
          <p className={styles.emptyText}>
            ¡Todo al día! No tienes tareas pendientes.
          </p>
        )}

        {evaluacionesPendientes.map((task) => (
          <Link
            key={task.id}
            to={`/evaluacion/${task.id}`}
            className={styles.taskCard}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className={styles.iconFire}>🔥</div>
              <div className={styles.taskInfo}>
                <span className={styles.taskTitle}>
                  {task.nombre_evaluacion}
                </span>
                <span className={styles.taskMeta}>{task.nombre_clase}</span>
              </div>
            </div>
            <div className={styles.taskDate}>
              Vence: {formatDate(task.fecha_fin)}
            </div>
          </Link>
        ))}
      </div>

      {/* HISTORIAL DE ENTREGAS */}
      {evaluacionesEntregadas.length > 0 && (
        <>
          <h2 className={styles.sectionTitle} style={{ marginTop: "3rem" }}>
            ✅ Historial de Entregas
          </h2>
          <div className={styles.taskList}>
            {evaluacionesEntregadas.map((task) => (
              <Link
                key={task.id}
                to={`/evaluacion/${task.id}`}
                className={`${styles.taskCard} ${styles.delivered}`}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div className={styles.iconCheck}>✅</div>
                  <div className={styles.taskInfo}>
                    <span
                      className={styles.taskTitle}
                      style={{ color: "var(--success)" }}
                    >
                      {task.nombre_evaluacion}
                    </span>
                    <span className={styles.taskMeta}>{task.nombre_clase}</span>
                  </div>
                </div>

                {/* Si tiene nota, la mostramos */}
                {task.nota ? (
                  <div
                    style={{
                      background: "#E8F0FE",
                      color: "#1A73E8",
                      padding: "5px 10px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    {task.nota}
                  </div>
                ) : (
                  <span className={styles.taskDate}>
                    Entregado: {formatDate(task.fecha_entrega)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardStudent;
