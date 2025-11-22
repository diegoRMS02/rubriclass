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
  const [rubrica, setRubrica] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para controlar el Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Función para cargar datos
  const fetchData = async () => {
    try {
      const evalRes = await axios.get(`/api/evaluaciones/${id}`);
      setEvaluacionInfo(evalRes.data.evaluacion);
      setRubrica(evalRes.data.rubrica);

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
    fetchData();
  };

  // --- NUEVA FUNCIÓN: EXPORTAR NOTAS ---
  const handleExport = async () => {
    try {
      const response = await axios.get(`/api/evaluaciones/${id}/exportar`, {
        responseType: "blob", // Importante para recibir archivos
      });

      // Crear un enlace invisible para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // El nombre del archivo viene del backend o usamos uno por defecto
      link.setAttribute(
        "download",
        `Reporte_Notas_${evaluacionInfo.nombre_evaluacion}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Error al exportar las notas.");
    }
  };

  if (loading)
    return <div className="p-20">Cargando panel de calificación...</div>;
  if (!evaluacionInfo)
    return <div className="p-20">Evaluación no encontrada.</div>;

  return (
    <div className="grading-container">
      <div className="grading-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <button onClick={() => navigate("/")} className="back-btn mb-4">
              ← Volver al Dashboard
            </button>
            <h1>Calificar: {evaluacionInfo.nombre_evaluacion}</h1>
            <p className="text-gray">
              Tipo: <strong>{evaluacionInfo.tipo_evaluacion}</strong> | Entrega:{" "}
              <strong>{evaluacionInfo.tipo_entrega}</strong>
            </p>
          </div>

          {/* BOTÓN DE EXPORTAR */}
          <button onClick={handleExport} className="export-btn">
            📊 Exportar Notas
          </button>
        </div>
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
                  {item.entrega_id ? (
                    <button
                      className="grade-btn"
                      onClick={() => handleOpenGradeModal(item)}
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
