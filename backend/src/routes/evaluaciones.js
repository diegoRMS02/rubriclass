const express = require("express");
const db = require("../db");
const { isAuthenticated, isTeacher } = require("../middleware/auth");

const router = express.Router();
router.get("/", [isAuthenticated, isTeacher], async (req, res) => {
  const docente_id = req.user.id;

  try {
    // Esta consulta usa JOIN para obtener los nombres de la clase y la rúbrica, no solo los IDs
    const evaluacionesQuery = await db.query(
      `SELECT 
         e.id, 
         e.nombre_evaluacion, 
         e.tipo_evaluacion, 
         c.nombre_clase, 
         r.titulo as nombre_rubrica
       FROM Evaluaciones e
       JOIN Clases c ON e.clase_id = c.id
       JOIN Rubricas r ON e.rubrica_id = r.id
       WHERE c.docente_id = $1 
       ORDER BY e.fecha_creacion DESC`,
      [docente_id]
    );
    // Verificamos que el docente sea el dueño de la clase (implícito en el JOIN con Clases)

    res.json(evaluacionesQuery.rows);
  } catch (error) {
    console.error("Error al obtener las evaluaciones:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
// --- Ruta para CREAR una nueva evaluación ---
// POST /api/evaluaciones
router.post("/", [isAuthenticated, isTeacher], async (req, res) => {
  const { nombre_evaluacion, clase_id, rubrica_id, tipo_evaluacion } = req.body;
  const docente_id = req.user.id; // Para verificar que el docente es dueño de la clase/rúbrica

  // Validación simple
  if (!nombre_evaluacion || !clase_id || !rubrica_id || !tipo_evaluacion) {
    return res
      .status(400)
      .json({ message: "Faltan datos para crear la evaluación." });
  }

  try {
    // (En un futuro, podríamos verificar aquí que el docente_id sea dueño de la clase y la rúbrica)

    const nuevaEvaluacion = await db.query(
      `INSERT INTO Evaluaciones (nombre_evaluacion, clase_id, rubrica_id, tipo_evaluacion) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre_evaluacion, clase_id, rubrica_id, tipo_evaluacion]
    );

    res.status(201).json(nuevaEvaluacion.rows[0]);
  } catch (error) {
    console.error("Error al crear la evaluación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

module.exports = router;
