import React, { useState } from "react";
import axios from "axios";
import styles from "./CreateClassModal.module.css";

const DAYS_OPTIONS = [
  { label: "Lun", value: "Lunes" },
  { label: "Mar", value: "Martes" },
  { label: "Mié", value: "Miércoles" },
  { label: "Jue", value: "Jueves" },
  { label: "Vie", value: "Viernes" },
  { label: "Sáb", value: "Sábado" },
];

function CreateClassModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre_clase: "",
    seccion: "",
    hora_inicio: "",
    hora_fin: "",
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDayToggle = (dayValue) => {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre_clase) {
      setError("El nombre de la clase es obligatorio.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const diasString = selectedDays.join(", ");
      await axios.post("/api/clases", {
        ...formData,
        dias: diasString,
      });
      onSuccess();
    } catch (err) {
      setError("Error al crear la clase. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {/* Emoji cambiado a libros 📚 y envuelto en span para alineación */}
          <h2>
            <span role="img" aria-label="libros">
              📚
            </span>{" "}
            Crear Nueva Clase
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Fila 1: Nombre y Sección */}
          <div className={styles.row}>
            <div className={styles.group} style={{ flex: 2 }}>
              <label htmlFor="nombre_clase">Nombre del Curso</label>
              <input
                id="nombre_clase"
                type="text"
                placeholder="Ej. Matemáticas Avanzadas"
                value={formData.nombre_clase}
                onChange={(e) =>
                  setFormData({ ...formData, nombre_clase: e.target.value })
                }
                autoFocus
              />
            </div>
            <div className={styles.group} style={{ flex: 1 }}>
              <label htmlFor="seccion">Sección/Grupo</label>
              <input
                id="seccion"
                type="text"
                placeholder="Ej. G1"
                value={formData.seccion}
                onChange={(e) =>
                  setFormData({ ...formData, seccion: e.target.value })
                }
              />
            </div>
          </div>

          {/* Fila 2: Días de Clase */}
          <div className={styles.group}>
            <label>Días de Clase</label>
            <div className={styles.daysContainer}>
              {DAYS_OPTIONS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`${styles.dayBtn} ${
                    selectedDays.includes(day.value) ? styles.selected : ""
                  }`}
                  onClick={() => handleDayToggle(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fila 3: Horario */}
          <div className={styles.row}>
            <div className={styles.group}>
              <label htmlFor="hora_inicio">Hora Inicio</label>
              <input
                id="hora_inicio"
                type="time"
                className={styles.timeInput}
                value={formData.hora_inicio}
                onChange={(e) =>
                  setFormData({ ...formData, hora_inicio: e.target.value })
                }
              />
            </div>
            <div className={styles.group}>
              <label htmlFor="hora_fin">Hora Fin</label>
              <input
                id="hora_fin"
                type="time"
                className={styles.timeInput}
                value={formData.hora_fin}
                onChange={(e) =>
                  setFormData({ ...formData, hora_fin: e.target.value })
                }
              />
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {/* Botones de Acción */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? "Creando..." : "Guardar Clase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateClassModal;
