import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { Link } from "react-router-dom";
import styles from "./EvaluationList.module.css"; // Importamos los estilos modulares

function EvaluationList({ evaluations }) {
  // Estado vacío
  if (evaluations.length === 0) {
    return (
      <div className={styles.listContainer}>
        <p className={styles.emptyState}>
          Aún no has asignado ninguna evaluación.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.list}>
        {evaluations.map((evaluacion) => (
          <div key={evaluacion.id} className={styles.item}>
            {/* Parte Izquierda: Info Principal */}
            <div className={styles.info}>
              <Link
                to={`/docente/evaluacion/${evaluacion.id}`}
                className={styles.titleLink}
              >
                {evaluacion.nombre_evaluacion}
              </Link>
              <div className={styles.meta}>
                <span className={styles.badge}>
                  {evaluacion.tipo_evaluacion}
                </span>
                <span>•</span>
                <span>{evaluacion.nombre_clase}</span>
              </div>
            </div>

            {/* Parte Derecha: Fecha Límite */}
            {evaluacion.fecha_fin ? (
              <div className={styles.date}>
                Vence:{" "}
                {format(new Date(evaluacion.fecha_fin), "dd/MM/yyyy", {
                  locale: es,
                })}
              </div>
            ) : (
              <span style={{ fontSize: "0.8rem", color: "#999" }}>
                Sin fecha
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EvaluationList;
