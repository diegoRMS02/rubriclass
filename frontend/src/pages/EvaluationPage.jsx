import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

// Importamos el componente que acabamos de crear en el Paso 2
import EvaluationResult from "../components/EvaluationResult";

// Componente interno para mostrar la autoevaluación del alumno
function ReadOnlyRubric({ rubrica, respuestas }) {
  return (
    <div className="rubric-readonly">
      <h3 style={{ marginTop: "0" }}>Tu Autoevaluación</h3>
      {rubrica.map((criterio) => (
        <div key={criterio.id} className="rubric-criterion">
          <h4 style={{ fontSize: "0.9rem", color: "#666" }}>
            {criterio.descripcion}
          </h4>
          <div className="rubric-levels">
            {criterio.niveles.map((nivel) => {
              const isSelected = respuestas[criterio.id] === nivel.id;
              return (
                <div
                  key={nivel.id}
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
  const { id } = useParams();
  const navigate = useNavigate();

  const [evaluacion, setEvaluacion] = useState(null);
  const [rubrica, setRubrica] = useState(null);

  const [entregaData, setEntregaData] = useState(null); // Datos completos de la entrega

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModifying, setIsModifying] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [enlace, setEnlace] = useState("");
  const [respuestas, setRespuestas] = useState({});
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  useEffect(() => {
    const fetchEvaluationData = async () => {
      try {
        setLoading(true);
        // 1. Obtener datos generales
        const evalResponse = await axios.get(`/api/evaluaciones/${id}`);
        setEvaluacion(evalResponse.data.evaluacion);
        setRubrica(evalResponse.data.rubrica);

        const fechaFin = evalResponse.data.evaluacion.fecha_fin;
        if (fechaFin && new Date() > new Date(fechaFin)) {
          setIsDeadlinePassed(true);
        }

        // 2. Buscar entrega existente
        try {
          const entregaResponse = await axios.get(
            `/api/evaluaciones/${id}/entrega`
          );
          setEntregaData(entregaResponse.data);

          setRespuestas(entregaResponse.data.respuestas || {});
          if (entregaResponse.data.entrega.enlace_url) {
            setEnlace(entregaResponse.data.entrega.enlace_url);
          }
        } catch (err) {
          if (err.response && err.response.status !== 404) throw err;
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
    setRespuestas((prev) => ({ ...prev, [criterioId]: nivelId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDeadlinePassed) return;

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
      window.location.reload();
    } catch (err) {
      const msg =
        err.response?.data?.message || "Error al realizar la entrega.";
      setError(msg);
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Cargando evaluación...
      </div>
    );
  if (error) return <div className="error-message">{error}</div>;
  if (!evaluacion || !rubrica) return <div>No se encontró la evaluación.</div>;

  // --- MODO VISTA (Ya entregado) ---
  if (entregaData && !isModifying) {
    const { entrega, archivos, calificacion, detalleDocente } = entregaData;
    const isGraded = !!calificacion; // ¿Ya tiene nota?

    return (
      <div className="evaluation-page">
        <div className="evaluation-card">
          <h1>{evaluacion.nombre_evaluacion}</h1>

          {/* AQUI MOSTRAMOS LA NOTA SI EXISTE */}
          {isGraded && (
            <EvaluationResult
              calificacion={calificacion}
              detalleDocente={detalleDocente}
              rubrica={rubrica}
            />
          )}

          <div className="delivery-status-box success">
            <p>
              <strong>¡Ya has entregado esta tarea!</strong>
            </p>
            <p>
              Entregado el:{" "}
              {format(new Date(entrega.fecha_entrega), "Pp", { locale: es })}
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            {evaluacion.tipo_entrega === "archivo" &&
              archivos &&
              archivos.length > 0 && (
                <div className="form-group">
                  <label>Archivo Entregado:</label>
                  <a
                    href={archivos[0].archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      marginTop: "5px",
                      color: "#1a73e8",
                      fontWeight: "500",
                    }}
                  >
                    📄 {archivos[0].nombre_archivo}
                  </a>
                </div>
              )}
            {evaluacion.tipo_entrega === "enlace" && entrega.enlace_url && (
              <div className="form-group">
                <label>Enlace Entregado:</label>
                <a
                  href={entrega.enlace_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#1a73e8",
                  }}
                >
                  🔗 {entrega.enlace_url}
                </a>
              </div>
            )}
          </div>

          <hr />
          <ReadOnlyRubric
            rubrica={rubrica}
            respuestas={entregaData.respuestas || {}}
          />
          <hr />

          {/* Botón Modificar: Solo si NO ha pasado la fecha Y NO ha sido calificado */}
          {!isDeadlinePassed && !isGraded ? (
            <button
              onClick={() => setIsModifying(true)}
              className="modify-evaluation-btn"
            >
              Modificar Entrega
            </button>
          ) : (
            <p
              style={{
                color: "#666",
                textAlign: "center",
                fontStyle: "italic",
                marginTop: "1rem",
              }}
            >
              {isGraded
                ? "Esta tarea ya fue calificada, no puedes modificarla."
                : "La fecha límite ya pasó, no puedes modificar tu entrega."}
            </p>
          )}

          <button onClick={() => navigate("/")} className="back-btn">
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- MODO FORMULARIO (Para entregar o modificar) ---
  if (isDeadlinePassed && !entregaData) {
    return (
      <div className="evaluation-page">
        <div className="evaluation-card">
          <h1>{evaluacion.nombre_evaluacion}</h1>
          <div className="delivery-status-box error">
            <p className="deadline-passed-error">
              La fecha límite ha pasado. (Cerró el:{" "}
              {format(new Date(evaluacion.fecha_fin), "Pp", { locale: es })})
            </p>
          </div>
          <button onClick={() => navigate(-1)}>Volver</button>
        </div>
      </div>
    );
  }

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
          {evaluacion.tipo_entrega === "archivo" && (
            <div className="form-group">
              <label>Subir Archivo de Tarea</label>
              {isModifying && (
                <p className="file-info-text">
                  (Sube un archivo solo si deseas reemplazar el anterior)
                </p>
              )}
              <input
                type="file"
                onChange={(e) => setArchivo(e.target.files[0])}
                required={!entregaData}
              />
            </div>
          )}

          {evaluacion.tipo_entrega === "enlace" && (
            <div className="form-group">
              <label>Pegar Enlace (URL)</label>
              <input
                type="url"
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                placeholder="https://..."
                required
                className="url-input"
              />
            </div>
          )}

          <hr />
          <h2>Rúbrica de Autoevaluación</h2>

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
