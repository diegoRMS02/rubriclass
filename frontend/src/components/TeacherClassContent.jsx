import React, { useState } from "react";
import axios from "axios";
import styles from "./TeacherClassContent.module.css";

function TeacherClassContent({ claseId, modulos, onUpdate }) {
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [uploadingModuleId, setUploadingModuleId] = useState(null);

  const handleCreateModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      await axios.post("/api/modulos", {
        clase_id: claseId,
        titulo: newModuleTitle,
      });
      setNewModuleTitle("");
      setIsCreatingModule(false);
      onUpdate();
    } catch (error) {
      alert("Error al crear módulo");
    }
  };

  const handleUpload = async (moduloId, file) => {
    if (!file) return;
    setUploadingModuleId(moduloId);
    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("titulo", file.name);
    formData.append("tipo", "archivo");

    try {
      await axios.post(`/api/modulos/${moduloId}/recursos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpdate();
    } catch (error) {
      alert("Error al subir archivo");
    } finally {
      setUploadingModuleId(null);
    }
  };

  // --- NUEVA FUNCIÓN: ELIMINAR RECURSO ---
  const handleDeleteResource = async (recursoId) => {
    if (!window.confirm("¿Seguro que quieres eliminar este archivo?")) return;
    try {
      await axios.delete(`/api/modulos/recursos/${recursoId}`);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el recurso");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Contenido del Curso</h2>
        <button
          className={styles.addModuleBtn}
          onClick={() => setIsCreatingModule(!isCreatingModule)}
        >
          + Nuevo Módulo
        </button>
      </div>

      {isCreatingModule && (
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="Nombre del módulo (ej. Semana 1)"
            style={{
              flex: 1,
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          />
          <button
            onClick={handleCreateModule}
            style={{
              background: "#10B981",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Guardar
          </button>
        </div>
      )}

      <div className={styles.moduleList}>
        {modulos.length === 0 && (
          <p
            style={{ color: "#666", textAlign: "center", fontStyle: "italic" }}
          >
            No hay contenido creado aún.
          </p>
        )}

        {modulos.map((modulo) => (
          <div key={modulo.id} className={styles.moduleCard}>
            <div className={styles.moduleHeader}>
              <span className={styles.moduleTitle}>{modulo.titulo}</span>
            </div>

            <div className={styles.moduleContent}>
              <ul className={styles.resourceList}>
                {modulo.recursos &&
                  modulo.recursos.map((recurso) => (
                    <li key={recurso.id} className={styles.resourceItem}>
                      <span className={styles.resourceIcon}>
                        {recurso.tipo === "archivo" ? "📄" : "🔗"}
                      </span>
                      <div className={styles.resourceInfo}>
                        <a
                          href={recurso.url_publica || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.resourceLink}
                        >
                          {recurso.titulo}
                        </a>
                      </div>

                      {/* BOTÓN DE ELIMINAR */}
                      <button
                        onClick={() => handleDeleteResource(recurso.id)}
                        className={styles.deleteBtn}
                        title="Eliminar recurso"
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                {(!modulo.recursos || modulo.recursos.length === 0) && (
                  <li
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.9rem",
                      padding: "10px",
                      fontStyle: "italic",
                    }}
                  >
                    Carpeta vacía
                  </li>
                )}
              </ul>

              <div className={styles.uploadForm}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    color: "#4b5563",
                  }}
                >
                  Añadir archivo:
                </span>
                <input
                  type="file"
                  className={styles.fileInput}
                  onChange={(e) => handleUpload(modulo.id, e.target.files[0])}
                  disabled={uploadingModuleId === modulo.id}
                />
                {uploadingModuleId === modulo.id && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#1A73E8",
                      fontWeight: "bold",
                    }}
                  >
                    Subiendo...
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default TeacherClassContent;
