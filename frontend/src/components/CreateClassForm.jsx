import React, { useState } from "react";
import axios from "axios";

// Este componente recibe una función para actualizar la lista de clases
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
      // Si la clase se crea con éxito, llamamos a la función del padre
      onClassCreated(response.data);
      setNombreClase(""); // Limpiamos el input
    } catch (err) {
      setError("No se pudo crear la clase. Inténtalo de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Crear una Nueva Clase</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={nombreClase}
          onChange={(e) => setNombreClase(e.target.value)}
          placeholder="Nombre de la nueva clase"
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Crear Clase"}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default CreateClassForm;
