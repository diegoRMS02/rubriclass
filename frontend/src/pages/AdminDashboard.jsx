import React, { useState, useEffect } from "react";
import axios from "axios";

function AdminDashboard() {
  const [statsData, setStatsData] = useState({
    usuarios: 0,
    clases: 0,
    evaluaciones: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("/api/dashboard/stats");
        setStatsData(response.data);
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Mapeamos los datos reales a la estructura visual de las tarjetas
  const statsCards = [
    {
      label: "Usuarios Totales",
      value: loading ? "..." : statsData.usuarios,
      color: "#3b82f6",
    },
    {
      label: "Clases Activas",
      value: loading ? "..." : statsData.clases,
      color: "#10b981",
    },
    {
      label: "Evaluaciones/Tareas", // Ajustado el nombre
      value: loading ? "..." : statsData.evaluaciones,
      color: "#f59e0b",
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem", color: "#111827" }}>
        Panel de Control
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {statsCards.map((stat, index) => (
          <div
            key={index}
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: `5px solid ${stat.color}`,
            }}
          >
            <h3
              style={{
                margin: "0 0 0.5rem 0",
                color: "#6b7280",
                fontSize: "0.9rem",
                textTransform: "uppercase",
              }}
            >
              {stat.label}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "2rem",
                fontWeight: "800",
                color: "#1f2937",
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "3rem",
          padding: "2rem",
          background: "white",
          borderRadius: "12px",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        <p>
          Bienvenido al modo "Super Usuario". Usa el menú lateral para gestionar
          la plataforma.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
