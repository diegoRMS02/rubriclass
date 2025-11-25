import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import styles from "./StudentClassPage.module.css";

function StudentClassPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [clase, setClase] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [contenido, setContenido] = useState([]); // <-- Aquí guardaremos los módulos y archivos
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Pedimos TODA la información en paralelo
        const [claseRes, evalsRes, contentRes] = await Promise.all([
          axios.get(`/api/clases/${id}`),
          axios.get(`/api/evaluaciones/clase/${id}`),
          axios.get(`/api/clases/${id}/contenido`), // <-- Esta es la clave: pedimos los recursos
        ]);

        setClase(claseRes.data);
        setEvaluaciones(evalsRes.data);
        setContenido(contentRes.data); // Guardamos los módulos en el estado
      } catch (error) {
        console.error(error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Cargando aula...
      </div>
    );
  if (!clase) return null;

  return (
    <div className={styles.container}>
      {/* Banner */}
      <div className={styles.banner}>
        <button onClick={() => navigate("/")} className={styles.backBtn}>
          ← Mis Cursos
        </button>
        <h1 className={styles.courseTitle}>{clase.nombre_clase}</h1>
        <p className={styles.docente}>Docente: {clase.nombre_docente}</p>
      </div>

      <div className={styles.layoutGrid}>
        {/* COLUMNA IZQUIERDA: Recursos y Meet */}
        <div className={styles.leftColumn}>
          {/* Tarjeta de Clase Virtual */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>📹 Clase Virtual</h3>
            <button
              className={styles.meetBtn}
              onClick={() => alert("Integración Meet próximamente")}
            >
              Unirse a la Reunión
            </button>
          </div>

          {/* --- SECCIÓN DE RECURSOS (DINÁMICA) --- */}
          <div className={styles.resourcesSection}>
            <h3 className={styles.sectionTitleSmall}>📂 Material de Clase</h3>

            {contenido.length === 0 ? (
              <p className={styles.emptyText}>
                El docente aún no ha subido contenido.
              </p>
            ) : (
              <div className={styles.modulesContainer}>
                {contenido.map((modulo) => (
                  <div key={modulo.id} className={styles.moduleCard}>
                    <h4 className={styles.moduleTitle}>{modulo.titulo}</h4>

                    {modulo.recursos && modulo.recursos.length > 0 ? (
                      <ul className={styles.resourceList}>
                        {modulo.recursos.map((recurso) => (
                          <li key={recurso.id} className={styles.resourceItem}>
                            <span className={styles.resourceIcon}>
                              {recurso.tipo === "archivo" ? "📄" : "🔗"}
                            </span>
                            <a
                              href={recurso.url_publica} // <-- URL FIRMADA DE FIREBASE
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.resourceLink}
                            >
                              {recurso.titulo}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.emptyModule}>Carpeta vacía.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Evaluaciones */}
        <div className={styles.rightColumn}>
          <h3 className={styles.sectionTitleSmall}>📝 Tareas Pendientes</h3>
          <div className={styles.evalGrid}>
            {evaluaciones.length === 0 && (
              <p className={styles.emptyText}>No hay tareas asignadas.</p>
            )}

            {evaluaciones.map((ev) => (
              <Link
                key={ev.id}
                to={`/evaluacion/${ev.id}`}
                className={styles.evalCard}
              >
                <div className={styles.evalIcon}>
                  {ev.entrega_id ? "✅" : "🔥"}
                </div>
                <div className={styles.evalContent}>
                  <div className={styles.evalHeader}>
                    <h4>{ev.nombre_evaluacion}</h4>
                    {ev.nota && (
                      <span className={styles.gradeBadge}>{ev.nota}</span>
                    )}
                  </div>
                  <div className={styles.evalMeta}>
                    {ev.fecha_fin
                      ? format(new Date(ev.fecha_fin), "dd MMM", { locale: es })
                      : "Sin fecha"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentClassPage;
