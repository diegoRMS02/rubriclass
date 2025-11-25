import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale/es";
import styles from "./AssignRubricModal.module.css";

registerLocale("es", es);

// Aceptamos prop "evaluationToEdit"
function AssignRubricModal({
  clase,
  rubricas,
  onClose,
  onSuccess,
  evaluationToEdit = null,
}) {
  const [nombre, setNombre] = useState("");
  const [rubricaId, setRubricaId] = useState(rubricas[0]?.id || "");
  const [tipo, setTipo] = useState("individual");
  const [fechaFin, setFechaFin] = useState(null);
  const [tipoEntrega, setTipoEntrega] = useState("solo_rubrica");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar datos si es edición
  useEffect(() => {
    if (evaluationToEdit) {
      setNombre(evaluationToEdit.nombre_evaluacion);
      // La rúbrica y clase no se suelen editar para no romper integridad
      setRubricaId(evaluationToEdit.rubrica_id);
      setTipo(evaluationToEdit.tipo_evaluacion);
      setTipoEntrega(evaluationToEdit.tipo_entrega);
      if (evaluationToEdit.fecha_fin) {
        setFechaFin(new Date(evaluationToEdit.fecha_fin));
      }
    }
  }, [evaluationToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || (!rubricaId && !evaluationToEdit)) {
      setError("Completa los campos obligatorios.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      if (evaluationToEdit) {
        // MODO EDICIÓN (PUT)
        await axios.put(`/api/evaluaciones/${evaluationToEdit.id}`, {
          nombre_evaluacion: nombre,
          fecha_fin: fechaFin,
          tipo_entrega: tipoEntrega,
          // Nota: No enviamos rubrica_id ni clase_id en update por seguridad del MVP
        });
      } else {
        // MODO CREACIÓN (POST)
        await axios.post("/api/evaluaciones", {
          nombre_evaluacion: nombre,
          clase_id: clase.id,
          rubrica_id: parseInt(rubricaId),
          tipo_evaluacion: tipo,
          fecha_fin: fechaFin,
          tipo_entrega: tipoEntrega,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar.");
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

        <h2 className={styles.title}>
          {evaluationToEdit
            ? "Editar Evaluación"
            : `Asignar a: ${clase?.nombre_clase}`}
        </h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre de la Evaluación</label>
            <input
              type="text"
              className={styles.input}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Examen Final"
              autoFocus={!evaluationToEdit}
            />
          </div>

          {!evaluationToEdit && (
            // Solo mostramos el selector de rúbrica al crear, no al editar (por seguridad MVP)
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
          )}

          <div className={styles.row}>
            {/* El tipo se puede editar solo si es creación, o restringido en edición */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Tipo</label>
              <select
                className={styles.select}
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                disabled={!!evaluationToEdit} // Deshabilitado en edición por ahora
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
            <DatePicker
              selected={fechaFin}
              onChange={(date) => setFechaFin(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy h:mm aa"
              locale="es"
              placeholderText="Selecciona fecha y hora de entrega"
              className={styles.input}
              wrapperClassName={styles.datePickerFullWidth}
              isClearable
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading
              ? "Guardando..."
              : evaluationToEdit
              ? "Actualizar Cambios"
              : "Asignar Evaluación"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AssignRubricModal;
