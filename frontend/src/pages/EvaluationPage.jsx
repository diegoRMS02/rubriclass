import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import styles from "./EvaluationPage.module.css";

// Importamos el componente de resultados (que ya es bonito)
import EvaluationResult from "../components/EvaluationResult";

// Componente interno para mostrar la autoevaluación (Ahora con diseño Grid)
function ReadOnlyRubric({ rubrica, respuestas }) {
  return (
    <div className={styles.rubricSection}>
      <h3 style={{ marginTop: "2rem", marginBottom: "1rem", color: "#374151" }}>
        Tu Autoevaluación
      </h3>
      {rubrica.map((criterio) => (
        <div key={criterio.id} className={styles.rubricCriterion}>
          <h4>{criterio.descripcion}</h4>
          <div className={styles.levelsGrid}>
            {criterio.niveles.map((nivel) => {
              const isSelected = respuestas[criterio.id] === nivel.id;
              return (
                <div
                  key={nivel.id}
                  className={`${styles.levelCard} ${
                    isSelected ? styles.selected : ""
                  }`}
                  style={{ cursor: "default", opacity: isSelected ? 1 : 0.6 }}
                >
                  <span className={styles.points}>{nivel.puntaje}</span>
                  <span className={styles.desc}>{nivel.descripcion}</span>
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
  const [entregaData, setEntregaData] = useState(null);
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
        const evalResponse = await axios.get(`/api/evaluaciones/${id}`);
        setEvaluacion(evalResponse.data.evaluacion);
        setRubrica(evalResponse.data.rubrica);

        const fechaFin = evalResponse.data.evaluacion.fecha_fin;
        if (fechaFin && new Date() > new Date(fechaFin)) {
          setIsDeadlinePassed(true);
        }

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
      setError(err.response?.data?.message || "Error al realizar la entrega.");
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center">Cargando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!evaluacion || !rubrica) return <div>No encontrado.</div>;

  // --- MODO VISTA (Ya entregado) ---
  if (entregaData && !isModifying) {
    const { entrega, archivos, calificacion, detalleDocente } = entregaData;
    const isGraded = !!calificacion;

    return (
      <div className={styles.container}>
        {/* 1. Resultados del Docente (Si existen) */}
        {isGraded && (
          <EvaluationResult
            calificacion={calificacion}
            detalleDocente={detalleDocente}
            rubrica={rubrica}
          />
        )}

        <div className={styles.card}>
          <h1 className={styles.title}>{evaluacion.nombre_evaluacion}</h1>

          {/* Estado de Entrega */}
          <div className={`${styles.statusBox} ${styles.success}`}>
            <span className={styles.statusTitle}>¡Tarea Entregada!</span>
            <span>
              Enviado el:{" "}
              {format(new Date(entrega.fecha_entrega), "Pp", { locale: es })}
            </span>
          </div>

          {/* Archivos / Enlaces Entregados */}
          <div className={styles.fileSection}>
            {evaluacion.tipo_entrega === "archivo" &&
              archivos &&
              archivos.length > 0 && (
                <div>
                  <span className={styles.fileLabel}>Archivo adjunto:</span>
                  <a
                    href={archivos[0].archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.fileLink}
                  >
                    📄 {archivos[0].nombre_archivo}
                  </a>
                </div>
              )}
            {evaluacion.tipo_entrega === "enlace" && entrega.enlace_url && (
              <div>
                <span className={styles.fileLabel}>Enlace adjunto:</span>
                <a
                  href={entrega.enlace_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.fileLink}
                >
                  🔗 {entrega.enlace_url}
                </a>
              </div>
            )}
          </div>

          {/* Autoevaluación del Alumno */}
          <ReadOnlyRubric
            rubrica={rubrica}
            respuestas={entregaData.respuestas || {}}
          />

          <hr
            style={{
              margin: "2rem 0",
              borderTop: "1px solid #eee",
              borderBottom: "none",
            }}
          />

          {/* Botones de Acción */}
          {!isDeadlinePassed && !isGraded ? (
            <button
              onClick={() => setIsModifying(true)}
              className={styles.modifyBtn}
            >
              Modificar Entrega
            </button>
          ) : (
            <p className={styles.lockedMessage}>
              {isGraded
                ? "🔒 Esta tarea ya fue calificada."
                : "🔒 La fecha límite ya pasó."}
            </p>
          )}

          <button onClick={() => navigate("/")} className={styles.backBtn}>
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- MODO FORMULARIO ---
  if (isDeadlinePassed && !entregaData) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>{evaluacion.nombre_evaluacion}</h1>
          <div className={`${styles.statusBox} ${styles.error}`}>
            <span className={styles.statusTitle}>Entrega Cerrada</span>
            <span>
              La fecha límite fue:{" "}
              {format(new Date(evaluacion.fecha_fin), "Pp", { locale: es })}
            </span>
          </div>
          <button onClick={() => navigate(-1)} className={styles.backBtn}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {isModifying ? "Modificar Entrega" : evaluacion.nombre_evaluacion}
        </h1>

        {evaluacion.fecha_fin && (
          <span className={styles.deadline}>
            Vence:{" "}
            {format(new Date(evaluacion.fecha_fin), "Pp", { locale: es })}
          </span>
        )}

        <form onSubmit={handleSubmit}>
          {/* Inputs de Archivo/Enlace */}
          <div
            className={styles.fileSection}
            style={{ borderBottom: "none", marginBottom: "0" }}
          >
            {evaluacion.tipo_entrega === "archivo" && (
              <div>
                <label className={styles.fileLabel}>Subir Archivo</label>
                {isModifying && (
                  <p className="text-sm text-gray-500 mb-2">
                    (Sube uno nuevo para reemplazar el anterior)
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
              <div>
                <label className={styles.fileLabel}>Pegar Enlace</label>
                <input
                  type="url"
                  value={enlace}
                  onChange={(e) => setEnlace(e.target.value)}
                  placeholder="https://..."
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
              </div>
            )}
          </div>

          <hr
            style={{
              margin: "1.5rem 0",
              borderTop: "1px solid #eee",
              borderBottom: "none",
            }}
          />

          {/* Rúbrica Interactiva */}
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
            Completa la Rúbrica
          </h2>

          {rubrica.map((criterio) => (
            <div key={criterio.id} className={styles.rubricCriterion}>
              <h4>{criterio.descripcion}</h4>
              <div className={styles.levelsGrid}>
                {criterio.niveles.map((nivel) => (
                  <label
                    key={nivel.id}
                    className={`${styles.levelCard} ${
                      respuestas[criterio.id] === nivel.id
                        ? styles.selected
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={`criterio-${criterio.id}`}
                      value={nivel.id}
                      checked={respuestas[criterio.id] === nivel.id}
                      onChange={() => handleRubricChange(criterio.id, nivel.id)}
                      required
                    />
                    <span className={styles.points}>{nivel.puntaje}</span>
                    <span className={styles.desc}>{nivel.descripcion}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginTop: "2rem" }}>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
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
                className={styles.backBtn}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default EvaluationPage;
