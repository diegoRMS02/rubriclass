import React, { useState } from "react";
import axios from "axios";

function AssignRubricModal({ clase, rubricas, onClose, onSuccess }) {
  const [nombre, setNombre] = useState("");
  const [rubricaId, setRubricaId] = useState(rubricas[0]?.id || "");
  const [tipo, setTipo] = useState("individual");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !rubricaId || !tipo) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await axios.post("/api/evaluaciones", {
        nombre_evaluacion: nombre,
        clase_id: clase.id,
        rubrica_id: parseInt(rubricaId),
        tipo_evaluacion: tipo,
      });
      onSuccess(); // Llama a la función de éxito (que cerrará el modal)
    } catch (err) {
      const msg =
        err.response?.data?.message || "Error al crear la evaluación.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>
        <h2>Asignar Evaluación a: {clase.nombre_clase}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre de la Evaluación</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Evaluación Parcial 1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="rubrica">Seleccionar Rúbrica</label>
            <select
              id="rubrica"
              value={rubricaId}
              onChange={(e) => setRubricaId(e.target.value)}
            >
              {rubricas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.titulo}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tipo">Tipo de Evaluación</label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="individual">Individual</option>
              <option value="grupal">Grupal</option>
              <option value="autoevaluacion">Autoevaluación</option>
              <option value="coevaluacion">Co-evaluación (Pares)</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="modal-submit-btn">
            {loading ? "Asignando..." : "Asignar Evaluación"}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default AssignRubricModal;
