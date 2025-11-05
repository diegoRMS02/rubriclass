import React from "react";
// 1. Importamos las herramientas para formatear la fecha
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

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

            {/* --- 2. AQUÍ ESTÁ EL CAMBIO --- */}
            {/* Si existe una fecha_fin, la mostramos formateada */}
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
