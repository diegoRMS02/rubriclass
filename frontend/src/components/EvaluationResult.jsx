import React from "react";
import styles from "./EvaluationResult.module.css";

function EvaluationResult({ calificacion, detalleDocente, rubrica }) {
  if (!calificacion) return null;

  return (
    <div className={styles.resultCard}>
      <div className={styles.header}>
        <h2>Resultados de la Evaluación</h2>
        <div className={styles.scoreBox}>
          <span className={styles.scoreLabel}>Nota</span>
          <span className={styles.scoreValue}>{calificacion.nota}</span>
        </div>
      </div>

      {calificacion.feedback && (
        <div className={styles.feedbackSection}>
          <h3>Comentarios del Docente:</h3>
          <p className={styles.feedbackText}>"{calificacion.feedback}"</p>
        </div>
      )}

      <hr
        style={{ border: "0", borderTop: "1px solid #eee", margin: "20px 0" }}
      />

      <div className={styles.rubricSection}>
        <h3>Detalle de la Calificación</h3>
        <div>
          {rubrica.map((criterio) => (
            <div key={criterio.id} className={styles.rubricCriterion}>
              <h4>{criterio.descripcion}</h4>
              <div className={styles.levelsGrid}>
                {criterio.niveles.map((nivel) => {
                  // Verificamos si este nivel es el que marcó el docente
                  const isSelected =
                    parseInt(detalleDocente[criterio.id]) === nivel.id;

                  return (
                    <div
                      key={nivel.id}
                      className={`${styles.levelBadge} ${
                        isSelected ? styles.selected : ""
                      }`}
                    >
                      <div>{nivel.descripcion}</div>
                      <div style={{ fontSize: "0.8em", marginTop: "4px" }}>
                        ({nivel.puntaje} pts)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EvaluationResult;
