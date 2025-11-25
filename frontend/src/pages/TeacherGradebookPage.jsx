import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import styles from "./TeacherGradebookPage.module.css";

function TeacherGradebookPage() {
  const { id: classId } = useParams();
  const [data, setData] = useState([]); // Estudiantes y sus notas
  const [columns, setColumns] = useState([]); // Evaluaciones (Encabezados)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGradebook = async () => {
      try {
        const res = await axios.get(`/api/clases/${classId}/gradebook`);
        setColumns(res.data.meta.evaluaciones);
        setData(res.data.data);
      } catch (error) {
        console.error("Error cargando gradebook:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGradebook();
  }, [classId]);

  if (loading) return <div className={styles.container}>Cargando notas...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Link to="/" className={styles.backLink}>
            ← Volver al Dashboard
          </Link>
          <h1 className={styles.title}>Libro de Notas 📊</h1>
        </div>
        <button
          className={styles.backLink}
          style={{
            background: "none",
            border: "1px solid #1a73e8",
            padding: "8px 16px",
            borderRadius: "6px",
          }}
        >
          📥 Exportar Excel
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colStudent}>Estudiante</th>
              {columns.map((col) => (
                <th key={col.id} title={col.tipo_evaluacion}>
                  {col.nombre_evaluacion}
                </th>
              ))}
              <th>Promedio</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  style={{ padding: "3rem", color: "#888" }}
                >
                  No hay estudiantes inscritos en esta clase.
                </td>
              </tr>
            ) : (
              data.map((student) => (
                <tr key={student.id}>
                  <td className={styles.colStudent}>
                    <span className={styles.studentName}>
                      {student.nombre_completo}
                    </span>
                    <span className={styles.studentEmail}>{student.email}</span>
                  </td>

                  {/* Renderizamos las notas dinámicamente */}
                  {student.notas.map((nota, index) => (
                    <td key={index} className={styles.gradeCell}>
                      {nota !== null ? (
                        <span
                          className={
                            nota >= 11 ? styles.passing : styles.failing
                          }
                        >
                          {nota}
                        </span>
                      ) : (
                        <span className={styles.empty}>-</span>
                      )}
                    </td>
                  ))}

                  <td className={styles.gradeCell}>
                    <span className={styles.average}>{student.promedio}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeacherGradebookPage;
