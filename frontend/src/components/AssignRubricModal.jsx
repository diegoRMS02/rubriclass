import React, { useState } from "react";
import axios from "axios";
// 1. IMPORTAMOS EL DATEPICKER Y LO NECESARIO
import "react-datepicker/dist/react-datepicker.css";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale/es";

// 2. CONFIGURAMOS EL DATEPICKER EN ESPAÑOL
registerLocale("es", es);

function AssignRubricModal({ clase, rubricas, onClose, onSuccess }) {
  const [nombre, setNombre] = useState("");
  const [rubricaId, setRubricaId] = useState(rubricas[0]?.id || "");
  const [tipo, setTipo] = useState("individual");

  // 3. AÑADIMOS LOS NUEVOS ESTADOS
  const [fechaFin, setFechaFin] = useState(null); // Para la fecha límite
  const [tipoEntrega, setTipoEntrega] = useState("solo_rubrica"); // Para el tipo de entrega

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !rubricaId || !tipo || !tipoEntrega) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // 4. AÑADIMOS LOS NUEVOS DATOS AL ENVÍO DE AXIOS
      await axios.post("/api/evaluaciones", {
        nombre_evaluacion: nombre,
        clase_id: clase.id,
        rubrica_id: parseInt(rubricaId),
        tipo_evaluacion: tipo,
        fecha_fin: fechaFin, // <-- NUEVO
        tipo_entrega: tipoEntrega, // <-- NUEVO
      });
      onSuccess();
    } catch (err) {
      const msg =
        err.response?.data?.message || "Error al crear la evaluación.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>
        <h2>Asignar Evaluación a: {clase.nombre_clase}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Campo Nombre (sin cambios) */}
          <div className="form-group">
            <label htmlFor="nombre">Nombre de la Evaluación</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Evaluación Parcial 1"
            />
          </div>

          {/* Campo Rúbrica (sin cambios) */}
          <div className="form-group">
            <label htmlFor="rubrica">Seleccionar Rúbrica</label>
            <select
              id="rubrica"
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

          {/* 5. AÑADIMOS LOS NUEVOS CAMPOS AL FORMULARIO */}

          <div className="form-row">
            {/* Campo Tipo de Evaluación */}
            <div className="form-group">
              <label htmlFor="tipo">Tipo de Evaluación</label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="individual">Individual</option>
                <option value="grupal">Grupal</option>
                <option value="autoevaluacion">Autoevaluación</option>
                <option value="coevaluacion">Co-evaluación (Pares)</option>
              </select>
            </div>

            {/* Nuevo Campo: Tipo de Entrega */}
            <div className="form-group">
              <label htmlFor="tipoEntrega">Tipo de Entrega</label>
              <select
                id="tipoEntrega"
                value={tipoEntrega}
                onChange={(e) => setTipoEntrega(e.target.value)}
              >
                <option value="solo_rubrica">
                  Solo Rúbrica (Ej. Presentación)
                </option>
                <option value="archivo">Subida de Archivo</option>
                <option value="enlace">Entrega de Enlace (URL)</option>
              </select>
            </div>
          </div>

          {/* Nuevo Campo: Fecha Límite (DatePicker) */}
          <div className="form-group">
            <label htmlFor="fechaFin">Fecha Límite (Opcional)</label>
            <DatePicker
              id="fechaFin"
              selected={fechaFin}
              onChange={(date) => setFechaFin(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Hora"
              dateFormat="d MMMM, yyyy h:mm aa"
              locale="es"
              placeholderText="Clic para seleccionar fecha y hora"
              className="datepicker-input" // Clase para estilos
            />
          </div>

          <button type="submit" disabled={loading} className="modal-submit-btn">
            {loading ? "Asignando..." : "Asignar Evaluación"}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default AssignRubricModal;
