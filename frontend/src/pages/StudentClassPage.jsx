import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./StudentClassPage.module.css";

// Componentes
import ClassTabs from "../components/ClassTabs";
import AnnouncementFeed from "../components/AnnouncementFeed";
import ClassPeople from "../components/ClassPeople";

function StudentClassPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados
  const [clase, setClase] = useState(null);
  const [contenido, setContenido] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado de Pestañas (Por defecto 'novedades')
  const [activeTab, setActiveTab] = useState("novedades");

  const fetchData = useCallback(async () => {
    try {
      // 1. Datos de la Clase
      const claseRes = await axios.get(`/api/clases/${id}`);
      setClase(claseRes.data);

      // 2. Contenido del Curso
      const contenidoRes = await axios.get(`/api/clases/${id}/contenido`);
      setContenido(contenidoRes.data);

      // 3. Perfil actual
      const profileRes = await axios.get("/api/auth/profile");
      setCurrentUser(profileRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Función auxiliar para limpiar el nombre del archivo si tiene UUID pegado
  // (Ej: "uuid-uuid-miarchivo.pdf" -> "miarchivo.pdf")
  const cleanFileName = (title) => {
    if (!title) return "Archivo sin nombre";
    // Si parece tener un UUID al principio (aprox 36 chars + guion), intentamos cortarlo
    // Esto es un parche visual, lo ideal es guardar el nombre limpio en BD.
    if (title.length > 37 && title.charAt(36) === "-") {
      return title.substring(37);
    }
    return title;
  };

  if (loading)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        Cargando clase...
      </div>
    );
  if (!clase) return <div>Clase no encontrada</div>;

  return (
    <div className={styles.container}>
      {/* --- HEADER --- */}
      <div className={styles.banner}>
        <button onClick={() => navigate("/")} className={styles.backBtn}>
          ← Volver a Mis Cursos
        </button>
        <h1 className={styles.courseTitle}>{clase.nombre_clase}</h1>
        <div className={styles.teacherInfo}>
          <span role="img" aria-label="teacher">
            👨‍🏫
          </span>{" "}
          Docente: {clase.nombre_docente}
        </div>
      </div>

      {/* --- TABS DE NAVEGACIÓN --- */}
      <ClassTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* --- CONTENIDO DINÁMICO --- */}
      <div className={styles.tabContent}>
        {/* PESTAÑA 1: NOVEDADES */}
        {activeTab === "novedades" && (
          <AnnouncementFeed
            classId={clase.id}
            user={currentUser}
            isTeacher={false} // Solo lectura
          />
        )}

        {/* PESTAÑA 2: TRABAJO DE CLASE */}
        {activeTab === "contenido" && (
          <div className={styles.modulesContainer}>
            {contenido.length === 0 ? (
              <div className={styles.emptyMsg}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
                <h3>El docente aún no ha subido contenido.</h3>
                <p>Vuelve más tarde para ver los materiales del curso.</p>
              </div>
            ) : (
              contenido.map((modulo) => (
                <div key={modulo.id} className={styles.moduleCard}>
                  <h3 className={styles.moduleTitle}>{modulo.titulo}</h3>
                  <div className={styles.resourceList}>
                    {modulo.recursos.map((rec) => (
                      <a
                        key={rec.id}
                        href={rec.url_publica}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.resourceItem} // Estilo de tarjeta
                      >
                        {/* Icono Visual */}
                        <div className={styles.resourceIcon}>
                          {rec.tipo === "archivo" ? "📄" : "🔗"}
                        </div>

                        {/* Info del Archivo */}
                        <div className={styles.resourceInfo}>
                          <span className={styles.resourceTitle}>
                            {cleanFileName(rec.titulo)}
                          </span>
                          <span className={styles.resourceType}>
                            {rec.tipo === "archivo"
                              ? "Archivo Descargable"
                              : "Enlace Externo"}
                          </span>
                        </div>
                      </a>
                    ))}
                    {(!modulo.recursos || modulo.recursos.length === 0) && (
                      <span
                        style={{
                          color: "#999",
                          fontSize: "0.9rem",
                          padding: "1rem",
                          fontStyle: "italic",
                        }}
                      >
                        Sin recursos en este módulo
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PESTAÑA 3: PERSONAS */}
        {activeTab === "personas" && (
          <ClassPeople classId={clase.id} isTeacher={false} />
        )}
      </div>
    </div>
  );
}

export default StudentClassPage;
