import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import EnrollClassForm from "../components/EnrollClassForm";

function DashboardStudent({ user }) {
  const [classes, setClasses] = useState([]);
  // Ya no cargamos evaluaciones aquí, solo las clases

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get("/api/clases/inscripciones");
        setClasses(res.data);
      } catch (error) {
        console.error("Error cargando clases:", error);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1
        style={{
          fontSize: "1.8rem",
          fontWeight: "bold",
          marginBottom: "10px",
          color: "#333",
        }}
      >
        Hola, {user.nombre_completo.split(" ")[0]} 👋
      </h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Aquí tienes tus cursos activos
      </p>

      <div style={{ marginBottom: "40px" }}>
        <EnrollClassForm onClassEnrolled={() => window.location.reload()} />
      </div>

      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "20px",
          color: "#444",
        }}
      >
        Mis Cursos
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {classes.length === 0 && <p>No estás inscrito en ningún curso aún.</p>}

        {classes.map((clase) => (
          <Link
            key={clase.id}
            to={`/clase/${clase.id}`} // Enlace a la nueva página del curso
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #eee",
                transition: "transform 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-5px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              {/* Banner de color generado aleatoriamente basado en el ID */}
              <div
                style={{
                  height: "100px",
                  background: `linear-gradient(135deg, hsl(${
                    clase.id * 50
                  }, 70%, 50%), hsl(${clase.id * 50 + 30}, 70%, 40%))`,
                }}
              ></div>

              <div style={{ padding: "20px" }}>
                <h3
                  style={{
                    margin: "0 0 5px 0",
                    color: "#333",
                    fontSize: "1.2rem",
                  }}
                >
                  {clase.nombre_clase}
                </h3>
                <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
                  Docente: {clase.nombre_docente}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DashboardStudent;
