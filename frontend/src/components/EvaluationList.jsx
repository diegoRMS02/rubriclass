import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import "moment/locale/es";
import styles from "./EvaluationList.module.css";

moment.locale("es");

// Recibimos "onEdit" como nueva prop
function EvaluationList({ evaluations, onDeleteSuccess, onEdit }) {
  const handleDelete = async (e, id, titulo) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`¿Seguro que deseas eliminar "${titulo}"?`)) return;

    try {
      await axios.delete(`/api/evaluaciones/${id}`);
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (error) {
      alert(error.response?.data?.message || "Error al eliminar.");
    }
  };

  const handleEditClick = (e, evalItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) onEdit(evalItem);
  };

  if (!evaluations || evaluations.length === 0) {
    return <div className={styles.empty}>No hay evaluaciones asignadas.</div>;
  }

  return (
    <div className={styles.listContainer}>
      {evaluations.map((evalItem) => {
        const fechaFin = evalItem.fecha_fin ? moment(evalItem.fecha_fin) : null;
        const diasRestantes = fechaFin ? fechaFin.diff(moment(), "days") : 99;
        const esUrgente = diasRestantes <= 3 && diasRestantes >= 0;

        return (
          <div
            key={evalItem.id}
            className={styles.item}
            style={{ borderLeftColor: esUrgente ? "#ea4335" : "#1a73e8" }}
          >
            <div className={styles.info}>
              <Link
                to={`/docente/evaluacion/${evalItem.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <span className={styles.title}>
                  {evalItem.nombre_evaluacion}
                </span>
              </Link>

              <div className={styles.subInfo}>
                <span className={styles.tag}>{evalItem.tipo_evaluacion}</span>
                <span>• {evalItem.nombre_clase}</span>
              </div>
            </div>

            <div className={styles.meta}>
              <span
                className={`${styles.date} ${
                  esUrgente ? styles.urgent : styles.normal
                }`}
              >
                {fechaFin ? `Vence: ${fechaFin.format("D MMM")}` : "Sin fecha"}
              </span>

              {/* BOTÓN EDITAR */}
              <button
                className={styles.deleteBtn}
                onClick={(e) => handleEditClick(e, evalItem)}
                title="Editar Evaluación"
                style={{ color: "#1a73e8" }} // Azul para editar
              >
                ✏️
              </button>

              <button
                className={styles.deleteBtn}
                onClick={(e) =>
                  handleDelete(e, evalItem.id, evalItem.nombre_evaluacion)
                }
                title="Eliminar Evaluación"
              >
                🗑️
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default EvaluationList;
