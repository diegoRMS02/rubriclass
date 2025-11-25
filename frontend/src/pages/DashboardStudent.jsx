import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import "moment/locale/es";
import styles from "./DashboardStudent.module.css";

moment.locale("es");

function DashboardStudent({ user }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [entregadas, setEntregadas] = useState([]);

  // Estado para unirse a clase
  const [codigo, setCodigo] = useState("");
  const [loadingJoin, setLoadingJoin] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inscripRes, pendRes, entRes] = await Promise.all([
        axios.get("/api/clases/inscripciones"),
        axios.get("/api/evaluaciones/pendientes"),
        axios.get("/api/evaluaciones/entregadas"),
      ]);
      setInscripciones(inscripRes.data);
      setPendientes(pendRes.data);
      setEntregadas(entRes.data);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    }
  };

  const handleUnirse = async (e) => {
    e.preventDefault();
    if (!codigo) return;
    setLoadingJoin(true);
    try {
      await axios.post("/api/clases/inscribir", { codigo_inscripcion: codigo });
      alert("¡Te has inscrito correctamente!");
      setCodigo("");
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Error al inscribirse");
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* HEADER DE BIENVENIDA */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.welcomeTitle}>
            Hola, {user.nombre_completo.split(" ")[0]} 👋
          </h1>
          <p className={styles.subtitle}>
            Bienvenido a tu aula virtual. ¡A aprender!
          </p>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className={styles.dashboardGrid}>
        {/* COLUMNA IZQUIERDA: CURSOS (Lo principal) */}
        <div className={styles.leftColumn}>
          {/* Caja Compacta para Unirse */}
          <div className={styles.joinSection}>
            <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>
              🔗 Unirse a una nueva clase
            </h3>
            <form onSubmit={handleUnirse} className={styles.joinForm}>
              <input
                type="text"
                placeholder="Ingresa el código (ej. 7Y8J8Q)"
                className={styles.joinInput}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button
                type="submit"
                className={styles.joinBtn}
                disabled={loadingJoin}
              >
                {loadingJoin ? "..." : "Unirse"}
              </button>
            </form>
          </div>

          <h2 className={styles.sectionTitle}>📚 Mis Cursos</h2>

          {inscripciones.length === 0 ? (
            <div
              className={styles.emptyState}
              style={{ border: "2px dashed #ccc", borderRadius: "8px" }}
            >
              No estás inscrito en ningún curso aún. ¡Usa el código de arriba!
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {inscripciones.map((curso) => (
                <Link
                  to={`/clase/${curso.id}`}
                  key={curso.id}
                  className={styles.courseCard}
                >
                  <div className={styles.courseBanner}></div>
                  <div className={styles.courseContent}>
                    <span className={styles.courseName}>
                      {curso.nombre_clase}
                    </span>
                    <div className={styles.courseTeacher}>
                      👨‍🏫 {curso.nombre_docente}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: AGENDA (Tareas) */}
        <div className={styles.rightColumn}>
          <div className={styles.tasksCard}>
            <h3
              className={styles.sectionTitle}
              style={{ marginBottom: "1rem" }}
            >
              🔥 Próximas Entregas
            </h3>

            <div className={styles.taskList}>
              {pendientes.length === 0 ? (
                <p className={styles.emptyState}>
                  ¡Todo al día! No hay tareas pendientes.
                </p>
              ) : (
                pendientes.slice(0, 5).map((tarea) => {
                  // Solo mostramos las 5 primeras
                  const fecha = tarea.fecha_fin
                    ? moment(tarea.fecha_fin)
                    : null;
                  const esUrgente = fecha && fecha.diff(moment(), "days") < 3;

                  return (
                    <Link
                      to={`/evaluacion/${tarea.id}`}
                      key={tarea.id}
                      className={styles.taskRow}
                    >
                      <div className={styles.taskInfo}>
                        <span className={styles.taskTitle}>
                          {tarea.nombre_evaluacion}
                        </span>
                        <span className={styles.taskCourse}>
                          {tarea.nombre_clase}
                        </span>
                      </div>
                      <span
                        className={`${styles.taskDate} ${
                          esUrgente ? styles.urgent : ""
                        }`}
                      >
                        {fecha ? fecha.format("D MMM") : "Sin fecha"}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Link al calendario completo */}
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <Link
                to="/calendario"
                style={{
                  color: "#1a73e8",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                }}
              >
                Ver Calendario Completo →
              </Link>
            </div>
          </div>

          {/* Historial Resumido (Opcional, más pequeño abajo) */}
          <div className={styles.tasksCard} style={{ marginTop: "2rem" }}>
            <h3
              className={styles.sectionTitle}
              style={{ marginBottom: "1rem" }}
            >
              ✅ Historial Reciente
            </h3>
            <div className={styles.taskList}>
              {entregadas.slice(0, 3).map((tarea) => (
                <div
                  key={tarea.id}
                  className={styles.taskRow}
                  style={{ cursor: "default" }}
                >
                  <div className={styles.taskInfo}>
                    <span className={styles.taskTitle}>
                      {tarea.nombre_evaluacion}
                    </span>
                    <span
                      className={styles.taskCourse}
                      style={{ color: "#34a853", fontWeight: "bold" }}
                    >
                      {tarea.nota ? `Nota: ${tarea.nota}` : "Entregada"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardStudent;
