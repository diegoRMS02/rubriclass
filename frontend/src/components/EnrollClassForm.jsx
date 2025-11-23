import React, { useState } from "react";
import axios from "axios";
import styles from "./EnrollClassForm.module.css";

function EnrollClassForm({ onClassEnrolled }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post("/api/clases/inscribir", { codigo_inscripcion: codigo });
      setSuccess("¡Te has inscrito correctamente!");
      onClassEnrolled();
      setCodigo("");
    } catch (err) {
      setError(err.response?.data?.message || "Error al inscribirse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>🔗 Unirse a una Clase</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          className={styles.input}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="Ingresa el código (ej. A1B2C3)"
          disabled={loading}
          maxLength={10}
        />
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "..." : "Unirse"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
    </div>
  );
}

export default EnrollClassForm;
