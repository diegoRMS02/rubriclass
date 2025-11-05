import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

// --- (NUEVO) Componente de solo lectura para la rúbrica ---
function ReadOnlyRubric({ rubrica, respuestas }) {
  return (
    <div className="rubric-readonly">
      <h2>Rúbrica Completada</h2>
      {rubrica.map((criterio) => (
        <div key={criterio.id} className="rubric-criterion">
          <h4>{criterio.descripcion}</h4>
          <div className="rubric-levels">
            {criterio.niveles.map((nivel) => {
              // Comprueba si este nivel fue la respuesta seleccionada
              const isSelected = respuestas[criterio.id] === nivel.id;
              return (
                <div
                  key={nivel.id}
                  // Añade una clase 'selected' si fue la respuesta
                  className={`rubric-level-readonly ${
                    isSelected ? "selected" : ""
                  }`}
                >
                  <div className="level-content">
                    <strong>{nivel.descripcion}</strong> ({nivel.puntaje} pts)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function EvaluationPage({ user }) {
  const { id } = useParams(); // Obtiene el "id" de la URL
  const navigate = useNavigate(); // Para redirigir al usuario

  const [evaluacion, setEvaluacion] = useState(null);
  const [rubrica, setRubrica] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- (MODIFICADO) Estados para la entrega ---
  const [entrega, setEntrega] = useState(null); // Almacena la entrega existente
  const [isModifying, setIsModifying] = useState(false); // Para cambiar entre "Vista" y "Formulario"

  const [archivo, setArchivo] = useState(null);
  const [enlace, setEnlace] = useState("");
  const [respuestas, setRespuestas] = useState({}); // { criterioId: nivelId, ... }

  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  // --- (MODIFICADO) useEffect para cargar la evaluación Y la entrega ---
  useEffect(() => {
    const fetchEvaluationData = async () => {
      try {
        setLoading(true);
        // 1. Obtener la información de la Evaluación (rúbrica, fecha límite, etc.)
        const evalResponse = await axios.get(`/api/evaluaciones/${id}`);
        setEvaluacion(evalResponse.data.evaluacion);
        setRubrica(evalResponse.data.rubrica);

        // 2. Comprobar la fecha límite
        const fechaFin = evalResponse.data.evaluacion.fecha_fin;
        if (fechaFin && new Date() > new Date(fechaFin)) {
          setIsDeadlinePassed(true);
        }

        // 3. (NUEVO) Intentar obtener una entrega existente
        try {
          const entregaResponse = await axios.get(
            `/api/evaluaciones/${id}/entrega`
          );
          // Si tiene éxito (encuentra una entrega), la guardamos
          setEntrega(entregaResponse.data);
          setRespuestas(entregaResponse.data.respuestas || {});
          setEnlace(entregaResponse.data.entrega.enlace_url || "");
        } catch (err) {
          // Si da 404, significa que no hay entrega, lo cual está bien.
          if (err.response && err.response.status !== 404) {
            throw err; // Lanza cualquier otro error
          }
          console.log(
            "No se encontró una entrega previa. Mostrando formulario."
          );
        }
      } catch (err) {
        setError("No se pudo cargar la evaluación.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluationData();
  }, [id]);

  const handleRubricChange = (criterioId, nivelId) => {
    setRespuestas((prev) => ({
      ...prev,
      [criterioId]: nivelId,
    }));
  };

  // --- (MODIFICADO) handleSubmit ahora funciona para Crear y Modificar ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDeadlinePassed) return; // Doble chequeo

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("evaluacion_id", id);
    formData.append("respuestas", JSON.stringify(respuestas));

    if (evaluacion.tipo_entrega === "archivo" && archivo) {
      formData.append("archivo", archivo);
    } else if (evaluacion.tipo_entrega === "enlace") {
      formData.append("enlace_url", enlace);
    }

    try {
      await axios.post(`/api/evaluaciones/${id}/entregar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("¡Entrega realizada con éxito!");
      // 4. (MODIFICADO) Recargamos la página para mostrar el "Modo Vista"
      window.location.reload();
    } catch (err) {
      const msg =
        err.response?.data?.message || "Error al realizar la entrega.";
      setError(msg);
      setLoading(false);
    }
  };

  // --- Renderizado ---
  if (loading) return <div>Cargando evaluación...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!evaluacion || !rubrica) return <div>No se encontró la evaluación.</div>;

  // --- (NUEVO) Renderizado del MODO VISTA ---
  // Si ya existe una entrega Y no estamos en modo "Modificar"
  if (entrega && !isModifying) {
    return (
      <div className="evaluation-page">
        <div className="evaluation-card">
          <h1>{evaluacion.nombre_evaluacion}</h1>
          <div className="delivery-status-box success">
            <p>
              <strong>¡Ya has entregado esta tarea!</strong>
            </p>
            <p>
              Entregado el:{" "}
              {format(new Date(entrega.entrega.fecha_entrega), "Pp", {
                locale: es,
              })}
            </p>
          </div>

          {/* Mostrar archivo o enlace entregado */}
          {evaluacion.tipo_entrega === "archivo" &&
            entrega.archivos &&
            entrega.archivos.length > 0 && (
              <div className="form-group">
                <label>Archivo Entregado:</label>
                <a
                  href={entrega.archivos[0].archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {entrega.archivos[0].nombre_archivo}
                </a>
              </div>
            )}
          {evaluacion.tipo_entrega === "enlace" &&
            entrega.entrega.enlace_url && (
              <div className="form-group">
                <label>Enlace Entregado:</label>
                <a
                  href={entrega.entrega.enlace_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {entrega.entrega.enlace_url}
                </a>
              </div>
            )}

          <hr />
          <ReadOnlyRubric rubrica={rubrica} respuestas={respuestas} />
          <hr />

          {/* Mostrar botón de Modificar SOLO si la fecha límite no ha pasado */}
          {!isDeadlinePassed ? (
            <button
              onClick={() => setIsModifying(true)}
              className="modify-evaluation-btn"
            >
              Modificar Entrega
            </button>
          ) : (
            <p>La fecha límite ya pasó, no puedes modificar tu entrega.</p>
          )}
          <button onClick={() => navigate("/")} className="back-btn">
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- Renderizado del MODO FORMULARIO (para entregar o modificar) ---
  // (Esto se muestra si no hay entrega, o si isModifying es true)

  // Mensaje si la fecha límite pasó Y AÚN NO HA ENTREGADO
  if (isDeadlinePassed && !entrega) {
    return (
      <div className="evaluation-page">
        <div className="evaluation-card">
          <h1>{evaluacion.nombre_evaluacion}</h1>
          <div className="delivery-status-box error">
            <p className="deadline-passed-error">
              La fecha límite para esta entrega ha pasado. (Cerró el:{" "}
              {format(new Date(evaluacion.fecha_fin), "Pp", { locale: es })})
            </p>
          </div>
          <button onClick={() => navigate(-1)}>Volver</button>
        </div>
      </div>
    );
  }

  // Formulario de entrega (para entregar por primera vez o modificar)
  return (
    <div className="evaluation-page">
      <div className="evaluation-card">
        <h1>
          {isModifying ? "Modificar Entrega" : evaluacion.nombre_evaluacion}
        </h1>
        {evaluacion.fecha_fin && (
          <p className="evaluation-due-date">
            <strong>Fecha Límite:</strong>{" "}
            {format(new Date(evaluacion.fecha_fin), "Pp", { locale: es })}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          {/* --- Sección de Entrega (Archivo o Enlace) --- */}
          {evaluacion.tipo_entrega === "archivo" && (
            <div className="form-group">
              <label>Subir Archivo de Tarea</label>
              <p className="file-info-text">
                (Si seleccionas un archivo nuevo, reemplazará al anterior)
              </p>
              <input
                type="file"
                onChange={(e) => setArchivo(e.target.files[0])}
                // 'required' solo si es la primera entrega
                required={!entrega}
              />
            </div>
          )}
          {evaluacion.tipo_entrega === "enlace" && (
            <div className="form-group">
              <label>Pegar Enlace (URL)</label>
              <input
                type="url"
                value={enlace} // Pre-llenado con el enlace anterior
                onChange={(e) => setEnlace(e.target.value)}
                placeholder="https://..."
                required
                className="url-input"
              />
            </div>
          )}
          {evaluacion.tipo_entrega === "solo_rubrica" && (
            <p>
              Esta es una evaluación de desempeño, solo necesitas completar la
              rúbrica.
            </p>
          )}

          <hr />

          {/* --- Sección de la Rúbrica --- */}
          <h2>Rúbrica de Evaluación</h2>
          {rubrica.map((criterio) => (
            <div key={criterio.id} className="rubric-criterion">
              <h4>{criterio.descripcion}</h4>
              <div className="rubric-levels">
                {criterio.niveles.map((nivel) => (
                  <label key={nivel.id} className="rubric-level">
                    <input
                      type="radio"
                      name={`criterio-${criterio.id}`}
                      value={nivel.id}
                      // Pre-marca la respuesta guardada
                      checked={respuestas[criterio.id] === nivel.id}
                      onChange={() => handleRubricChange(criterio.id, nivel.id)}
                      required
                    />
                    <div className="level-content">
                      <strong>{nivel.descripcion}</strong> ({nivel.puntaje} pts)
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <hr />

          <button
            type="submit"
            disabled={loading}
            className="submit-evaluation-btn"
          >
            {loading
              ? "Enviando..."
              : isModifying
              ? "Guardar Cambios"
              : "Enviar Entrega"}
          </button>
          {/* Botón para cancelar la modificación */}
          {isModifying && (
            <button
              type="button"
              onClick={() => setIsModifying(false)}
              className="back-btn"
            >
              Cancelar
            </button>
          )}
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default EvaluationPage;
