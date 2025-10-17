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

module.exports = router;
