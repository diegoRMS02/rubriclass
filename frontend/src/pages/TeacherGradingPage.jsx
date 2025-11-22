import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
// Importamos el nuevo modal que ya creaste
import GradingModal from "../components/GradingModal";

function TeacherGradingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [entregas, setEntregas] = useState([]);
  const [evaluacionInfo, setEvaluacionInfo] = useState(null);
  const [rubrica, setRubrica] = useState([]); // Necesitamos la rúbrica para el modal
  const [loading, setLoading] = useState(true);

  // Estados para controlar el Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Función para cargar datos
  const fetchData = async () => {
    try {
      // 1. Info de la evaluación y rúbrica
      const evalRes = await axios.get(`/api/evaluaciones/${id}`);
      setEvaluacionInfo(evalRes.data.evaluacion);
      setRubrica(evalRes.data.rubrica);

      // 2. Lista de entregas de los estudiantes
      const entregasRes = await axios.get(
        `/api/evaluaciones/${id}/entregas_docente`
      );
      setEntregas(entregasRes.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // --- FUNCIONES DEL MODAL ---
  const handleOpenGradeModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
    setIsModalOpen(false);
  };

  const handleGradeSuccess = () => {
    alert("Calificación guardada correctamente");
    handleCloseModal();
    fetchData(); // Recargamos la lista para ver el estado "Calificado"
  };
  // ---------------------------

  if (loading)
    return <div className="p-20">Cargando panel de calificación...</div>;
  if (!evaluacionInfo)
    return <div className="p-20">Evaluación no encontrada.</div>;

  return (
    <div className="grading-container">
      <div className="grading-header">
        <button onClick={() => navigate("/")} className="back-btn mb-4">
          ← Volver al Dashboard
        </button>
        <h1>Calificar: {evaluacionInfo.nombre_evaluacion}</h1>
        <p className="text-gray">
          Tipo: <strong>{evaluacionInfo.tipo_evaluacion}</strong> | Entrega:{" "}
          <strong>{evaluacionInfo.tipo_entrega}</strong>
        </p>
      </div>

      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Estado</th>
              <th>Fecha Entrega</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entregas.map((item) => (
              <tr key={item.usuario_id}>
                <td>
                  <div className="student-name">{item.nombre_estudiante}</div>
                  <div className="student-email">{item.email_estudiante}</div>
                </td>
                <td>
                  {item.entrega_id ? (
                    <span className="badge success">Entregado</span>
                  ) : (
                    <span className="badge pending">Pendiente</span>
                  )}
                  {item.calificacion_id && (
                    <span className="badge graded">Calificado</span>
                  )}
                </td>
                <td>
                  {item.fecha_entrega
                    ? format(new Date(item.fecha_entrega), "Pp", { locale: es })
                    : "-"}
                </td>
                <td>
                  {/* Solo mostramos el botón si el estudiante entregó */}
                  {item.entrega_id ? (
                    <button
                      className="grade-btn"
                      onClick={() => handleOpenGradeModal(item)} // <-- AQUÍ ESTÁ EL CAMBIO
                    >
                      {item.calificacion_id ? "Editar Nota" : "Calificar"}
                    </button>
                  ) : (
                    <span className="text-small text-gray">Sin entrega</span>
                  )}
                </td>
              </tr>
            ))}
            {entregas.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center p-4">
                  No hay estudiantes inscritos en esta clase.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- RENDERIZADO DEL MODAL --- */}
      {isModalOpen && selectedStudent && (
        <GradingModal
          student={selectedStudent}
          evaluationId={id}
          rubric={rubrica}
          onClose={handleCloseModal}
          onSuccess={handleGradeSuccess}
        />
      )}
    </div>
  );
}

export default TeacherGradingPage;
