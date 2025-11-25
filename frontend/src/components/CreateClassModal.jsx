import React, { useState, useEffect } from "react";
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

function CreateClassModal({ onClose, onSuccess, classToEdit = null }) {
  const [formData, setFormData] = useState({
    nombre_clase: "",
    seccion: "",
    hora_inicio: "",
    hora_fin: "",
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar datos si es edición
  useEffect(() => {
    if (classToEdit) {
      setFormData({
        nombre_clase: classToEdit.nombre_clase || "",
        seccion: classToEdit.seccion || "",
        hora_inicio: classToEdit.hora_inicio || "",
        hora_fin: classToEdit.hora_fin || "",
      });
      if (classToEdit.dias) {
        setSelectedDays(classToEdit.dias.split(", ").filter(Boolean));
      }
    }
  }, [classToEdit]);

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
      // PREPARAR DATOS
      const diasString = selectedDays.join(", ");
      const payload = { ...formData, dias: diasString };

      // ENVIAR PETICIÓN (Sin headers manuales, Axios usa cookies automáticamente)
      if (classToEdit) {
        // MODO EDICIÓN
        await axios.put(`/api/clases/${classToEdit.id}`, payload);
      } else {
        // MODO CREACIÓN
        await axios.post("/api/clases", payload);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        // Si da 401 es porque la sesión en el servidor caducó
        setError(
          "Tu sesión expiró. Por favor recarga la página e inicia sesión."
        );
      } else {
        setError(err.response?.data?.message || "Error al guardar la clase.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>
            <span role="img" aria-label="libros">
              📚
            </span>{" "}
            {classToEdit ? "Editar Clase" : "Crear Nueva Clase"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
                autoFocus={!classToEdit}
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
              {loading
                ? "Guardando..."
                : classToEdit
                ? "Actualizar"
                : "Guardar Clase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateClassModal;
