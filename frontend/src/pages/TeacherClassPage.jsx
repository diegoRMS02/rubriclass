import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import TeacherClassContent from "../components/TeacherClassContent";
import styles from "./TeacherClassPage.module.css";

function TeacherClassPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clase, setClase] = useState(null);
  const [contenido, setContenido] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // 1. Obtener info básica de la clase
      const claseRes = await axios.get(`/api/clases/${id}`);
      setClase(claseRes.data);

      // 2. Obtener contenido (módulos y recursos)
      const contenidoRes = await axios.get(`/api/clases/${id}/contenido`);
      setContenido(contenidoRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Cargando curso...
      </div>
    );
  if (!clase) return <div>Clase no encontrada</div>;

  return (
    <div className={styles.container}>
      {/* Header con Diseño Moderno */}
      <div className={styles.banner}>
        <button onClick={() => navigate("/")} className={styles.backBtn}>
          ← Volver al Dashboard
        </button>
        <h1 className={styles.courseTitle}>{clase.nombre_clase}</h1>
        <div className={styles.codeBadge}>
          Código de Inscripción: <strong>{clase.codigo_inscripcion}</strong>
        </div>
      </div>

      {/* Componente de Gestión de Contenido (Ya estilizado anteriormente) */}
      <TeacherClassContent
        claseId={clase.id}
        modulos={contenido}
        onUpdate={fetchData}
      />
    </div>
  );
}

export default TeacherClassPage;
