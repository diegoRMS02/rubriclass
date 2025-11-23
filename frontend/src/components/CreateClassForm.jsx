import React, { useState } from "react";
import axios from "axios";
import styles from "./CreateClassForm.module.css";

function CreateClassForm({ onClassCreated }) {
  const [nombreClase, setNombreClase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreClase.trim()) {
      setError("El nombre de la clase no puede estar vacío.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/clases", {
        nombre_clase: nombreClase,
      });
      onClassCreated(response.data);
      setNombreClase("");
    } catch (err) {
      setError("No se pudo crear la clase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>✨ Crear una Nueva Clase</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          className={styles.input}
          value={nombreClase}
          onChange={(e) => setNombreClase(e.target.value)}
          placeholder="Ej. Matemáticas Avanzadas"
          disabled={loading}
        />
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Creando..." : "Crear Clase"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export default CreateClassForm;
