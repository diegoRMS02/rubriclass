import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./ClassManagementPage.module.css";

function ClassManagementPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get("/api/clases/admin/all");
        setClasses(res.data);
      } catch (error) {
        console.error("Error cargando clases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) return <div style={{ padding: "2rem" }}>Cargando clases...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de Clases Académicas</h1>
        {/* Nota: Usualmente el Admin no crea clases, lo hacen los profes. 
            Pero si quisieras, aquí iría el botón. Por ahora lo dejamos limpio. */}
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre de la Clase</th>
              <th>Sección</th>
              <th>Código de Acceso</th>
              <th>Docente Encargado</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr key={cls.id}>
                <td>
                  <strong style={{ color: "#2563eb" }}>{cls.nombre}</strong>
                </td>
                <td>{cls.seccion}</td>
                <td>
                  <span className={styles.codeBadge}>{cls.codigo_acceso}</span>
                </td>
                <td>
                  <div className={styles.teacherInfo}>
                    <span className={styles.teacherName}>{cls.docente}</span>
                    <span className={styles.teacherEmail}>
                      {cls.docente_email}
                    </span>
                  </div>
                </td>
                <td style={{ color: "#9ca3af", fontSize: "0.8rem" }}>
                  #{cls.id}
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  No hay clases activas en la plataforma.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClassManagementPage;
