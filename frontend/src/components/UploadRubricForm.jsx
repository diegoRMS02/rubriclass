import React, { useState } from "react";
import axios from "axios";
import styles from "./UploadRubricForm.module.css";

function UploadRubricForm({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
      setSuccess("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Selecciona un archivo primero.");
      return;
    }

    const formData = new FormData();
    formData.append("rubricaFile", file);
    setLoading(true);

    try {
      const response = await axios.post("/api/rubricas/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(response.data.message);
      setFile(null); // Resetear archivo
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError("Error al subir. Verifica el formato.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>📂 Subir Nueva Rúbrica</h3>
        <p className={styles.subtitle}>Formato Excel (.xlsx) requerido</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fileInputWrapper}>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          <div className={styles.fileLabel}>
            {file ? (
              <>
                Archivo seleccionado:
                <span className={styles.fileName}>{file.name}</span>
              </>
            ) : (
              <span>Arrastra tu archivo aquí o haz clic</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          className={styles.button}
          disabled={loading || !file}
        >
          {loading ? "Subiendo..." : "Subir Rúbrica"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
    </div>
  );
}

export default UploadRubricForm;
