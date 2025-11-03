import React from "react";

function EvaluationList({ evaluations }) {
  if (evaluations.length === 0) {
    return (
      <div className="evaluation-list-container">
        <h2>Evaluaciones Asignadas</h2>
        <p>Aún no has asignado ninguna evaluación.</p>
      </div>
    );
  }

  return (
    <div className="evaluation-list-container">
      <h2>Evaluaciones Asignadas</h2>
      <ul className="evaluation-list">
        {evaluations.map((evaluacion) => (
          <li key={evaluacion.id} className="evaluation-item">
            <div className="evaluation-header">
              <h3 className="evaluation-title">
                {evaluacion.nombre_evaluacion}
              </h3>
              <span className="evaluation-type">
                {evaluacion.tipo_evaluacion}
              </span>
            </div>
            <div className="evaluation-details">
              <p>
                <strong>Clase:</strong> {evaluacion.nombre_clase}
              </p>
              <p>
                <strong>Rúbrica:</strong> {evaluacion.nombre_rubrica}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EvaluationList;
