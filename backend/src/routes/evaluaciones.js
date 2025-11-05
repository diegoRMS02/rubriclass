const express = require("express");
const db = require("../db");
const { isAuthenticated, isTeacher } = require("../middleware/auth");

const router = express.Router();

// --- Ruta para OBTENER las evaluaciones de un docente ---
// GET /api/evaluaciones
router.get("/", [isAuthenticated, isTeacher], async (req, res) => {
  const docente_id = req.user.id;

  try {
    const evaluacionesQuery = await db.query(
      `SELECT 
         e.id, 
         e.nombre_evaluacion, 
         e.tipo_evaluacion, 
         e.fecha_fin,      -- <-- NUEVO
         e.tipo_entrega,   -- <-- NUEVO
         c.nombre_clase, 
         r.titulo as nombre_rubrica
       FROM Evaluaciones e
       JOIN Clases c ON e.clase_id = c.id
       JOIN Rubricas r ON e.rubrica_id = r.id
       WHERE c.docente_id = $1 
       ORDER BY e.fecha_creacion DESC`,
      [docente_id]
    );

    res.json(evaluacionesQuery.rows);
  } catch (error) {
    console.error("Error al obtener las evaluaciones:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- Ruta para CREAR una nueva evaluación (ACTUALIZADA) ---
// POST /api/evaluaciones
router.post("/", [isAuthenticated, isTeacher], async (req, res) => {
  // 1. OBTENEMOS LOS NUEVOS CAMPOS DEL BODY
  const {
    nombre_evaluacion,
    clase_id,
    rubrica_id,
    tipo_evaluacion,
    fecha_fin, // <-- NUEVO
    tipo_entrega, // <-- NUEVO
  } = req.body;

  // Validación principal
  if (
    !nombre_evaluacion ||
    !clase_id ||
    !rubrica_id ||
    !tipo_evaluacion ||
    !tipo_entrega
  ) {
    return res
      .status(400)
      .json({ message: "Faltan datos para crear la evaluación." });
  }

  // Convertimos la fecha_fin a un formato que PostgreSQL entienda
  // Si fecha_fin no se envía (es opcional), la guardamos como NULL
  const fechaFinSQL = fecha_fin ? new Date(fecha_fin) : null;

  try {
    // 2. ACTUALIZAMOS LA CONSULTA SQL PARA INSERTAR LOS NUEVOS DATOS
    const nuevaEvaluacion = await db.query(
      `INSERT INTO Evaluaciones (
         nombre_evaluacion, clase_id, rubrica_id, tipo_evaluacion, fecha_fin, tipo_entrega
       ) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        nombre_evaluacion,
        clase_id,
        rubrica_id,
        tipo_evaluacion,
        fechaFinSQL, // <-- NUEVO
        tipo_entrega, // <-- NUEVO
      ]
    );

    res.status(201).json(nuevaEvaluacion.rows[0]);
  } catch (error) {
    console.error("Error al crear la evaluación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

module.exports = router;
