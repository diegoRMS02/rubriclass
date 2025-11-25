import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// Componentes Existentes
import TeacherClassContent from "../components/TeacherClassContent";
import ClassTabs from "../components/ClassTabs";
import AnnouncementFeed from "../components/AnnouncementFeed";
import CreateClassModal from "../components/CreateClassModal";

// NUEVO COMPONENTE (Gestión de Personas)
import ClassPeople from "../components/ClassPeople";

import styles from "./TeacherClassPage.module.css";

function TeacherClassPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [clase, setClase] = useState(null);
  const [contenido, setContenido] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("novedades");

  // Estado para el Modal de Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const claseRes = await axios.get(`/api/clases/${id}`);
      setClase(claseRes.data);

      const contenidoRes = await axios.get(`/api/clases/${id}/contenido`);
      setContenido(contenidoRes.data);

      const profileRes = await axios.get("/api/auth/profile");
      setCurrentUser(profileRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler para cuando se guarda la edición
  const handleEditSuccess = () => {
    fetchData(); // Recargamos para ver el nuevo nombre/horario
    setIsEditModalOpen(false);
  };

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>Cargando...</div>
    );
  if (!clase) return <div>Clase no encontrada</div>;

  return (
    <div className={styles.container}>
      {/* --- HEADER CON BOTÓN DE CONFIGURACIÓN --- */}
      <div className={styles.banner}>
        <div className={styles.topRow}>
          <button onClick={() => navigate("/")} className={styles.backBtn}>
            ← Volver al Dashboard
          </button>

          {/* Botón de Configuración (Solo lo ve el docente) */}
          <button
            className={styles.settingsBtn}
            onClick={() => setIsEditModalOpen(true)}
            title="Configuración de la Clase"
          >
            ⚙️
          </button>
        </div>

        <div className={styles.courseInfo}>
          <h1 className={styles.courseTitle}>{clase.nombre_clase}</h1>
          <div className={styles.codeBadge}>
            Código: <strong>{clase.codigo_inscripcion}</strong>
          </div>
        </div>
      </div>

      {/* --- TABS (Novedades | Trabajo | Personas) --- */}
      <ClassTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* --- CONTENIDO DINÁMICO SEGÚN PESTAÑA --- */}
      <div className={styles.tabContent}>
        {activeTab === "novedades" && (
          <AnnouncementFeed
            classId={clase.id}
            user={currentUser}
            isTeacher={true}
          />
        )}

        {activeTab === "contenido" && (
          <TeacherClassContent
            claseId={clase.id}
            modulos={contenido}
            onUpdate={fetchData}
          />
        )}

        {activeTab === "personas" && (
          <ClassPeople classId={clase.id} isTeacher={true} />
        )}
      </div>

      {/* --- MODAL DE EDICIÓN --- */}
      {isEditModalOpen && (
        <CreateClassModal
          classToEdit={clase} // Pasamos la clase actual para editar
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

export default TeacherClassPage;
