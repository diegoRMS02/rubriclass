import React, { useState } from "react";
import axios from "axios";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale/es"; // Importación correcta para date-fns v3/v4
import styles from "./AssignRubricModal.module.css";

// Registrar idioma español para el calendario
registerLocale("es", es);

function AssignRubricModal({ clase, rubricas, onClose, onSuccess }) {
  const [nombre, setNombre] = useState("");
  const [rubricaId, setRubricaId] = useState(rubricas[0]?.id || "");
  const [tipo, setTipo] = useState("individual");
  const [fechaFin, setFechaFin] = useState(null);
  const [tipoEntrega, setTipoEntrega] = useState("solo_rubrica");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !rubricaId) {
      setError("Completa los campos obligatorios.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Axios enviará la fecha como ISO string (ej: 2025-11-25T14:30:00.000Z)
      // PostgreSQL lo guardará con la hora exacta.
      await axios.post("/api/evaluaciones", {
        nombre_evaluacion: nombre,
        clase_id: clase.id,
        rubrica_id: parseInt(rubricaId),
        tipo_evaluacion: tipo,
        fecha_fin: fechaFin,
        tipo_entrega: tipoEntrega,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la evaluación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>

        <h2 className={styles.title}>Asignar a: {clase.nombre_clase}</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre de la Evaluación</label>
            <input
              type="text"
              className={styles.input}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Examen Final"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Rúbrica Base</label>
            <select
              className={styles.select}
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

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tipo</label>
              <select
                className={styles.select}
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="individual">Individual</option>
                <option value="grupal">Grupal</option>
                <option value="autoevaluacion">Autoevaluación</option>
                <option value="coevaluacion">Co-evaluación</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Entrega</label>
              <select
                className={styles.select}
                value={tipoEntrega}
                onChange={(e) => setTipoEntrega(e.target.value)}
              >
                <option value="solo_rubrica">Solo Rúbrica</option>
                <option value="archivo">Subir Archivo</option>
                <option value="enlace">Pegar Enlace</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Fecha y Hora Límite (Opcional)
            </label>
            {/* Wrapper Class para forzar ancho 100% */}
            <DatePicker
              selected={fechaFin}
              onChange={(date) => setFechaFin(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy h:mm aa"
              locale="es"
              placeholderText="Selecciona fecha y hora de entrega"
              className={styles.input} // ✨ IMPORTANTE: Usa el mismo estilo que tus inputs
              wrapperClassName={styles.datePickerFullWidth} // ✨ IMPORTANTE: Para el ancho
              isClearable
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Guardando..." : "Asignar Evaluación"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AssignRubricModal;
