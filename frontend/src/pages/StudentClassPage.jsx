import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

function StudentClassPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clase, setClase] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Necesitamos una API para obtener los datos de UNA clase (aún no la tenemos, la simularemos)
        // Y las evaluaciones de ESA clase.
        // POR AHORA: Usaremos las APIs existentes filtrando en el frontend (temporalmente)

        // 1. Obtener info de la clase (usando la lista de inscripciones)
        const clasesRes = await axios.get("/api/clases/inscripciones");
        const miClase = clasesRes.data.find((c) => c.id === parseInt(id));

        if (!miClase) {
          alert("No estás inscrito en esta clase");
          navigate("/");
          return;
        }
        setClase(miClase);

        // 2. Obtener TODAS las evaluaciones (pendientes y entregadas) y filtrar por clase
        // NOTA: Lo ideal sería crear una API backend específica: GET /api/evaluaciones/clase/:id
        // Pero para avanzar rápido, llamamos a las dos y filtramos.
        const [pendientesRes, entregadasRes] = await Promise.all([
          axios.get("/api/evaluaciones/pendientes"),
          axios.get("/api/evaluaciones/entregadas"),
        ]);

        // Combinamos y filtramos
        const todas = [
          ...pendientesRes.data.map((e) => ({ ...e, estado: "pendiente" })),
          ...entregadasRes.data.map((e) => ({ ...e, estado: "entregado" })),
        ].filter((e) => e.nombre_clase === miClase.nombre_clase); // Filtramos por nombre (o ID si lo tuviéramos en la respuesta)

        setEvaluaciones(todas);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div>Cargando aula...</div>;
  if (!clase) return null;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      {/* Banner del Curso */}
      <div
        style={{
          background: "#1a73e8",
          color: "white",
          padding: "40px",
          borderRadius: "16px",
          marginBottom: "30px",
          boxShadow: "0 4px 12px rgba(26, 115, 232, 0.2)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          ← Volver
        </button>
        <h1 style={{ margin: 0, fontSize: "2.5rem" }}>{clase.nombre_clase}</h1>
        <p style={{ opacity: 0.9, marginTop: "10px" }}>
          Docente: {clase.nombre_docente}
        </p>
      </div>

      {/* Grid de Secciones */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}
      >
        {/* COLUMNA IZQUIERDA: Recursos y Meet */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Tarjeta de Clase Virtual */}
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #eee",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              📹 Clase Virtual
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              Enlace permanente a la sala.
            </p>
            <button
              style={{
                width: "100%",
                padding: "10px",
                background: "#1a73e8",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              Unirse a la reunión
            </button>
          </div>

          {/* Tarjeta de Recursos */}
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #eee",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>📂 Recursos</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #eee",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                📄 Sílabo del Curso.pdf
              </li>
              <li
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #eee",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                📊 Diapositivas Semana 1.pptx
              </li>
              <li
                style={{
                  padding: "10px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  color: "#666",
                  fontStyle: "italic",
                }}
              >
                + Añadir recurso (Solo profe)
              </li>
            </ul>
          </div>
        </div>

        {/* COLUMNA DERECHA: Evaluaciones */}
        <div>
          <h2 style={{ marginTop: 0 }}>📝 Evaluaciones y Tareas</h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {evaluaciones.length === 0 && <p>No hay tareas asignadas.</p>}

            {evaluaciones.map((evaluacion) => (
              <Link
                key={evaluacion.id}
                to={`/evaluacion/${evaluacion.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "12px",
                    border: "1px solid #eee",
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                >
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      background:
                        evaluacion.estado === "entregado"
                          ? "#e6f4ea"
                          : "#fef3c7",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                    }}
                  >
                    {evaluacion.estado === "entregado" ? "✅" : "🔥"}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                      {evaluacion.nombre_evaluacion}
                    </h3>
                    <p
                      style={{
                        margin: "5px 0 0 0",
                        fontSize: "0.85rem",
                        color: "#666",
                      }}
                    >
                      {evaluacion.fecha_fin
                        ? `Vence: ${format(
                            new Date(evaluacion.fecha_fin),
                            "dd MMM",
                            { locale: es }
                          )}`
                        : "Sin fecha límite"}
                    </p>
                  </div>

                  {evaluacion.nota && (
                    <div
                      style={{
                        background: "#e8f0fe",
                        color: "#1a73e8",
                        padding: "5px 10px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                      }}
                    >
                      {evaluacion.nota}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentClassPage;
