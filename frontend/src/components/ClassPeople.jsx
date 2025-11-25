import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./ClassPeople.module.css"; // Crearemos este CSS abajo

function ClassPeople({ classId, isTeacher }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`/api/clases/${classId}/personas`);
      setStudents(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [classId]);

  const handleRemove = async (student) => {
    if (
      !window.confirm(
        `¿Seguro que quieres sacar a ${student.nombre_completo} de la clase?`
      )
    )
      return;
    try {
      await axios.delete(`/api/clases/${classId}/personas/${student.id}`);
      fetchStudents(); // Recargar lista
    } catch (error) {
      alert("Error al eliminar.");
    }
  };

  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Cargando personas...
      </div>
    );

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>Estudiantes ({students.length})</h3>

      {students.length === 0 ? (
        // --- EMPTY STATE MEJORADO 🚀 ---
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>Empty 👻</div>
          <h4>¡Aún no hay estudiantes!</h4>
          <p>Comparte el código de la clase para que se inscriban.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {students.map((student) => (
            <div key={student.id} className={styles.studentRow}>
              <div className={styles.info}>
                <img
                  src={student.foto_url || "https://via.placeholder.com/40"}
                  alt="Avatar"
                  className={styles.avatar}
                  referrerPolicy="no-referrer"
                />
                <span className={styles.name}>{student.nombre_completo}</span>
              </div>

              {isTeacher && (
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemove(student)}
                  title="Eliminar de la clase"
                >
                  ⛔
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClassPeople;
