import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { Link } from "react-router-dom"; // <-- Importamos Link

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
              {/* --- CAMBIO AQUÍ: Convertimos el título en un enlace --- */}
              <Link
                to={`/docente/evaluacion/${evaluacion.id}`}
                className="evaluation-title-link"
              >
                {evaluacion.nombre_evaluacion}
              </Link>
              {/* ------------------------------------------------------- */}
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

            {evaluacion.fecha_fin && (
              <div className="evaluation-due-date">
                <strong>Fecha Límite:</strong>
                {format(new Date(evaluacion.fecha_fin), "Pp", { locale: es })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EvaluationList;
