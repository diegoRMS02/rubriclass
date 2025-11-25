import React, { useState } from "react";
import axios from "axios";
import styles from "./TeacherClassContent.module.css";

function TeacherClassContent({ claseId, modulos, onUpdate }) {
  const [isCreating, setIsCreating] = useState(false);
  const [nombreModulo, setNombreModulo] = useState("");
  const [loading, setLoading] = useState(false);

  // --- CREAR MÓDULO ---
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!nombreModulo.trim()) return;

    setLoading(true);
    try {
      await axios.post("/api/modulos", {
        clase_id: claseId,
        titulo: nombreModulo,
      });
      setNombreModulo("");
      setIsCreating(false);
      onUpdate();
    } catch (error) {
      console.error("Error creando módulo", error);
      alert("Error al crear el módulo");
    } finally {
      setLoading(false);
    }
  };

  // --- SUBIR ARCHIVO ---
  const handleFileUpload = async (moduloId, file) => {
    if (!file) return;

    // Usamos el nombre original para el título
    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("modulo_id", moduloId);
    formData.append("tipo", "archivo");

    try {
      // Feedback visual simple (puedes mejorarlo con un toast)
      const btn = document.getElementById(`upload-label-${moduloId}`);
      if (btn) btn.innerText = "⏳ Subiendo...";

      await axios.post("/api/recursos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpdate();
    } catch (error) {
      console.error("Error subiendo archivo", error);
      alert("Error al subir el archivo.");
    }
  };

  // --- ELIMINAR RECURSO (NUEVO) ---
  const handleDeleteResource = async (recursoId, titulo) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar el archivo "${cleanFileName(titulo)}"?`
      )
    )
      return;

    try {
      await axios.delete(`/api/recursos/${recursoId}`);
      onUpdate(); // Recargar la lista
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el archivo.");
    }
  };

  // --- HELPER: Limpiar nombre feo (UUID) ---
  const cleanFileName = (title) => {
    if (!title) return "Archivo sin nombre";
    // Si tiene un UUID al inicio (36 chars + guion), lo cortamos
    if (title.length > 37 && title.charAt(36) === "-") {
      return title.substring(37);
    }
    return title;
  };

  return (
    <div className={styles.container}>
      {/* --- ZONA DE CREACIÓN --- */}
      {!isCreating ? (
        <div
          className={`${styles.creationCard} ${styles.collapsed}`}
          onClick={() => setIsCreating(true)}
        >
          <button className={styles.expandBtn}>
            <span>➕</span> Crear Nuevo Módulo / Semana
          </button>
        </div>
      ) : (
        <div className={styles.creationCard}>
          <h3 className={styles.formTitle}>Nuevo Módulo</h3>
          <form onSubmit={handleCreateModule}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                className={styles.input}
                placeholder="Nombre del módulo (Ej: Semana 1: Introducción)"
                value={nombreModulo}
                onChange={(e) => setNombreModulo(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsCreating(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={!nombreModulo.trim() || loading}
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- LISTA DE MÓDULOS --- */}
      <div className={styles.moduleList}>
        {modulos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#888",
              padding: "3rem",
              border: "2px dashed #e0e0e0",
              borderRadius: "8px",
              background: "white",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📂</div>
            <p>No hay contenido. ¡Crea tu primer módulo arriba! 👆</p>
          </div>
        ) : (
          modulos.map((modulo) => (
            <div key={modulo.id} className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <h3 className={styles.moduleTitle}>{modulo.titulo}</h3>
              </div>

              <div className={styles.resourceList}>
                {modulo.recursos &&
                  modulo.recursos.map((rec) => (
                    <div key={rec.id} className={styles.resourceItem}>
                      {/* Enlace / Archivo */}
                      <a
                        href={rec.url_publica}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.resourceLink}
                      >
                        <span
                          style={{ fontSize: "1.2rem", marginRight: "10px" }}
                        >
                          {rec.tipo === "archivo" ? "📄" : "🔗"}
                        </span>
                        {cleanFileName(rec.titulo)}
                      </a>

                      {/* Botón de Eliminar (NUEVO) */}
                      <button
                        className={styles.deleteResourceBtn}
                        onClick={() => handleDeleteResource(rec.id, rec.titulo)}
                        title="Eliminar archivo"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                {(!modulo.recursos || modulo.recursos.length === 0) && (
                  <p
                    style={{
                      padding: "0 1.5rem",
                      color: "#999",
                      fontSize: "0.9rem",
                      fontStyle: "italic",
                    }}
                  >
                    Carpeta vacía.
                  </p>
                )}
              </div>

              {/* Dropzone */}
              <div className={styles.dropZone}>
                <label
                  id={`upload-label-${modulo.id}`}
                  style={{ cursor: "pointer", display: "block", width: "100%" }}
                >
                  <input
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      handleFileUpload(modulo.id, e.target.files[0])
                    }
                  />
                  <span>
                    📂 Agregar archivo a <strong>{modulo.titulo}</strong>
                  </span>
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TeacherClassContent;
