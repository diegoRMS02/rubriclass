import React from "react";
import axios from "axios";
import styles from "./RubricList.module.css";

function RubricList({ rubrics, onDeleteSuccess }) {
  // Recibimos prop para refrescar

  const handleDelete = async (id, titulo) => {
    // 1. Confirmación de seguridad (UX Vital)
    if (!window.confirm(`¿Estás seguro de eliminar la rúbrica "${titulo}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/rubricas/${id}`);
      // 2. Notificar al padre para que recargue la lista
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (error) {
      alert(error.response?.data?.message || "Error al eliminar.");
    }
  };

  if (rubrics.length === 0) {
    return (
      <div className={styles.emptyState}>📂 No hay rúbricas subidas aún.</div>
    );
  }

  return (
    <div className={styles.container}>
      {rubrics.map((rubric) => (
        <div key={rubric.id} className={styles.rubricCard}>
          {/* Icono Visual */}
          <div className={styles.iconWrapper}>📊</div>

          {/* Contenido */}
          <div className={styles.content}>
            <h4 className={styles.title}>{rubric.titulo}</h4>
            <p className={styles.description}>
              {rubric.descripcion || "Sin descripción"}
            </p>
          </div>

          {/* Botón Eliminar */}
          <button
            className={styles.deleteBtn}
            title="Eliminar Rúbrica"
            onClick={() => handleDelete(rubric.id, rubric.titulo)}
          >
            🗑️
          </button>
        </div>
      ))}
    </div>
  );
}

export default RubricList;
