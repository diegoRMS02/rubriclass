import React, { useState, useEffect } from "react";
import axios from "axios";
// Importamos el módulo CSS
import styles from "./GradingModal.module.css";

function GradingModal({ student, evaluationId, rubric, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [nota, setNota] = useState("");
  const [grades, setGrades] = useState({});
  const [error, setError] = useState("");

  const calculateRubricScore = () => {
    let total = 0;
    Object.entries(grades).forEach(([criterioId, nivelId]) => {
      const criterio = rubric.find((c) => c.id === parseInt(criterioId));
      if (criterio) {
        const nivel = criterio.niveles.find((n) => n.id === parseInt(nivelId));
        if (nivel) total += nivel.puntaje;
      }
    });
    return total;
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(
          `/api/evaluaciones/entregas/${student.entrega_id}/detalles`
        );
        setFiles(res.data.archivos);

        if (res.data.calificacion) {
          setFeedback(res.data.calificacion.feedback || "");
          setNota(res.data.calificacion.nota || "");
          setGrades(res.data.detalles || {});
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar los detalles de la entrega.");
      } finally {
        setLoading(false);
      }
    };

    if (student.entrega_id) {
      fetchDetails();
    }
  }, [student.entrega_id]);

  const handleGradeChange = (criterioId, nivelId) => {
    setGrades((prev) => ({ ...prev, [criterioId]: nivelId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nota || parseFloat(nota) < 0 || parseFloat(nota) > 20) {
      setError("Por favor, ingresa una nota válida entre 0 y 20.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/evaluaciones/${student.entrega_id}/calificar`, {
        feedback,
        nota: parseFloat(nota),
        detalles: grades,
      });
      onSuccess();
    } catch (err) {
      setError("Error al guardar la calificación.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>

        <div className={styles.header}>
          <h2>Calificando a: {student.nombre_estudiante}</h2>
          {/* Nota: 'badge' y 'success' siguen siendo globales en index.css por ahora */}
          <span className="badge success">Entregado</span>
        </div>

        {loading ? (
          <p>Cargando entrega...</p>
        ) : (
          <div>
            {/* SECCIÓN DE ARCHIVOS */}
            <div>
              <h3>Archivos Entregados</h3>
              {files.length === 0 ? (
                <p className={styles.textGray}>No hay archivos adjuntos.</p>
              ) : (
                <ul className={styles.filesList}>
                  {files.map((f) => (
                    <li key={f.id}>
                      <a
                        href={f.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.fileLink}
                      >
                        📄 {f.nombre_archivo}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <hr />

            <form onSubmit={handleSubmit}>
              {/* SECCIÓN DE RÚBRICA */}
              <h3>Rúbrica de Evaluación</h3>
              <div>
                {rubric.map((criterio) => (
                  <div key={criterio.id} className={styles.rubricCriterion}>
                    <h4>{criterio.descripcion}</h4>
                    <div className={styles.levelsGrid}>
                      {criterio.niveles.map((nivel) => (
                        <label
                          key={nivel.id}
                          // Usamos template literals para combinar la clase base y la condicional
                          className={`${styles.levelCard} ${
                            grades[criterio.id] === nivel.id
                              ? styles.selected
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name={`crit-${criterio.id}`}
                            value={nivel.id}
                            checked={grades[criterio.id] === nivel.id}
                            onChange={() =>
                              handleGradeChange(criterio.id, nivel.id)
                            }
                          />
                          <div className={styles.levelInfo}>
                            <span className={styles.points}>
                              {nivel.puntaje} pts
                            </span>
                            <span className={styles.desc}>
                              {nivel.descripcion}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* SECCIÓN DE NOTA FINAL Y FEEDBACK */}
              <div className={styles.formGroup}>
                <label>Nota Final (0 - 20)</label>
                <div className={styles.gradeContainer}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Ej. 18"
                    className={styles.gradeInput}
                    required
                  />
                  <span className={styles.sumHint}>
                    (Suma de rúbrica: {calculateRubricScore()} pts)
                  </span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Feedback / Comentarios</label>
                <textarea
                  rows="3"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className={styles.feedbackInput}
                />
              </div>

              {error && <p className={styles.errorMessage}>{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className={styles.submitBtn}
              >
                {submitting ? "Guardando..." : "Guardar Calificación"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default GradingModal;
