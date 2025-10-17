import React, { useState } from "react";
import axios from "axios";

function EnrollClassForm({ onClassEnrolled }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) {
      setError("El código de inscripción es requerido.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Hacemos la petición a la API que creamos en el backend
      await axios.post("/api/clases/inscribir", {
        codigo_inscripcion: codigo,
      });
      setSuccess("¡Inscripción exitosa!");
      // Si la inscripción es exitosa, llamamos a la función del padre para recargar la lista
      onClassEnrolled();
      setCodigo("");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "No se pudo inscribir. Verifica el código.";
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Inscribirse a una Nueva Clase</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="Ingresa el código de la clase"
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Inscribiendo..." : "Inscribirse"}
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>
    </div>
  );
}

export default EnrollClassForm;
