// src/routes/clases.js

const express = require("express");
const router = express.Router();
const db = require("../db"); // Nuestra conexión a la BD
const { isAuthenticated, isTeacher } = require("../middleware/auth"); // Nuestros guardias de seguridad

// --- Función para generar un código de inscripción aleatorio ---
function generateCode() {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
router.get("/", [isAuthenticated, isTeacher], async (req, res) => {
  const docente_id = req.user.id;

  try {
    const clasesQuery = await db.query(
      "SELECT * FROM Clases WHERE docente_id = $1 ORDER BY fecha_creacion DESC",
      [docente_id]
    );
    res.json(clasesQuery.rows);
  } catch (error) {
    console.error("Error al obtener las clases:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
// --- Ruta para crear una nueva clase ---
// POST /api/clases
// Protegida: solo usuarios autenticados Y que sean docentes pueden acceder.
router.post("/", [isAuthenticated, isTeacher], async (req, res) => {
  const { nombre_clase } = req.body;
  const docente_id = req.user.id; // Obtenemos el ID del docente que inició sesión

  // Validamos que nos hayan enviado el nombre de la clase
  if (!nombre_clase) {
    return res
      .status(400)
      .json({ message: "El nombre de la clase es requerido." });
  }

  try {
    const codigo_inscripcion = generateCode();

    const nuevaClaseQuery = await db.query(
      "INSERT INTO Clases (nombre_clase, codigo_inscripcion, docente_id) VALUES ($1, $2, $3) RETURNING *",
      [nombre_clase, codigo_inscripcion, docente_id]
    );

    res.status(201).json(nuevaClaseQuery.rows[0]);
  } catch (error) {
    console.error("Error al crear la clase:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
router.post("/inscribir", isAuthenticated, async (req, res) => {
  const { codigo_inscripcion } = req.body;
  const usuario_id = req.user.id;
  const usuario_rol = req.user.rol;

  // 1. Validaciones básicas
  if (usuario_rol !== "estudiante") {
    return res.status(403).json({
      message: "Prohibido: Solo los estudiantes pueden inscribirse a clases.",
    });
  }
  if (!codigo_inscripcion) {
    return res
      .status(400)
      .json({ message: "El código de inscripción es requerido." });
  }

  try {
    // 2. Buscar la clase que corresponde al código
    const claseQuery = await db.query(
      "SELECT id FROM Clases WHERE codigo_inscripcion = $1",
      [codigo_inscripcion]
    );

    if (claseQuery.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Clase no encontrada con ese código." });
    }
    const clase_id = claseQuery.rows[0].id;

    // 3. Verificar que el estudiante no esté ya inscrito
    const inscripcionExistenteQuery = await db.query(
      "SELECT * FROM Inscripciones WHERE usuario_id = $1 AND clase_id = $2",
      [usuario_id, clase_id]
    );

    if (inscripcionExistenteQuery.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "Ya estás inscrito en esta clase." });
    }

    // 4. Si todo está bien, registrar la inscripción
    await db.query(
      "INSERT INTO Inscripciones (usuario_id, clase_id) VALUES ($1, $2)",
      [usuario_id, clase_id]
    );

    res.status(200).json({ message: "¡Inscripción exitosa!" });
  } catch (error) {
    console.error("Error al inscribir en la clase:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
// GET /api/clases/inscripciones
router.get("/inscripciones", isAuthenticated, async (req, res) => {
  // Nos aseguramos de que solo los estudiantes puedan acceder a esta ruta
  if (req.user.rol !== "estudiante") {
    return res.status(403).json({ message: "Acción solo para estudiantes." });
  }

  const usuario_id = req.user.id;

  try {
    // Esta consulta SQL une varias tablas para obtener la información necesaria
    const inscripcionesQuery = await db.query(
      `SELECT c.id, c.nombre_clase, u.nombre_completo as nombre_docente
       FROM Clases c
       JOIN Inscripciones i ON c.id = i.clase_id
       JOIN Usuarios u ON c.docente_id = u.id
       WHERE i.usuario_id = $1
       ORDER BY c.nombre_clase ASC`,
      [usuario_id]
    );
    res.json(inscripcionesQuery.rows);
  } catch (error) {
    console.error("Error al obtener las inscripciones:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
module.exports = router;
